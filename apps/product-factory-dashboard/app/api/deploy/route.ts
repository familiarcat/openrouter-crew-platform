import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { 
  detectDeployIntent, 
  formatDeployResponse, 
  extractMilestoneTitle,
  defaultConfig,
  DeployResult,
} from '../../../lib/deploy';
import { appendEvent } from '../../../lib/store';

const execAsync = promisify(exec);

// SSM command for redeployment
const REDEPLOY_COMMANDS = [
  'aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin 860268930466.dkr.ecr.us-east-2.amazonaws.com',
  'docker pull 860268930466.dkr.ecr.us-east-2.amazonaws.com/rag-refresh-product-factory:latest',
  'docker stop rag-app 2>/dev/null || true',
  'docker rm rag-app 2>/dev/null || true',
  'docker run -d --name rag-app -p 3000:3000 --restart always 860268930466.dkr.ecr.us-east-2.amazonaws.com/rag-refresh-product-factory:latest',
  'docker ps'
];

const STATUS_COMMANDS = ['docker ps', 'docker logs --tail 20 rag-app'];
const LOGS_COMMANDS = ['docker logs --tail 100 rag-app'];

export async function POST(req: Request) {
  const { query } = await req.json();
  
  // Detect intent from natural language
  const intent = detectDeployIntent(query);
  
  if (!intent) {
    return NextResponse.json({
      success: false,
      action: 'unknown',
      message: 'Could not understand deployment request. Try: "redeploy docker", "check status", "show logs", or "make a milestone push"',
      intent: null,
    });
  }

  let result: DeployResult;

  try {
    // Handle milestone intents (these run locally, no AWS needed)
    if (intent === 'milestone' || intent === 'milestoneAndDeploy') {
      result = await executeMilestone(query, intent === 'milestoneAndDeploy');
    } else {
      // AWS operations require credentials
      const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
      const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
      
      if (!accessKeyId || !secretAccessKey) {
        return NextResponse.json({
          success: false,
          action: intent,
          message: 'AWS credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.',
          intent,
        });
      }

      switch (intent) {
        case 'redeploy':
          result = await executeSSMCommand(REDEPLOY_COMMANDS, 'redeploy', accessKeyId, secretAccessKey);
          break;
        case 'status':
          result = await executeSSMCommand(STATUS_COMMANDS, 'status', accessKeyId, secretAccessKey);
          break;
        case 'logs':
          result = await executeSSMCommand(LOGS_COMMANDS, 'logs', accessKeyId, secretAccessKey);
          break;
        case 'terraform':
          result = {
            success: true,
            action: 'terraform',
            message: 'Terraform operations must be run locally. Use: cd infra && terraform plan && terraform apply',
          };
          break;
        default:
          result = {
            success: false,
            action: 'unknown',
            message: 'Unhandled deployment intent',
          };
      }
    }
  } catch (error) {
    result = {
      success: false,
      action: intent,
      message: `Deployment error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }

  // Log the deployment event
  await appendEvent({
    type: 'deploy',
    at: new Date().toISOString(),
    query,
    intent,
    result: { success: result.success, action: result.action, commandId: result.commandId },
  });

  return NextResponse.json({
    ...result,
    intent,
    formattedResponse: formatDeployResponse(result),
  });
}

/**
 * Execute milestone script locally
 */
async function executeMilestone(query: string, withDeploy: boolean): Promise<DeployResult> {
  const title = extractMilestoneTitle(query);
  const projectRoot = process.cwd();
  const scriptPath = path.join(projectRoot, 'scripts/milestone/run_milestone.sh');
  
  const deployFlag = withDeploy ? '--deploy' : '';
  const command = `bash "${scriptPath}" "${title}" ${deployFlag}`.trim();
  
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: projectRoot,
      env: {
        ...process.env,
        PATH: process.env.PATH,
      },
      timeout: withDeploy ? 300000 : 60000, // 5 min with deploy, 1 min without
    });
    
    const output = stdout + (stderr ? `\n${stderr}` : '');
    
    return {
      success: true,
      action: withDeploy ? 'milestoneAndDeploy' : 'milestone',
      message: `Milestone "${title}" created successfully!\n\n${output}`,
      details: {
        title,
        withDeploy,
        output: output.slice(0, 500), // Truncate for response
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      action: withDeploy ? 'milestoneAndDeploy' : 'milestone',
      message: `Milestone failed: ${errorMessage}`,
      details: { title, withDeploy },
    };
  }
}

async function executeSSMCommand(
  commands: string[],
  action: string,
  accessKeyId: string,
  secretAccessKey: string
): Promise<DeployResult> {
  const { SSMClient, SendCommandCommand, GetCommandInvocationCommand } = await import('@aws-sdk/client-ssm');
  
  const client = new SSMClient({
    region: defaultConfig.awsRegion,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  try {
    // Send command
    const sendResult = await client.send(new SendCommandCommand({
      InstanceIds: [defaultConfig.instanceId],
      DocumentName: 'AWS-RunShellScript',
      Parameters: { commands },
    }));

    const commandId = sendResult.Command?.CommandId;

    if (!commandId) {
      return {
        success: false,
        action,
        message: 'Failed to get command ID from SSM',
      };
    }

    // For status/logs, wait and get output
    if (action === 'status' || action === 'logs') {
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const invocationResult = await client.send(new GetCommandInvocationCommand({
        CommandId: commandId,
        InstanceId: defaultConfig.instanceId,
      }));

      return {
        success: invocationResult.Status === 'Success',
        action,
        commandId,
        message: invocationResult.StandardOutputContent || 'No output',
        details: {
          status: invocationResult.Status,
          exitCode: invocationResult.ResponseCode,
        },
      };
    }

    // For redeploy, return immediately
    return {
      success: true,
      action,
      commandId,
      message: `Deployment initiated. Command ID: ${commandId}`,
    };
  } catch (error) {
    return {
      success: false,
      action,
      message: `SSM error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}


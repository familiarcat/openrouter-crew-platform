import { spawnSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { ECRClient, GetAuthorizationTokenCommand } from '@aws-sdk/client-ecr';
import { ECSClient, UpdateServiceCommand } from '@aws-sdk/client-ecs';

export class DeploymentService {
  private rootDir: string;

  constructor() {
    // Resolve root from: apps/crew-cli/dist/services -> ../../../../
    this.rootDir = path.resolve(__dirname, '../../../../');
  }

  async deploy(environment: string, region: string) {
    console.log(`🚀 Starting deployment to ${environment} in ${region}...`);

    this.checkPrerequisites();

    // Initialize AWS Clients
    const ecrClient = new ECRClient({ region });
    const ecsClient = new ECSClient({ region });

    // 1. Build Application
    console.log('\n📦 Building application...');
    this.run('pnpm', ['build'], this.rootDir);

    // 2. Infrastructure (Terraform)
    console.log('\n🏗️  Deploying infrastructure...');
    const infraDir = path.join(this.rootDir, 'infrastructure');

    if (!fs.existsSync(infraDir)) {
      console.error(`❌ Infrastructure directory not found at ${infraDir}`);
      process.exit(1);
    }

    this.run('terraform', ['init'], infraDir);
    this.run('terraform', [
      'apply',
      '-auto-approve',
      `-var=environment=${environment}`,
      `-var=aws_region=${region}`
    ], infraDir);

    // Get Outputs
    const ecrUrl = this.getTerraformOutput(infraDir, 'ecr_repository_url');
    const clusterName = this.getTerraformOutput(infraDir, 'ecs_cluster_name');
    const serviceName = this.getTerraformOutput(infraDir, 'ecs_service_name');

    console.log(`\nℹ️  ECR: ${ecrUrl}`);
    console.log(`ℹ️  Cluster: ${clusterName}`);
    console.log(`ℹ️  Service: ${serviceName}`);

    // 3. Docker Build & Push
    console.log('\n🐳 Building and pushing Docker image...');

    // ECR Login
    try {
      const authCommand = new GetAuthorizationTokenCommand({});
      const authResponse = await ecrClient.send(authCommand);
      const authData = authResponse.authorizationData?.[0];

      if (!authData || !authData.authorizationToken) {
        throw new Error('Failed to retrieve ECR authorization token.');
      }

      const token = Buffer.from(authData.authorizationToken, 'base64').toString('utf-8');
      const [username, password] = token.split(':');
      const registry = ecrUrl.split('/')[0];

      console.log(`Logging into ECR registry: ${registry}`);
      this.runWithInput('docker', ['login', '--username', username, '--password-stdin', registry], password, this.rootDir);
      
    } catch (error: any) {
      console.error(`❌ ECR Login failed: ${error.message}`);
      process.exit(1);
    }

    // Build & Push
    const imageTag = `${ecrUrl}:latest`;
    // Using the unified dashboard Dockerfile as per standard deployment
    this.run('docker', [
      'build',
      '-t', imageTag,
      '-f', 'apps/unified-dashboard/Dockerfile',
      '.'
    ], this.rootDir);

    this.run('docker', ['push', imageTag], this.rootDir);

    // 4. Update ECS Service
    console.log('\n🔄 Updating ECS service...');
    try {
      const updateCommand = new UpdateServiceCommand({
        cluster: clusterName,
        service: serviceName,
        forceNewDeployment: true
      });
      await ecsClient.send(updateCommand);
      console.log('✅ ECS Service update initiated.');
    } catch (error: any) {
      console.error(`❌ Failed to update ECS service: ${error.message}`);
      process.exit(1);
    }

    console.log('\n✅ Deployment complete!');
  }

  private checkPrerequisites() {
    const tools = ['docker', 'terraform', 'pnpm'];
    for (const tool of tools) {
      const result = spawnSync('which', [tool]);
      if (result.status !== 0) {
        console.error(`❌ Missing required tool: ${tool}`);
        process.exit(1);
      }
    }
  }

  private run(command: string, args: string[], cwd: string) {
    const result = spawnSync(command, args, { cwd, stdio: 'inherit' });
    if (result.status !== 0) {
      console.error(`❌ Command failed: ${command} ${args.join(' ')}`);
      process.exit(1);
    }
  }

  private runWithInput(command: string, args: string[], input: string, cwd: string) {
    const result = spawnSync(command, args, { cwd, input, stdio: ['pipe', 'inherit', 'inherit'] });
    if (result.status !== 0) {
      console.error(`❌ Command failed: ${command} ${args.join(' ')}`);
      process.exit(1);
    }
  }

  private runShell(command: string, cwd: string) {
    const result = spawnSync(command, { cwd, shell: true, stdio: 'inherit' });
    if (result.status !== 0) {
      console.error(`❌ Command failed: ${command}`);
      process.exit(1);
    }
  }

  private getTerraformOutput(cwd: string, name: string): string {
    const result = spawnSync('terraform', ['output', '-raw', name], { cwd, encoding: 'utf-8' });
    if (result.status !== 0) {
      console.error(`❌ Failed to get terraform output: ${name}`);
      process.exit(1);
    }
    return result.stdout.trim();
  }
}
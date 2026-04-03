import * as vscode from 'vscode';
import { AgentNetworkService } from '../services/agent-network';
import { ChatPanel } from '../ui/chat-panel';


/**
 * Geordi's Warp Core Optimization Command
 * 
 * Directs Geordi La Forge to analyze cost variance data and propose engineering solutions
 * to improve workflow efficiency and reduce unexpected costs.
 */
export async function geordiWarpCoreOptimizeCommand(
    context: vscode.ExtensionContext,
    agentNetwork: AgentNetworkService
) {
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "⚙️ Geordi: Analyzing Warp Core efficiency...",
        cancellable: true
    }, async (progress) => {
        try {
            progress.report({ message: "Gathering project cost variance data...", increment: 20 });
            const projectVariances = await agentNetwork.getProjectCostVarianceSummary();
            
            progress.report({ message: "Gathering workflow cost variance data...", increment: 20 });
            const workflowVariances = await agentNetwork.getWorkflowCostVarianceAnalysis();

            // Filter for top 3 most problematic projects/workflows
            const topProjects = projectVariances.slice(0, 3).map(p => 
                `Project: ${p.project_name} (ID: ${p.project_id})\n  Total Estimated: $${p.total_estimated_usd.toFixed(4)}\n  Total Actual: $${p.total_actual_usd.toFixed(4)}\n  Variance: ${p.aggregate_variance_percentage}%`
            ).join('\n\n');

            const topWorkflows = workflowVariances.filter(w => w.budget_alert).slice(0, 5).map(w =>
                `Workflow: ${w.workflow_name} (Request ID: ${w.request_id})\n  Estimated: $${w.estimated_cost_usd.toFixed(4)}\n  Actual: $${w.total_actual_cost.toFixed(4)}\n  Variance: ${w.variance_percentage}% (Alert: ${w.budget_alert})`
            ).join('\n\n');

            const directive = `
### GEORDI'S WARP CORE OPTIMIZATION DIRECTIVE ###

**Objective:** Analyze the provided cost variance data to identify inefficiencies in agent workflows and propose concrete engineering solutions to reduce unexpected costs and improve consistency. Focus on areas where actual costs significantly exceed estimates or where budget alerts are triggered.

**Data for Analysis:**

**Top Projects by Cost Variance:**
${topProjects || 'No significant project variances detected.'}

**Top Workflows by Cost Variance (Budget Alerts):**
${topWorkflows || 'No significant workflow variances detected.'}

**Task:**
1. Pinpoint the root causes of high variance (e.g., frequent retries, unexpected model upgrades, inaccurate initial complexity analysis).
2. Propose specific engineering actions (e.g., refine agent prompts, optimize n8n workflows, adjust model routing logic, improve caching strategies).
3. Provide a prioritized list of recommendations.
            `;

            // Get Geordi's agent
            const geordi = agentNetwork.getDepartment('geordi'); // Assuming 'geordi' is the agent ID for Geordi

            progress.report({ message: "Geordi is analyzing data...", increment: 40 });

            // Execute Geordi's task directly
            const result = await geordi.executeTask(directive, { intent: 'OPTIMIZE', complexity: 'HIGH' });

            // Broadcast Geordi's analysis result as an insight
            // Determine severity based on content (e.g., if "CRITICAL" or "HIGH" is in the output)
            const severity = result.output.includes('CRITICAL') || result.output.includes('HIGH') ? 'HIGH' : 'INFO';
            await agentNetwork.broadcastInsight(
                `Geordi's Optimization Analysis: ${result.output}`,
                'geordi-optimization-analysis',
                severity
            );

            await vscode.commands.executeCommand('openrouter-crew.chat');
            if (ChatPanel.currentPanel) {
                ChatPanel.currentPanel.addMessage({ role: 'assistant', text: result.output, meta: { cost: result.cost, model: result.model } });
            }

        } catch (error: any) {
            vscode.window.showErrorMessage(`Geordi's Optimization failed: ${error.message}`);
        }
    });
}
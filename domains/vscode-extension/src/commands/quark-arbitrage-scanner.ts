import * as vscode from 'vscode';
import { AgentNetworkService } from '../services/agent-network';
import { ChatPanel } from '../ui/chat-panel';


/**
 * Quark's Arbitrage Opportunity Scanner Command
 * 
 * Directs Quark to analyze model consistency and cost data to identify
 * "arbitrage opportunities" in model routing, where a cheaper model
 * performs unexpectedly well or an expensive model underperforms.
 */
export async function quarkArbitrageScannerCommand(
    context: vscode.ExtensionContext,
    agentNetwork: AgentNetworkService
) {
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "💰 Quark: Scanning for arbitrage opportunities...",
        cancellable: true
    }, async (progress) => {
        try {
            progress.report({ message: "Gathering model consistency statistics...", increment: 30 });
            const modelStats = await agentNetwork.getModelConsistencyStats();
            
            progress.report({ message: "Gathering project cost variance data...", increment: 30 });
            const projectVariances = await agentNetwork.getProjectCostVarianceSummary();

            const topModels = modelStats.slice(0, 5).map(m => 
                `Model: ${m.model}\n  Avg Consistency: ${(m.avg_consistency_score * 100).toFixed(2)}%\n  Total Attempts: ${m.total_attempts}\n  Min Score: ${(m.min_score * 100).toFixed(2)}%`
            ).join('\n\n');

            const highVarianceProjects = projectVariances.filter(p => p.aggregate_variance_percentage > 20).slice(0, 3).map(p =>
                `Project: ${p.project_name}\n  Aggregate Variance: ${p.aggregate_variance_percentage}%`
            ).join('\n\n');

            const directive = `
### QUARK'S ARBITRAGE OPPORTUNITY SCANNER DIRECTIVE ###

**Objective:** Analyze the provided model performance and cost variance data to identify opportunities for optimizing model routing to maximize ROI.

**Data for Analysis:**

**Top Models by Consistency Score:**
${topModels || 'No model consistency data available.'}

**Projects with High Cost Variance:**
${highVarianceProjects || 'No projects with high cost variance.'}

**Task:**
1. Identify models that are over-performing their cost tier or under-performing their cost tier for specific task types/projects.
2. Propose adjustments to the ModelRouter configuration (e.g., suggest a cheaper model for tasks where an expensive one is consistently underperforming, or vice-versa).
3. Suggest strategies to exploit these "arbitrage opportunities" to improve overall platform profitability.
            `;

            // Get Quark's agent
            const quark = agentNetwork.getDepartment('quark'); // Assuming 'quark' is the agent ID for Quark

            progress.report({ message: "Quark is analyzing data...", increment: 40 });

            // Execute Quark's task directly
            const result = await quark.executeTask(directive, { intent: 'OPTIMIZE', complexity: 'HIGH' });

            // Broadcast Quark's analysis result as an insight
            const severity = result.output.includes('CRITICAL') || result.output.includes('HIGH') ? 'HIGH' : 'INFO';
            await agentNetwork.broadcastInsight(
                `Quark's Arbitrage Analysis: ${result.output}`,
                'quark-arbitrage-analysis',
                severity
            );

            await vscode.commands.executeCommand('openrouter-crew.chat');
            if (ChatPanel.currentPanel) {
                ChatPanel.currentPanel.addMessage({ role: 'assistant', text: result.output, meta: { cost: result.costUSD, model: result.model } });
            }

        } catch (error: any) {
            vscode.window.showErrorMessage(`Quark's Arbitrage Scanner failed: ${error.message}`);
        }
    });
}
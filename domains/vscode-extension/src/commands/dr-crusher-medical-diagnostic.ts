import * as vscode from 'vscode';
import { AgentNetworkService } from '../services/agent-network';
import { ChatPanel } from '../ui/chat-panel';
import { TreatmentPlanView } from '../ui/treatment-plan-view';

/**
 * Dr. Crusher's Medical Diagnostic Command
 * 
 * Performs a systemic health check of the platform by aggregating infrastructure,
 * financial, and model performance telemetry.
 */
export async function drCrusherMedicalDiagnosticCommand(
    context: vscode.ExtensionContext,
    agentNetwork: AgentNetworkService
) {
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "🏥 Dr. Crusher: Performing Systemic Diagnostic...",
        cancellable: true
    }, async (progress) => {
        try {
            progress.report({ message: "Scanning warp field (Docker)...", increment: 20 });
            const dockerStatus = await agentNetwork.getDockerStatus();
            
            progress.report({ message: "Analyzing metabolic variance (Costs)...", increment: 20 });
            const costVariances = await agentNetwork.getProjectCostVarianceSummary();
            
            progress.report({ message: "Checking neural consistency (Models)...", increment: 20 });
            const modelStats = await agentNetwork.getModelConsistencyStats();

            const dockerSummary = dockerStatus.map(d => `- ${d.name}: ${d.status} (${d.healthy ? 'HEALTHY' : 'UNHEALTHY'})`).join('\n');
            const costSummary = costVariances.slice(0, 3).map(p => `- ${p.project_name}: ${p.aggregate_variance_percentage}% variance`).join('\n');
            const modelSummary = modelStats.slice(0, 3).map(m => `- ${m.model}: ${(m.avg_consistency_score * 100).toFixed(1)}% consistency`).join('\n');

            const directive = `
### DR. CRUSHER'S MEDICAL DIAGNOSTIC DIRECTIVE ###

**Objective:** Perform a systemic health check of the platform. Identify "Technical Debt Infections" or operational anomalies.

**Vitals Scan:**

**1. Infrastructure (Docker Status):**
${dockerSummary || 'No data available.'}

**2. Financial Metabolism (Cost Variance):**
${costSummary || 'No data available.'}

**3. Neural Pathways (Model Consistency):**
${modelSummary || 'No data available.'}

**Task:**
1. Diagnose systemic issues based on these vitals.
2. Identify areas of high risk (unhealthy containers, high cost variance, low consistency).
3. Issue a prioritized Treatment Plan.
            `;

            const crusher = agentNetwork.getDepartment('crusher');
            progress.report({ message: "Beverly is generating treatment plan...", increment: 30 });
            const result = await crusher.executeTask(directive, { intent: 'OPTIMIZE', complexity: 'HIGH' });

            const severity = result.output.includes('CRITICAL') ? 'CRITICAL' : (result.output.includes('HIGH') ? 'HIGH' : 'INFO');
            await agentNetwork.broadcastInsight(
                `Medical Diagnostic Report: ${result.output}`,
                'dr-crusher-diagnostic',
                severity
            );

            await vscode.commands.executeCommand('openrouter-crew.chat');
            if (ChatPanel.currentPanel) {
                ChatPanel.currentPanel.addMessage({ role: 'assistant', text: result.output, meta: { cost: result.cost, model: result.model } });
            }

            // Show the rich Medical Chart UI
            const treatmentView = new TreatmentPlanView(context);
            await treatmentView.show(result, { docker: dockerSummary, cost: costSummary, model: modelSummary });

        } catch (error: any) {
            vscode.window.showErrorMessage(`Crusher's Diagnostic failed: ${error.message}`);
        }
    });
}
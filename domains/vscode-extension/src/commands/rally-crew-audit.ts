import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { AgentNetworkService } from '../services/agent-network';
import { CostTracker } from '../services/cost-tracker';
import { ChatPanel } from '../ui/chat-panel';

/**
 * Coordinated Fleet Audit Command
 * Rallies multiple agents to review the integration of Supabase migrations.
 */
export async function rallyCrewAuditCommand(
    context: vscode.ExtensionContext, 
    agentNetwork: AgentNetworkService,
    costTracker: CostTracker
) {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
        vscode.window.showErrorMessage('🛡️ Admiral: No active workspace detected for fleet audit.');
        return;
    }

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "🖖 Rallying the Crew for Migration Integration Audit...",
        cancellable: true
    }, async (progress) => {
        try {
            // 1. Gather Artifacts for Context
            progress.report({ message: "Gathering migration artifacts...", increment: 10 });
            const migrationsDir = path.join(workspaceRoot, 'supabase', 'migrations');
            const schemaFile = path.join(workspaceRoot, 'domains', 'shared', 'schemas', 'src', 'database.ts');
            
            let migrationsList: string[] = [];
            try {
                migrationsList = await fs.readdir(migrationsDir);
            } catch (e) {
                console.warn("Migrations directory not found");
            }

            const schemaExists = await fs.access(schemaFile).then(() => true).catch(() => false);

            // 2. Fetch Recent Autopilot Audits from n8n
            progress.report({ message: "Retrieving recent autopilot logs...", increment: 10 });
            const recentAudits = await agentNetwork.getRecentInsights('n8n-autopilot-audit', 5);
            
            const auditHistoryText = recentAudits.length > 0 
                ? recentAudits.map((a, i) => `Audit ${i+1} [${a.severity}] (${new Date(a.created_at).toLocaleDateString()}): ${a.content.substring(0, 300)}...`).join('\n\n')
                : "No recent autopilot audits found in logs.";

            // 3. Construct the Multi-Agent Directive
            const auditPrompt = `
### RECENT AUTOPILOT AUDIT HISTORY ###
${auditHistoryText}

---
### FLEET DIRECTIVE: Supabase Migration Integration Audit ###

**Artifacts Detected:**
- Migrations Count: ${migrationsList.length}
- Latest Migration: ${migrationsList.slice(-1)[0] || 'None'}
- Generated Type Definitions: ${schemaExists ? 'READY' : 'MISSING'}

**Directives per Department:**
1. **DATA (Strategic)**: Verify if latest migrations align with BarItalia STL technical specs.
2. **GEORDI (Engineering)**: Verify if 'shared/schemas' types are synchronized with the migrations.
3. **WORF (Security)**: Scan migrations for Row Level Security (RLS) enforcement and secret leakage.
4. **CRUSHER (Diagnostics)**: Check for manual SQL patterns in application domains instead of using the types.

Please provide a unified 'Green/Yellow/Red' status report on integration health.
            `;

            // 4. Engage the Agent Network
            progress.report({ message: "Crew is performing cross-domain analysis...", increment: 30 });
            
            // Open the chat panel to show the coordinated response
            await vscode.commands.executeCommand('openrouter-crew.chat');
            if (ChatPanel.currentPanel) {
                await ChatPanel.currentPanel.ask(auditPrompt);
            }

        } catch (error: any) {
            vscode.window.showErrorMessage(`Audit Failed: ${error.message}`);
        }
    });
}
import * as vscode from 'vscode';
import { MaintenanceStatusProvider } from '../providers/maintenance-status';

export async function triggerMaintenance(statusProvider: MaintenanceStatusProvider) {
    // 1. Update UI to Maintenance State
    statusProvider.setMaintenanceMode(true);
    
    // Show transient notification
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "System Maintenance: Pruning Memories...",
        cancellable: false
    }, async (progress) => {
        try {
            const config = vscode.workspace.getConfiguration('openrouter-crew');
            const dashboardUrl = config.get<string>('dashboardUrl') || 'http://localhost:3000';
            
            const response = await fetch(`${dashboardUrl}/api/route?task=maintenance`);
            
            if (response.ok) {
                const data = await response.json() as { success: boolean; maintenance: { count: number } };
                vscode.window.showInformationMessage(`Maintenance Complete. Pruned ${data.maintenance?.count || 0} expired memories.`);
            } else {
                throw new Error(`API responded with ${response.status} ${response.statusText}`);
            }
        } catch (error: any) {
            vscode.window.showErrorMessage(`Maintenance Failed: ${error.message}`);
        } finally {
            // 2. Revert UI to Operational State
            statusProvider.setMaintenanceMode(false);
        }
    });
}
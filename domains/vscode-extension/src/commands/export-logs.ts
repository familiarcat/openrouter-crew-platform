import * as vscode from 'vscode';
import { TextEncoder } from 'util';

export async function exportLogsCommand(sessionLogs: string[]): Promise<void> {
    if (sessionLogs.length === 0) {
        vscode.window.showInformationMessage('OpenRouter Crew: No logs to export yet.');
        return;
    }

    const uri = await vscode.window.showSaveDialog({
        filters: {
            'Log Files': ['log', 'txt', 'md']
        },
        defaultUri: vscode.Uri.file('openrouter-crew-session.log'),
        saveLabel: 'Export Logs'
    });

    if (uri) {
        const content = sessionLogs.join('\n\n');
        await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(content));
        vscode.window.showInformationMessage(`Logs exported to ${uri.fsPath}`);
    }
}
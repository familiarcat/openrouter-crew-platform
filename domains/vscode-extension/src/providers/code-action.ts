import * as vscode from 'vscode';

/**
 * Provides Code Actions (Quick Fixes) for issues detected in the editor.
 */
export class CrewCodeActionProvider implements vscode.CodeActionProvider {
    
    provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection,
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<(vscode.Command | vscode.CodeAction)[]> {
        
        // If there are no diagnostics (errors/warnings), don't provide actions
        if (context.diagnostics.length === 0) {
            return [];
        }

        const actions: vscode.CodeAction[] = [];

        // Create a Quick Fix action that triggers our existing quickFix command
        const fixAction = new vscode.CodeAction(
            '✨ Fix with OpenRouter Crew',
            vscode.CodeActionKind.QuickFix
        );
        
        fixAction.command = { command: 'openrouter-crew.quickFix', title: 'Fix with OpenRouter Crew' };
        fixAction.diagnostics = [...context.diagnostics];
        
        actions.push(fixAction);

        return actions;
    }
}
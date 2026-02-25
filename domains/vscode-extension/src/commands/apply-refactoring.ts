import * as vscode from 'vscode';

/**
 * Applies a refactoring or other code change by replacing code in a given range.
 * This command is intended to be called programmatically, often from a webview, with arguments.
 * @param newCode The new code to insert.
 * @param rangeToReplace A plain object representing the range to replace, 
 *                       as it comes from a webview context.
 */
export async function applyRefactoringCommand(
    newCode: string, 
    rangeToReplace?: { start: { line: number, character: number }, end: { line: number, character: number } }
): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor to apply changes.');
        return;
    }

    if (typeof newCode !== 'string') {
        vscode.window.showErrorMessage('Apply command called with invalid arguments.');
        return;
    }

    let selectionRange: vscode.Range;

    if (rangeToReplace) {
        selectionRange = new vscode.Range(
            new vscode.Position(rangeToReplace.start.line, rangeToReplace.start.character),
            new vscode.Position(rangeToReplace.end.line, rangeToReplace.end.character)
        );
    } else {
        selectionRange = editor.selection;
    }

    try {
        await editor.edit(editBuilder => {
            editBuilder.replace(selectionRange, newCode);
        });
        
        await vscode.commands.executeCommand('editor.action.formatDocument');
        vscode.window.showInformationMessage('Changes applied successfully.');
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to apply changes: ${error instanceof Error ? error.message : String(error)}`);
    }
}
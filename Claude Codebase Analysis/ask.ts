import * as vscode from 'vscode';

export async function askCommand() {
    vscode.window.showInformationMessage('Ask command executed');
}
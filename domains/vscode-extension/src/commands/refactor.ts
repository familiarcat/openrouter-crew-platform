import * as vscode from 'vscode';
import { CommandExecutor } from './command-executor.js';
import { ContextProvider } from '../services/context-provider.js';
import { OutputLogger } from '../ui/output-logger.js';
import { ChatPanel } from '../ui/chat-panel.js';

export async function refactorCommand(
    commandExecutor: CommandExecutor,
    contextProvider: ContextProvider,
    outputLogger: OutputLogger,
    range?: vscode.Range
): Promise<void> {
    // If range provided (e.g. from CodeLens), select it first
    if (range && vscode.window.activeTextEditor) {
        vscode.window.activeTextEditor.selection = new vscode.Selection(range.start, range.end);
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found.');
        return;
    }

    const context = contextProvider.getEditorContext();
    if (!context || !context.selectedCode) {
        vscode.window.showInformationMessage('Please select the code you want to refactor.');
        return;
    }

    const quickPickItems = [
        { label: 'Improve readability and clarity', detail: 'Focus on variable names, comments, and structure.' },
        { label: 'Reduce complexity', detail: 'Simplify logic, break down large functions.' },
        { label: 'Add type hints', detail: 'Ensure all variables, parameters, and returns are typed.' },
        { label: 'Convert to async/await', detail: 'Modernize promise-based code.' },
        { label: 'Custom instruction...', detail: 'Enter your own refactoring prompt.' }
    ];

    const selected = await vscode.window.showQuickPick(quickPickItems, {
        placeHolder: 'Select a refactoring goal or enter a custom one',
        title: 'Refactor Code'
    });

    if (!selected) return;

    let instruction = selected.label;
    if (instruction === 'Custom instruction...') {
        const customInstruction = await vscode.window.showInputBox({
            prompt: 'Custom Refactoring Instruction',
            placeHolder: 'e.g., "Extract the loop into a separate function"'
        });
        if (!customInstruction) {
            // User cancelled the input box
            return;
        }
        instruction = customInstruction;
    }

    if (!instruction) return;

    const filePath = editor.document.fileName;

    // Construct the prompt
    const prompt = `Refactor the following code in '${filePath}'.
Instruction: ${instruction}

Code:
\`\`\`${context.languageId}
${context.selectedCode}
\`\`\`
`;

    // Ensure Chat Panel is open
    await vscode.commands.executeCommand('openrouter-crew.chat');
    
    // Send to Chat Panel
    if (ChatPanel.currentPanel) {
        ChatPanel.currentPanel.ask(prompt);
    } else {
        vscode.window.showErrorMessage('Failed to open Chat Panel.');
    }
}
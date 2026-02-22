import * as vscode from 'vscode';
import { LLMRouter } from './services/llm-router';
import { CostTracker } from './services/cost-tracker';

export function activate(context: vscode.ExtensionContext) {
    console.log('OpenRouter Crew Extension is now active!');

    // Initialize services
    const costTracker = new CostTracker(context);
    const llmRouter = new LLMRouter(costTracker);

    // Register commands
    let askDisposable = vscode.commands.registerCommand('openrouter-crew.ask', async () => {
        const input = await vscode.window.showInputBox({ prompt: 'Ask OpenRouter Crew' });
        if (input) {
            try {
                const response = await llmRouter.route({ prompt: input });
                vscode.window.showInformationMessage(`AI: ${response.content}`);
            } catch (error: any) {
                vscode.window.showErrorMessage(`Error: ${error.message}`);
            }
        }
    });

    context.subscriptions.push(askDisposable);
}

export function deactivate() {}
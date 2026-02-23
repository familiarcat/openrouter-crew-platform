import * as vscode from 'vscode';

export async function updateDailyBudgetCommand(): Promise<void> {
    const config = vscode.workspace.getConfiguration('openrouterCrew');
    const currentBudget = config.get<number>('budget.daily') || 1.0;

    const input = await vscode.window.showInputBox({
        prompt: 'Enter new daily budget (USD)',
        value: currentBudget.toString(),
        validateInput: (value) => {
            const num = parseFloat(value);
            return isNaN(num) || num <= 0 ? 'Please enter a valid positive number' : null;
        }
    });

    if (input) {
        const newBudget = parseFloat(input);
        await config.update('budget.daily', newBudget, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`Daily budget updated to $${newBudget.toFixed(2)}`);
    }
}
import * as vscode from 'vscode';

export async function updateDailyBudgetCommand(): Promise<void> {
  const config = vscode.workspace.getConfiguration('openrouterCrew');
  const currentBudget = config.get<number>('budget.daily', 1.0);

  const newBudgetString = await vscode.window.showInputBox({
    prompt: 'Enter the new daily budget in USD.',
    value: currentBudget.toString(),
    validateInput: (value) => {
      const numberValue = parseFloat(value);
      if (isNaN(numberValue) || numberValue < 0) {
        return 'Please enter a valid positive number.';
      }
      return null; // Input is valid
    },
  });

  if (newBudgetString) {
    const newBudget = parseFloat(newBudgetString);
    await config.update('budget.daily', newBudget, vscode.ConfigurationTarget.Global);
    vscode.window.showInformationMessage(`Daily budget updated to $${newBudget.toFixed(2)}.`);
  }
}
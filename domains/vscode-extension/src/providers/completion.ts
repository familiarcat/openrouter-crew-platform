import * as vscode from 'vscode';
import { LLMRouter } from '../services/llm-router';

export class AICompletionProvider implements vscode.InlineCompletionItemProvider {
  constructor(private llmRouter: LLMRouter) {}

  async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken
  ): Promise<vscode.InlineCompletionItem[]> {
    // Only trigger on explicit request or specific logic to save costs
    // For now, we'll rely on manual trigger (Ctrl+Space) or specific typing pauses
    if (context.triggerKind === vscode.InlineCompletionTriggerKind.Automatic) {
       // Optional: Add debounce or logic to prevent spamming API on every keystroke
    }

    const prefix = document.getText(new vscode.Range(new vscode.Position(Math.max(0, position.line - 50), 0), position));
    const suffix = document.getText(new vscode.Range(position, new vscode.Position(Math.min(document.lineCount, position.line + 20), 0)));

    const prompt = `Complete the code at <CURSOR>. Return ONLY the code to insert. Do not include markdown formatting.

Context:
${prefix}<CURSOR>${suffix}`;

    try {
      const response = await this.llmRouter.route({
        prompt,
        intent: 'COMPLETE',
        complexity: 'LOW' // Force cheaper model for completions
      });

      if (response && response.content) {
        // Strip any markdown code blocks if the model adds them despite instructions
        const cleanContent = response.content.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
        return [new vscode.InlineCompletionItem(cleanContent)];
      }
    } catch (error) {
      console.error('Completion error:', error);
    }

    return [];
  }
}
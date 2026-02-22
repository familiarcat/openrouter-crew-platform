import * as vscode from 'vscode';
import { FileManager } from '../services/file-manager';

/**
 * Hover Provider
 * Shows cost estimates and AI actions when hovering over function definitions.
 */
export class CostHoverProvider implements vscode.HoverProvider {
  constructor(private fileManager: FileManager) {}

  provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {
    const analysis = this.fileManager.analyzeFile(document.fileName, document.getText());
    
    // Find if we are hovering over a function definition
    const node = analysis.nodes.find(n => 
      (n.type === 'function' || n.type === 'class') && 
      n.startLine - 1 === position.line
    );

    if (!node) {
      return null;
    }

    // Calculate estimated tokens and cost
    // Rough estimate: 1 token ~= 4 chars
    const contentLength = node.content.length;
    const estimatedTokens = Math.ceil(contentLength / 4);
    
    // Cost estimates (using Claude 3.5 Sonnet pricing as baseline: $3/1M input)
    const inputCostPer1M = 3.0;
    const outputCostPer1M = 15.0;
    
    // Estimate for "Explain": Input + ~500 output tokens
    const explainCost = ((estimatedTokens * inputCostPer1M) + (500 * outputCostPer1M)) / 1000000;
    
    // Estimate for "Refactor": Input + Output (roughly same size as input)
    const refactorCost = ((estimatedTokens * inputCostPer1M) + (estimatedTokens * outputCostPer1M)) / 1000000;

    const markdown = new vscode.MarkdownString();
    markdown.isTrusted = true;
    
    markdown.appendMarkdown(`### 🤖 OpenRouter Crew AI\n\n`);
    markdown.appendMarkdown(`**${node.type === 'function' ? 'Function' : 'Class'}:** \`${node.name}\`\n\n`);
    markdown.appendMarkdown(`**Complexity:** ${this.getComplexityLabel(this.calculateComplexity(node.content))}\n`);
    markdown.appendMarkdown(`**Size:** ~${estimatedTokens} tokens\n\n`);
    
    markdown.appendMarkdown(`**Estimated Costs:**\n`);
    markdown.appendMarkdown(`- ℹ️ Explain: ~$${explainCost.toFixed(5)}\n`);
    markdown.appendMarkdown(`- 🧪 Refactor: ~$${refactorCost.toFixed(5)}\n\n`);
    
    markdown.appendMarkdown(`$(info) Explain | $(beaker) Refactor`);

    return new vscode.Hover(markdown);
  }

  private calculateComplexity(content: string): number {
    return (content.match(/if|for|while|case|catch/g) || []).length + 1;
  }

  private getComplexityLabel(score: number): string {
    return score > 10 ? '🔴 High' : score > 5 ? '🟡 Medium' : '🟢 Low';
  }
}
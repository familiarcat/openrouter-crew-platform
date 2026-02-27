import * as vscode from 'vscode';
import { LLMRouter } from '../services/llm-router.js';

export class AICompletionProvider implements vscode.InlineCompletionItemProvider {
    constructor(private llmRouter: LLMRouter) {}

    async provideInlineCompletionItems(document: vscode.TextDocument, position: vscode.Position, context: vscode.InlineCompletionContext, token: vscode.CancellationToken): Promise<vscode.InlineCompletionItem[]> {
        // Future: Implement ghost text completion using LLM
        // This requires careful cost management
        return [];
    }
}
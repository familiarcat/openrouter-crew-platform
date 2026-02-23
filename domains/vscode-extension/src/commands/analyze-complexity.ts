import * as vscode from 'vscode';
import { LLMRouter } from '../services/llm-router.js';
import { ContextProvider } from '../services/context-provider.js';
import { NLPProcessor } from '../services/nlp-processor.js';

export async function analyzeComplexityCommand(llmRouter: LLMRouter, contextProvider: ContextProvider): Promise<void> {
    const editorContext = contextProvider.getEditorContext();
    if (!editorContext || !editorContext.selectedCode) {
        vscode.window.showWarningMessage('Please select code to analyze.');
        return;
    }
    
    // Per the architecture in `command-executor.ts`, complexity analysis should use the NLPProcessor.
    // This command is being updated to reflect that pattern, moving away from the direct `llmRouter` method.
    // In a future refactor, a single `CommandExecutor` instance would provide these services.
    const nlpProcessor = new NLPProcessor();
    const analysis = nlpProcessor.analyze(editorContext.selectedCode);
 
    vscode.window.showInformationMessage(`Code Complexity: ${analysis.complexity}`);
}
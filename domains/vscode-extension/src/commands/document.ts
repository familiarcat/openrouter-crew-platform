import * as vscode from 'vscode';
import { LLMRouter } from '../services/llm-router';
import { ContextProvider } from '../services/context-provider';
import { OutputLogger } from '../ui/output-logger';
import { executeAICommand } from './command-runner';

export async function documentCommand(llmRouter: LLMRouter, contextProvider: ContextProvider, outputLogger: OutputLogger): Promise<void> {
  const editorContext = contextProvider.getEditorContext();
  if (!editorContext) {
    vscode.window.showErrorMessage('No active editor found.');
    return;
  }

  if (!editorContext.selectedCode) {
    vscode.window.showInformationMessage('Please select a function or class to document.');
    return;
  }

  const language = editorContext.languageId;
  const docStyle = (language === 'javascript' || language === 'typescript') ? 'JSDoc' : 'docstring';

  const prompt = `Generate a comprehensive ${docStyle} for the following ${language} code.

Code to document:
\`\`\`${language}
${editorContext.selectedCode}
\`\`\`

Requirements:
1. Describe the function's purpose.
2. Document all parameters with their types and descriptions.
3. Document the return value.
4. Include an example of usage if applicable.
5. Return the **complete, updated code block** with the new documentation inserted. Do not provide any other text, explanations, or markdown formatting.`;

  const response = await executeAICommand(
    llmRouter,
    'OpenRouter Crew: Generating documentation...',
    {
      prompt,
      context: editorContext.selectedCode,
      intent: 'DOCUMENT',
    }
  );

  if (response) {
    let documentedCode = response.content;
    
    // Clean up markdown code blocks if present
    const codeBlockMatch = documentedCode.match(/```[\w]*\n([\s\S]*?)```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      documentedCode = codeBlockMatch[1].trim();
    }

    const editor = vscode.window.activeTextEditor;
    if (editor) {
      // Replace the original selection with the newly documented code
      await editor.edit(editBuilder => {
        editBuilder.replace(editorContext.selectionRange, documentedCode);
      });

      // Optional: format the document after insertion to fix indentation
      await vscode.commands.executeCommand('editor.action.formatSelection');
    }

    outputLogger.logExchange({
      title: `Documentation Generation (${language})`,
      model: response.model,
      cost: response.cost,
      content: 'Documentation applied to the editor.',
      contextCode: {
        language: language,
        code: editorContext.selectedCode,
      },
    });
  }
}
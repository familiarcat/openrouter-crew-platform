import * as vscode from 'vscode';
import { LLMRouter } from '../services/llm-router';
import { FileManager } from '../services/file-manager';
import { OutputLogger } from '../ui/output-logger';
import { executeAICommand } from './command-runner';
import { StructureView } from '../ui/structure-view';

export async function structureCommand(llmRouter: LLMRouter, fileManager: FileManager, outputLogger: OutputLogger, structureView: StructureView): Promise<void> {
  const files = await fileManager.getProjectStructure();

  if (files.length === 0) {
    vscode.window.showInformationMessage('No files found in the workspace to analyze.');
    return;
  }

  // Limit file list size if too large to avoid token limits (approx 500 files)
  const fileList = files.length > 500
    ? files.slice(0, 500).join('\n') + `\n...and ${files.length - 500} more files`
    : files.join('\n');

  const prompt = `Analyze the following project file structure and suggest improvements for better organization, scalability, and maintainability.

Current Structure:
\`\`\`
${fileList}
\`\`\`

Provide:
1. Analysis of the current organization (strengths/weaknesses)
2. Specific suggestions for moving/renaming files or folders to improve architecture
3. Recommendations for missing directories (e.g., tests, docs, types, utils)`;

  const response = await executeAICommand(llmRouter, 'OpenRouter Crew: Analyzing project structure...', {
    prompt,
    intent: 'STRUCTURE',
  });

  if (response) {
    structureView.show(response);
    outputLogger.logExchange({
      title: 'Project Structure Analysis',
      model: response.model,
      cost: response.cost,
      content: response.content,
    });
  }
}
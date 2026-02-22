import * as vscode from 'vscode';
import { activateExtension } from './activation';
import { deactivateExtension } from './deactivation';

export async function activate(context: vscode.ExtensionContext) {
  console.log('🚀 OpenRouter Crew Extension is now active!');
  await activateExtension(context);
}

export function deactivate() {
  deactivateExtension();
}
import * as vscode from 'vscode';
import { ResponseCache } from '../services/cache.js';

export async function clearCacheCommand(responseCache: ResponseCache): Promise<void> {
    await responseCache.clearAll();
    vscode.window.showInformationMessage('OpenRouter Crew: LLM Response Cache Cleared.');
}
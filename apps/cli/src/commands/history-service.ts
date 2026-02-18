import fs from 'fs/promises';
import path from 'path';
import { OptimizationSuggestion } from '@openrouter-crew/shared-cost-tracking';

const MOCK_HISTORY_PATH = path.join(process.cwd(), '.mock-crew-history.json');

export interface HistoryEntry {
  timestamp: string;
  action: 'apply' | 'revert';
  suggestionId: string;
  suggestionType: 'model_switch' | 'batching' | 'caching';
  details: string;
}

class OptimizationHistoryService {
  private async readHistory(): Promise<HistoryEntry[]> {
    try {
      const data = await fs.readFile(MOCK_HISTORY_PATH, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // If file doesn't exist, return empty array
      return [];
    }
  }

  private async writeHistory(history: HistoryEntry[]): Promise<void> {
    await fs.writeFile(MOCK_HISTORY_PATH, JSON.stringify(history, null, 2));
  }

  async logAction(suggestion: OptimizationSuggestion, action: 'apply' | 'revert'): Promise<void> {
    const history = await this.readHistory();
    
    let details = '';
    if (suggestion.type === 'model_switch') {
        if (action === 'apply') {
            details = `Switched to ${suggestion.context?.suggestedModel} from ${suggestion.context?.currentModel}`;
        } else {
            details = `Reverted to ${suggestion.context?.currentModel} from ${suggestion.context?.suggestedModel}`;
        }
    } else {
        details = `Manual action recommended for ${suggestion.type}.`;
    }

    const newEntry: HistoryEntry = {
      timestamp: new Date().toISOString(),
      action,
      suggestionId: suggestion.id,
      suggestionType: suggestion.type,
      details,
    };

    history.unshift(newEntry); // Add to the beginning
    await this.writeHistory(history);
  }

  async getHistory(limit: number = 20): Promise<HistoryEntry[]> {
    const history = await this.readHistory();
    return history.slice(0, limit);
  }
}

export const historyService = new OptimizationHistoryService();
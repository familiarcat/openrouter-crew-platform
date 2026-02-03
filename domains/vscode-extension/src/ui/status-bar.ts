/**
 * Status Bar UI
 *
 * Real-time cost meter in VSCode status bar.
 */

/**
 * Status Bar Item
 */
export interface StatusBarItem {
  text: string;
  tooltip: string;
  color?: string;
  command?: string;
}

/**
 * Status Bar Manager
 */
export class StatusBarManager {
  /**
   * Format budget status for display
   */
  static formatBudgetStatus(remaining: number, total: number): StatusBarItem {
    const percent = ((total - remaining) / total) * 100;
    const status = percent > 95 ? '🔴' : percent > 75 ? '🟡' : '🟢';

    return {
      text: `${status} $${remaining.toFixed(2)} / $${total.toFixed(2)} (${Math.round(percent)}%)`,
      tooltip: `Budget: $${remaining.toFixed(2)} remaining of $${total.toFixed(2)} daily limit`,
      command: 'openrouter-crew.cost.report',
    };
  }

  /**
   * Format session status
   */
  static formatSessionStatus(requestCount: number, totalCost: number): StatusBarItem {
    return {
      text: `📊 ${requestCount} requests • $${totalCost.toFixed(2)}`,
      tooltip: `Session: ${requestCount} requests, $${totalCost.toFixed(2)} total cost`,
    };
  }

  /**
   * Format error status
   */
  static formatErrorStatus(message: string): StatusBarItem {
    return {
      text: `⚠️ ${message}`,
      tooltip: message,
      color: 'error',
    };
  }

  /**
   * Format ready status
   */
  static formatReadyStatus(): StatusBarItem {
    return {
      text: `✅ Alex AI Ready`,
      tooltip: 'AI assistant is ready for commands',
      color: 'success',
    };
  }
}

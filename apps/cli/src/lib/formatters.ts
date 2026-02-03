import chalk from 'chalk';
import { table } from 'table';

/**
 * Format cost values with currency symbol
 */
export function formatCost(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(amount);
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

/**
 * Format a percentage with color
 */
export function formatPercent(value: number, total: number): string {
  const percent = (value / total) * 100;
  const formatted = `${percent.toFixed(1)}%`;

  if (percent >= 80) {
    return chalk.red(formatted);
  }
  if (percent >= 50) {
    return chalk.yellow(formatted);
  }
  return chalk.green(formatted);
}

/**
 * Format a table with headers and rows
 */
export function formatTable(headers: string[], rows: (string | number)[][]): void {
  const data = [headers.map((h) => chalk.bold(h)), ...rows];

  const config = {
    border: {
      topBody: '─',
      topJoin: '┬',
      topLeft: '┌',
      topRight: '┐',
      bottomBody: '─',
      bottomJoin: '┴',
      bottomLeft: '└',
      bottomRight: '┘',
      bodyLeft: '│',
      bodyRight: '│',
      bodyJoin: '│',
      joinBody: '─',
      joinLeft: '├',
      joinRight: '┤',
      joinJoin: '┼',
    },
    style: {
      head: [],
      border: ['grey'],
    },
  };

  console.log(table(data, config));
}

/**
 * Format a status badge
 */
export function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: chalk.yellow('⏳ Pending'),
    running: chalk.blue('▶ Running'),
    completed: chalk.green('✓ Completed'),
    failed: chalk.red('✗ Failed'),
    available: chalk.green('✓ Available'),
    busy: chalk.yellow('⏳ Busy'),
    paused: chalk.gray('⏸ Paused'),
  };

  return statusMap[status] || status;
}

/**
 * Format a crew member name with emoji
 */
export function formatCrewMember(name: string): string {
  const emojiMap: Record<string, string> = {
    picard: '⭐',
    data: '🤖',
    riker: '🎯',
    troi: '🎨',
    worf: '🛡️',
    crusher: '⚕️',
    lafarge: '🔧',
    uhura: '📡',
    obrien: '🔨',
    quark: '💰',
  };

  const emoji = emojiMap[name.toLowerCase()] || '👤';
  return `${emoji} ${chalk.bold(name)}`;
}

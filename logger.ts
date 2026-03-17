import chalk from 'chalk';

export const printHeader = (text: string): void => console.log(chalk.blue(`\n════════════════════════════════════════════════════════\n${text}\n════════════════════════════════════════════════════════\n`));
export const printStep = (text: string): void => console.log(chalk.cyan(`→ ${text}`));
export const printSuccess = (text: string): void => console.log(chalk.green(`✓ ${text}`));
export const printWarning = (text: string): void => console.log(chalk.yellow(`⚠ ${text}`));
export const printError = (text: string): void => console.error(chalk.red(`✗ ${text}`));
export const printInfo = (text: string): void => console.log(chalk.magenta(`ℹ ${text}`));
export const stepMarker = (stepNum: string, stepName: string): void => console.log(chalk.magenta(`\n[${stepNum}/11] ${chalk.yellow(stepName)}\n`));

export interface TableColumn<T> {
  header: string;
  width: number;
  getter: (item: T) => string;
  color?: (item: T) => (text: string) => string;
}

export const printTable = <T>(data: T[], columns: TableColumn<T>[]): void => {
  const header = columns.map(col => chalk.bold(col.header.padEnd(col.width))).join('');
  console.log(header);
  console.log('─'.repeat(columns.reduce((sum, col) => sum + col.width, 0)));

  data.forEach(item => {
    const row = columns.map(col => {
      const val = col.getter(item);
      const padded = val.padEnd(col.width);
      return col.color ? col.color(item)(padded) : padded;
    }).join('');
    console.log(row);
  });
};
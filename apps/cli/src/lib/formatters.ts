import { table } from 'table';

export function formatTable(headers: string[], rows: string[][]) {
  const config = {
    border: {
      topBody: `─`,
      topJoin: `┬`,
      topLeft: `┌`,
      topRight: `┐`,
      bottomBody: `─`,
      bottomJoin: `┴`,
      bottomLeft: `└`,
      bottomRight: `┘`,
      bodyLeft: `│`,
      bodyRight: `│`,
      bodyJoin: `│`,
      headerJoin: `┼`,
    },
  };
  console.log(table([headers, ...rows], config));
}

export function formatCost(cost: number): string {
  return `$${cost.toFixed(4)}`;
}
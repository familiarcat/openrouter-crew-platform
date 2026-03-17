import * as readline from 'readline';

export const askForConfirmation = (question: string, expected: string): Promise<boolean> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim().toUpperCase() === expected.toUpperCase());
    });
  });
};
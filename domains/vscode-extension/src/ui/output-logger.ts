import * as vscode from 'vscode';

export class OutputLogger {
  private outputChannel: vscode.OutputChannel;

  constructor() {
    this.outputChannel = vscode.window.createOutputChannel('OpenRouter Crew');
  }

  show() {
    this.outputChannel.show(true);
  }

  log(message: string) {
    this.outputChannel.appendLine(message);
  }

  logExchange(params: {
    title: string;
    model: string;
    cost: number;
    content: string;
    contextCode?: { language: string; code: string };
  }) {
    this.show();
    this.log('----------------------------------------');
    this.log(params.title);
    this.log(`Model: ${params.model} | Cost: $${params.cost.toFixed(6)}`);
    this.log('----------------------------------------');

    if (params.contextCode) {
      this.log('Reviewed Code:');
      this.log('```' + params.contextCode.language);
      this.log(params.contextCode.code);
      this.log('```');
      this.log('\nReview:');
    }

    this.log(params.content);
    this.log('');
  }
}
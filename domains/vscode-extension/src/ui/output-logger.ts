import * as vscode from 'vscode';

/**
 * Defines the structure for logging an exchange with an AI model.
 */
export interface LogExchange {
    model: string;
    cost: number;
    content: string;
    cached?: boolean;
}

/**
 * Defines the interface for a logger that can record AI exchanges.
 */
export interface OutputLogger {
    logExchange(exchange: LogExchange): void;
}

/**
 * Concrete implementation of OutputLogger using a VSCode OutputChannel.
 */
export class VSCodeOutputLogger implements OutputLogger {
    private channel: vscode.OutputChannel;

    constructor() {
        this.channel = vscode.window.createOutputChannel('OpenRouter Crew Logs');
    }

    logExchange(exchange: LogExchange): void {
        this.channel.appendLine(`[${new Date().toISOString()}] ${exchange.model} ($${exchange.cost.toFixed(6)})`);
        this.channel.appendLine(exchange.content);
        this.channel.appendLine('---');
    }
}
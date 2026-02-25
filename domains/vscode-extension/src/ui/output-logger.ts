/**
 * Defines the structure for logging an exchange with an AI model.
 */
export interface LogExchange {
    model: string;
    cost: number;
    content: string;
}

/**
 * Defines the interface for a logger that can record AI exchanges.
 */
export interface OutputLogger {
    logExchange(exchange: LogExchange): void;
}
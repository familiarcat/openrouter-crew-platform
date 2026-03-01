/**
 * Standardized errors for CrewAPIClient
 */
export declare class CrewAPIError extends Error {
    statusCode: number;
    code: string;
    details?: any;
    constructor(message: string, statusCode?: number, code?: string, details?: any);
}
export declare class AuthenticationError extends CrewAPIError {
    constructor(message?: string, details?: any);
}
export declare class AuthorizationError extends CrewAPIError {
    constructor(message?: string, details?: any);
}
export declare class NotFoundError extends CrewAPIError {
    constructor(resource: string, id?: string);
}
export declare class RateLimitError extends CrewAPIError {
    retryAfter?: number;
    constructor(message?: string, retryAfter?: number);
}
export declare class NetworkError extends CrewAPIError {
    constructor(message: string, originalError?: any);
}
//# sourceMappingURL=errors.d.ts.map
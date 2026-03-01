/**
 * Standardized errors for CrewAPIClient
 */
export class CrewAPIError extends Error {
    statusCode;
    code;
    details;
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.name = 'CrewAPIError';
    }
}
export class AuthenticationError extends CrewAPIError {
    constructor(message = 'Authentication failed', details) {
        super(message, 401, 'AUTHENTICATION_ERROR', details);
        this.name = 'AuthenticationError';
    }
}
export class AuthorizationError extends CrewAPIError {
    constructor(message = 'Permission denied', details) {
        super(message, 403, 'AUTHORIZATION_ERROR', details);
        this.name = 'AuthorizationError';
    }
}
export class NotFoundError extends CrewAPIError {
    constructor(resource, id) {
        super(`${resource} not found${id ? `: ${id}` : ''}`, 404, 'NOT_FOUND');
        this.name = 'NotFoundError';
    }
}
export class RateLimitError extends CrewAPIError {
    retryAfter;
    constructor(message = 'Rate limit exceeded', retryAfter) {
        super(message, 429, 'RATE_LIMIT_EXCEEDED', { retryAfter });
        this.retryAfter = retryAfter;
        this.name = 'RateLimitError';
    }
}
export class NetworkError extends CrewAPIError {
    constructor(message, originalError) {
        super(message, 0, 'NETWORK_ERROR', originalError);
        this.name = 'NetworkError';
    }
}
//# sourceMappingURL=errors.js.map
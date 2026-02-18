/**
 * Standardized errors for CrewAPIClient
 */

export class CrewAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'CrewAPIError';
  }
}

export class AuthenticationError extends CrewAPIError {
  constructor(message: string = 'Authentication failed', details?: any) {
    super(message, 401, 'AUTHENTICATION_ERROR', details);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends CrewAPIError {
  constructor(message: string = 'Permission denied', details?: any) {
    super(message, 403, 'AUTHORIZATION_ERROR', details);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends CrewAPIError {
  constructor(resource: string, id?: string) {
    super(`${resource} not found${id ? `: ${id}` : ''}`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends CrewAPIError {
  constructor(message: string = 'Rate limit exceeded', public retryAfter?: number) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', { retryAfter });
    this.name = 'RateLimitError';
  }
}

export class NetworkError extends CrewAPIError {
  constructor(message: string, originalError?: any) {
    super(message, 0, 'NETWORK_ERROR', originalError);
    this.name = 'NetworkError';
  }
}
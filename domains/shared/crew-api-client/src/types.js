/**
 * Core types for the Unified CrewAPIClient, based on the Surface Parity Contract.
 * Defines the contract for all surface interactions.
 */
export class UnauthorizedError extends Error {
    constructor(message) {
        super(message);
        this.name = 'UnauthorizedError';
    }
}
//# sourceMappingURL=types.js.map
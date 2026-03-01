/**
 * Authorization Service
 * Enforces consistent permission rules across all surfaces
 */
import { UnauthorizedError } from '../types';
/**
 * Authorization matrix: action → required role
 */
const AUTHORIZATION_MATRIX = {
    RETRIEVE_MEMORY: ['owner', 'member', 'viewer'],
    CREATE_MEMORY: ['owner', 'member'],
    UPDATE_MEMORY: ['owner', 'member'],
    DELETE_MEMORY: ['owner'], // Only owners can delete
    RESTORE_MEMORY: ['owner', 'member'],
    CREATE_CREW: ['owner'],
    EXECUTE_CREW: ['owner', 'member'],
    LIST_CREWS: ['owner', 'member', 'viewer'],
    GET_CREW_STATUS: ['owner', 'member', 'viewer'],
    SEARCH_MEMORIES: ['owner', 'member', 'viewer'],
    EXPLAIN_RETRIEVAL: ['owner', 'member', 'viewer'],
    EXPLAIN_COST: ['owner', 'member', 'viewer'],
    COMPLIANCE_STATUS: ['owner', 'member'],
    EXPIRATION_FORECAST: ['owner', 'member'],
    EXPORT_CREW_DATA: ['owner'],
    IMPORT_CREW_DATA: ['owner'],
    PRUNE_EXPIRED_MEMORIES: ['owner'],
    GENERATE_AUDIT_REPORT: ['owner'],
};
/**
 * Validate authorization for an intent
 * Throws UnauthorizedError if not allowed
 */
export async function validateAuthorization(intent, context) {
    const requiredRoles = AUTHORIZATION_MATRIX[intent.action];
    if (!requiredRoles) {
        throw new UnauthorizedError(`Unknown action: ${intent.action}`);
    }
    if (!requiredRoles.includes(context.role)) {
        throw new UnauthorizedError(`User role '${context.role}' is not authorized for action '${intent.action}'. ` +
            `Required roles: ${requiredRoles.join(', ')}`);
    }
    // Validate crew access (user can only access their own crew)
    if (intent.crew_id && context.crew_id && intent.crew_id !== context.crew_id) {
        throw new UnauthorizedError(`User is not authorized to access crew '${intent.crew_id}'`);
    }
}
/**
 * Get required role for an action
 */
export function getRequiredRoles(action) {
    return AUTHORIZATION_MATRIX[action] || [];
}
/**
 * Check if role has permission for action
 */
export function hasPermission(action, role) {
    const requiredRoles = AUTHORIZATION_MATRIX[action];
    return requiredRoles ? requiredRoles.includes(role) : false;
}
//# sourceMappingURL=authorization.js.map
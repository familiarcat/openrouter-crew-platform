/**
 * Authorization Service
 * Enforces consistent permission rules across all surfaces
 */
import { Intent, AuthContext, UserRole } from '../types';
/**
 * Validate authorization for an intent
 * Throws UnauthorizedError if not allowed
 */
export declare function validateAuthorization(intent: Intent, context: AuthContext): Promise<void>;
/**
 * Get required role for an action
 */
export declare function getRequiredRoles(action: string): UserRole[];
/**
 * Check if role has permission for action
 */
export declare function hasPermission(action: string, role: UserRole): boolean;
//# sourceMappingURL=authorization.d.ts.map
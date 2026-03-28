import { normalizeUserId } from "@/lib/auth/user-id";
/**
 * Authentication & Authorization Middleware for Alex AI
 *
 * Provides JWT/API key authentication and permission checking for API routes.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  supabase,
  checkPermission,
  logAudit,
  AuthProfile,
} from "@/lib/supabase";
import { verifyApiKey, hashApiKey } from "./api-keys";

/**
 * Extended NextRequest with user context
 */
export interface AuthenticatedRequest extends NextRequest {
  user?: AuthProfile;
  userId?: string;
}

/**
 * Authentication result
 */
export interface AuthResult {
  success: boolean;
  user?: AuthProfile;
  error?: string;
}

/**
 * Get user from Authorization header
 *
 * Supports:
 * - Bearer {api_key} - API key authentication (for VSCode extension)
 * - Bearer {jwt} - JWT token (for web dashboard - future)
 *
 * @param request - Next.js request object
 * @returns AuthResult with user profile or error
 */
export async function getUserFromRequest(
  request: NextRequest
): Promise<AuthResult> {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader) {
    return {
      success: false,
      error: "Missing Authorization header",
    };
  }

  // Extract token
  const token = authHeader.replace(/^Bearer\s+/i, "");

  if (!token) {
    return {
      success: false,
      error: "Invalid Authorization header format",
    };
  }

  // Try API key authentication first (for VSCode extension)
  const apiKeyResult = await authenticateWithApiKey(token);
  if (apiKeyResult.success) {
    return apiKeyResult;
  }

  // Future: Try JWT authentication (for web dashboard)
  // const jwtResult = await authenticateWithJWT(token);
  // if (jwtResult.success) return jwtResult;

  return {
    success: false,
    error: "Invalid or expired credentials",
  };
}

/**
 * Authenticate using API key
 *
 * @param apiKey - API key from Authorization header
 * @returns AuthResult with user profile or error
 */
async function authenticateWithApiKey(apiKey: string): Promise<AuthResult> {
  try {
    // Hash the API key
    const keyHash = hashApiKey(apiKey);

    // Look up API key in database
    const { data: apiKeyData, error: keyError } = await (supabase as any)
      .from("api_keys")
      .select("user_id, expires_at, revoked_at")
      .eq("key_hash", keyHash)
      .single();

    if (keyError || !apiKeyData) {
      return {
        success: false,
        error: "Invalid API key",
      };
    }

    const keyData = apiKeyData as any;

    // Check if revoked
    if (keyData.revoked_at) {
      return {
        success: false,
        error: "API key has been revoked",
      };
    }

    // Check if expired
    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
      return {
        success: false,
        error: "API key has expired",
      };
    }

    // Get user profile
    const { data: user, error: userError } = await supabase
      .from("auth_profiles")
      .select("*")
      .eq("id", keyData.user_id)
      .single();

    if (userError || !user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Update last_used_at timestamp (fire and forget)
    ((supabase as any).from("api_keys") as any)
      .update({ last_used_at: new Date().toISOString() })
      .eq("key_hash", keyHash)
      .then(() => {})
      .catch(() => {});

    return {
      success: true,
      // Ensure user_id exists to satisfy AuthProfile typing
      user: {
        user_id: normalizeUserId(user as any) ?? "",
        ...(user as any),
      } as any,
    };
  } catch (error) {
    console.error("[Auth] API key authentication error:", error);
    return {
      success: false,
      error: "Authentication failed",
    };
  }
}

/**
 * Middleware to require authentication
 *
 * Usage in API route:
 * ```typescript
 * export async function GET(req: NextRequest) {
 *   const authResult = await requireAuth(req);
 *   if (authResult instanceof NextResponse) return authResult;
 *   const { user } = authResult;
 *   // ... rest of handler
 * }
 * ```
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ user: AuthProfile } | NextResponse> {
  const authResult = await getUserFromRequest(request);

  if (!authResult.success) {
    return NextResponse.json(
      { error: authResult.error || "Unauthorized" },
      { status: 401 }
    );
  }

  return { user: authResult.user! };
}

/**
 * Middleware to require specific permission
 *
 * Usage in API route:
 * ```typescript
 * export async function POST(req: NextRequest) {
 *   const authResult = await requirePermission(req, 'project:create');
 *   if (authResult instanceof NextResponse) return authResult;
 *   const { user } = authResult;
 *   // ... rest of handler
 * }
 * ```
 */
export async function requirePermission(
  request: NextRequest,
  permission: string,
  projectId?: string
): Promise<{ user: AuthProfile } | NextResponse> {
  // First, require authentication
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;

  // Check permission
  const hasPermission = await checkPermission(
    normalizeUserId(user.id as any) ??
      (user.id as any)?.id ??
      (user.id as any) ??
      "",
    permission,
    projectId
  );

  // Log the permission check
  await logAudit({
    userId: user.id,
    action: `check_${permission}`,
    resource: projectId ? "project" : "system",
    resourceId: projectId || "global",
    metadata: {
      permission,
      hasPermission,
      route: request.nextUrl.pathname,
      method: request.method,
    },
  });

  if (!hasPermission) {
    return NextResponse.json(
      {
        error: "Forbidden",
        message: `You do not have permission: ${permission}`,
      },
      { status: 403 }
    );
  }

  return { user };
}

/**
 * Get user ID from request (without full auth check)
 * Useful for optional authentication scenarios
 */
export async function getUserId(request: NextRequest): Promise<string | null> {
  const authResult = await getUserFromRequest(request);
  return authResult.success
    ? String(
        (authResult as any).user?.id ?? (authResult as any).user?.user_id ?? ""
      )
    : null;
}

/**
 * Check if user can access project
 *
 * User can access if:
 * - They are the owner
 * - They are a project member
 * - They are an administrator
 */
export async function canAccessProject(
  userId: string,
  projectId: string
): Promise<boolean> {
  // Check if user is administrator
  const { data: user } = await supabase
    .from("auth_profiles")
    .select("system_role")
    .eq("id", userId)
    .single();

  if ((user as any)?.system_role === "administrator") {
    return true;
  }

  // Check if user is project owner
  const { data: project } = await supabase
    .from("projects")
    .select("owner_id")
    .eq("id", projectId)
    .single();

  if ((project as any)?.owner_id === userId) {
    return true;
  }

  // Check if user is project member
  const { data: membership } = await supabase
    .from("project_members")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .single();

  return !!membership;
}

/**
 * Middleware factory for permission-based route protection
 *
 * Usage:
 * ```typescript
 * const handler = withPermission('project:create', async (req, { user }) => {
 *   // Handler code with authenticated user
 *   return NextResponse.json({ success: true });
 * });
 *
 * export { handler as POST };
 * ```
 */
export function withPermission(
  permission: string,
  handler: (
    request: NextRequest,
    context: { user: AuthProfile }
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await requirePermission(request, permission);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    return handler(request, authResult);
  };
}

/**
 * Middleware factory for authentication-only route protection
 *
 * Usage:
 * ```typescript
 * const handler = withAuth(async (req, { user }) => {
 *   // Handler code with authenticated user
 *   return NextResponse.json({ user });
 * });
 *
 * export { handler as GET };
 * ```
 */
export function withAuth(
  handler: (
    request: NextRequest,
    context: { user: AuthProfile }
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    return handler(request, authResult);
  };
}

/**
 * Development utility: Create a test user session
 * ONLY for development/testing - DO NOT use in production
 */
export async function createDevUser(
  email: string
): Promise<AuthProfile | null> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("createDevUser() cannot be used in production");
  }

  const { data, error } = await supabase
    .from("auth_profiles")
    .select("*")
    .eq("email", email)
    .single();

  if (error || !data) {
    console.error("[Auth] Dev user not found:", email);
    return null;
  }

  return {
    user_id: String((data as any)?.user_id ?? (data as any)?.id ?? ""),
    ...(data as any),
  } as any;
}

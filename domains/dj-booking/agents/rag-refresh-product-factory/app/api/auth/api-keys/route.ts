import { normalizeUserId } from "@/lib/auth/user-id";
/**
 * API Key Management Routes
 *
 * Allows users to create, list, and revoke API keys for VSCode extension authentication.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import {
  createApiKeyForUser,
  listApiKeys,
  revokeApiKey,
  deleteApiKey,
} from "@/lib/auth/api-keys";
import { logAudit } from "@/lib/supabase";

/**
 * GET /api/auth/api-keys - List user's API keys
 *
 * Authentication: Required
 * Returns: Array of API key records (without plain keys)
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;

  // Get query params
  const { searchParams } = new URL(req.url);
  const includeRevoked = searchParams.get("includeRevoked") === "true";

  if (!user?.id || typeof user.id !== "string") {
    return NextResponse.json(
      { success: false, error: "Missing user id" },
      { status: 401 }
    );
  }
  const keys = await listApiKeys(user.id, includeRevoked);

  // Don't send sensitive data
  const sanitizedKeys = keys.map((key) => ({
    id: key.id,
    name: (key as any).name ?? (key as any).label ?? "",
    key_prefix: (key as any).key_prefix ?? "",
    scopes: (key as any).scopes ?? [],
    created_at: key.created_at,
    last_used_at: (key as any).last_used_at ?? null,
    expires_at: (key as any).expires_at ?? null,
    revoked_at: key.revoked_at,
  }));

  await logAudit({
    userId: user.id,
    action: "list_api_keys",
    resource: "api_key",
    metadata: { scope: "all", permission: "user:manage_api_keys" },
  });

  return NextResponse.json({
    api_keys: sanitizedKeys,
    total: sanitizedKeys.length,
  });
}

/**
 * POST /api/auth/api-keys - Create a new API key
 *
 * Authentication: Required
 * Body: { name: string, scopes?: string[], expiresInDays?: number }
 * Returns: { api_key: string, record: {...} }
 */
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;

  const body = await req.json();
  const { name, scopes, expiresInDays } = body;

  if (!name || typeof name !== "string") {
    return NextResponse.json(
      { error: "API key name is required" },
      { status: 400 }
    );
  }

  // Validate scopes if provided
  const validScopes = [
    "code:read",
    "code:write",
    "code:execute",
    "project:read",
    "project:write",
    "crew:chat",
    "crew:invoke",
  ];

  const requestedScopes = scopes || validScopes;

  const invalidScopes = requestedScopes.filter(
    (s: string) => !validScopes.includes(s)
  );
  if (invalidScopes.length > 0) {
    return NextResponse.json(
      { error: `Invalid scopes: ${invalidScopes.join(", ")}` },
      { status: 400 }
    );
  }

  // Create API key
  // AlexAI canonical userId normalization (server route)
  const userId = typeof (user as any)?.id === "string" ? (user as any).id : "";
  if (!userId) {
    return NextResponse.json(
      { success: false, error: "Missing user id" },
      { status: 401 }
    );
  }

  const result = await createApiKeyForUser(
    userId,
    name,
    requestedScopes,
    expiresInDays !== undefined ? expiresInDays : 365
  );

  if (!result) {
    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 }
    );
  }

  await logAudit({
    userId: user.id,
    action: "create_api_key",
    resource: "api_key",
    resourceId: result.record.id,
    metadata: {
      permission: "user:manage_api_keys",
      key_name: name,
      scopes: requestedScopes,
      expires_in_days: expiresInDays,
    },
  });

  return NextResponse.json({
    api_key: result.apiKey, // ⚠️ ONLY SHOWN ONCE!
    record: {
      id: result.record.id,
      name: (result.record as any).name ?? (result.record as any).label ?? "",
      key_prefix: (result.record as any).key_prefix ?? "",
      scopes: (result.record as any).scopes ?? [],
      created_at: result.record.created_at,
      expires_at: (result.record as any).expires_at ?? null,
    },
    message: "⚠️ Save this API key securely - it will not be shown again!",
  });
}

/**
 * DELETE /api/auth/api-keys - Revoke or delete an API key
 *
 * Authentication: Required
 * Query: ?id={keyId}&permanent=true (optional)
 */
export async function DELETE(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;

  const { searchParams } = new URL(req.url);
  const keyId = searchParams.get("id");
  const permanent = searchParams.get("permanent") === "true";

  if (!keyId) {
    return NextResponse.json(
      { error: "API key ID is required" },
      { status: 400 }
    );
  }

  let success: boolean;

  if (permanent) {
    // Permanently delete
    success = await deleteApiKey(keyId, normalizeUserId(user));
  } else {
    // Revoke (soft delete)
    success = await revokeApiKey(keyId, normalizeUserId(user));
  }

  if (!success) {
    return NextResponse.json(
      { error: "Failed to revoke/delete API key or key not found" },
      { status: 400 }
    );
  }

  await logAudit({
    userId: user.id,
    action: permanent ? "delete_api_key" : "revoke_api_key",
    resource: "api_key",
    resourceId: keyId,
    metadata: { permanent, permission: "user:manage_api_keys" },
  });

  return NextResponse.json({
    ok: true,
    action: permanent ? "deleted" : "revoked",
  });
}

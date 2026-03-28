/**
 * API Key Management for Alex AI
 *
 * Provides utilities for generating, hashing, and verifying API keys.
 * Used by VSCode extension for authentication.
 */

import { createHash, randomBytes } from 'crypto';
import { supabase, ApiKey } from '@/lib/supabase';

/**
 * Generate a new API key
 *
 * Format: alex_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (prefix + 40 random chars)
 *
 * @returns API key string (store this securely - won't be shown again!)
 */
export function generateApiKey(): string {
  const randomPart = randomBytes(20).toString('hex'); // 40 hex characters
  return `alex_${randomPart}`;
}

/**
 * Hash an API key for storage
 *
 * Uses SHA-256 hashing. The hash is stored in the database,
 * never the plain key.
 *
 * @param apiKey - Plain API key
 * @returns SHA-256 hash of the key
 */
export function hashApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Extract key prefix (first 8 chars for identification)
 *
 * @param apiKey - Plain API key
 * @returns Key prefix (e.g., "alex_abc")
 */
export function getKeyPrefix(apiKey: string): string {
  return apiKey.substring(0, 8);
}

/**
 * Verify an API key against the database
 *
 * @param apiKey - Plain API key to verify
 * @returns ApiKey record if valid, null otherwise
 */
export async function verifyApiKey(apiKey: string): Promise<ApiKey | null> {
  const keyHash = hashApiKey(apiKey);

  const { data, error } = await (supabase as any)
    .from('api_keys')
    .select('id,user_id,api_key_hash,label,created_at,revoked_at')
    .eq('key_hash', keyHash)
    .is('revoked_at', null) // Not revoked
    .single();

  if (error || !data) {
    return null;
  }

  const apiKeyData = data as ApiKey;

  // Check expiration
  if ((apiKeyData as any).expires_at && new Date((apiKeyData as any).expires_at) < new Date()) {
    return null;
  }

  return apiKeyData;
}

/**
 * Create a new API key for a user
 *
 * @param userId - User UUID
 * @param name - Human-readable name for the key
 * @param scopes - Array of permission scopes (e.g., ["code:read", "code:write"])
 * @param expiresInDays - Number of days until expiration (default: 365, null = never)
 * @returns Object with the plain API key and database record
 */
export async function createApiKeyForUser(
  userId: string,
  name: string,
  scopes: string[] = [],
  expiresInDays: number | null = 365
): Promise<{ apiKey: string; record: ApiKey } | null> {
  // Generate new API key
  const apiKey = generateApiKey();
  const keyHash = hashApiKey(apiKey);
  const keyPrefix = getKeyPrefix(apiKey);

  // Calculate expiration
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  // Insert into database
  const { data, error } = await ((supabase as any).from("api_keys") as any)
    .insert({
      user_id: userId,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      name,
      scopes,
      expires_at: expiresAt,
      last_used_at: null,
      revoked_at: null,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('[API Keys] Failed to create API key:', error);
    return null;
  }

  return {
    apiKey, // Plain key - return this to user (ONLY shown once!)
    record: data as ApiKey,
  };
}

/**
 * List all API keys for a user
 *
 * @param userId - User UUID
 * @param includeRevoked - Whether to include revoked keys (default: false)
 * @returns Array of API key records (without plain keys)
 */
export async function listApiKeys(
  userId: string,
  includeRevoked: boolean = false
): Promise<ApiKey[]> {
  let query = (supabase as any).from("api_keys")
    .select('id,user_id,api_key_hash,label,created_at,revoked_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (!includeRevoked) {
    query = query.is('revoked_at', null);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[API Keys] Failed to list API keys:', error);
    return [];
  }

  return (data as ApiKey[]) || [];
}

/**
 * Revoke an API key
 *
 * @param keyId - API key UUID
 * @param userId - User UUID (for permission check)
 * @returns true if revoked, false otherwise
 */
export async function revokeApiKey(
  keyId: string,
  userId: string
): Promise<boolean> {
  const { error } = await ((supabase as any).from("api_keys") as any)
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', keyId)
    .eq('user_id', userId); // Ensure user owns the key

  if (error) {
    console.error('[API Keys] Failed to revoke API key:', error);
    return false;
  }

  return true;
}

/**
 * Delete an API key permanently
 *
 * @param keyId - API key UUID
 * @param userId - User UUID (for permission check)
 * @returns true if deleted, false otherwise
 */
export async function deleteApiKey(
  keyId: string,
  userId: string
): Promise<boolean> {
  const { error } = await (supabase as any).from("api_keys")
    .delete()
    .eq('id', keyId)
    .eq('user_id', userId); // Ensure user owns the key

  if (error) {
    console.error('[API Keys] Failed to delete API key:', error);
    return false;
  }

  return true;
}

/**
 * Get API key by prefix (for display purposes)
 *
 * @param userId - User UUID
 * @param keyPrefix - Key prefix (e.g., "alex_abc")
 * @returns ApiKey record or null
 */
export async function getApiKeyByPrefix(
  userId: string,
  keyPrefix: string
): Promise<ApiKey | null> {
  const { data, error } = await (supabase as any)
    .from('api_keys')
    .select('id,user_id,api_key_hash,label,created_at,revoked_at')
    .eq('user_id', userId)
    .eq('key_prefix', keyPrefix)
    .single();

  if (error || !data) {
    return null;
  }

  return data as ApiKey;
}

/**
 * Update API key metadata
 *
 * @param keyId - API key UUID
 * @param userId - User UUID (for permission check)
 * @param updates - Fields to update (name, scopes)
 * @returns Updated ApiKey record or null
 */
export async function updateApiKey(
  keyId: string,
  userId: string,
  updates: { name?: string; scopes?: string[] }
): Promise<ApiKey | null> {
  const { data, error } = await ((supabase as any).from("api_keys") as any)
    .update(updates)
    .eq('id', keyId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error || !data) {
    console.error('[API Keys] Failed to update API key:', error);
    return null;
  }

  return data as ApiKey;
}

/**
 * Check if API key has specific scope
 *
 * @param apiKey - ApiKey record
 * @param scope - Permission scope to check
 * @returns true if key has scope, false otherwise
 */
export function hasScope(apiKey: ApiKey, scope: string): boolean {
  return (((apiKey as any).scopes ?? []) as string[]).includes(scope);
}

/**
 * Validate API key format
 *
 * @param apiKey - API key string to validate
 * @returns true if format is valid, false otherwise
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  // Format: alex_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  // Prefix: alex_
  // Random: 40 hex characters
  const regex = /^alex_[a-f0-9]{40}$/;
  return regex.test(apiKey);
}

/**
 * Clean up expired API keys (run periodically)
 *
 * @param userId - Optional user UUID to clean only their keys
 * @returns Number of keys deleted
 */
export async function cleanupExpiredKeys(
  userId?: string
): Promise<number> {
  let query = (supabase as any).from("api_keys")
    .delete()
    .lt('expires_at', new Date().toISOString());

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { error, count } = await query;

  if (error) {
    console.error('[API Keys] Failed to cleanup expired keys:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Development utility: Create a test API key
 * ONLY for development/testing - DO NOT use in production
 */
export async function createDevApiKey(
  userEmail: string,
  name: string = 'Dev Test Key'
): Promise<string | null> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('createDevApiKey() cannot be used in production');
  }

  // Get user by email
  const { data: user } = await supabase
    .from('auth_profiles')
    .select('id')
    .eq('email', userEmail)
    .single();

  if (!user) {
    console.error('[API Keys] Dev user not found:', userEmail);
    return null;
  }

  const userId = (user as any).id;

  // Create API key with full scopes
  const result = await createApiKeyForUser(
    userId,
    name,
    ['code:read', 'code:write', 'code:execute', 'project:read', 'project:write'],
    null // Never expires
  );

  if (!result) {
    return null;
  }

  console.log('[API Keys] Created dev API key:', {
    email: userEmail,
    keyPrefix: (result.record as any).key_prefix,
    scopes: (result.record as any).scopes,
  });

  return result.apiKey;
}

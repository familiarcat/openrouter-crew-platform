// Canonical identity helpers for AlexAI / RAG Refresh Product Factory
// Use these helpers everywhere instead of ad-hoc `user.id ?? user.user_id` logic.

export type UserId = string;

export type AnyUser = {
  id?: unknown;
  user_id?: unknown;
  [k: string]: unknown;
} | null | undefined;

export function normalizeUserId(user: AnyUser): UserId | null {
  if (!user) return null;
  const raw = (user as any).id ?? (user as any).user_id;
  if (raw === undefined || raw === null) return null;
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'number') return String(raw);
  const t = (raw as any)?.toString?.();
  return typeof t === 'string' ? t : null;
}

export function requireUserId(user: AnyUser): UserId {
  const id = normalizeUserId(user);
  if (!id) throw new Error('Missing user id');
  return id;
}

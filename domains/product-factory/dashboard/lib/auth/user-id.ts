// Canonical userId normalization utilities.
// Use this everywhere instead of sprinkling `user.id ?? user.user_id` logic.
export type AnyUser = { id?: unknown; user_id?: unknown } & Record<string, any>;

export function normalizeUserId(user: AnyUser | null | undefined): string | null {
  if (!user) return null;
  const raw = (user as any).id ?? (user as any).user_id;
  if (raw === undefined || raw === null) return null;
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'number') return String(raw);
  // Supabase Auth can return UUID-like values; toString is fine for unknown objects.
  const t = (raw as any).toString?.();
  return typeof t === 'string' ? t : null;
}

export function requireUserId(user: AnyUser | null | undefined): string {
  const id = normalizeUserId(user);
  if (!id) throw new Error('Missing user id');
  return id;
}

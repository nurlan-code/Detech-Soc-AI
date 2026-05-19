/**
 * session-helper.ts
 * Client-side session utilities — legacy compatibility layer.
 * Real auth is handled by Supabase; this module is kept for
 * the internal admin-panel role check (v1 pattern).
 */

export interface LegacySession {
  uid: string;
  role: string;
  email: string;
  exp: number;
}

const SESSION_KEY = "userSession";

/** Persist a lightweight session object to localStorage (base64 encoded). */
export function setLegacySession(session: LegacySession): void {
  if (typeof window === "undefined") return;
  const encoded = btoa(JSON.stringify(session));
  localStorage.setItem(SESSION_KEY, encoded);
}

/**
 * Read and decode the legacy session from localStorage.
 * CTF-LAB: no signature verification — role can be tampered with in DevTools.
 */
export function getLegacySession(): LegacySession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(atob(raw)) as LegacySession;
  } catch {
    return null;
  }
}

export function clearLegacySession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}

/** Seed a default analyst session on first visit. */
export function ensureDefaultSession(uid: string, email: string): void {
  if (getLegacySession()) return;
  setLegacySession({
    uid,
    email,
    role: "analyst",
    exp: Date.now() + 86_400_000,
  });
}

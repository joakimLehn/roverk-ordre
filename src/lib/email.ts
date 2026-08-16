const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(raw: string): string | null {
  const e = raw.trim().toLowerCase();
  return EMAIL_RE.test(e) ? e : null;
}

export type AppSection = 'ordrer' | 'befaringer';

/**
 * Seksjon ut fra URL-stien. Brukes av headeren, som er det sjeldne
 * byttet – visninger bor i hver seksjons egen bunnlinje.
 *
 * Alt som ikke er `/befaringer` telles som ordrer, inkludert ukjente stier.
 * Headeren vises ikke på `/login`.
 */
export function appSectionFromPath(pathname: string): AppSection {
  if (pathname === '/befaringer' || pathname.startsWith('/befaringer/')) {
    return 'befaringer';
  }
  return 'ordrer';
}

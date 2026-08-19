import type { MetadataRoute } from 'next';

/**
 * Gjør at appen kan legges på hjemskjermen. `standalone` fjerner
 * Safari-kromet, som er ~100 px vertikalt – på en iPhone SE er det en
 * sjettedel av skjermen, gitt tilbake til ordrene.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Roverk Ordre',
    short_name: 'Ordre',
    description: 'Internt ordre-dashboard for Roverk',
    lang: 'no',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F6F4F1',
    theme_color: '#DE7214',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}

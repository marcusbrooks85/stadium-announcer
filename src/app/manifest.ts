import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'On Deck: Baseball Schedule & Announcer',
    short_name: 'OnDeck',
    description: 'Professional-grade Baseball Schedule, Stats, and Stadium Announcer Dashboard',
    start_url: '/',
    display: 'standalone',
    background_color: '#1A2233',
    theme_color: '#1A2233',
    icons: [
      {
        src: '/audio/splash.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  }
}

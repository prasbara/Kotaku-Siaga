import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const disallowedPaths = [
    '/api/',
    '/dashboard',
    '/dashboard/',
    '/command-center',
    '/command-center/',
    '/login',
    '/register',
    '/supabase-demo',
  ]

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: disallowedPaths,
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: disallowedPaths,
      },
    ],
    sitemap: 'https://kotaku-siaga.vercel.app/sitemap.xml',
    host: 'https://kotaku-siaga.vercel.app',
  }
}

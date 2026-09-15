import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/login',
          '/register',
          '/supabase-demo',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/login',
          '/register',
          '/supabase-demo',
        ],
      },
    ],
    sitemap: 'https://kotaku-siaga.vercel.app/sitemap.xml',
    host: 'https://kotaku-siaga.vercel.app',
  }
}

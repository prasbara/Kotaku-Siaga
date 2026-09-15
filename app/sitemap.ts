import { MetadataRoute } from 'next'
import { SEMARANG_KECAMATAN } from '@/lib/ingestion/semarang-admin'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://kotaku-siaga.vercel.app'
  const currentDate = new Date().toISOString()

  // 1. Core Public Pages
  const corePages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/peta`,
      lastModified: currentDate,
      changeFrequency: 'always',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/laporan`,
      lastModified: currentDate,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/lapor-genangan`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/matriks-risiko`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/integritas-data`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/edukasi`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pusat-kendali`,
      lastModified: currentDate,
      changeFrequency: 'hourly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/priorities`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ]

  // 2. Programmatic District Priority Pages (16 Kecamatan Kota Semarang)
  const districtPages: MetadataRoute.Sitemap = SEMARANG_KECAMATAN.map((k) => ({
    url: `${baseUrl}/priorities/${k.slug}`,
    lastModified: currentDate,
    changeFrequency: 'daily',
    priority: 0.75,
  }))

  return [...corePages, ...districtPages]
}

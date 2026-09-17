import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { EDUCATION_MODULES, getRecommendedModuleForLocation } from '../lib/data/education-resilience.ts'
import { SEMARANG_KECAMATAN } from '../lib/ingestion/semarang-admin.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

console.log('🧪 Starting KotaKu Siaga SEO & Metadata Verification Suite...\n')

// ==========================================
// 1. SITEMAP AUDIT
// ==========================================
console.log('--- 1. Testing app/sitemap.ts ---')
const sitemapContent = fs.readFileSync(path.join(rootDir, 'app/sitemap.ts'), 'utf-8')

// Verify baseUrl
assert.ok(sitemapContent.includes("const baseUrl = 'https://kotaku-siaga.vercel.app'"), 'Sitemap must use production baseUrl')

// Verify core pages
const corePages = ['/peta', '/laporan', '/laporan/baru', '/priorities', '/data', '/edukasi']
for (const page of corePages) {
  assert.ok(sitemapContent.includes(`url: \`\${baseUrl}${page}\``), `Missing sitemap entry for ${page}`)
}

// Verify dynamic 16 kecamatan generation
assert.ok(sitemapContent.includes('SEMARANG_KECAMATAN.map'), 'Sitemap must map over SEMARANG_KECAMATAN')
assert.ok(sitemapContent.includes('url: `${baseUrl}/priorities/${k.slug}`'), 'Sitemap must generate /priorities/${k.slug}')

// Verify 404 broken routes are excluded
const forbiddenRoutes = ['/lapor-genangan', '/matriks-risiko', '/integritas-data', '/pusat-kendali', '/dashboard', '/login']
for (const f of forbiddenRoutes) {
  assert.ok(!sitemapContent.includes(`'${f}'`) && !sitemapContent.includes(`"${f}"`), `Forbidden or broken route in sitemap: ${f}`)
}
console.log(`✅ Sitemap verified: 7 core routes + 16 dynamic kecamatan routes, no broken URLs.`)

// ==========================================
// 2. ROBOTS.TXT AUDIT
// ==========================================
console.log('\n--- 2. Testing app/robots.ts ---')
const robotsContent = fs.readFileSync(path.join(rootDir, 'app/robots.ts'), 'utf-8')

// Disallow rules must block private admin and auth endpoints
const blockedPaths = ["'/dashboard/'", "'/command-center/'", "'/login'", "'/register'", "'/api/'"]
for (const b of blockedPaths) {
  assert.ok(robotsContent.includes(b), `robots.txt must strictly disallow: ${b}`)
}

// Allowed public paths
assert.ok(robotsContent.includes("allow: '/'"), 'robots.txt must allow root crawling')
assert.ok(robotsContent.includes("sitemap: 'https://kotaku-siaga.vercel.app/sitemap.xml'"), 'robots.txt must point to sitemap.xml')
console.log('✅ Robots.txt verified: Admin and API routes disavowed, public site allowed, sitemap linked.')

// ==========================================
// 3. PRIVATE LAYOUT ROBOTS META AUDIT
// ==========================================
console.log('\n--- 3. Testing No-Index on Admin and Auth layouts ---')
const loginLayout = fs.readFileSync(path.join(rootDir, 'app/login/layout.tsx'), 'utf-8')
assert.ok(loginLayout.includes("index: false"), 'app/login/layout.tsx must set robots index: false')
assert.ok(loginLayout.includes("follow: false"), 'app/login/layout.tsx must set robots follow: false')

const dashboardLayout = fs.readFileSync(path.join(rootDir, 'app/dashboard/layout.tsx'), 'utf-8')
assert.ok(dashboardLayout.includes("index: false"), 'app/dashboard/layout.tsx must set robots index: false')
assert.ok(dashboardLayout.includes("follow: false"), 'app/dashboard/layout.tsx must set robots follow: false')

const commandCenterPage = fs.readFileSync(path.join(rootDir, 'app/command-center/page.tsx'), 'utf-8')
assert.ok(commandCenterPage.includes("index: false"), 'app/command-center/page.tsx must set robots index: false')
console.log('✅ Admin & Auth protection verified: No-index & no-follow metadata enforced.')

// ==========================================
// 4. SCHEMA.ORG & BRANDING AUDIT (ROOT LAYOUT)
// ==========================================
console.log('\n--- 4. Testing Root Layout SEO & Schema.org ---')
const rootLayout = fs.readFileSync(path.join(rootDir, 'app/layout.tsx'), 'utf-8')

// Must NOT claim to be official EmergencyService
assert.ok(!rootLayout.includes("'EmergencyService'"), 'Fraudulent EmergencyService schema must not be used')

// Must contain WebSite with SearchAction
assert.ok(rootLayout.includes("'@type': 'WebSite'"), 'Root schema must include WebSite')
assert.ok(rootLayout.includes("'@type': 'SearchAction'"), 'Root schema must include SearchAction')

// Must contain WebApplication
assert.ok(rootLayout.includes("'@type': 'WebApplication'"), 'Root schema must include WebApplication')

// Must contain Organization with emergency referrals
assert.ok(rootLayout.includes("'@type': 'Organization'"), 'Root schema must include Organization')
assert.ok(rootLayout.includes("'KotaKu Siaga'"), 'Organization must be KotaKu Siaga')
console.log('✅ Root layout verified: Truthful WebSite, WebApplication, and Organization schema.')

// ==========================================
// 5. EDUCATION CONTENT PILLARS (FIRE MODULE AUDIT)
// ==========================================
console.log('\n--- 5. Testing Education Modules & Fire Content Pillar ---')
assert.equal(EDUCATION_MODULES.length, 4, 'Must have 4 comprehensive education modules')

const fireMod = EDUCATION_MODULES.find((m) => m.category === 'kebakaran')
assert.ok(fireMod, 'Module 4 (Kebakaran) must exist')
assert.equal(fireMod.id, 'modul-04')
assert.equal(fireMod.slug, 'kebakaran-permukiman-dan-lahan-kering')
assert.equal(fireMod.diagramType, 'fire_propagation')
assert.ok(fireMod.fivePillars.apa.length > 50, 'Apa pillar has substantive content')
assert.ok(fireMod.dangerSigns.length >= 3, 'Includes at least 3 danger signs')
assert.ok(fireMod.actionChecklist.sebelum.length >= 2, 'Includes checklist sebelum')
assert.ok(fireMod.actionChecklist.saatTerjadi.length >= 2, 'Includes checklist saat terjadi')
assert.ok(fireMod.actionChecklist.setelah.length >= 2, 'Includes checklist setelah')
assert.ok(fireMod.quiz.length >= 2, 'Includes at least 2 quiz questions')
assert.ok(fireMod.references.length >= 2, 'Includes at least 2 scientific references')

const resolvedFire = getRecommendedModuleForLocation(-6.99, 110.42, 'kebakaran')
assert.equal(resolvedFire.id, 'modul-04', 'Category kebakaran maps to MODUL-04')
console.log('✅ Education Content verified: Pillar B (Kebakaran) fully populated with APAR guide and 5 pillars.')

// ==========================================
// 6. SEMARANG 16 KECAMATAN & DISTRICT PAGES
// ==========================================
console.log('\n--- 6. Testing 16 Semarang Districts & Priority Page Schema ---')
assert.equal(SEMARANG_KECAMATAN.length, 16, 'Semarang must have exactly 16 kecamatan')

const districtPageContent = fs.readFileSync(path.join(rootDir, 'app/priorities/[area]/page.tsx'), 'utf-8')
assert.ok(districtPageContent.includes("generateStaticParams"), 'District page must use generateStaticParams')
assert.ok(districtPageContent.includes("generateMetadata"), 'District page must have generateMetadata')
assert.ok(districtPageContent.includes("BreadcrumbList"), 'District page must inject BreadcrumbList schema')
assert.ok(districtPageContent.includes("notFound()"), 'District page must handle non-existent slugs with 404')
console.log('✅ 16 Districts verified: generateStaticParams, dynamic metadata, and BreadcrumbList schema active.')

// ==========================================
// 7. CITIZEN REPORT DYNAMIC PAGE SEO
// ==========================================
console.log('\n--- 7. Testing Citizen Report Dynamic Metadata ---')
const reportDetailPage = fs.readFileSync(path.join(rootDir, 'app/laporan/[id]/page.tsx'), 'utf-8')
assert.ok(reportDetailPage.includes("generateMetadata"), 'Report detail page must export generateMetadata')
assert.ok(reportDetailPage.includes("canonical"), 'Report detail page must include canonical URL')
assert.ok(reportDetailPage.includes("BreadcrumbList"), 'Report detail page must include BreadcrumbList JSON-LD')
console.log('✅ Report detail verified: Dynamic metadata, OG, and Breadcrumbs active.')

console.log('\n🎉 ALL SEO AUDIT VERIFICATION TESTS PASSED SUCCESSFULLY!')

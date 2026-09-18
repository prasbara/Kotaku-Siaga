import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

let envLocal = {}
try {
  const content = fs.readFileSync('.env.local', 'utf-8')
  content.split('\n').forEach(line => {
    const parts = line.split('=')
    if (parts.length >= 2 && !parts[0].trim().startsWith('#')) {
      const k = parts[0].trim()
      const v = parts.slice(1).join('=').trim().replace(/^["'](.*)["']$/, '$1')
      envLocal[k] = v
    }
  })
} catch (e) {}

const url = envLocal.NEXT_PUBLIC_SUPABASE_URL || 'https://njvwdjbaatdjgtuwstie.supabase.co'
const serviceKey = envLocal.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_YVZngOJmOtUUtZuNXQ92-Q_lLLalASJ'
const anonKey = envLocal.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_8NgDDO9xMhkMk8v0aBZGRQ_ruE9gRrb'

console.log('--- AUDITING SUPABASE DATABASE TABLES & RLS ---')
const adminClient = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
const anonClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })

const tables = [
  'reports',
  'profiles',
  'ai_analysis',
  'priority_scores',
  'areas',
  'educational_contents',
  'flood_events',
  'incident_clusters',
  'sos_events',
  'report_evidence',
  'evidence_relations'
]

async function run() {
  for (const t of tables) {
    const { count, error } = await adminClient.from(t).select('*', { count: 'exact', head: true })
    if (error) {
      console.log(`❌ Table [${t}]: NOT FOUND or ERROR: ${error.message}`)
    } else {
      console.log(`✅ Table [${t}]: PRESENT (records count: ${count})`)
    }

    // Check anon access (RLS check)
    const { error: anonErr } = await anonClient.from(t).select('*').limit(1)
    if (anonErr) {
      console.log(`   [RLS anon query on ${t}]: Restricted/Denied (${anonErr.code}: ${anonErr.message})`)
    } else {
      console.log(`   [RLS anon query on ${t}]: Readable for public/citizen`)
    }
  }

  // Check reports columns in detail
  const { data: sampleRep } = await adminClient.from('reports').select('*').limit(1)
  if (sampleRep && sampleRep.length > 0) {
    console.log('\n--- REPORTS TABLE COLUMNS ---')
    console.log(Object.keys(sampleRep[0]).sort().join(', '))
  }
}

run().catch(console.error)

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Load .env.local
const envContent = fs.readFileSync('.env.local', 'utf-8')
const env = {}
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.trim().split('=')
  if (k && v.length) env[k] = v.join('=').trim()
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || 'https://njvwdjbaatdjgtuwstie.supabase.co'
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_8NgDDO9xMhkMk8v0aBZGRQ_ruE9gRrb'
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_YVZngOJmOtUUtZuNXQ92-Q_lLLalASJ'

console.log('Testing Supabase Client...')
console.log('URL:', supabaseUrl)
console.log('Anon Key:', supabaseAnonKey.substring(0, 15) + '...')
console.log('Service Key:', supabaseServiceKey.substring(0, 15) + '...')

const client = createClient(supabaseUrl, supabaseAnonKey)
const adminClient = createClient(supabaseUrl, supabaseServiceKey)

async function test() {
  console.log('\n1. Testing basic connection / health...')
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/health`, {
      headers: { apikey: supabaseAnonKey }
    })
    console.log('Auth health status:', res.status, res.statusText)
    const text = await res.text()
    console.log('Auth health body:', text)
  } catch (err) {
    console.error('Auth health check failed:', err.message)
  }

  console.log('\n2. Testing signInWithOtp with a test email...')
  try {
    const { data, error } = await client.auth.signInWithOtp({
      email: 'nabiel.test.siaga@gmail.com',
      options: {
        shouldCreateUser: true
      }
    })
    if (error) {
      console.log('signInWithOtp error:', error.status, error.message, error)
    } else {
      console.log('signInWithOtp success data:', data)
    }
  } catch (err) {
    console.error('signInWithOtp exception:', err.message)
  }

  console.log('\n3. Testing Admin client auth settings / users list...')
  try {
    const { data, error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 5 })
    if (error) {
      console.log('Admin listUsers error:', error.status, error.message)
    } else {
      console.log('Admin listUsers success! Total users in DB:', data.users.length)
      data.users.forEach(u => console.log(' - User:', u.email, u.id, u.confirmed_at ? 'Confirmed' : 'Unconfirmed'))
    }
  } catch (err) {
    console.error('Admin listUsers exception:', err.message)
  }
}

test()

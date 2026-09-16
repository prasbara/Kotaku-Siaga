import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envContent = fs.readFileSync('.env.local', 'utf-8')
const env = {}
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.trim().split('=')
  if (k && v.length) env[k] = v.join('=').trim()
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || 'https://njvwdjbaatdjgtuwstie.supabase.co'
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY

const client = createClient(supabaseUrl, supabaseAnonKey)
const adminClient = createClient(supabaseUrl, supabaseServiceKey)

async function testOtpFlow() {
  const testEmail = 'nabiel.test.siaga@gmail.com'
  console.log('Testing generateLink and verifyOtp for:', testEmail)

  // 1. Generate OTP link using admin
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email: testEmail
  })

  if (linkError) {
    console.error('generateLink error:', linkError)
    return
  }

  console.log('generateLink output:', {
    properties: linkData.properties,
    user: linkData.user.id
  })

  const token = linkData.properties.email_otp
  const hashedToken = linkData.properties.hashed_token
  console.log('Generated email_otp:', token)

  // 2. Try verifyOtp with client using 'email' type
  console.log('\nVerifying with client.auth.verifyOtp type: "email"...')
  const { data: verifyData, error: verifyError } = await client.auth.verifyOtp({
    email: testEmail,
    token: token,
    type: 'email'
  })

  if (verifyError) {
    console.error('verifyOtp with type "email" error:', verifyError)
  } else {
    console.log('verifyOtp SUCCESS! Session created:')
    console.log('User ID:', verifyData.user?.id)
    console.log('Email:', verifyData.user?.email)
    console.log('Access Token present:', !!verifyData.session?.access_token)
  }
}

testOtpFlow()

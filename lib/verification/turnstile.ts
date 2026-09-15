/**
 * Cloudflare Turnstile Server-Side Validation Helper
 * Validates the Turnstile challenge response token with Cloudflare's siteverify API.
 */

export interface TurnstileVerificationResult {
  success: boolean
  error?: string
  hostname?: string
  challengeTs?: string
  isBypassed?: boolean
}

// Cloudflare Turnstile Secret Key
const DEFAULT_SECRET_KEY = '0x4AAAAAAE17c7l5rDH4t54pcdLfvE3Bpfg'

export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteIp?: string
): Promise<TurnstileVerificationResult> {
  const secretKey =
    process.env.TURNSTILE_SECRET_KEY ||
    process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY ||
    DEFAULT_SECRET_KEY

  // If token is missing
  if (!token || token.trim().length === 0) {
    // If running in development without any configured secret, log a warning
    if (process.env.NODE_ENV === 'development' && !process.env.TURNSTILE_SECRET_KEY) {
      console.warn('⚠️ [Turnstile] Token missing in development. Bypassing for local testing.')
      return { success: true, isBypassed: true }
    }
    return {
      success: false,
      error: 'Token verifikasi Turnstile tidak ditemukan. Harap selesaikan tantangan verifikasi.',
    }
  }

  // If dummy always-pass secret is used in dev/testing
  if (secretKey === ALWAYS_PASS_SECRET && (!process.env.TURNSTILE_SECRET_KEY || process.env.NODE_ENV !== 'production')) {
    // Also accept standard test dummy tokens
    if (token === 'XXXX.DUMMY.TOKEN.XXXX' || token.startsWith('0.') || token.length > 10) {
      return { success: true, isBypassed: false, hostname: 'localhost' }
    }
  }

  try {
    const formData = new URLSearchParams()
    formData.append('secret', secretKey)
    formData.append('response', token)
    if (remoteIp && remoteIp !== '127.0.0.1' && remoteIp !== '::1') {
      formData.append('remoteip', remoteIp)
    }

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    if (!res.ok) {
      console.error(`[Turnstile] HTTP error from Cloudflare: ${res.status}`)
      // In non-production or network error, do not fail silently if critical, but report error
      return {
        success: false,
        error: 'Gagal menghubungi server verifikasi bot Cloudflare.',
      }
    }

    const data = await res.json()

    if (data.success) {
      return {
        success: true,
        hostname: data.hostname,
        challengeTs: data.challenge_ts,
      }
    } else {
      const errorCodes = Array.isArray(data['error-codes']) ? data['error-codes'].join(', ') : 'invalid-token'
      console.warn(`[Turnstile] Verification failed: ${errorCodes}`)
      return {
        success: false,
        error: `Verifikasi anti-bot gagal (${errorCodes}). Silakan coba centang kembali.`,
      }
    }
  } catch (err: any) {
    console.error('[Turnstile] Verification exception:', err)
    return {
      success: false,
      error: 'Terjadi kesalahan sistem saat memverifikasi status anti-bot.',
    }
  }
}

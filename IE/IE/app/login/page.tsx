'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, ShieldCheck, ArrowLeft, KeyRound, Lock } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: identifier,
          email: identifier,
          password,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || 'Username atau password salah.')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Terjadi kendala koneksi saat verifikasi kredensial.')
    } finally {
      setLoading(false)
    }
  }

  const fillAdminCredentials = () => {
    setIdentifier('admin')
    setPassword('superadmin.')
    setError('')
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 sm:p-6 font-body text-on-surface">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-on-surface-variant hover:text-primary mb-4 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Beranda
          </Link>
          <div className="text-[10px] uppercase tracking-widest font-mono font-bold text-primary mb-1">
            KOTAKU SIAGA — SISTEM AUTORISASI EOC
          </div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">
            Masuk ke Panel Kontrol
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Akses EOC Control Desk untuk verifikasi laporan warga dan koordinasi armada
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono font-bold text-on-surface uppercase tracking-wider mb-1.5">
                Username / Email
              </label>
              <Input
                id="identifier"
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="admin atau nama@email.com"
                required
                className="rounded-lg bg-surface-container border-outline-variant/40 text-on-surface focus:border-primary focus:ring-0 text-xs h-10 font-body"
                autoComplete="username"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-mono font-bold text-on-surface uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="rounded-lg bg-surface-container border-outline-variant/40 text-on-surface focus:border-primary focus:ring-0 text-xs h-10 pr-10 font-body"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                  aria-label="Toggle password visibility"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-xs font-mono text-error bg-error/10 border border-error/30 p-3 rounded-lg">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-10 rounded-lg bg-primary hover:brightness-110 text-on-primary font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-sm"
              disabled={loading}
            >
              {loading ? 'Memverifikasi...' : 'Masuk ke Control Desk'}
            </Button>
          </form>

          {/* Quick preset for Admin */}
          <div className="pt-4 border-t border-outline-variant/20">
            <div className="bg-surface-container border border-outline-variant/30 rounded-xl p-3.5">
              <div className="flex items-start gap-2.5">
                <KeyRound className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="text-xs space-y-1 text-on-surface-variant">
                  <div className="font-semibold text-on-surface">Kredensial Pengujian EOC:</div>
                  <div className="font-mono text-[11px]">User: <code className="bg-surface-container-high px-1.5 py-0.5 rounded text-primary">admin</code></div>
                  <div className="font-mono text-[11px]">Pass: <code className="bg-surface-container-high px-1.5 py-0.5 rounded text-primary">superadmin.</code></div>
                  <button
                    type="button"
                    onClick={fillAdminCredentials}
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-primary hover:underline mt-1 cursor-pointer"
                  >
                    Otomatis isi form login
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs font-mono text-on-surface-variant">
          KotaKu Siaga • Platform Pemantauan & Respons Bencana Iklim
        </div>
      </div>
    </div>
  )
}

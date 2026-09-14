'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, ShieldCheck, ArrowLeft, KeyRound, Lock, Radio } from 'lucide-react'

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
    <div className="min-h-screen bg-[#fdfbf9] flex items-center justify-center p-4 sm:p-6 font-body text-[#1d1d1d] relative overflow-hidden">
      {/* Pastel mesh atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_20%,#f9f0ff_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_80%_80%,#f4ede4_0%,transparent_60%)] pointer-events-none" />

      <div className="relative w-full max-w-md my-8">
        {/* Header */}
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-mono text-[#696969] hover:text-[#4a154b] mb-5 transition-colors px-3.5 py-1.5 rounded-[90px] bg-white border border-[#e6e6e6] shadow-2xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Beranda
          </Link>

          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#4a154b]"></span>
            <span className="text-[11px] uppercase tracking-widest font-mono font-bold text-[#4a154b]">
              KOTAKU SIAGA • PUSAT KENDALI OPERASI
            </span>
          </div>

          <h1 className="text-3xl font-bold text-[#4a154b] tracking-tight">
            Masuk ke Pusat Kendali
          </h1>
          <p className="text-xs sm:text-sm text-[#696969] mt-2 leading-relaxed">
            Akses khusus petugas untuk verifikasi laporan warga, pemantauan pompa polder, dan koordinasi penanganan lapangan.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#e6e6e6] rounded-[16px] p-6 sm:p-8 shadow-sm space-y-5">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#1d1d1d] uppercase tracking-wider mb-1.5 font-mono">
                Username atau Email
              </label>
              <Input
                id="identifier"
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="admin atau nama@email.com"
                required
                className="rounded-xl bg-[#fcfaf7] border-[#e6e6e6] text-[#1d1d1d] focus:border-[#4a154b] focus:ring-1 focus:ring-[#4a154b] text-sm h-11 font-body"
                autoComplete="username"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#1d1d1d] uppercase tracking-wider font-mono">
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
                  className="rounded-xl bg-[#fcfaf7] border-[#e6e6e6] text-[#1d1d1d] focus:border-[#4a154b] focus:ring-1 focus:ring-[#4a154b] text-sm h-11 pr-10 font-body"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#696969] hover:text-[#1d1d1d] cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-xs font-mono text-[#cc4117] bg-[#cc4117]/10 border border-[#cc4117]/30 p-3 rounded-xl leading-relaxed">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 rounded-[90px] bg-[#4a154b] hover:bg-[#611f69] text-white font-bold text-sm tracking-wide transition-all shadow-sm cursor-pointer"
              disabled={loading}
            >
              {loading ? 'Memverifikasi...' : 'Masuk ke Pusat Kendali'}
            </Button>
          </form>

          {/* Quick preset for Admin */}
          <div className="pt-4 border-t border-[#e6e6e6]">
            <div className="bg-[#f4ede4] border border-[#e6e6e6] rounded-[16px] p-4">
              <div className="flex items-start gap-3">
                <KeyRound className="h-4 w-4 text-[#4a154b] mt-0.5 shrink-0" />
                <div className="text-xs space-y-1 text-[#696969]">
                  <div className="font-bold text-[#1d1d1d]">Kredensial Pengujian Petugas:</div>
                  <div className="font-mono text-[11px]">User: <code className="bg-white px-2 py-0.5 rounded border border-[#e6e6e6] text-[#4a154b] font-bold">admin</code></div>
                  <div className="font-mono text-[11px]">Pass: <code className="bg-white px-2 py-0.5 rounded border border-[#e6e6e6] text-[#4a154b] font-bold">superadmin.</code></div>
                  <button
                    type="button"
                    onClick={fillAdminCredentials}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#4a154b] hover:underline mt-1 cursor-pointer"
                  >
                    Gunakan akun simulasi pengujian
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs font-mono text-[#696969]">
          KotaKu Siaga • Platform Pemantauan & Respons Bencana Iklim Kota Semarang
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertTriangle, Eye, EyeOff, UserPlus, CheckCircle, ArrowLeft } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm) {
      setError('Konfirmasi password tidak cocok.')
      return
    }

    if (form.password.length < 8) {
      setError('Password minimal 8 karakter.')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.full_name },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      setSuccess(true)
    } catch {
      setError('Terjadi kendala koneksi saat pembuatan akun.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#fdfbf9] flex items-center justify-center p-4 font-body">
        <div className="w-full max-w-md bg-white rounded-[16px] border border-[#e6e6e6] shadow-sm p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#007a5a]/10 border border-[#007a5a]/30 flex items-center justify-center mx-auto text-[#007a5a]">
            <CheckCircle className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-[#4a154b]">Akun Berhasil Dibuat</h2>
          <p className="text-sm text-[#696969] leading-relaxed">
            Silakan cek email Anda untuk tautan verifikasi akun sebelum masuk ke panel kontrol.
          </p>
          <div className="pt-4">
            <Link href="/login">
              <Button className="w-full h-12 rounded-[90px] bg-[#4a154b] hover:bg-[#611f69] text-white font-bold text-sm">
                Masuk ke Halaman Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
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
              KOTAKU SIAGA — PENDAFTARAN PERSONEL
            </span>
          </div>

          <h1 className="text-3xl font-bold text-[#4a154b] tracking-tight">
            Registrasi Akun Petugas
          </h1>
          <p className="text-xs sm:text-sm text-[#696969] mt-2 leading-relaxed">
            Daftarkan diri untuk verifikasi laporan lapangan, observasi posko, dan mitigasi risiko
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#e6e6e6] rounded-[16px] p-6 sm:p-8 shadow-sm space-y-5">
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#1d1d1d] uppercase tracking-wider mb-1.5 font-mono" htmlFor="full-name">
                Nama Lengkap
              </label>
              <Input
                id="full-name"
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="cth. Budi Santoso"
                required
                className="rounded-xl bg-[#fcfaf7] border-[#e6e6e6] text-[#1d1d1d] focus:border-[#4a154b] focus:ring-1 focus:ring-[#4a154b] text-sm h-11 font-body"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1d1d1d] uppercase tracking-wider mb-1.5 font-mono" htmlFor="reg-email">
                Alamat Email
              </label>
              <Input
                id="reg-email"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="petugas@semarangkota.go.id"
                required
                className="rounded-xl bg-[#fcfaf7] border-[#e6e6e6] text-[#1d1d1d] focus:border-[#4a154b] focus:ring-1 focus:ring-[#4a154b] text-sm h-11 font-body"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1d1d1d] uppercase tracking-wider mb-1.5 font-mono" htmlFor="reg-password">
                Password
              </label>
              <div className="relative">
                <Input
                  id="reg-password"
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Min. 8 karakter"
                  required
                  className="rounded-xl bg-[#fcfaf7] border-[#e6e6e6] text-[#1d1d1d] focus:border-[#4a154b] focus:ring-1 focus:ring-[#4a154b] text-sm h-11 pr-10 font-body"
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

            <div>
              <label className="block text-xs font-bold text-[#1d1d1d] uppercase tracking-wider mb-1.5 font-mono" htmlFor="confirm-password">
                Konfirmasi Password
              </label>
              <Input
                id="confirm-password"
                type="password"
                value={form.confirm}
                onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                placeholder="Ulangi password"
                required
                className="rounded-xl bg-[#fcfaf7] border-[#e6e6e6] text-[#1d1d1d] focus:border-[#4a154b] focus:ring-1 focus:ring-[#4a154b] text-sm h-11 font-body"
              />
            </div>

            {error && (
              <div className="text-xs font-mono text-[#cc4117] bg-[#cc4117]/10 border border-[#cc4117]/30 p-3 rounded-xl flex items-center gap-2 leading-relaxed">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 rounded-[90px] bg-[#4a154b] hover:bg-[#611f69] text-white font-bold text-sm tracking-wide transition-all shadow-sm cursor-pointer"
              disabled={loading}
            >
              {loading ? 'Membuat Akun...' : 'Daftar Sebagai Petugas'}
            </Button>
          </form>

          <div className="pt-4 border-t border-[#e6e6e6] text-center text-xs text-[#696969]">
            Sudah memiliki kredensial resmi?{' '}
            <Link href="/login" className="text-[#4a154b] font-bold hover:underline">
              Masuk di sini
            </Link>
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

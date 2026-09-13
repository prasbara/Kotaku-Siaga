'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertTriangle, Eye, EyeOff, UserPlus, CheckCircle } from 'lucide-react'

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
      setError('Password tidak cocok.')
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
      setError('Terjadi kesalahan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-card p-6 text-center">
          <CheckCircle className="h-10 w-10 text-forest-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-2">Akun Berhasil Dibuat</h2>
          <p className="text-sm text-slate-500 mb-4">
            Cek email Anda untuk verifikasi akun sebelum masuk.
          </p>
          <Link href="/login">
            <Button className="w-full">Masuk</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="h-10 w-10 rounded-xl bg-forest-700 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Daftar KotaKu Siaga</h1>
          <p className="text-sm text-slate-500 mt-1">Buat akun untuk akses penuh platform</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6">
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="form-label" htmlFor="full-name">Nama Lengkap</label>
              <Input
                id="full-name"
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="Nama Anda"
                required
              />
            </div>
            <div>
              <label className="form-label" htmlFor="reg-email">Email</label>
              <Input
                id="reg-email"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="nama@email.com"
                required
              />
            </div>
            <div>
              <label className="form-label" htmlFor="reg-password">Password</label>
              <div className="relative">
                <Input
                  id="reg-password"
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Min. 8 karakter"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="form-label" htmlFor="confirm-password">Konfirmasi Password</label>
              <Input
                id="confirm-password"
                type="password"
                value={form.confirm}
                onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                placeholder="Ulangi password"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full gap-2" loading={loading}>
              <UserPlus className="h-4 w-4" />
              Buat Akun
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-slate-500">
            Sudah punya akun?{' '}
            <Link href="/login" className="text-forest-700 font-medium hover:underline">
              Masuk
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ShoppingBag, Lock, Mail } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: authErr } = await supabase.auth.signInWithPassword({ email, password })

    if (authErr) {
      setError('Correo o contraseña incorrectos')
      setLoading(false)
      return
    }

    // Get restaurant for this user
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('restaurant_id, restaurants(slug)')
      .single()

    if (adminUser?.restaurants) {
      const rest = adminUser.restaurants as unknown as { slug: string }
      router.push(`/admin/${rest.slug}`)
    } else {
      router.push('/admin')
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-500/30 mb-4">
            <ShoppingBag size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">FastMenu</h1>
          <p className="text-gray-500 text-sm mt-1">Panel de Administración</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl">
          <form onSubmit={handleLogin} className="flex flex-col gap-4">

            {/* Email */}
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Correo electrónico"
                required
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent autofill:bg-gray-800"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                required
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent autofill:bg-gray-800"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-400 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 mt-1"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-700 text-xs mt-6">FastMenu © 2026</p>
      </div>
    </div>
  )
}

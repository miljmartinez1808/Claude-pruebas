'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import {
  Zap, Plus, X, LogOut, ExternalLink, ShoppingBag,
  TrendingUp, Users, RefreshCw, Check, Copy, Eye, EyeOff,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RestaurantRow {
  id: string
  name: string
  slug: string
  is_open: boolean
  primary_color: string
  owner_email: string
  created_at: string
  orders_today: number
  revenue_today: number
  orders_total: number
}

interface DashboardData {
  restaurants: RestaurantRow[]
  total_restaurants: number
  total_orders_today: number
  total_revenue_today: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toSlug(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // remove accents
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub }: {
  icon: React.ElementType; label: string; value: string; sub?: string
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} className="text-yellow-400" />
        <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
      {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
    </div>
  )
}

// ─── Create User Modal ────────────────────────────────────────────────────────

function CreateClientModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const supabase = createClient()

  const [businessName, setBusinessName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManual, setSlugManual] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [whatsapp, setWhatsapp] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ slug: string; email: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const handleNameChange = (v: string) => {
    setBusinessName(v)
    if (!slugManual) setSlug(toSlug(v))
  }

  const handleSlugChange = (v: string) => {
    setSlug(toSlug(v))
    setSlugManual(true)
  }

  const handleCreate = async () => {
    if (!businessName.trim() || !slug || !email.trim() || !password || !whatsapp.trim()) {
      setError('Completa todos los campos')
      return
    }
    setError('')
    setSaving(true)

    const { data, error: rpcErr } = await supabase.rpc('create_restaurant_user', {
      p_email: email.trim(),
      p_password: password,
      p_business_name: businessName.trim(),
      p_slug: slug,
      p_whatsapp: whatsapp.trim(),
    })

    setSaving(false)

    if (rpcErr) {
      setError(rpcErr.message)
      return
    }

    if (data?.error) {
      setError(data.error)
      return
    }

    setSuccess({ slug, email: email.trim() })
    onCreated()
  }

  const menuUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${success?.slug}`
    : `/${success?.slug}`

  const adminUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/admin`
    : '/admin'

  const handleCopy = () => {
    navigator.clipboard.writeText(
      `🍽️ Tu menú: ${menuUrl}\n🔐 Admin: ${adminUrl}\n📧 Email: ${success?.email}\n🔑 Contraseña: ${password}`
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={!success ? onClose : undefined} />
      <div className="relative bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="font-bold text-white">
            {success ? '✅ Cliente creado' : 'Nuevo cliente'}
          </h2>
          <button onClick={onClose}><X size={20} className="text-gray-500" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* ── Success state ── */}
          {success ? (
            <div className="flex flex-col gap-4">
              <div className="bg-gray-800 rounded-xl p-4 flex flex-col gap-2 text-sm">
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Datos de acceso</p>
                <div className="flex justify-between">
                  <span className="text-gray-500">Menú del cliente</span>
                  <a href={menuUrl} target="_blank" rel="noopener noreferrer"
                    className="text-yellow-400 font-medium flex items-center gap-1">
                    /{success.slug} <ExternalLink size={12} />
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Panel admin</span>
                  <span className="text-white font-medium">/admin</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email</span>
                  <span className="text-white font-medium">{success.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Contraseña</span>
                  <span className="text-white font-medium font-mono">{password}</span>
                </div>
              </div>

              <button
                onClick={handleCopy}
                className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${copied ? 'bg-green-500 text-white' : 'bg-yellow-400 text-gray-900 hover:bg-yellow-300'}`}
              >
                {copied ? <><Check size={16} /> ¡Copiado!</> : <><Copy size={16} /> Copiar datos de acceso</>}
              </button>

              <button onClick={onClose}
                className="w-full py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm">
                Cerrar
              </button>
            </div>
          ) : (
            /* ── Form ── */
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs text-gray-500 font-medium mb-1">Nombre del negocio *</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Burger Bois"
                  className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 font-medium mb-1">
                  Enlace del menú (slug) *
                  <span className="ml-2 text-gray-600 normal-case font-normal">fastmenu.com/<span className="text-yellow-400">{slug || '…'}</span></span>
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="burger-bois"
                  className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 font-mono"
                />
                <p className="text-xs text-gray-600 mt-1">Se genera automáticamente. Puedes editarlo.</p>
              </div>

              <div>
                <label className="block text-xs text-gray-500 font-medium mb-1">WhatsApp del negocio *</label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="3001234567"
                  className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              <div className="border-t border-gray-800 pt-4">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">Acceso del cliente al panel admin</p>

                <div className="mb-3">
                  <label className="block text-xs text-gray-500 font-medium mb-1">Correo electrónico *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="cliente@email.com"
                    className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 font-medium mb-1">Contraseña *</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-xl pl-4 pr-11 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-900/40 border border-red-800 rounded-xl px-4 py-3 text-red-400 text-sm">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer — only show when not success */}
        {!success && (
          <div className="px-6 py-4 border-t border-gray-800 flex gap-2">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-700 text-sm text-gray-400">
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-yellow-400 text-gray-900 text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? <><RefreshCw size={14} className="animate-spin" /> Creando...</> : 'Crear cliente'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Restaurant Row ───────────────────────────────────────────────────────────

function RestaurantCard({ r }: { r: RestaurantRow }) {
  const menuUrl = typeof window !== 'undefined' ? `${window.location.origin}/${r.slug}` : `/${r.slug}`
  const adminUrl = typeof window !== 'undefined' ? `${window.location.origin}/admin/${r.slug}` : `/admin/${r.slug}`

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-3">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ background: r.primary_color }}>
            {r.name.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-white text-sm">{r.name}</p>
            <p className="text-xs text-gray-500">{r.owner_email}</p>
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-semibold flex-shrink-0 ${r.is_open ? 'bg-green-900/50 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
          {r.is_open ? 'Abierto' : 'Cerrado'}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gray-800 rounded-xl px-3 py-2 text-center">
          <p className="text-lg font-black text-white">{r.orders_today}</p>
          <p className="text-xs text-gray-500">pedidos hoy</p>
        </div>
        <div className="bg-gray-800 rounded-xl px-3 py-2 text-center">
          <p className="text-sm font-black text-yellow-400">{formatCurrency(r.revenue_today)}</p>
          <p className="text-xs text-gray-500">ingresos hoy</p>
        </div>
        <div className="bg-gray-800 rounded-xl px-3 py-2 text-center">
          <p className="text-lg font-black text-white">{r.orders_total}</p>
          <p className="text-xs text-gray-500">total pedidos</p>
        </div>
      </div>

      {/* Links */}
      <div className="flex gap-2">
        <a href={menuUrl} target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 text-xs text-gray-400 border border-gray-800 rounded-xl py-2 hover:border-gray-600 hover:text-white transition-colors">
          <ExternalLink size={12} /> Ver menú
        </a>
        <a href={adminUrl} target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 text-xs text-gray-400 border border-gray-800 rounded-xl py-2 hover:border-gray-600 hover:text-white transition-colors">
          <ExternalLink size={12} /> Panel admin
        </a>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SuperAdminPage() {
  const router = useRouter()
  const supabase = createClient()

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    const { data: result } = await supabase.rpc('get_superadmin_dashboard')
    setData(result as DashboardData)
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/superadmin/login')
  }

  const filtered = (data?.restaurants || []).filter((r) =>
    search === '' ||
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.owner_email.toLowerCase().includes(search.toLowerCase()) ||
    r.slug.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-950 pb-16">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-yellow-400 rounded-xl flex items-center justify-center">
            <Zap size={18} className="text-gray-900" />
          </div>
          <div>
            <p className="font-black text-white text-sm">FastMenu</p>
            <p className="text-xs text-yellow-400 font-semibold">Panel del Creador</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} disabled={loading}
            className="p-2 text-gray-500 hover:text-gray-300 transition-colors">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 px-3 py-2 border border-gray-800 rounded-xl transition-colors">
            <LogOut size={14} /> Salir
          </button>
        </div>
      </div>

      <div className="px-4 py-5 max-w-2xl mx-auto">

        {/* Stats */}
        {data && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <StatCard icon={Users} label="Clientes" value={String(data.total_restaurants)} sub="restaurantes" />
            <StatCard icon={ShoppingBag} label="Pedidos hoy" value={String(data.total_orders_today)} sub="en toda la plataforma" />
            <StatCard icon={TrendingUp} label="Ingresos hoy" value={formatCurrency(data.total_revenue_today)} sub="plataforma total" />
          </div>
        )}

        {/* Search + Create */}
        <div className="flex gap-2 mb-5">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente..."
            className="flex-1 bg-gray-900 border border-gray-800 text-white placeholder-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-yellow-400 text-gray-900 font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-yellow-300 transition-colors whitespace-nowrap"
          >
            <Plus size={16} /> Nuevo cliente
          </button>
        </div>

        {/* Restaurants list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-600">
            <ShoppingBag size={40} className="mx-auto mb-3 opacity-30" />
            <p>{search ? 'Sin resultados' : 'No hay clientes aún'}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((r) => <RestaurantCard key={r.id} r={r} />)}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <CreateClientModal
          onClose={() => setShowCreate(false)}
          onCreated={load}
        />
      )}
    </div>
  )
}

'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, UtensilsCrossed, ClipboardList, Settings, LogOut, ShoppingBag } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  slug: string
  restaurantName: string
}

const navItems = (slug: string) => [
  { href: `/admin/${slug}`, icon: LayoutDashboard, label: 'Dashboard' },
  { href: `/admin/${slug}/menu`, icon: UtensilsCrossed, label: 'Menú' },
  { href: `/admin/${slug}/pedidos`, icon: ClipboardList, label: 'Pedidos' },
  { href: `/admin/${slug}/configuracion`, icon: Settings, label: 'Configuración' },
]

export default function AdminSidebar({ slug, restaurantName }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 min-h-screen bg-gray-900 flex-col">
        {/* Brand */}
        <div className="px-6 py-5 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-yellow-400 rounded-lg flex items-center justify-center">
              <ShoppingBag size={20} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">FastMenu</p>
              <p className="text-gray-400 text-xs leading-tight truncate max-w-[130px]">{restaurantName}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navItems(slug).map(({ href, icon: Icon, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-yellow-400 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 flex z-50">
        {navItems(slug).map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center py-2 text-xs font-medium ${
                active ? 'text-yellow-400' : 'text-gray-400'
              }`}
            >
              <Icon size={20} />
              <span className="mt-0.5">{label}</span>
            </Link>
          )
        })}
      </div>
    </>
  )
}

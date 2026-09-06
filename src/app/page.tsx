import Link from 'next/link'
import { ShoppingBag, Zap, BarChart2, MessageCircle } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-center">

      {/* Logo */}
      <div className="w-20 h-20 bg-orange-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-orange-500/30 mb-6">
        <ShoppingBag size={40} className="text-white" />
      </div>

      {/* Headline */}
      <h1 className="text-5xl font-black text-white mb-3 tracking-tight">FastMenu</h1>
      <p className="text-gray-400 text-lg mb-10 max-w-sm leading-relaxed">
        Sistema de pedidos para comidas rápidas.<br />
        <span className="text-white font-semibold">Rápido, simple y económico.</span>
      </p>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10 max-w-2xl w-full">
        {[
          { icon: Zap, title: 'Pedidos al instante', desc: 'Menú digital con carrito y envío por WhatsApp', color: 'text-orange-400' },
          { icon: BarChart2, title: 'Panel completo', desc: 'Dashboard, pedidos en tiempo real y estadísticas', color: 'text-blue-400' },
          { icon: MessageCircle, title: 'Sin comisiones', desc: 'Pago único, sin mensualidades ni porcentajes', color: 'text-green-400' },
        ].map(({ icon: Icon, title, desc, color }) => (
          <div
            key={title}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-left hover:border-gray-700 transition-colors"
          >
            <Icon size={22} className={`${color} mb-3`} />
            <p className="font-bold text-white text-sm mb-1">{title}</p>
            <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Link
        href="/admin/login"
        className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-10 py-3.5 rounded-xl shadow-lg shadow-orange-500/25 transition-colors text-base"
      >
        Acceder al panel →
      </Link>

      {/* Footer */}
      <p className="text-gray-700 text-xs mt-10">
        ¿Tienes un negocio de comidas rápidas? Contáctanos.
      </p>
    </div>
  )
}

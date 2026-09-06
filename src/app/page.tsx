import Link from 'next/link'
import { ShoppingBag, Zap, BarChart2, MessageCircle } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 to-yellow-500 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl mb-6">
        <ShoppingBag size={40} className="text-yellow-400" />
      </div>
      <h1 className="text-4xl font-black text-white mb-2">FastMenu</h1>
      <p className="text-yellow-100 text-lg mb-8 max-w-sm">
        Sistema de pedidos para comidas rápidas. Rápido, simple y económico.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 max-w-2xl w-full">
        {[
          { icon: Zap, title: 'Pedidos al instante', desc: 'Menú digital con carrito y envío por WhatsApp' },
          { icon: BarChart2, title: 'Panel completo', desc: 'Dashboard, pedidos en tiempo real y estadísticas' },
          { icon: MessageCircle, title: 'Sin comisiones', desc: 'Pago único, sin mensualidades ni porcentajes' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-white/20 backdrop-blur rounded-2xl p-4 text-left">
            <Icon size={24} className="text-white mb-2" />
            <p className="font-bold text-white text-sm">{title}</p>
            <p className="text-yellow-100 text-xs mt-1">{desc}</p>
          </div>
        ))}
      </div>

      <Link
        href="/admin/login"
        className="bg-white text-yellow-500 font-bold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
      >
        Acceder al panel →
      </Link>
    </div>
  )
}

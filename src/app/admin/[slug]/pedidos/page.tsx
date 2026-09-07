'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Order } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { Clock, CheckCircle, ChefHat, Truck, RefreshCw } from 'lucide-react'

interface Props {
  params: Promise<{ slug: string }>
}

const STATUS_CONFIG = {
  pendiente:  { label: 'Pendiente',  icon: Clock,        color: '#f97316', bg: '#fff7ed' },
  preparando: { label: 'Preparando', icon: ChefHat,      color: '#3b82f6', bg: '#eff6ff' },
  listo:      { label: 'Listo',      icon: CheckCircle,  color: '#10b981', bg: '#f0fdf4' },
  entregado:  { label: 'Entregado',  icon: Truck,        color: '#8b5cf6', bg: '#f5f3ff' },
}

const DELIVERY_LABELS = {
  mesa: 'Mesa',
  domicilio: 'Domicilio',
  recoger: 'Recogerlo',
}

const NEXT_STATUS: Record<string, string> = {
  pendiente: 'preparando',
  preparando: 'listo',
  listo: 'entregado',
}

export default function PedidosPage({ params }: Props) {
  const { slug } = use(params)
  const supabase = createClient()

  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState<string>('activos')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('restaurants').select('id').eq('slug', slug).single().then(({ data }) => {
      if (data) setRestaurantId(data.id)
    })
  }, [slug])

  useEffect(() => {
    if (!restaurantId) return
    loadOrders()

    // Realtime subscription
    const channel = supabase
      .channel('orders-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `restaurant_id=eq.${restaurantId}`,
      }, () => loadOrders())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [restaurantId, filter])

  async function loadOrders() {
    if (!restaurantId) return
    setLoading(true)

    let query = supabase
      .from('orders')
      .select('*, order_items(*, order_item_addons(*))')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (filter === 'activos') {
      query = query.in('status', ['pendiente', 'preparando', 'listo'])
    } else if (filter !== 'todos') {
      query = query.eq('status', filter)
    }

    const { data } = await query
    setOrders(data || [])
    setLoading(false)
  }

  const updateStatus = async (orderId: string, newStatus: string) => {
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
    loadOrders()
  }

  const filters = [
    { key: 'activos', label: 'Activos' },
    { key: 'pendiente', label: 'Pendientes' },
    { key: 'preparando', label: 'Preparando' },
    { key: 'listo', label: 'Listos' },
    { key: 'entregado', label: 'Entregados' },
    { key: 'todos', label: 'Todos' },
  ]

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Pedidos</h1>
        <button onClick={loadOrders} className="p-2 rounded-lg hover:bg-gray-100">
          <RefreshCw size={18} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f.key
                ? 'bg-yellow-400 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Orders */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>No hay pedidos {filter !== 'todos' ? `con estado "${filter}"` : ''}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => {
            const cfg = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG]
            const StatusIcon = cfg.icon
            const nextStatus = NEXT_STATUS[order.status]

            return (
              <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-sm">#{order.order_number}</span>
                    <span className="text-gray-500 text-xs">·</span>
                    <span className="text-gray-500 text-xs">{DELIVERY_LABELS[order.delivery_type as keyof typeof DELIVERY_LABELS]}</span>
                  </div>
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    <StatusIcon size={12} />
                    {cfg.label}
                  </div>
                </div>

                {/* Customer */}
                <div className="px-4 py-3">
                  <p className="font-semibold text-sm text-gray-900">{order.customer_name}</p>
                  <p className="text-xs text-gray-500">{order.customer_phone}</p>
                  {order.customer_address && (
                    <p className="text-xs text-gray-500">📍 {order.customer_address}</p>
                  )}

                  {/* Items */}
                  <div className="mt-2 flex flex-col gap-1">
                    {(order.order_items || []).map((item) => (
                      <div key={item.id}>
                        <p className="text-sm text-gray-700">
                          {item.quantity}x {item.product_name}
                        </p>
                        {(item.order_item_addons || []).map((a) => (
                          <p key={a.id} className="text-xs text-gray-400 pl-4">
                            +{a.quantity} {a.addon_name}
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <p className="text-xs text-gray-400 mt-1 italic">&quot;{order.notes}&quot;</p>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-100">
                  <div>
                    <p className="font-bold text-gray-900">{formatCurrency(order.total)}</p>
                    <p className="text-xs text-gray-500">
                      {order.payment_method === 'efectivo' ? '💵 Efectivo' : '📲 Transferencia'}
                      {order.amount_tendered ? ` · Paga con ${formatCurrency(order.amount_tendered)}` : ''}
                    </p>
                  </div>
                  {nextStatus && (
                    <button
                      onClick={() => updateStatus(order.id, nextStatus)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-yellow-400 hover:bg-yellow-500 transition-colors"
                    >
                      → {STATUS_CONFIG[nextStatus as keyof typeof STATUS_CONFIG].label}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

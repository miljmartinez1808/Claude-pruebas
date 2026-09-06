import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import DashboardCharts from '@/components/admin/DashboardCharts'
import { TrendingUp, ShoppingBag, DollarSign, Clock } from 'lucide-react'

interface Props {
  params: Promise<{ slug: string }>
}

async function getStats(restaurantId: string) {
  const supabase = await createClient()
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).toISOString()

  const [{ data: todayOrders }, { data: weekOrders }, { data: statusData }] = await Promise.all([
    supabase
      .from('orders')
      .select('total, created_at')
      .eq('restaurant_id', restaurantId)
      .gte('created_at', todayStart),
    supabase
      .from('orders')
      .select('total, created_at')
      .eq('restaurant_id', restaurantId)
      .gte('created_at', weekStart),
    supabase
      .from('orders')
      .select('status')
      .eq('restaurant_id', restaurantId)
      .gte('created_at', todayStart),
  ])

  const ordersToday = todayOrders?.length || 0
  const revenueToday = todayOrders?.reduce((s, o) => s + o.total, 0) || 0
  const ordersWeek = weekOrders?.length || 0
  const revenueWeek = weekOrders?.reduce((s, o) => s + o.total, 0) || 0

  // Group week orders by day
  const dayMap: Record<string, { orders: number; revenue: number }> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const key = d.toLocaleDateString('es-CO', { weekday: 'short' })
    dayMap[key] = { orders: 0, revenue: 0 }
  }
  weekOrders?.forEach((o) => {
    const d = new Date(o.created_at)
    const key = d.toLocaleDateString('es-CO', { weekday: 'short' })
    if (dayMap[key]) {
      dayMap[key].orders++
      dayMap[key].revenue += o.total
    }
  })
  const ordersByDay = Object.entries(dayMap).map(([date, v]) => ({ date, ...v }))

  // Status counts today
  const statusCounts: Record<string, number> = {}
  statusData?.forEach((o) => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1
  })
  const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }))

  // Pending today
  const pending = statusCounts['pendiente'] || 0

  return { ordersToday, revenueToday, ordersWeek, revenueWeek, ordersByDay, ordersByStatus, pending }
}

export default async function DashboardPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: rest } = await supabase.from('restaurants').select('id, name, is_open, primary_color').eq('slug', slug).single()
  if (!rest) return null

  const stats = await getStats(rest.id)
  const primaryColor = rest.primary_color || '#FBBF24'

  const statCards = [
    { label: 'Pedidos hoy', value: stats.ordersToday, icon: ShoppingBag, color: primaryColor },
    { label: 'Ingresos hoy', value: formatCurrency(stats.revenueToday), icon: DollarSign, color: '#10b981' },
    { label: 'Pedidos semana', value: stats.ordersWeek, icon: TrendingUp, color: '#3b82f6' },
    { label: 'Pendientes ahora', value: stats.pending, icon: Clock, color: '#f97316' },
  ]

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm">{rest.name}</p>
        </div>
        <span
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
            rest.is_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${rest.is_open ? 'bg-green-500' : 'bg-red-500'}`} />
          {rest.is_open ? 'Abierto' : 'Cerrado'}
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 font-medium">{label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}22` }}>
                <Icon size={16} style={{ color }} />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <DashboardCharts
        ordersByDay={stats.ordersByDay}
        ordersByStatus={stats.ordersByStatus}
        primaryColor={primaryColor}
      />
    </div>
  )
}

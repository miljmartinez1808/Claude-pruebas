'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

interface Props {
  ordersByDay: { date: string; orders: number; revenue: number }[]
  ordersByStatus: { status: string; count: number }[]
  primaryColor: string
}

const STATUS_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  preparando: 'Preparando',
  listo: 'Listo',
  entregado: 'Entregado',
}

const PIE_COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6']

export default function DashboardCharts({ ordersByDay, ordersByStatus, primaryColor }: Props) {
  const statusData = ordersByStatus.map((s) => ({
    name: STATUS_LABELS[s.status] || s.status,
    value: s.count,
  }))

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Bar chart - pedidos por día */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4 text-sm">Pedidos últimos 7 días</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={ordersByDay}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              formatter={(value) => [value, 'Pedidos']}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,.1)' }}
            />
            <Bar dataKey="orders" fill={primaryColor} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie chart - estado de pedidos */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4 text-sm">Estado de pedidos (hoy)</h3>
        {statusData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                outerRadius={70}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}
              >
                {statusData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
            Sin pedidos hoy
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Category } from '@/types'

interface Props {
  restaurantId: string
  category: Category | null
  onClose: () => void
  onSaved: () => void
}

export default function CategoryFormModal({ restaurantId, category, onClose, onSaved }: Props) {
  const supabase = createClient()
  const [name, setName] = useState(category?.name || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!name.trim()) { setError('El nombre es obligatorio'); return }
    setSaving(true)

    if (category) {
      await supabase.from('categories').update({ name: name.trim() }).eq('id', category.id)
    } else {
      const { data: last } = await supabase
        .from('categories')
        .select('order')
        .eq('restaurant_id', restaurantId)
        .order('order', { ascending: false })
        .limit(1)
        .single()

      await supabase.from('categories').insert({
        restaurant_id: restaurantId,
        name: name.trim(),
        order: (last?.order || 0) + 1,
        is_active: true,
      })
    }

    setSaving(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">{category ? 'Editar categoría' : 'Nueva categoría'}</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Hamburguesas"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg bg-yellow-400 text-white text-sm font-semibold disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

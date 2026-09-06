'use client'

import { useState, useEffect } from 'react'
import { X, Minus, Plus } from 'lucide-react'
import { Product, CartAddon, CartItem } from '@/types'
import { formatCurrency, generateCartItemId } from '@/lib/utils'

interface Props {
  product: Product | null
  primaryColor: string
  onClose: () => void
  onAdd: (item: CartItem) => void
}

export default function ProductModal({ product, primaryColor, onClose, onAdd }: Props) {
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [addonQtys, setAddonQtys] = useState<Record<string, number>>({})

  useEffect(() => {
    if (product) {
      setQuantity(1)
      setNotes('')
      setAddonQtys({})
    }
  }, [product])

  if (!product) return null

  const addonGroups = product.addon_groups || []

  const getAddonQty = (addonItemId: string) => addonQtys[addonItemId] || 0

  const setAddonQty = (groupId: string, addonItemId: string, delta: number) => {
    const group = addonGroups.find((g) => g.id === groupId)
    if (!group) return

    const currentGroupTotal = (group.addon_items || []).reduce(
      (sum, item) => sum + (addonQtys[item.id] || 0),
      0
    )
    const current = addonQtys[addonItemId] || 0
    const next = Math.max(0, current + delta)

    if (delta > 0 && currentGroupTotal >= group.max_quantity) return

    setAddonQtys((prev) => ({ ...prev, [addonItemId]: next }))
  }

  const addonTotal = addonGroups.reduce((sum, group) => {
    return (
      sum +
      (group.addon_items || []).reduce(
        (gs, item) => gs + item.price * (addonQtys[item.id] || 0),
        0
      )
    )
  }, 0)

  const unitPrice = product.price + addonTotal
  const subtotal = unitPrice * quantity

  const selectedAddons: CartAddon[] = addonGroups.flatMap((group) =>
    (group.addon_items || [])
      .filter((item) => (addonQtys[item.id] || 0) > 0)
      .map((item) => ({
        addon_item_id: item.id,
        addon_group_id: group.id,
        addon_name: item.name,
        price: item.price,
        quantity: addonQtys[item.id] || 0,
      }))
  )

  const handleAdd = () => {
    const cartItem: CartItem = {
      id: generateCartItemId(),
      product_id: product.id,
      product_name: product.name,
      unit_price: unitPrice,
      quantity,
      notes,
      addons: selectedAddons,
      subtotal,
    }
    onAdd(cartItem)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-lg bg-white rounded-t-2xl max-h-[90vh] flex flex-col">
        {/* Product image */}
        {product.image_url && (
          <div className="relative w-full h-48 rounded-t-2xl overflow-hidden flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <button
              onClick={onClose}
              className="absolute top-3 right-3 bg-black/40 rounded-full p-1.5 text-white"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between p-4 pb-2">
          <div className="flex-1 pr-8">
            <h2 className="text-lg font-bold text-gray-900">{product.name}</h2>
            {product.description && (
              <p className="text-gray-500 text-sm mt-0.5">{product.description}</p>
            )}
          </div>
          {!product.image_url && (
            <button
              onClick={onClose}
              className="text-yellow-500 hover:text-yellow-600"
            >
              <X size={24} />
            </button>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 pb-2">
          {addonGroups.map((group) => {
            const groupTotal = (group.addon_items || []).reduce(
              (s, i) => s + (addonQtys[i.id] || 0),
              0
            )
            return (
              <div key={group.id} className="mb-4">
                {/* Group header */}
                <div className="flex items-center gap-2 py-2 border-b border-gray-100 mb-2">
                  <span className="font-semibold text-gray-900">{group.name}</span>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded text-white"
                    style={{ background: primaryColor }}
                  >
                    MÁXIMO: {group.max_quantity}
                  </span>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded"
                    style={{ background: primaryColor, color: 'white' }}
                  >
                    {group.is_required ? 'OBLIGATORIO' : 'OPCIONAL'}
                  </span>
                </div>

                {(group.addon_items || []).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 border-b border-gray-50"
                  >
                    <div>
                      <p className="font-medium text-sm text-gray-800">{item.name}</p>
                      {item.price > 0 && (
                        <p className="text-sm font-medium" style={{ color: primaryColor }}>
                          {formatCurrency(item.price)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setAddonQty(group.id, item.id, -1)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white"
                        style={{ background: primaryColor }}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center font-medium text-sm">
                        {getAddonQty(item.id)}
                      </span>
                      <button
                        onClick={() => setAddonQty(group.id, item.id, 1)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white"
                        style={{ background: primaryColor }}
                        disabled={groupTotal >= group.max_quantity}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}

          {/* Observaciones */}
          <div className="mb-4">
            <div className="flex items-center gap-2 py-2 border-b border-gray-100 mb-2">
              <span className="font-semibold text-gray-900">Observaciones</span>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded text-white"
                style={{ background: primaryColor }}
              >
                OPCIONAL
              </span>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones"
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center gap-3">
          {/* Quantity */}
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-2 py-1">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>
              <Minus size={16} className="text-gray-600" />
            </button>
            <span className="w-6 text-center font-semibold">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)}>
              <Plus size={16} className="text-gray-600" />
            </button>
          </div>

          {/* Add button */}
          <button
            onClick={handleAdd}
            className="flex-1 py-3 rounded-lg text-white font-semibold text-sm"
            style={{ background: primaryColor }}
          >
            Agregar {formatCurrency(subtotal)}
          </button>
        </div>
      </div>
    </div>
  )
}

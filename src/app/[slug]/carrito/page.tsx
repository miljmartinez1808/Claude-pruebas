'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Restaurant, CartItem } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface Props {
  params: Promise<{ slug: string }>
}

const CART_KEY = (slug: string) => `cart_${slug}`

const DELIVERY_OPTIONS = [
  { value: 'mesa', label: 'Mesa' },
  { value: 'domicilio', label: 'Domicilio' },
  { value: 'recoger', label: 'Recogerlo' },
] as const

type DeliveryType = 'mesa' | 'domicilio' | 'recoger'

export default function CartPage({ params }: Props) {
  const { slug } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('domicilio')

  useEffect(() => {
    supabase
      .from('restaurants')
      .select('*')
      .eq('slug', slug)
      .single()
      .then(({ data }) => setRestaurant(data))

    try {
      const saved = localStorage.getItem(CART_KEY(slug))
      if (saved) setCartItems(JSON.parse(saved))
    } catch {}
  }, [slug])

  const removeItem = (id: string) => {
    const updated = cartItems.filter((i) => i.id !== id)
    setCartItems(updated)
    try { localStorage.setItem(CART_KEY(slug), JSON.stringify(updated)) } catch {}
  }

  const total = cartItems.reduce((sum, i) => sum + i.subtotal, 0)
  const count = cartItems.reduce((sum, i) => sum + i.quantity, 0)
  const primaryColor = restaurant?.primary_color || '#FBBF24'

  const handleConfirm = () => {
    try {
      localStorage.setItem(`delivery_${slug}`, deliveryType)
    } catch {}
    router.push(`/${slug}/checkout`)
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center gap-3 shadow-sm sticky top-0 z-10">
        <Link href={`/${slug}`}>
          <ArrowLeft size={22} className="text-gray-700" />
        </Link>
        <h1 className="font-bold text-gray-900">Tu Orden</h1>
      </div>

      {/* Restaurant info */}
      <div className="bg-white mt-2 px-4 py-3">
        <h2 className="text-lg font-bold text-gray-900">{restaurant.name}</h2>

        {/* Delivery type */}
        <p className="text-sm font-semibold text-gray-700 mt-3 mb-2">Seleccione forma de entrega</p>
        <div className="flex gap-2">
          {DELIVERY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDeliveryType(opt.value)}
              className="flex-1 py-2 rounded-lg text-sm font-medium border transition-colors"
              style={{
                background: deliveryType === opt.value ? primaryColor : 'transparent',
                borderColor: primaryColor,
                color: deliveryType === opt.value ? 'white' : primaryColor,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Order detail */}
      <div className="bg-white mt-2 px-4 py-3">
        <h3 className="font-semibold text-gray-900 mb-3">Detalle de la Orden</h3>

        {cartItems.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>Tu carrito está vacío</p>
            <Link href={`/${slug}`} className="text-sm mt-2 block" style={{ color: primaryColor }}>
              Ver menú
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    {item.quantity} x {item.product_name}
                  </p>
                  {item.addons.length > 0 && (
                    <div className="pl-3 mt-0.5">
                      {item.addons.map((a) => (
                        <p key={a.addon_item_id} className="text-xs text-gray-500">
                          +{a.quantity} {a.addon_name}
                        </p>
                      ))}
                    </div>
                  )}
                  {item.notes && (
                    <p className="text-xs text-gray-400 mt-0.5 italic">"{item.notes}"</p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <span className="font-semibold text-sm text-gray-900">
                    {formatCurrency(item.subtotal)}
                  </span>
                  <button onClick={() => removeItem(item.id)}>
                    <Trash2 size={16} className="text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-gray-400 mt-4">
        Tecnología <span className="text-blue-400 font-medium">FastMenu</span>
      </p>

      {/* Bottom actions */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 flex flex-col gap-2">
          <button
            onClick={handleConfirm}
            className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-white font-semibold"
            style={{ background: primaryColor }}
          >
            <span className="bg-white/20 rounded-lg px-2 py-0.5 text-sm">{count}</span>
            <span>Confirmar Orden</span>
            <span>{formatCurrency(total)}</span>
          </button>
          <Link
            href={`/${slug}`}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl font-medium text-white"
            style={{ background: `${primaryColor}cc` }}
          >
            <ArrowLeft size={16} />
            Volver a tienda
          </Link>
        </div>
      )}
    </div>
  )
}

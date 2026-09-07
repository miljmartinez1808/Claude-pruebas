'use client'

import { CartItem } from '@/types'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

interface Props {
  items: CartItem[]
  total: number
  primaryColor: string
  slug: string
}

export default function CartButton({ items, total, primaryColor, slug }: Props) {
  if (items.length === 0) return null

  const count = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <div className="fixed bottom-6 left-0 right-0 flex justify-center z-40 px-4">
      <Link
        href={`/${slug}/carrito`}
        className="flex items-center justify-between w-full max-w-md px-4 py-3 rounded-xl text-white shadow-lg"
        style={{ background: primaryColor }}
      >
        <span className="flex items-center gap-2 font-semibold">
          <span className="bg-white/20 rounded-lg px-2 py-0.5 text-sm">{count}</span>
          Confirmar Orden
        </span>
        <span className="font-semibold">{formatCurrency(total)}</span>
      </Link>
    </div>
  )
}

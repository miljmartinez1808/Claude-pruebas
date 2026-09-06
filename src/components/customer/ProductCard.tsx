'use client'

import Image from 'next/image'
import { Product } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { Search } from 'lucide-react'

interface Props {
  product: Product
  primaryColor: string
  onSelect: (product: Product) => void
}

export default function ProductCard({ product, primaryColor, onSelect }: Props) {
  return (
    <div
      className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onSelect(product)}
    >
      {/* Image */}
      <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: `${primaryColor}22` }}
          >
            <Search size={20} style={{ color: primaryColor }} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight">{product.name}</h3>
        {product.description && (
          <p className="text-gray-500 text-xs mt-0.5 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        )}
        <p className="font-semibold text-sm mt-1" style={{ color: primaryColor }}>
          {formatCurrency(product.price)}
        </p>
      </div>
    </div>
  )
}

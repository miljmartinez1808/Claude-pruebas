'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Category, Product } from '@/types'
import ProductCard from './ProductCard'

interface Props {
  category: Category
  products: Product[]
  primaryColor: string
  defaultOpen?: boolean
  onSelectProduct: (product: Product) => void
}

export default function CategoryAccordion({
  category,
  products,
  primaryColor,
  defaultOpen = false,
  onSelectProduct,
}: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  if (products.length === 0) return null

  return (
    <div className="mb-1">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3.5 font-semibold text-white text-base"
        style={{ background: primaryColor }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="underline underline-offset-2">{category.name}</span>
        <ChevronDown
          size={20}
          className="transition-transform"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {/* Products list */}
      {isOpen && (
        <div className="px-4 py-3 bg-gray-50 flex flex-col gap-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              primaryColor={primaryColor}
              onSelect={onSelectProduct}
            />
          ))}
        </div>
      )}
    </div>
  )
}

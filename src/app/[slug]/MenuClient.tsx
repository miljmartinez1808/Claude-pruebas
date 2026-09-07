'use client'

import { useState, useMemo, useEffect } from 'react'
import { Restaurant, Category, Product, CartItem } from '@/types'
import RestaurantHeader from '@/components/customer/RestaurantHeader'
import SearchBar from '@/components/customer/SearchBar'
import CategoryAccordion from '@/components/customer/CategoryAccordion'
import ProductModal from '@/components/customer/ProductModal'
import CartButton from '@/components/customer/CartButton'

const CART_KEY = (slug: string) => `cart_${slug}`

interface Props {
  restaurant: Restaurant
  categories: Category[]
  products: Product[]
  slug: string
}

export default function MenuClient({ restaurant, categories, products, slug }: Props) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [search, setSearch] = useState('')
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  // Restore cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_KEY(slug))
      if (saved) setCartItems(JSON.parse(saved))
    } catch {}
  }, [slug])

  // Persist cart whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY(slug), JSON.stringify(cartItems))
    } catch {}
  }, [cartItems, slug])

  const handleAddToCart = (item: CartItem) => {
    setCartItems((prev) => [...prev, item])
  }

  const cartTotal = cartItems.reduce((sum, i) => sum + i.subtotal, 0)

  const primaryColor = restaurant.primary_color || '#FBBF24'

  // Filter products by search query, grouped by category
  const productsByCategory = useMemo(() => {
    const q = search.toLowerCase().trim()
    return categories.reduce<Record<string, Product[]>>((acc, cat) => {
      acc[cat.id] = products.filter(
        (p) =>
          p.category_id === cat.id &&
          (!q ||
            p.name.toLowerCase().includes(q) ||
            (p.description || '').toLowerCase().includes(q))
      )
      return acc
    }, {})
  }, [categories, products, search])

  const noResults =
    search !== '' && categories.every((c) => (productsByCategory[c.id] || []).length === 0)

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <RestaurantHeader restaurant={restaurant} />
      <SearchBar value={search} onChange={setSearch} primaryColor={primaryColor} />

      <div className="mt-1">
        {categories.map((cat, i) => (
          <CategoryAccordion
            key={cat.id}
            category={cat}
            products={productsByCategory[cat.id] || []}
            primaryColor={primaryColor}
            defaultOpen={i === 0 && !search}
            onSelectProduct={setSelectedProduct}
          />
        ))}
      </div>

      {noResults && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg">Sin resultados para &quot;{search}&quot;</p>
        </div>
      )}

      <p className="text-center text-xs text-gray-400 mt-8 pb-4">
        Tecnología <span className="text-blue-400 font-medium">FastMenu</span>
      </p>

      <ProductModal
        product={selectedProduct}
        primaryColor={primaryColor}
        onClose={() => setSelectedProduct(null)}
        onAdd={handleAddToCart}
      />

      <CartButton
        items={cartItems}
        total={cartTotal}
        primaryColor={primaryColor}
        slug={slug}
      />
    </div>
  )
}

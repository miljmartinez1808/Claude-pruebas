'use client'

import { useEffect, useState, useMemo } from 'react'
import { use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Restaurant, Category, Product, CartItem } from '@/types'
import RestaurantHeader from '@/components/customer/RestaurantHeader'
import SearchBar from '@/components/customer/SearchBar'
import CategoryAccordion from '@/components/customer/CategoryAccordion'
import ProductModal from '@/components/customer/ProductModal'
import CartButton from '@/components/customer/CartButton'

interface Props {
  params: Promise<{ slug: string }>
}

const CART_KEY = (slug: string) => `cart_${slug}`

export default function MenuPage({ params }: Props) {
  const { slug } = use(params)
  const supabase = createClient()

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [search, setSearch] = useState('')
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Load data
  useEffect(() => {
    async function load() {
      // Restaurant
      const { data: rest } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .single()

      if (!rest) { setNotFound(true); setLoading(false); return }
      setRestaurant(rest)

      // Categories
      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', rest.id)
        .eq('is_active', true)
        .order('order')
      setCategories(cats || [])

      // Products with addons
      const { data: prods } = await supabase
        .from('products')
        .select('*, addon_groups(*, addon_items(*))')
        .eq('restaurant_id', rest.id)
        .eq('is_available', true)
        .order('order')
      setProducts(prods || [])

      setLoading(false)
    }
    load()
  }, [slug])

  // Restore cart from localStorage
  useEffect(() => {
    if (!slug) return
    try {
      const saved = localStorage.getItem(CART_KEY(slug))
      if (saved) setCartItems(JSON.parse(saved))
    } catch {}
  }, [slug])

  // Persist cart
  useEffect(() => {
    if (!slug) return
    try {
      localStorage.setItem(CART_KEY(slug), JSON.stringify(cartItems))
    } catch {}
  }, [cartItems, slug])

  const handleAddToCart = (item: CartItem) => {
    setCartItems((prev) => [...prev, item])
  }

  const cartTotal = cartItems.reduce((sum, i) => sum + i.subtotal, 0)

  // Filter products by search
  const productsByCategory = useMemo(() => {
    const q = search.toLowerCase().trim()
    return categories.reduce<Record<string, Product[]>>((acc, cat) => {
      const filtered = products.filter(
        (p) =>
          p.category_id === cat.id &&
          (!q || p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q))
      )
      acc[cat.id] = filtered
      return acc
    }, {})
  }, [categories, products, search])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Cargando menú...</p>
        </div>
      </div>
    )
  }

  if (notFound || !restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Restaurante no encontrado</h1>
          <p className="text-gray-500">El enlace que recibiste no es válido.</p>
        </div>
      </div>
    )
  }

  const primaryColor = restaurant.primary_color || '#FBBF24'

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <RestaurantHeader restaurant={restaurant} />
      <SearchBar value={search} onChange={setSearch} primaryColor={primaryColor} />

      {/* Categories */}
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

      {/* No results */}
      {search && categories.every((c) => (productsByCategory[c.id] || []).length === 0) && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg">Sin resultados para &quot;{search}&quot;</p>
        </div>
      )}

      {/* Footer */}
      <p className="text-center text-xs text-gray-400 mt-8 pb-4">
        Tecnología <span className="text-blue-400 font-medium">FastMenu</span>
      </p>

      {/* Product modal */}
      <ProductModal
        product={selectedProduct}
        primaryColor={primaryColor}
        onClose={() => setSelectedProduct(null)}
        onAdd={handleAddToCart}
      />

      {/* Cart button */}
      <CartButton
        items={cartItems}
        total={cartTotal}
        primaryColor={primaryColor}
        slug={slug}
      />
    </div>
  )
}

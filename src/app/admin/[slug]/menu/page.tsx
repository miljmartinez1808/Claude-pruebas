'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Category, Product } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react'
import ProductFormModal from '@/components/admin/ProductFormModal'
import CategoryFormModal from '@/components/admin/CategoryFormModal'

interface Props {
  params: Promise<{ slug: string }>
}

export default function MenuPage({ params }: Props) {
  const { slug } = use(params)
  const supabase = createClient()

  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [expandedCat, setExpandedCat] = useState<string | null>(null)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [editCategory, setEditCategory] = useState<Category | null>(null)
  const [showProductForm, setShowProductForm] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [newProductCatId, setNewProductCatId] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('restaurants').select('id').eq('slug', slug).single().then(({ data }) => {
      if (data) setRestaurantId(data.id)
    })
  }, [slug])

  useEffect(() => {
    if (!restaurantId) return
    load()
  }, [restaurantId])

  async function load() {
    const [{ data: cats }, { data: prods }] = await Promise.all([
      supabase.from('categories').select('*').eq('restaurant_id', restaurantId!).order('order'),
      supabase
        .from('products')
        .select('*, addon_groups(*, addon_items(*))')
        .eq('restaurant_id', restaurantId!)
        .order('order'),
    ])
    setCategories(cats || [])
    setProducts(prods || [])
  }

  const toggleAvailable = async (product: Product) => {
    await supabase.from('products').update({ is_available: !product.is_available }).eq('id', product.id)
    load()
  }

  const toggleCategoryActive = async (cat: Category) => {
    await supabase.from('categories').update({ is_active: !cat.is_active }).eq('id', cat.id)
    load()
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return
    await supabase.from('products').delete().eq('id', id)
    load()
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('¿Eliminar esta categoría? También se eliminarán sus productos.')) return
    await supabase.from('categories').delete().eq('id', id)
    load()
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Gestión de Menú</h1>
        <button
          onClick={() => { setEditCategory(null); setShowCategoryForm(true) }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-400 text-white text-sm font-medium"
        >
          <Plus size={16} /> Categoría
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {categories.map((cat) => {
          const catProducts = products.filter((p) => p.category_id === cat.id)
          const isExpanded = expandedCat === cat.id

          return (
            <div key={cat.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Category header */}
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer"
                onClick={() => setExpandedCat(isExpanded ? null : cat.id)}
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  <span className={`font-semibold text-sm ${cat.is_active ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                    {cat.name}
                  </span>
                  <span className="text-xs text-gray-400">({catProducts.length})</span>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => toggleCategoryActive(cat)} title={cat.is_active ? 'Ocultar' : 'Mostrar'}>
                    {cat.is_active ? <Eye size={16} className="text-gray-400" /> : <EyeOff size={16} className="text-gray-300" />}
                  </button>
                  <button onClick={() => { setEditCategory(cat); setShowCategoryForm(true) }}>
                    <Pencil size={16} className="text-gray-400 hover:text-yellow-500" />
                  </button>
                  <button onClick={() => deleteCategory(cat.id)}>
                    <Trash2 size={16} className="text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              </div>

              {/* Products */}
              {isExpanded && (
                <div className="border-t border-gray-100">
                  {catProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${product.is_available ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                          {product.name}
                        </p>
                        <p className="text-xs font-semibold text-yellow-500">{formatCurrency(product.price)}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <button onClick={() => toggleAvailable(product)} title={product.is_available ? 'Deshabilitar' : 'Habilitar'}>
                          {product.is_available
                            ? <Eye size={15} className="text-gray-400" />
                            : <EyeOff size={15} className="text-gray-300" />}
                        </button>
                        <button onClick={() => { setEditProduct(product); setShowProductForm(true) }}>
                          <Pencil size={15} className="text-gray-400 hover:text-yellow-500" />
                        </button>
                        <button onClick={() => deleteProduct(product.id)}>
                          <Trash2 size={15} className="text-gray-400 hover:text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add product button */}
                  <div className="px-4 py-2">
                    <button
                      onClick={() => {
                        setEditProduct(null)
                        setNewProductCatId(cat.id)
                        setShowProductForm(true)
                      }}
                      className="flex items-center gap-1.5 text-sm text-yellow-500 font-medium hover:text-yellow-600"
                    >
                      <Plus size={14} /> Agregar producto
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {categories.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p>No hay categorías. Crea la primera.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCategoryForm && restaurantId && (
        <CategoryFormModal
          restaurantId={restaurantId}
          category={editCategory}
          onClose={() => { setShowCategoryForm(false); setEditCategory(null) }}
          onSaved={() => { setShowCategoryForm(false); setEditCategory(null); load() }}
        />
      )}

      {showProductForm && restaurantId && (
        <ProductFormModal
          restaurantId={restaurantId}
          categoryId={newProductCatId || (editProduct?.category_id ?? '')}
          categories={categories}
          product={editProduct}
          onClose={() => { setShowProductForm(false); setEditProduct(null) }}
          onSaved={() => { setShowProductForm(false); setEditProduct(null); load() }}
        />
      )}
    </div>
  )
}

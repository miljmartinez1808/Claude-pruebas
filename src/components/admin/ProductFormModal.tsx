'use client'

import { useState, useRef } from 'react'
import { X, Plus, Trash2, ImagePlus, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Category, Product } from '@/types'

interface AddonItemDraft { id?: string; name: string; price: string }
interface AddonGroupDraft { id?: string; name: string; max_quantity: string; is_required: boolean; items: AddonItemDraft[] }

interface Props {
  restaurantId: string
  categoryId: string
  categories: Category[]
  product: Product | null
  onClose: () => void
  onSaved: () => void
}

function initGroups(product: Product | null): AddonGroupDraft[] {
  if (!product?.addon_groups) return []
  return product.addon_groups.map((g) => ({
    id: g.id,
    name: g.name,
    max_quantity: String(g.max_quantity),
    is_required: g.is_required,
    items: (g.addon_items || []).map((i) => ({ id: i.id, name: i.name, price: String(i.price) })),
  }))
}

export default function ProductFormModal({ restaurantId, categoryId, categories, product, onClose, onSaved }: Props) {
  const supabase = createClient()

  const [name, setName] = useState(product?.name || '')
  const [description, setDescription] = useState(product?.description || '')
  const [price, setPrice] = useState(product ? String(product.price) : '')
  const [selectedCatId, setSelectedCatId] = useState(categoryId)
  const [imageUrl, setImageUrl] = useState(product?.image_url || '')
  const [addonGroups, setAddonGroups] = useState<AddonGroupDraft[]>(initGroups(product))
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${restaurantId}/${Date.now()}.${ext}`
    const { error: uploadErr } = await supabase.storage
      .from('product-images')
      .upload(path, file, { upsert: true })
    if (!uploadErr) {
      const { data } = supabase.storage.from('product-images').getPublicUrl(path)
      setImageUrl(data.publicUrl)
    }
    setUploading(false)
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSave = async () => {
    if (!name.trim()) { setError('El nombre es obligatorio'); return }
    if (!price || isNaN(Number(price))) { setError('El precio no es válido'); return }
    setSaving(true)

    let productId = product?.id

    if (product) {
      await supabase.from('products').update({
        name: name.trim(),
        description: description.trim() || null,
        price: parseInt(price),
        category_id: selectedCatId,
        image_url: imageUrl.trim() || null,
      }).eq('id', product.id)
    } else {
      const { data: last } = await supabase
        .from('products').select('order').eq('restaurant_id', restaurantId).order('order', { ascending: false }).limit(1).single()

      const { data: newProd } = await supabase.from('products').insert({
        restaurant_id: restaurantId,
        category_id: selectedCatId,
        name: name.trim(),
        description: description.trim() || null,
        price: parseInt(price),
        image_url: imageUrl.trim() || null,
        is_available: true,
        order: (last?.order || 0) + 1,
      }).select().single()

      productId = newProd?.id
    }

    if (!productId) { setSaving(false); return }

    // Manage addon groups
    const existingGroupIds = (product?.addon_groups || []).map((g) => g.id)
    const draftGroupIds = addonGroups.filter((g) => g.id).map((g) => g.id!)

    // Delete removed groups
    const toDelete = existingGroupIds.filter((id) => !draftGroupIds.includes(id))
    if (toDelete.length) await supabase.from('addon_groups').delete().in('id', toDelete)

    for (const group of addonGroups) {
      let groupId = group.id
      if (groupId) {
        await supabase.from('addon_groups').update({
          name: group.name,
          max_quantity: parseInt(group.max_quantity) || 1,
          is_required: group.is_required,
        }).eq('id', groupId)
      } else {
        const { data: newGroup } = await supabase.from('addon_groups').insert({
          product_id: productId,
          name: group.name,
          max_quantity: parseInt(group.max_quantity) || 1,
          is_required: group.is_required,
        }).select().single()
        groupId = newGroup?.id
      }
      if (!groupId) continue

      // Items
      const existingItemIds = group.id
        ? (product?.addon_groups?.find((g) => g.id === group.id)?.addon_items || []).map((i) => i.id)
        : []
      const draftItemIds = group.items.filter((i) => i.id).map((i) => i.id!)
      const itemsToDelete = existingItemIds.filter((id) => !draftItemIds.includes(id))
      if (itemsToDelete.length) await supabase.from('addon_items').delete().in('id', itemsToDelete)

      for (const item of group.items) {
        if (item.id) {
          await supabase.from('addon_items').update({ name: item.name, price: parseInt(item.price) || 0 }).eq('id', item.id)
        } else {
          await supabase.from('addon_items').insert({ addon_group_id: groupId, name: item.name, price: parseInt(item.price) || 0 })
        }
      }
    }

    setSaving(false)
    onSaved()
  }

  const addGroup = () => setAddonGroups([...addonGroups, { name: 'Adicion', max_quantity: '1', is_required: false, items: [] }])
  const removeGroup = (i: number) => setAddonGroups(addonGroups.filter((_, idx) => idx !== i))
  const updateGroup = (i: number, field: string, value: unknown) =>
    setAddonGroups(addonGroups.map((g, idx) => (idx === i ? { ...g, [field]: value } : g)))

  const addItem = (gi: number) =>
    setAddonGroups(addonGroups.map((g, i) => i === gi ? { ...g, items: [...g.items, { name: '', price: '0' }] } : g))
  const removeItem = (gi: number, ii: number) =>
    setAddonGroups(addonGroups.map((g, i) => i === gi ? { ...g, items: g.items.filter((_, j) => j !== ii) } : g))
  const updateItem = (gi: number, ii: number, field: string, value: string) =>
    setAddonGroups(addonGroups.map((g, i) => i === gi
      ? { ...g, items: g.items.map((item, j) => j === ii ? { ...item, [field]: value } : item) }
      : g))

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">{product ? 'Editar producto' : 'Nuevo producto'}</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Categoría</label>
            <select
              value={selectedCatId}
              onChange={(e) => setSelectedCatId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none"
            >
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Nombre *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Precio (COP) *</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="15000"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Imagen del producto</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={handleImageUpload}
            />
            {imageUrl ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Imagen del producto"
                  className="w-full h-40 object-cover rounded-xl border border-gray-200"
                />
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 rounded-xl opacity-0 hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="bg-white text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-lg"
                  >
                    {uploading ? 'Subiendo...' : 'Cambiar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full h-32 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors"
              >
                {uploading
                  ? <Loader2 size={22} className="animate-spin" />
                  : <ImagePlus size={22} />
                }
                <span className="text-xs">{uploading ? 'Subiendo imagen...' : 'Toca para subir una foto'}</span>
                <span className="text-xs text-gray-300">JPG, PNG o WebP · máx. 5 MB</span>
              </button>
            )}
          </div>

          {/* Addon groups */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-500">Grupos de adiciones</label>
              <button onClick={addGroup} className="flex items-center gap-1 text-xs text-yellow-500 font-medium">
                <Plus size={13} /> Agregar grupo
              </button>
            </div>

            {addonGroups.map((group, gi) => (
              <div key={gi} className="border border-gray-200 rounded-xl p-3 mb-2">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={group.name}
                    onChange={(e) => updateGroup(gi, 'name', e.target.value)}
                    placeholder="Nombre del grupo"
                    className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-gray-900 bg-white"
                  />
                  <button onClick={() => removeGroup(gi)}><Trash2 size={15} className="text-red-400" /></button>
                </div>

                <div className="flex gap-2 mb-2">
                  <div className="flex-1">
                    <label className="text-xs text-gray-400">Máximo</label>
                    <input
                      type="number"
                      value={group.max_quantity}
                      onChange={(e) => updateGroup(gi, 'max_quantity', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-900 bg-white"
                      min="1"
                    />
                  </div>
                  <div className="flex-1 flex items-end pb-1.5">
                    <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={group.is_required}
                        onChange={(e) => updateGroup(gi, 'is_required', e.target.checked)}
                        className="accent-yellow-400"
                      />
                      Obligatorio
                    </label>
                  </div>
                </div>

                {/* Items */}
                <div className="flex flex-col gap-1.5 mb-1">
                  {group.items.map((item, ii) => (
                    <div key={ii} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(gi, ii, 'name', e.target.value)}
                        placeholder="Nombre"
                        className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 bg-white"
                      />
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => updateItem(gi, ii, 'price', e.target.value)}
                        placeholder="Precio"
                        className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-900 bg-white"
                      />
                      <button onClick={() => removeItem(gi, ii)}><X size={13} className="text-gray-400" /></button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => addItem(gi)}
                  className="text-xs text-yellow-500 font-medium flex items-center gap-1"
                >
                  <Plus size={12} /> Agregar ítem
                </button>
              </div>
            ))}
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
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

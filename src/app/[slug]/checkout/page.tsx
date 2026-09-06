'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Restaurant, CartItem } from '@/types'
import { formatCurrency, buildWhatsAppMessage, buildWhatsAppUrl } from '@/lib/utils'
import Image from 'next/image'

interface Props {
  params: Promise<{ slug: string }>
}

const CART_KEY = (slug: string) => `cart_${slug}`

type PaymentMethod = 'efectivo' | 'transferencia'
type DeliveryType = 'mesa' | 'domicilio' | 'recoger'

export default function CheckoutPage({ params }: Props) {
  const { slug } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('domicilio')

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('')
  const [amountTendered, setAmountTendered] = useState('')
  const [comment, setComment] = useState('')
  const [showPaymentOptions, setShowPaymentOptions] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    supabase.from('restaurants').select('*').eq('slug', slug).single().then(({ data }) => {
      setRestaurant(data)
    })
    try {
      const saved = localStorage.getItem(CART_KEY(slug))
      if (saved) setCartItems(JSON.parse(saved))
      const dt = localStorage.getItem(`delivery_${slug}`)
      if (dt) setDeliveryType(dt as DeliveryType)
    } catch {}
  }, [slug])

  const total = cartItems.reduce((sum, i) => sum + i.subtotal, 0)
  const primaryColor = restaurant?.primary_color || '#FBBF24'
  const paymentOptions = restaurant?.payment_methods || ['efectivo']

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = 'Ingresa tu nombre'
    if (!phone.trim()) errs.phone = 'Ingresa tu celular'
    if (deliveryType === 'domicilio' && !address.trim()) errs.address = 'Ingresa la dirección'
    if (!paymentMethod) errs.payment = 'Debe seleccionar una forma de pago.'
    return errs
  }

  const handleSend = async () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    if (!restaurant || cartItems.length === 0) return

    setSubmitting(true)
    try {
      // Get next order number
      const { data: nextNum } = await supabase.rpc('next_order_number', {
        p_restaurant_id: restaurant.id,
      })
      const orderNumber = nextNum || Math.floor(Math.random() * 90000000 + 10000000)

      // Insert order
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
          restaurant_id: restaurant.id,
          order_number: orderNumber,
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          customer_address: address.trim() || null,
          delivery_type: deliveryType,
          payment_method: paymentMethod,
          amount_tendered: amountTendered ? parseInt(amountTendered) : null,
          total,
          notes: comment.trim() || null,
          status: 'pendiente',
        })
        .select()
        .single()

      if (orderErr || !order) throw orderErr

      // Insert order items
      for (const item of cartItems) {
        const { data: oi } = await supabase
          .from('order_items')
          .insert({
            order_id: order.id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            notes: item.notes || null,
          })
          .select()
          .single()

        if (oi && item.addons.length > 0) {
          await supabase.from('order_item_addons').insert(
            item.addons.map((a) => ({
              order_item_id: oi.id,
              addon_item_id: a.addon_item_id,
              addon_name: a.addon_name,
              price: a.price,
              quantity: a.quantity,
            }))
          )
        }
      }

      // Clear cart
      try { localStorage.removeItem(CART_KEY(slug)) } catch {}

      // Build WhatsApp message
      const msg = buildWhatsAppMessage({
        orderNumber,
        restaurantName: restaurant.name,
        restaurantWhatsapp: restaurant.whatsapp_number,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerAddress: address.trim() || null,
        deliveryType,
        paymentMethod: paymentMethod as PaymentMethod,
        amountTendered: amountTendered ? parseInt(amountTendered) : null,
        total,
        notes: comment.trim() || null,
        items: cartItems.map((ci) => ({
          name: ci.product_name,
          quantity: ci.quantity,
          unitPrice: ci.unit_price,
          addons: ci.addons.map((a) => ({
            name: a.addon_name,
            price: a.price,
            quantity: a.quantity,
          })),
          itemNotes: ci.notes || null,
        })),
      })

      const waUrl = buildWhatsAppUrl(restaurant.whatsapp_number, msg)
      window.open(waUrl, '_blank')
    } catch (err) {
      console.error(err)
      alert('Ocurrió un error al enviar el pedido. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const paymentLabel = paymentMethod === 'efectivo' ? 'Efectivo' : paymentMethod === 'transferencia' ? 'Transferencia' : ''

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Restaurant header strip */}
      <div className="relative h-28 bg-gray-800">
        {restaurant.banner_url && (
          <Image src={restaurant.banner_url} alt={restaurant.name} fill className="object-cover opacity-60" />
        )}
        <Link href={`/${slug}/carrito`} className="absolute top-3 left-3 bg-white/20 p-2 rounded-full">
          <ArrowLeft size={18} className="text-white" />
        </Link>
        {/* Logo */}
        <div className="absolute -bottom-8 left-4 w-16 h-16 rounded-full border-4 border-white bg-white shadow overflow-hidden">
          {restaurant.logo_url ? (
            <Image src={restaurant.logo_url} alt="logo" width={64} height={64} className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white"
              style={{ background: primaryColor }}>
              {restaurant.name.charAt(0)}
            </div>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="pt-12 px-4">
        <h1 className="text-lg font-bold text-gray-900 mb-1">{restaurant.name}</h1>
        <h2 className="text-base font-semibold text-gray-700 mb-4">Confirmando Orden</h2>

        {/* Name */}
        <div className="relative mb-3">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">👤</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
            className={`w-full border rounded-lg pl-9 pr-4 py-3 text-sm focus:outline-none ${errors.name ? 'border-red-400' : 'border-gray-200'}`}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        {/* Phone */}
        <div className="relative mb-3">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">📱</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Tu celular"
            className={`w-full border rounded-lg pl-9 pr-4 py-3 text-sm focus:outline-none ${errors.phone ? 'border-red-400' : 'border-gray-200'}`}
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>

        {/* Address */}
        {deliveryType === 'domicilio' && (
          <div className="relative mb-3">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🏠</span>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Tu dirección"
              className={`w-full border rounded-lg pl-9 pr-4 py-3 text-sm focus:outline-none ${errors.address ? 'border-red-400' : 'border-gray-200'}`}
            />
            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
          </div>
        )}

        {/* Payment method */}
        <div className="relative mb-3">
          <button
            onClick={() => setShowPaymentOptions(!showPaymentOptions)}
            className={`w-full border rounded-lg px-4 py-3 text-sm text-left flex items-center justify-between ${errors.payment ? 'border-red-400' : 'border-gray-200'}`}
          >
            <span className={paymentMethod ? 'text-gray-900' : 'text-gray-400'}>
              {paymentLabel || 'Seleccione una forma de pago'}
            </span>
            <ChevronDown size={16} className="text-gray-400" />
          </button>
          {errors.payment && <p className="text-red-500 text-xs mt-1">{errors.payment}</p>}

          {showPaymentOptions && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 mt-1">
              {paymentOptions.includes('efectivo') && (
                <button
                  onClick={() => { setPaymentMethod('efectivo'); setShowPaymentOptions(false) }}
                  className="w-full px-4 py-3 text-sm text-left hover:bg-gray-50 border-b border-gray-100"
                >
                  Efectivo
                </button>
              )}
              {paymentOptions.includes('transferencia') && (
                <button
                  onClick={() => { setPaymentMethod('transferencia'); setShowPaymentOptions(false) }}
                  className="w-full px-4 py-3 text-sm text-left hover:bg-gray-50"
                >
                  Transferencia
                </button>
              )}
            </div>
          )}
        </div>

        {/* Amount tendered (efectivo) */}
        {paymentMethod === 'efectivo' && (
          <div className="mb-3">
            <input
              type="number"
              value={amountTendered}
              onChange={(e) => setAmountTendered(e.target.value)}
              placeholder="¿Con cuánto paga? (opcional)"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none"
            />
          </div>
        )}

        {/* Nequi info (transferencia) */}
        {paymentMethod === 'transferencia' && (restaurant.nequi_number || restaurant.nequi_qr_url || restaurant.bank_account) && (
          <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="font-semibold text-sm text-green-800 mb-1">Datos de pago:</p>
            {restaurant.nequi_number && (
              <p className="text-sm text-green-700">🟢 Nequi: <strong>{restaurant.nequi_number}</strong></p>
            )}
            {restaurant.bank_account && (
              <p className="text-sm text-green-700 mt-1">🏦 {restaurant.bank_account}</p>
            )}
            {restaurant.nequi_qr_url && (
              <div className="mt-2">
                <Image src={restaurant.nequi_qr_url} alt="QR Nequi" width={120} height={120} className="rounded-lg" />
              </div>
            )}
            <p className="text-xs text-green-600 mt-2">Total a pagar: <strong>{formatCurrency(total)}</strong></p>
          </div>
        )}

        {/* Comment */}
        <div className="mb-4">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Ingrese un comentario(opcional)"
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none"
          />
        </div>

        <p className="text-xs text-gray-400 mb-4">
          Al dar click en enviar, aceptas nuestros{' '}
          <span style={{ color: primaryColor }} className="font-medium">Términos y condiciones</span>
          {' '}y las{' '}
          <span style={{ color: primaryColor }} className="font-medium">políticas de privacidad</span>.
        </p>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-gray-400 mb-4">
        Tecnología <span className="text-blue-400 font-medium">FastMenu</span>
      </p>

      {/* Bottom actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 flex flex-col gap-2">
        <button
          onClick={handleSend}
          disabled={submitting}
          className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-white font-semibold bg-green-500 hover:bg-green-600 disabled:opacity-60"
        >
          <span>📱</span>
          {submitting ? 'Enviando...' : 'Enviar por WhatsApp'}
        </button>
        <Link
          href={`/${slug}/carrito`}
          className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl font-medium text-white"
          style={{ background: primaryColor }}
        >
          <ArrowLeft size={16} />
          Volver a la Orden
        </Link>
      </div>
    </div>
  )
}

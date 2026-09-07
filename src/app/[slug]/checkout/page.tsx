'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronDown, Copy, Check, ZoomIn } from 'lucide-react'
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
  const [copied, setCopied] = useState(false)
  const [qrFull, setQrFull] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState<{ orderNumber: number } | null>(null)

  useEffect(() => {
    supabase.from('restaurants').select('*').eq('slug', slug).single().then(({ data }) => {
      setRestaurant(data)
    })
    try {
      const saved = localStorage.getItem(CART_KEY(slug))
      const dt = localStorage.getItem(`delivery_${slug}`)
      // Read after mount, not during render: the server renders an empty cart,
      // so restoring it during render would cause a hydration mismatch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setCartItems(JSON.parse(saved))
      if (dt) setDeliveryType(dt as DeliveryType)
    } catch {}
  }, [slug, supabase])

  const total = cartItems.reduce((sum, i) => sum + i.subtotal, 0)
  const primaryColor = restaurant?.primary_color || '#FBBF24'
  const paymentOptions = restaurant?.payment_methods || ['efectivo']

  const handleCopyNequi = () => {
    if (!restaurant?.nequi_number) return
    navigator.clipboard.writeText(restaurant.nequi_number)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

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
      // place_order assigns the order number server-side (it runs as SECURITY
      // DEFINER so it can see existing orders, and retries on collision).
      const { data: result, error: placeErr } = await supabase.rpc('place_order', {
        p_restaurant_id:    restaurant.id,
        p_customer_name:    name.trim(),
        p_customer_phone:   phone.trim(),
        p_customer_address: address.trim() || null,
        p_delivery_type:    deliveryType,
        p_payment_method:   paymentMethod,
        p_amount_tendered:  amountTendered ? parseInt(amountTendered) : null,
        p_total:            total,
        p_notes:            comment.trim() || null,
        p_items: cartItems.map((item) => ({
          product_id:   item.product_id,
          product_name: item.product_name,
          quantity:     item.quantity,
          unit_price:   item.unit_price,
          notes:        item.notes || '',
          addons:       item.addons.map((a) => ({
            addon_item_id: a.addon_item_id,
            addon_name:    a.addon_name,
            price:         a.price,
          })),
        })),
      })

      if (placeErr) throw placeErr
      if (!result) throw new Error('No se pudo crear la orden. Intenta de nuevo.')

      const orderNumber = (result as { order_number: number }).order_number

      try {
        localStorage.removeItem(CART_KEY(slug))
        localStorage.removeItem(`delivery_${slug}`)
      } catch {}

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
      setOrderPlaced({ orderNumber })
    } catch (err: unknown) {
      console.error('Checkout error:', err)
      const msg = err instanceof Error
        ? err.message
        : (err as { message?: string })?.message || 'Error desconocido'
      alert(`Ocurrió un error al enviar el pedido.\n\n${msg}\n\nIntenta de nuevo o borra el caché del browser.`)
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
  const hasTransferInfo = restaurant.nequi_number || restaurant.nequi_qr_url || restaurant.bank_account

  // ── Success screen ────────────────────────────────────────────────────────────
  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Restaurant header strip */}
        <div className="relative h-28 bg-gray-800 flex-shrink-0">
          {restaurant.banner_url && (
            <Image src={restaurant.banner_url} alt={restaurant.name} fill className="object-cover opacity-60" />
          )}
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

        {/* Success content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pt-10 pb-8 text-center">
          {/* Big checkmark */}
          <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
            style={{ background: `${primaryColor}20` }}>
            <span className="text-5xl">✅</span>
          </div>

          <h1 className="text-2xl font-black text-gray-900 mb-2">
            ¡Pedido creado con éxito!
          </h1>
          <p className="text-gray-500 text-sm mb-1">
            Orden <span className="font-bold text-gray-700">#{String(orderPlaced.orderNumber).padStart(8, '0')}</span>
          </p>
          <p className="text-gray-400 text-sm mb-8">
            Se abrió WhatsApp para confirmar tu pedido con <span className="font-medium text-gray-600">{restaurant.name}</span>.
          </p>

          {/* CTA */}
          <button
            onClick={() => router.push(`/${slug}`)}
            className="w-full max-w-xs py-4 rounded-2xl font-bold text-white text-base shadow-lg active:scale-95 transition-transform"
            style={{ background: primaryColor }}
          >
            🍽️ Hacer un nuevo pedido
          </button>

          <p className="text-center text-xs text-gray-400 mt-8">
            Tecnología <span className="text-blue-400 font-medium">FastMenu</span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* ── QR full-screen lightbox ── */}
      {qrFull && restaurant.nequi_qr_url && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-6"
          onClick={() => setQrFull(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={restaurant.nequi_qr_url}
            alt="QR de pago"
            className="max-w-full max-h-full object-contain rounded-2xl"
          />
          <button
            onClick={() => setQrFull(false)}
            className="absolute top-4 right-4 bg-white/20 rounded-full p-2 text-white"
          >
            <ArrowLeft size={20} />
          </button>
        </div>
      )}

      <div className="min-h-screen bg-white pb-32">
        {/* Restaurant header strip */}
        <div className="relative h-28 bg-gray-800">
          {restaurant.banner_url && (
            <Image src={restaurant.banner_url} alt={restaurant.name} fill className="object-cover opacity-60" />
          )}
          <Link href={`/${slug}/carrito`} className="absolute top-3 left-3 bg-white/20 p-2 rounded-full">
            <ArrowLeft size={18} className="text-white" />
          </Link>
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
              className={`w-full border rounded-lg pl-9 pr-4 py-3 text-sm text-gray-900 bg-white focus:outline-none ${errors.name ? 'border-red-400' : 'border-gray-200'}`}
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
              className={`w-full border rounded-lg pl-9 pr-4 py-3 text-sm text-gray-900 bg-white focus:outline-none ${errors.phone ? 'border-red-400' : 'border-gray-200'}`}
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
                className={`w-full border rounded-lg pl-9 pr-4 py-3 text-sm text-gray-900 bg-white focus:outline-none ${errors.address ? 'border-red-400' : 'border-gray-200'}`}
              />
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
            </div>
          )}

          {/* Payment method */}
          <div className="relative mb-3">
            <button
              onClick={() => setShowPaymentOptions(!showPaymentOptions)}
              className={`w-full border rounded-lg px-4 py-3 text-sm text-left flex items-center justify-between bg-white ${errors.payment ? 'border-red-400' : 'border-gray-200'}`}
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
                    className="w-full px-4 py-3 text-sm text-left text-gray-900 hover:bg-gray-50 border-b border-gray-100"
                  >
                    💵 Efectivo
                  </button>
                )}
                {paymentOptions.includes('transferencia') && (
                  <button
                    onClick={() => { setPaymentMethod('transferencia'); setShowPaymentOptions(false) }}
                    className="w-full px-4 py-3 text-sm text-left text-gray-900 hover:bg-gray-50"
                  >
                    🟢 Transferencia / Nequi
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
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none"
              />
            </div>
          )}

          {/* Transferencia info */}
          {paymentMethod === 'transferencia' && hasTransferInfo && (
            <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 overflow-hidden">
              {/* Header */}
              <div className="px-4 pt-4 pb-2">
                <p className="font-bold text-green-800 text-sm mb-3">📲 Datos para transferencia</p>

                {/* Nequi number + copy */}
                {restaurant.nequi_number && (
                  <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 mb-3 border border-green-100">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">🟢 Número Nequi / Daviplata</p>
                      <p className="text-lg font-bold text-gray-900 tracking-wide">{restaurant.nequi_number}</p>
                    </div>
                    <button
                      onClick={handleCopyNequi}
                      className="flex flex-col items-center gap-0.5 ml-3 flex-shrink-0"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${copied ? 'bg-green-500' : 'bg-green-100 hover:bg-green-200'}`}>
                        {copied
                          ? <Check size={18} className="text-white" />
                          : <Copy size={18} className="text-green-700" />
                        }
                      </div>
                      <span className={`text-xs font-medium ${copied ? 'text-green-600' : 'text-green-700'}`}>
                        {copied ? '¡Copiado!' : 'Copiar'}
                      </span>
                    </button>
                  </div>
                )}

                {/* Bank account */}
                {restaurant.bank_account && (
                  <div className="bg-white rounded-xl px-4 py-2.5 mb-3 border border-green-100">
                    <p className="text-xs text-gray-500 mb-0.5">🏦 Datos bancarios</p>
                    <p className="text-sm font-semibold text-gray-800">{restaurant.bank_account}</p>
                  </div>
                )}

                {/* Total to pay */}
                <div className="flex items-center justify-between px-1 mb-1">
                  <p className="text-sm text-green-700">Total a transferir</p>
                  <p className="font-bold text-green-800 text-base">{formatCurrency(total)}</p>
                </div>
              </div>

              {/* QR — full width, tappable */}
              {restaurant.nequi_qr_url && (
                <div
                  className="relative cursor-pointer bg-white mx-4 mb-4 rounded-xl overflow-hidden border border-green-100"
                  onClick={() => setQrFull(true)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={restaurant.nequi_qr_url}
                    alt="QR de pago"
                    className="w-full object-contain"
                    style={{ maxHeight: '280px' }}
                  />
                  {/* Tap hint */}
                  <div className="absolute bottom-2 right-2 bg-black/40 rounded-full px-2 py-1 flex items-center gap-1">
                    <ZoomIn size={12} className="text-white" />
                    <span className="text-xs text-white">Ampliar</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Comment */}
          <div className="mb-4">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ingrese un comentario (opcional)"
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 bg-white resize-none focus:outline-none"
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
    </>
  )
}

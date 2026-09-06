// ─── Formatting helpers ───────────────────────────────────────────────────────

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatOrderNumber(num: number): string {
  return String(num).padStart(8, '0')
}

// ─── Restaurant helpers ───────────────────────────────────────────────────────

export function isRestaurantOpen(
  hoursOpen: string | null,
  hoursClose: string | null,
  isOpenFlag: boolean
): boolean {
  if (!isOpenFlag) return false
  if (!hoursOpen || !hoursClose) return isOpenFlag

  const now = new Date()
  const [openH, openM] = hoursOpen.split(':').map(Number)
  const [closeH, closeM] = hoursClose.split(':').map(Number)

  const openMinutes = openH * 60 + openM
  const closeMinutes = closeH * 60 + closeM
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  if (closeMinutes < openMinutes) {
    // crosses midnight
    return nowMinutes >= openMinutes || nowMinutes < closeMinutes
  }
  return nowMinutes >= openMinutes && nowMinutes < closeMinutes
}

// ─── WhatsApp message builder ─────────────────────────────────────────────────

interface WhatsAppOrderData {
  orderNumber: number
  restaurantName: string
  restaurantWhatsapp: string
  customerName: string
  customerPhone: string
  customerAddress: string | null
  deliveryType: 'mesa' | 'domicilio' | 'recoger'
  paymentMethod: 'efectivo' | 'transferencia'
  amountTendered: number | null
  total: number
  notes: string | null
  items: {
    name: string
    quantity: number
    unitPrice: number
    addons: { name: string; price: number; quantity: number }[]
    itemNotes: string | null
  }[]
}

export function buildWhatsAppMessage(data: WhatsAppOrderData): string {
  const deliveryLabels = {
    mesa: 'Mesa',
    domicilio: 'Domicilio',
    recoger: 'Recogerlo',
  }

  const paymentLabels = {
    efectivo: 'Efectivo',
    transferencia: 'Transferencia',
  }

  const lines: string[] = [
    `Orden ${formatOrderNumber(data.orderNumber)} Hola ${data.restaurantName} soy *${data.customerName}* me gustaría hacer un pedido`,
    '',
    `*Dirección:* ${data.customerAddress || 'N/A'}`,
    `*Celular:* ${data.customerPhone}`,
    `*Tipo de entrega:* ${deliveryLabels[data.deliveryType]}`,
    '',
    '*Detalle de la orden:*',
  ]

  data.items.forEach((item) => {
    lines.push(`• ${item.quantity} x - ${item.name} (${formatCurrency(item.unitPrice)})`)
    item.addons.forEach((addon) => {
      if (addon.quantity > 0) {
        lines.push(`  ↳ +${addon.quantity} ${addon.name} (${formatCurrency(addon.price)})`)
      }
    })
    if (item.itemNotes) {
      lines.push(`  📝 ${item.itemNotes}`)
    }
  })

  lines.push('')
  lines.push(`*Forma de Pago:* ${paymentLabels[data.paymentMethod]}`)

  if (data.paymentMethod === 'efectivo' && data.amountTendered) {
    lines.push(`*Paga con:* ${formatCurrency(data.amountTendered)}`)
  }

  lines.push(`*Total del pedido:* ${formatCurrency(data.total)}`)

  if (data.notes) {
    lines.push('')
    lines.push(`*Comentario:* ${data.notes}`)
  }

  lines.push('')
  lines.push('Gracias.')

  return lines.join('\n')
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const cleaned = phone.replace(/\D/g, '')
  const withCountry = cleaned.startsWith('57') ? cleaned : `57${cleaned}`
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`
}

// ─── Cart helpers ─────────────────────────────────────────────────────────────

export function generateCartItemId(): string {
  return Math.random().toString(36).substring(2, 9)
}

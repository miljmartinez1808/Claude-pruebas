// ─── Database types ────────────────────────────────────────────────────────

export interface Restaurant {
  id: string
  slug: string
  name: string
  description: string | null
  logo_url: string | null
  banner_url: string | null
  address: string | null
  phone: string | null
  whatsapp_number: string
  hours_open: string | null
  hours_close: string | null
  is_open: boolean
  primary_color: string
  nequi_number: string | null
  nequi_qr_url: string | null
  bank_account: string | null
  payment_methods: string[] // ['efectivo', 'transferencia']
  created_at: string
}

export interface Category {
  id: string
  restaurant_id: string
  name: string
  order: number
  is_active: boolean
}

export interface Product {
  id: string
  restaurant_id: string
  category_id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_available: boolean
  order: number
  addon_groups?: AddonGroup[]
}

export interface AddonGroup {
  id: string
  product_id: string
  name: string
  max_quantity: number
  is_required: boolean
  addon_items?: AddonItem[]
}

export interface AddonItem {
  id: string
  addon_group_id: string
  name: string
  price: number
}

export interface Order {
  id: string
  restaurant_id: string
  order_number: number
  customer_name: string
  customer_phone: string
  customer_address: string | null
  delivery_type: 'mesa' | 'domicilio' | 'recoger'
  payment_method: 'efectivo' | 'transferencia'
  amount_tendered: number | null
  total: number
  notes: string | null
  status: 'pendiente' | 'preparando' | 'listo' | 'entregado'
  created_at: string
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  notes: string | null
  order_item_addons?: OrderItemAddon[]
}

export interface OrderItemAddon {
  id: string
  order_item_id: string
  addon_item_id: string
  addon_name: string
  price: number
  quantity: number
}

// ─── Cart types ─────────────────────────────────────────────────────────────

export interface CartAddon {
  addon_item_id: string
  addon_group_id: string
  addon_name: string
  price: number
  quantity: number
}

export interface CartItem {
  id: string // unique cart item id (product_id + random)
  product_id: string
  product_name: string
  unit_price: number
  quantity: number
  notes: string
  addons: CartAddon[]
  subtotal: number
}

export interface Cart {
  items: CartItem[]
  total: number
}

// ─── Dashboard stats ─────────────────────────────────────────────────────────

export interface DashboardStats {
  orders_today: number
  revenue_today: number
  orders_this_week: number
  revenue_this_week: number
  orders_by_day: { date: string; orders: number; revenue: number }[]
  top_products: { name: string; quantity: number }[]
  orders_by_status: { status: string; count: number }[]
}

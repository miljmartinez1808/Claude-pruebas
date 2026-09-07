import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MenuClient from './MenuClient'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function MenuPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  // 1️⃣ Fetch restaurant first to get its id
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!restaurant) notFound()

  // 2️⃣ Fetch categories + products in parallel (2 round trips total, not 3 sequential)
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .eq('is_active', true)
      .order('order'),
    supabase
      .from('products')
      .select('*, addon_groups(*, addon_items(*))')
      .eq('restaurant_id', restaurant.id)
      .eq('is_available', true)
      .order('order'),
  ])

  // All data is ready on the server — HTML arrives fully populated to the browser
  return (
    <MenuClient
      restaurant={restaurant}
      categories={categories ?? []}
      products={products ?? []}
      slug={slug}
    />
  )
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/admin/AdminSidebar'

interface Props {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export default async function AdminLayout({ children, params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  // Verify user has access to this restaurant
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('restaurant_id, restaurants(name, slug)')
    .eq('user_id', user.id)
    .single()

  const rest = adminUser?.restaurants as unknown as { name: string; slug: string } | undefined
  if (!rest || rest.slug !== slug) redirect('/admin/login')

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar slug={slug} restaurantName={rest.name} />
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        {children}
      </main>
    </div>
  )
}

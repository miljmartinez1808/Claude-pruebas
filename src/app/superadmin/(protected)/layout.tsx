import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function SuperAdminProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Server-side auth: no flash, no client-side bypass risk
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/superadmin/login')

  const { data: isSA } = await supabase.rpc('is_super_admin')
  if (!isSA) redirect('/superadmin/login')

  return <>{children}</>
}

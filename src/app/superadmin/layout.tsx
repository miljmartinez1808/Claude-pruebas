'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const check = async () => {
      // Skip auth check on login page
      if (pathname === '/superadmin/login') {
        setChecking(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/superadmin/login')
        return
      }

      const { data: isSA } = await supabase.rpc('is_super_admin')
      if (!isSA) {
        await supabase.auth.signOut()
        router.replace('/superadmin/login')
        return
      }

      setChecking(false)
    }
    check()
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  if (checking && pathname !== '/superadmin/login') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}

import { createBrowserClient } from '@supabase/ssr'

function makeClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// One browser client for the whole app, as Supabase recommends. A fresh client
// per render is what made `supabase` an unstable dependency in effects.
let browserClient: ReturnType<typeof makeClient> | undefined

export function createClient() {
  browserClient ??= makeClient()
  return browserClient
}

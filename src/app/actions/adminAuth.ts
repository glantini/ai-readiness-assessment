'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signOutAdmin() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}

import { createClient } from '@/lib/supabase/server'
import AdminNav from './AdminNav'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav userEmail={user?.email ?? null} />
      {children}
    </div>
  )
}

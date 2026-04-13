import { createClient } from '@/lib/supabase/server'
import AdminNav from './AdminNav'
import Footer from '@/components/Footer'

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
    <div className="flex min-h-screen flex-col bg-gray-50">
      <AdminNav userEmail={user?.email ?? null} />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  )
}

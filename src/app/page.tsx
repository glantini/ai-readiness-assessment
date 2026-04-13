import { redirect } from 'next/navigation'

// Middleware already redirects authenticated IMG users to /admin.
// This catches everyone else (unauthenticated visitors to /).
export default function RootPage() {
  redirect('/auth/login')
}

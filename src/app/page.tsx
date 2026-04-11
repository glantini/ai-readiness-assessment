import { redirect } from 'next/navigation'

// Middleware already redirects authenticated IMG users to /dashboard.
// This catches everyone else (unauthenticated visitors to /).
export default function RootPage() {
  redirect('/auth/login')
}

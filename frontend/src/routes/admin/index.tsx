import { createFileRoute, useSearch } from '@tanstack/react-router'
import { LoginForm } from '../../components/auth/LoginForm'
import { UserRole } from '@/types/enums'
import { useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useSelector } from '@/store'

export const Route = createFileRoute('/admin/')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      redirect: (search.redirect as string) || undefined,
    }
  },
  component: AdminLoginPage,
})

function AdminLoginPage() {
  const router = useRouter()
  const search = useSearch({ from: '/admin/' })
  const { isAuthenticated, user } = useSelector((state) => state.auth)

  useEffect(() => {
    // If user is already authenticated as super admin, redirect them
    if (isAuthenticated && user && user.role === UserRole.SUPER_ADMIN) {
      const redirectTo = search.redirect || '/admin/dashboard'
      router.navigate({ to: redirectTo })
    }
  }, [isAuthenticated, user, router, search.redirect])

  const handleLoginSuccess = () => {
    // Navigate to the redirect URL if provided, otherwise go to dashboard
    const redirectTo = search.redirect || '/admin/dashboard'
    router.navigate({ to: redirectTo })
  }

  return (
    <LoginForm userType={UserRole.SUPER_ADMIN} onSuccess={handleLoginSuccess} />
  )
}

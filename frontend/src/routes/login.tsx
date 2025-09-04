import { createFileRoute, useSearch } from '@tanstack/react-router'
import { LoginForm } from '../components/auth/LoginForm'
import { UserRole } from '@/types/enums'
import { useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useSelector } from '@/store'

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      redirect: (search.redirect as string) || undefined,
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const router = useRouter()
  const search = useSearch({ from: '/login' })
  const { isAuthenticated, user } = useSelector((state) => state.auth)

  useEffect(() => {
    // If user is already authenticated as admin, redirect them
    if (isAuthenticated && user && user.role === UserRole.ADMIN) {
      const redirectTo = search.redirect || '/dashboard'
      router.navigate({ to: redirectTo })
    }
  }, [isAuthenticated, user, router, search.redirect])

  const handleLoginSuccess = () => {
    // Navigate to the redirect URL if provided, otherwise go to dashboard
    const redirectTo = search.redirect || '/dashboard'
    router.navigate({ to: redirectTo })
  }

  return <LoginForm userType={UserRole.ADMIN} onSuccess={handleLoginSuccess} />
}

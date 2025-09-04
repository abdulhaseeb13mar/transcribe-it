import { useEffect } from 'react'
import { dispatch, useSelector } from '@/store'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { logoutUser } from '../../store/authThunks'
import { useRouter } from '@tanstack/react-router'
import { UserRole } from '../../types/enums'

export function OrganizationDashboard() {
  const user = useSelector((state) => state.auth.user)
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)
  const router = useRouter()

  // Redirect to login if user is no longer authenticated or not an admin
  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== UserRole.ADMIN) {
      router.navigate({ to: '/', search: { redirect: undefined } })
    }
  }, [isAuthenticated, user, router])

  const handleLogout = () => {
    dispatch(logoutUser())
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Organization Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Welcome back, {user?.name}
            </p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Organization Info</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Organization: {user?.organizationName || 'N/A'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Role: Organization Admin
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Dashboard functionality coming soon...
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No recent activity
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Translate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Convert text or files into different languages.
              </p>
              <Button
                onClick={() => router.navigate({ to: '/dashboard/translate' })}
              >
                Go to Translate
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

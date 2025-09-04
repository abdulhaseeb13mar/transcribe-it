import { createFileRoute, redirect, Outlet, Link } from '@tanstack/react-router'
import { store } from '../../store'
import { UserRole } from '../../types/enums'
import { Button } from '../../components/ui/button'
import { useSelector } from '@/store'
import { dispatch } from '../../store'
import { logoutUser } from '../../store/authThunks'

export const Route = createFileRoute('/admin/dashboard')({
  beforeLoad: ({ location }) => {
    const state = store.getState()
    const { isAuthenticated, user } = state.auth

    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      throw redirect({
        to: '/admin',
        search: {
          redirect: location.href,
        },
      })
    }

    // Check if user has super admin role
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw redirect({
        to: '/admin',
        search: {
          redirect: location.href,
        },
      })
    }
  },
  component: AdminDashboardLayout,
})

function AdminDashboardLayout() {
  const user = useSelector((state) => state.auth.user)

  const handleLogout = () => {
    dispatch(logoutUser())
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Super Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Welcome back, {user?.name}
            </p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8">
          <Link to="/admin/dashboard" activeOptions={{ exact: true }}>
            {({ isActive }) => (
              <Button variant={isActive ? 'default' : 'ghost'}>Overview</Button>
            )}
          </Link>
          <Link to="/admin/dashboard/organizations">
            {({ isActive }) => (
              <Button variant={isActive ? 'default' : 'ghost'}>
                Organizations
              </Button>
            )}
          </Link>
          <Link to="/admin/dashboard/plans">
            {({ isActive }) => (
              <Button variant={isActive ? 'default' : 'ghost'}>Plans</Button>
            )}
          </Link>
          {/* <Link to="/admin/dashboard/users">
            {({ isActive }) => (
              <Button variant={isActive ? 'default' : 'ghost'}>Users</Button>
            )}
          </Link> */}
        </div>

        {/* Content */}
        <Outlet />
      </div>
    </div>
  )
}

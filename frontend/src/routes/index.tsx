import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { useSelector } from '@/store'
import { UserRole } from '../types/enums'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)
  const user = useSelector((state) => state.auth.user)

  if (isAuthenticated && user) {
    // Redirect authenticated users to their dashboard
    const dashboardPath =
      user.role === UserRole.SUPER_ADMIN ? '/admin/dashboard' : '/dashboard'
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome back, {user.name}!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            You are logged in as{' '}
            {user.role === UserRole.SUPER_ADMIN
              ? 'Super Admin'
              : 'Organization Admin'}
          </p>
          <Link to={dashboardPath}>
            <Button size="lg">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Transcribe It
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Professional transcription services with powerful administration
            tools for organizations and super administrators.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          <Card className="border-2 hover:border-blue-300 transition-colors">
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                Organization Login
              </CardTitle>
              <CardDescription className="text-center">
                Access your organization's transcription dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  For organization administrators and team members
                </p>
                <Link to="/login">
                  <Button size="lg" className="w-full">
                    Login to Organization
                  </Button>
                </Link>
                <div className="text-sm">
                  <span className="text-gray-600">
                    Don't have an organization?{' '}
                  </span>
                  <Link
                    to="/register"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Create one here
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-purple-300 transition-colors">
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                Super Admin
              </CardTitle>
              <CardDescription className="text-center">
                System administration and organization management
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  For system administrators only
                </p>
                <Link to="/admin">
                  <Button size="lg" variant="secondary" className="w-full">
                    Admin Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-16">
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
            Note: Super admin needs to be created first via backend setup.
            Organization registration is available above.
          </p>
          <div className="space-x-4">
            <Link
              to="/setup"
              className="text-blue-600 hover:text-blue-800 underline text-sm"
            >
              Setup Super Admin
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

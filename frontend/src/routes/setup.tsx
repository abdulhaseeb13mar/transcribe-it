import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { SuperAdminSetup } from '../components/auth/SuperAdminSetup'

export const Route = createFileRoute('/setup')({
  component: SetupPage,
})

function SetupPage() {
  const navigate = useNavigate()

  const handleSuccess = () => {
    // Setup successful, navigate to admin login
    // navigate({ to: '/admin' })
  }

  const handleLoginClick = () => {
    // navigate({ to: '/admin' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <SuperAdminSetup
        onSuccess={handleSuccess}
        onLoginClick={handleLoginClick}
      />
    </div>
  )
}

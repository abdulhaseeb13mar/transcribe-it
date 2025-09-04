import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { OrgRegistrationForm } from '../components/auth/OrgRegistrationForm'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const navigate = useNavigate()

  const handleSuccess = () => {
    // Registration successful, could navigate to a success page or login
    navigate({ to: '/login' })
  }

  const handleLoginClick = () => {
    navigate({ to: '/login' })
  }

  return (
    <OrgRegistrationForm
      onSuccess={handleSuccess}
      onLoginClick={handleLoginClick}
    />
  )
}

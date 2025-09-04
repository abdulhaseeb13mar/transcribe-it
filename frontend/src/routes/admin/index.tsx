import { createFileRoute } from '@tanstack/react-router'
import { LoginForm } from '../../components/auth/LoginForm'
import { UserRole } from '@/types/enums'

export const Route = createFileRoute('/admin/')({
  component: AdminLoginPage,
})

function AdminLoginPage() {
  return <LoginForm userType={UserRole.SUPER_ADMIN} />
}

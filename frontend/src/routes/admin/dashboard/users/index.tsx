import { createFileRoute } from '@tanstack/react-router'
import { UsersDashboard } from '../../../../components/dashboard/admin/UsersDashboard'
import type { User } from '../../../../components/dashboard/admin/UsersDashboard'

export const Route = createFileRoute('/admin/dashboard/users/')({
  component: UsersComponent,
})

function UsersComponent() {
  // TODO: Replace with actual API calls
  const users: User[] = [
    {
      id: '1',
      name: 'Super Admin',
      email: 'admin@transcribe.com',
      role: 'Super Admin',
      organizationName: 'System',
      createdAt: '2024-01-01',
    },
    {
      id: '2',
      name: 'John Doe',
      email: 'admin@acme.com',
      role: 'Organization Admin',
      organizationName: 'Acme Corp',
      createdAt: '2024-01-15',
    },
    {
      id: '3',
      name: 'Jane Smith',
      email: 'admin@techstart.com',
      role: 'Organization Admin',
      organizationName: 'TechStart Inc',
      createdAt: '2024-02-20',
    },
  ]

  return <UsersDashboard users={users} />
}

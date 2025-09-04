import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { OrganizationsDashboard } from '../../../../components/dashboard/admin/OrganizationsDashboard'
import type { Organization } from '../../../../components/dashboard/admin/OrganizationsDashboard'
import {
  AdminService,
  type CreateOrganizationRequest,
} from '../../../../services/adminService'

export const Route = createFileRoute('/admin/dashboard/organizations/')({
  component: OrganizationsComponent,
})

function OrganizationsComponent() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('Fetching organizations...')
    loadOrganizations()
  }, [])

  const loadOrganizations = async () => {
    try {
      setLoading(true)
      const data = await AdminService.getOrganizations()
      // Map backend organization data to frontend format
      const mappedOrganizations: Organization[] = data.map((org) => {
        const adminUser = org.users?.find((user: any) => user.role === 'ADMIN')
        return {
          id: org.id,
          name: org.name,
          email: adminUser?.email || 'No admin assigned',
          createdAt: new Date(org.createdAt).toLocaleDateString(),
          adminName: adminUser?.name || 'No admin assigned',
        }
      })
      setOrganizations(mappedOrganizations)
    } catch (error) {
      console.error('Failed to load organizations:', error)
      // Fallback to mock data for now
      const mockOrganizations: Organization[] = [
        {
          id: '1',
          name: 'Acme Corp',
          email: 'admin@acme.com',
          createdAt: '2024-01-15',
          adminName: 'John Doe',
        },
        {
          id: '2',
          name: 'TechStart Inc',
          email: 'admin@techstart.com',
          createdAt: '2024-02-20',
          adminName: 'Jane Smith',
        },
      ]
      setOrganizations(mockOrganizations)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrganization = async (
    orgData: CreateOrganizationRequest,
  ) => {
    try {
      await AdminService.createOrganization(orgData)
      // After successful creation, reload the organizations list
      await loadOrganizations()
    } catch (error) {
      console.error('Failed to create organization:', error)
      // You might want to show a toast/notification here
    }
  }

  if (loading) {
    return <div>Loading organizations...</div>
  }

  return (
    <OrganizationsDashboard
      organizations={organizations}
      onCreateOrganization={handleCreateOrganization}
    />
  )
}

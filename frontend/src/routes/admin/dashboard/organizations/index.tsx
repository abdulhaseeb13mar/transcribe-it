import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { OrganizationsDashboard } from '../../../../components/dashboard/admin/OrganizationsDashboard'

import {
  AdminService,
  type CreateOrganizationRequest,
  type Organization,
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
      setOrganizations(data)
    } catch (error) {
      console.error('Failed to load organizations:', error)
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

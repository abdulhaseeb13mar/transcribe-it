import { useState } from 'react'
import { Button } from '../../ui/button'
import { Card, CardContent } from '../../ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../ui/dialog'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import type { CreateOrganizationRequest } from '@/services/adminService'

export interface Organization {
  id: string
  name: string
  email: string
  createdAt: string
  adminName: string
}

interface OrganizationsDashboardProps {
  organizations?: Organization[]
  onCreateOrganization?: (orgData: CreateOrganizationRequest) => Promise<void>
}

export function OrganizationsDashboard({
  organizations = [],
  onCreateOrganization,
}: OrganizationsDashboardProps) {
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newOrgForm, setNewOrgForm] = useState({
    name: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
  })

  const handleCreateOrg = async () => {
    // Validate form fields
    if (!newOrgForm.name.trim()) {
      alert('Please enter an organization name')
      return
    }
    if (!newOrgForm.adminName.trim()) {
      alert('Please enter an admin name')
      return
    }
    if (!newOrgForm.adminEmail.trim()) {
      alert('Please enter an admin email')
      return
    }
    if (!newOrgForm.adminPassword.trim()) {
      alert('Please enter an admin password')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newOrgForm.adminEmail)) {
      alert('Please enter a valid email address')
      return
    }

    // Basic password validation
    if (newOrgForm.adminPassword.length < 6) {
      alert('Password must be at least 6 characters long')
      return
    }

    if (onCreateOrganization) {
      try {
        setIsCreating(true)
        await onCreateOrganization({
          name: newOrgForm.name,
          orgName: newOrgForm.name,
          email: newOrgForm.adminEmail,
          password: newOrgForm.adminPassword,
        })

        // Only close dialog and reset form if successful
        setIsCreateOrgOpen(false)
        setNewOrgForm({
          name: '',
          adminName: '',
          adminEmail: '',
          adminPassword: '',
        })
      } catch (error) {
        console.error('Failed to create organization:', error)
        // Show error to user - you might want to use a proper toast library
        alert(
          `Failed to create organization: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      } finally {
        setIsCreating(false)
      }
    } else {
      // Default behavior - just log for now
      console.log('Creating organization:', newOrgForm)
      setIsCreateOrgOpen(false)
      setNewOrgForm({
        name: '',
        adminName: '',
        adminEmail: '',
        adminPassword: '',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Organizations
        </h2>
        <Dialog open={isCreateOrgOpen} onOpenChange={setIsCreateOrgOpen}>
          <DialogTrigger asChild>
            <Button>Create Organization</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Organization</DialogTitle>
              <DialogDescription>
                Add a new organization and its admin user.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="org-name">Organization Name *</Label>
                <Input
                  id="org-name"
                  value={newOrgForm.name}
                  onChange={(e) =>
                    setNewOrgForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Enter organization name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="admin-name">Admin Name *</Label>
                <Input
                  id="admin-name"
                  value={newOrgForm.adminName}
                  onChange={(e) =>
                    setNewOrgForm((prev) => ({
                      ...prev,
                      adminName: e.target.value,
                    }))
                  }
                  placeholder="Enter admin name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="admin-email">Admin Email *</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={newOrgForm.adminEmail}
                  onChange={(e) =>
                    setNewOrgForm((prev) => ({
                      ...prev,
                      adminEmail: e.target.value,
                    }))
                  }
                  placeholder="Enter admin email"
                  required
                />
              </div>
              <div>
                <Label htmlFor="admin-password">Admin Password *</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={newOrgForm.adminPassword}
                  onChange={(e) =>
                    setNewOrgForm((prev) => ({
                      ...prev,
                      adminPassword: e.target.value,
                    }))
                  }
                  placeholder="Enter admin password (min 6 characters)"
                  required
                  minLength={6}
                />
              </div>
              <Button
                onClick={handleCreateOrg}
                className="w-full"
                disabled={isCreating}
              >
                {isCreating ? 'Creating...' : 'Create Organization'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Admin Name</TableHead>
                <TableHead>Admin Email</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-gray-500 py-8"
                  >
                    No organizations found
                  </TableCell>
                </TableRow>
              ) : (
                organizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell>{org.adminName}</TableCell>
                    <TableCell>{org.email}</TableCell>
                    <TableCell>{org.createdAt}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

import { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { logoutUser } from '../../store/authThunks'
import { dispatch, useSelector } from '@/store'

interface Organization {
  id: string
  name: string
  email: string
  createdAt: string
  adminName: string
}

interface User {
  id: string
  name: string
  email: string
  role: string
  organizationName: string
  createdAt: string
}

export function SuperAdminDashboard() {
  const user = useSelector((state) => state.auth.user)

  const [activeTab, setActiveTab] = useState<
    'overview' | 'organizations' | 'users'
  >('overview')
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false)
  const [newOrgForm, setNewOrgForm] = useState({
    name: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
  })

  // Mock data - replace with actual API calls
  const organizations: Organization[] = [
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

  const handleLogout = () => {
    dispatch(logoutUser())
  }

  const handleCreateOrg = () => {
    // TODO: Implement actual organization creation
    console.log('Creating organization:', newOrgForm)
    setIsCreateOrgOpen(false)
    setNewOrgForm({
      name: '',
      adminName: '',
      adminEmail: '',
      adminPassword: '',
    })
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
          <Button
            variant={activeTab === 'overview' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </Button>
          <Button
            variant={activeTab === 'organizations' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('organizations')}
          >
            Organizations
          </Button>
          <Button
            variant={activeTab === 'users' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('users')}
          >
            Users
          </Button>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Total Organizations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-600">
                  {organizations.length}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">
                  {users.length}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium text-green-600">
                  All Systems Operational
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'organizations' && (
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
                      <Label htmlFor="org-name">Organization Name</Label>
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
                      />
                    </div>
                    <div>
                      <Label htmlFor="admin-name">Admin Name</Label>
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
                      />
                    </div>
                    <div>
                      <Label htmlFor="admin-email">Admin Email</Label>
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
                      />
                    </div>
                    <div>
                      <Label htmlFor="admin-password">Admin Password</Label>
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
                        placeholder="Enter admin password"
                      />
                    </div>
                    <Button onClick={handleCreateOrg} className="w-full">
                      Create Organization
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
                    {organizations.map((org) => (
                      <TableRow key={org.id}>
                        <TableCell className="font-medium">
                          {org.name}
                        </TableCell>
                        <TableCell>{org.adminName}</TableCell>
                        <TableCell>{org.email}</TableCell>
                        <TableCell>{org.createdAt}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              All Users
            </h2>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>{user.organizationName}</TableCell>
                        <TableCell>{user.createdAt}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Form, FormField, FormError } from '../ui/form'
import { createSuperAdmin, checkSuperAdminExists } from '../../store/authThunks'
import { clearError } from '../../store/slices/authSlice'
import { dispatch, useSelector } from '@/store'

interface SuperAdminFormData {
  email: string
  password: string
  name: string
}

interface SuperAdminSetupProps {
  onSuccess?: () => void
  onLoginClick?: () => void
}

export function SuperAdminSetup({
  onSuccess,
  onLoginClick,
}: SuperAdminSetupProps) {
  const isLoading = useSelector((state) => state.auth.isLoading)
  const error = useSelector((state) => state.auth.error)
  const superAdminExists = useSelector((state) => state.auth.superAdminExists)

  const [formData, setFormData] = useState<SuperAdminFormData>({
    email: '',
    password: '',
    name: '',
  })

  const [setupSuccess, setSetupSuccess] = useState(false)

  useEffect(() => {
    // Check if super admin already exists
    dispatch(checkSuperAdminExists())
  }, [dispatch])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email || !formData.password || !formData.name) {
      return
    }

    // Clear any previous errors
    dispatch(clearError())

    try {
      await dispatch(createSuperAdmin(formData)).unwrap()
      setSetupSuccess(true)
      onSuccess?.()
    } catch (error) {
      console.error('Super admin creation failed:', error)
    }
  }

  if (superAdminExists === true) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-blue-600">
            Super Admin Exists
          </CardTitle>
          <CardDescription className="text-center">
            A super admin has already been created for this system
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            You can now log in using your super admin credentials.
          </p>
          <Button onClick={onLoginClick} className="w-full">
            Go to Super Admin Login
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (setupSuccess) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-green-600">
            Super Admin Created!
          </CardTitle>
          <CardDescription className="text-center">
            Your super admin account has been created successfully
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            You can now log in to the super admin dashboard and start managing
            organizations.
          </p>
          <Button onClick={onLoginClick} className="w-full">
            Go to Super Admin Login
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Setup Super Admin
        </CardTitle>
        <CardDescription className="text-center">
          Create the initial super administrator account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form onSubmit={handleSubmit}>
          <FormField>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Enter super admin name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </FormField>

          <FormField>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter super admin email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </FormField>

          <FormField>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Must contain uppercase, lowercase, number, and special character
            </p>
          </FormField>

          {error && <FormError>{error}</FormError>}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating Super Admin...' : 'Create Super Admin'}
          </Button>

          <div className="text-center text-sm mt-4">
            <p className="text-gray-600 text-xs">
              This will create the initial super administrator for the system.
              Only one super admin can be created.
            </p>
          </div>
        </Form>
      </CardContent>
    </Card>
  )
}

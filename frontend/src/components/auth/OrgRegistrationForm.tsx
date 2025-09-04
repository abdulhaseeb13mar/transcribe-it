import React, { useState } from 'react'
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
import { registerOrganization } from '../../store/authThunks'
import { clearError } from '../../store/slices/authSlice'
import { dispatch, useSelector } from '@/store'

interface OrgRegistrationFormData {
  email: string
  password: string
  name: string
  orgName: string
}

interface OrgRegistrationFormProps {
  onSuccess?: () => void
  onLoginClick?: () => void
}

export function OrgRegistrationForm({
  onSuccess,
  onLoginClick,
}: OrgRegistrationFormProps) {
  const isLoading = useSelector((state) => state.auth.isLoading)
  const error = useSelector((state) => state.auth.error)

  const [formData, setFormData] = useState<OrgRegistrationFormData>({
    email: '',
    password: '',
    name: '',
    orgName: '',
  })

  const [registrationSuccess, setRegistrationSuccess] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.email ||
      !formData.password ||
      !formData.name ||
      !formData.orgName
    ) {
      return
    }

    // Clear any previous errors
    dispatch(clearError())

    try {
      const result = await dispatch(registerOrganization(formData)).unwrap()
      setRegistrationSuccess(true)

      if (!result.needsEmailVerification) {
        // If email verification is not needed, we can proceed
        onSuccess?.()
      }
    } catch (error) {
      console.error('Registration failed:', error)
    }
  }

  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-green-600">
              Registration Successful!
            </CardTitle>
            <CardDescription className="text-center">
              Your organization has been created successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Please check your email for verification instructions. Once
              verified, you can log in to your organization dashboard.
            </p>
            <Button onClick={onLoginClick} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Create Organization
          </CardTitle>
          <CardDescription className="text-center">
            Register your organization and create an admin account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form onSubmit={handleSubmit}>
            <FormField>
              <Label htmlFor="orgName">Organization Name</Label>
              <Input
                id="orgName"
                name="orgName"
                type="text"
                placeholder="Enter your organization name"
                value={formData.orgName}
                onChange={handleInputChange}
                required
              />
            </FormField>

            <FormField>
              <Label htmlFor="name">Admin Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Enter admin full name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </FormField>

            <FormField>
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter admin email address"
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
              {isLoading ? 'Creating Organization...' : 'Create Organization'}
            </Button>

            <div className="text-center text-sm">
              <span className="text-gray-600">Already have an account? </span>
              <button
                type="button"
                onClick={onLoginClick}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Sign in here
              </button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

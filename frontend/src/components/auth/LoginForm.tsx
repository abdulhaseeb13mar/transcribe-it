import React, { useState, useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
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
import { loginUser, loginSuperAdmin } from '../../store/authThunks'
import { clearError } from '../../store/slices/authSlice'
import { dispatch, useSelector } from '@/store'
import { UserRole } from '../../types/enums'

interface LoginFormData {
  email: string
  password: string
}

interface LoginFormProps {
  userType: UserRole
  onSuccess?: () => void
}

export function LoginForm({ userType, onSuccess }: LoginFormProps) {
  const router = useRouter()
  const isLoading = useSelector((state) => state.auth.isLoading)
  const error = useSelector((state) => state.auth.error)
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)
  const user = useSelector((state) => state.auth.user)

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  })

  // Clear errors when component mounts or userType changes
  useEffect(() => {
    dispatch(clearError())
  }, [userType])

  // Handle navigation after successful login
  useEffect(() => {
    if (isAuthenticated && user) {
      if (
        userType === UserRole.SUPER_ADMIN &&
        user.role === UserRole.SUPER_ADMIN
      ) {
        router.navigate({ to: '/admin/dashboard' })
      } else if (userType === UserRole.ADMIN && user.role === UserRole.ADMIN) {
        router.navigate({ to: '/dashboard' })
      }
      onSuccess?.()
    }
  }, [isAuthenticated, user, userType, router, onSuccess])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    // Clear any existing errors when user starts typing
    if (error) {
      dispatch(clearError())
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email || !formData.password) {
      return
    }

    try {
      if (userType === UserRole.SUPER_ADMIN) {
        await dispatch(loginSuperAdmin(formData)).unwrap()
      } else {
        await dispatch(loginUser(formData)).unwrap()
      }
      onSuccess?.()
    } catch (error) {
      // Error is handled by the thunk and stored in state
      console.error('Login failed:', error)
    }
  }

  const title =
    userType === UserRole.SUPER_ADMIN
      ? 'Super Admin Login'
      : 'Organization Login'
  const description =
    userType === UserRole.SUPER_ADMIN
      ? 'Access the super admin dashboard'
      : 'Login to your organization dashboard'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {title}
          </CardTitle>
          <CardDescription className="text-center">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form onSubmit={handleSubmit}>
            <FormField>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={
                  userType === UserRole.SUPER_ADMIN
                    ? 'Super admin email'
                    : 'Enter your email'
                }
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
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            </FormField>

            {error && <FormError>{error}</FormError>}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

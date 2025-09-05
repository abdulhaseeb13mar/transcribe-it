import { useEffect, useState } from 'react'
import { dispatch, useSelector } from '@/store'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { logoutUser } from '../../store/authThunks'
import { useRouter } from '@tanstack/react-router'
import { UserRole } from '../../types/enums'
import {
  creditService,
  type MyCreditsResponse,
} from '../../services/creditService'

export function OrganizationDashboard() {
  const user = useSelector((state) => state.auth.user)
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)
  const token = useSelector((state) => state.auth.session?.token)
  const router = useRouter()
  const [credits, setCredits] = useState<number | null>(null)
  const [recent, setRecent] = useState<MyCreditsResponse['recentUsage']>([])

  // Redirect to login if user is no longer authenticated or not an admin
  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== UserRole.ADMIN) {
      router.navigate({ to: '/', search: { redirect: undefined } })
    }
  }, [isAuthenticated, user, router])

  useEffect(() => {
    if (!token) return
    ;(async () => {
      try {
        const res = await creditService.getMyCredits()
        if (res.success && res.data) {
          setCredits(res.data.credits)
          setRecent(res.data.recentUsage || [])
        }
      } catch (e) {
        // ignore
      }
    })()
  }, [token])

  const handleLogout = () => {
    dispatch(logoutUser())
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  const formatOperation = (op: string) => {
    if (op === 'translation') return 'Translation'
    if (op === 'extract_and_translate') return 'Extract and Translate'
    return op.charAt(0).toUpperCase() + op.slice(1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Organization Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Welcome back, {user?.name}
            </p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Organization Info</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Role: Organization Admin
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Credits:{' '}
                {credits !== null ? (
                  <span className="font-semibold">{credits}</span>
                ) : (
                  <span className="animate-pulse">Loading…</span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Translate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Convert files into English language.
              </p>
              <Button
                onClick={() => router.navigate({ to: '/dashboard/translate' })}
              >
                Go to Translate
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {recent && recent.length > 0 ? (
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  {recent.map((u) => (
                    <li
                      key={u.id}
                      className="flex items-center justify-between"
                    >
                      <span className="truncate mr-2">
                        {formatOperation(u.operation)}
                      </span>
                      <span className="text-xs text-gray-500">
                        -{u.creditsUsed}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No recent activity
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Credits</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Buy more credits to keep your team productive.
              </p>
              <div className="mt-3">
                <Button
                  onClick={() => router.navigate({ to: '/dashboard/plans' })}
                >
                  Manage Credits
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                View payments history.
              </p>
              <Button
                onClick={() => router.navigate({ to: '/dashboard/payments' })}
              >
                View Payments
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

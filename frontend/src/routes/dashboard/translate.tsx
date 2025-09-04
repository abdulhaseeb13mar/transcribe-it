import { createFileRoute, redirect } from '@tanstack/react-router'
import { store } from '../../store'
import { UserRole } from '../../types/enums'

export const Route = createFileRoute('/dashboard/translate')({
  beforeLoad: () => {
    const state = store.getState()
    const { isAuthenticated, user } = state.auth

    if (!isAuthenticated || !user) {
      throw redirect({
        to: '/login',
        search: {
          redirect: undefined,
        },
      })
    }

    if (user.role !== UserRole.ADMIN) {
      throw redirect({
        to: '/login',
        search: {
          redirect: undefined,
        },
      })
    }
  },
  component: TranslatePage,
})

function TranslatePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Translate</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Translation tools coming soon...
        </p>
      </div>
    </div>
  )
}


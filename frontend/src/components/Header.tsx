import { useSelector } from '@/store'
import { Link, useLocation } from '@tanstack/react-router'

export default function Header() {
  const location = useLocation()
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)
  const user = useSelector((state) => state.auth.user)

  // Don't show header on login pages and dashboard pages (they have their own navigation)
  const hideHeader = ['/login', '/admin', '/dashboard'].some((path) =>
    location.pathname.startsWith(path),
  )

  if (hideHeader) {
    return null
  }

  return (
    <header className="p-4 flex gap-4 bg-white border-b border-gray-200 text-black justify-between">
      <nav className="flex flex-row items-center gap-6">
        <div className="font-bold text-xl">
          <Link to="/" className="text-blue-600 hover:text-blue-800">
            Transcribe It
          </Link>
        </div>
        {!isAuthenticated && (
          <div className="flex gap-4">
            <Link
              to="/login"
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/admin"
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              Admin
            </Link>
          </div>
        )}
      </nav>
      {isAuthenticated && user && (
        <div className="text-sm text-gray-600">Welcome, {user.name}</div>
      )}
    </header>
  )
}

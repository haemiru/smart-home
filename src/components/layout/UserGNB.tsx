import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useTenantStore } from '@/stores/tenantStore'
import { signOut } from '@/api/auth'
import { gnbMenuItems } from '@/utils/mockData'
import { useSessionTimeout } from '@/hooks/useSessionTimeout'

export function UserGNB() {
  const { session, user } = useAuthStore()
  const tenant = useTenantStore((s) => s.tenant)
  const { formatted: sessionTimer, remainingMs } = useSessionTimeout()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        {/* Desktop GNB */}
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <img src={tenant?.logo_url || '/logo.png'} alt={tenant?.office_name || '중개프로'} className="h-9 w-9 rounded-lg object-contain" />
              <span className="text-lg font-bold text-primary-700">{tenant?.office_name || '중개프로'}</span>
            </Link>

            {/* Desktop Menu */}
            <nav className="hidden items-center gap-1 lg:flex">
              {gnbMenuItems.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {session ? (
                <div className="hidden items-center gap-2 sm:flex">
                  <Link to="/favorites" className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50">
                    💗 관심매물 보기
                  </Link>
                  <span className="text-sm text-gray-600">{user?.display_name}</span>
                  {(user?.role === 'agent' || user?.role === 'staff') && (
                    <Link
                      to="/admin/dashboard"
                      className="rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-100"
                    >
                      관리자
                    </Link>
                  )}
                  <span className={`rounded px-1.5 py-0.5 font-mono text-xs ${remainingMs < 5 * 60 * 1000 ? 'font-semibold text-red-600' : 'text-gray-400'}`}>
                    {sessionTimer}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50"
                  >
                    로그아웃
                  </button>
                </div>
              ) : (
                <div className="hidden items-center gap-2 sm:flex">
                  <Link
                    to="/auth/login"
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    로그인
                  </Link>
                  <Link
                    to="/auth/signup"
                    className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
                  >
                    회원가입
                  </Link>
                </div>
              )}

              {/* Mobile Hamburger */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="rounded-lg p-2 text-gray-600 hover:bg-gray-50 lg:hidden"
              >
                {isMobileMenuOpen ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Slide Menu */}
        {isMobileMenuOpen && (
          <div className="border-t border-gray-100 bg-white lg:hidden">
            <nav className="mx-auto max-w-7xl space-y-1 px-4 py-3">
              {gnbMenuItems.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-2.5 text-sm font-medium ${
                      isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <div className="border-t border-gray-100 pt-2">
                {session ? (
                  <>
                    <div className="px-3 py-2 text-sm text-gray-500">{user?.display_name}</div>
                    {(user?.role === 'agent' || user?.role === 'staff') && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block rounded-lg px-3 py-2.5 text-sm font-medium text-primary-700"
                      >
                        관리자 포털
                      </Link>
                    )}
                    <div className="flex items-center justify-between rounded-lg px-3 py-2.5">
                      <button
                        onClick={handleSignOut}
                        className="text-sm font-medium text-gray-500"
                      >
                        로그아웃
                      </button>
                      <span className={`font-mono text-xs ${remainingMs < 5 * 60 * 1000 ? 'font-semibold text-red-600' : 'text-gray-400'}`}>
                        {sessionTimer}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex gap-2 px-3 py-2">
                    <Link
                      to="/auth/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex-1 rounded-lg border border-gray-200 py-2 text-center text-sm font-medium text-gray-600"
                    >
                      로그인
                    </Link>
                    <Link
                      to="/auth/signup"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex-1 rounded-lg bg-primary-600 py-2 text-center text-sm font-medium text-white"
                    >
                      회원가입
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

    </>
  )
}

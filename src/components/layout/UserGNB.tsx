import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { signOut } from '@/api/auth'
import { gnbMenuItems } from '@/utils/mockData'
import { AreaCalculatorModal } from '@/components/common/AreaCalculatorModal'

export function UserGNB() {
  const { session, user } = useAuthStore()
  const [isCalcOpen, setIsCalcOpen] = useState(false)
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
              <img src="/logo.png" alt="Smart Home" className="h-9 w-9 rounded-lg object-contain" />
              <span className="text-lg font-bold text-primary-700">Smart Home</span>
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
              <button
                onClick={() => setIsCalcOpen(true)}
                className="hidden rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 sm:inline-flex sm:items-center sm:gap-1"
              >
                <span>📐</span>
                <span>면적계산기</span>
              </button>

              {session ? (
                <div className="hidden items-center gap-2 sm:flex">
                  <span className="text-sm text-gray-600">{user?.display_name}</span>
                  {(user?.role === 'agent' || user?.role === 'staff') && (
                    <Link
                      to="/admin/dashboard"
                      className="rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-100"
                    >
                      관리자
                    </Link>
                  )}
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
              <button
                onClick={() => {
                  setIsCalcOpen(true)
                  setIsMobileMenuOpen(false)
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600"
              >
                📐 면적계산기
              </button>
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
                    <button
                      onClick={handleSignOut}
                      className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-500"
                    >
                      로그아웃
                    </button>
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

      <AreaCalculatorModal isOpen={isCalcOpen} onClose={() => setIsCalcOpen(false)} />
    </>
  )
}

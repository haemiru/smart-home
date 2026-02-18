import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom'

const settingsNav = [
  { path: 'office', label: '사무소 정보', icon: '🏢' },
  { path: 'staff', label: '소속원 관리', icon: '👥' },
  { path: 'features', label: '기능 관리', icon: '⚡' },
  { path: 'categories', label: '매물 카테고리', icon: '📂' },
  { path: 'search', label: '검색 설정', icon: '🔍' },
  { path: 'units', label: '기본 단위', icon: '📏' },
  { path: 'floating', label: '플로팅 버튼', icon: '💬' },
  { path: 'notifications', label: '알림 설정', icon: '🔔' },
  { path: 'integrations', label: '외부 연동', icon: '🔗' },
  { path: 'billing', label: '요금제/결제', icon: '💳' },
  { path: 'security', label: '보안 설정', icon: '🔒' },
]

export function SettingsLayout() {
  const location = useLocation()

  // Redirect /admin/settings to /admin/settings/office
  if (location.pathname === '/admin/settings' || location.pathname === '/admin/settings/') {
    return <Navigate to="office" replace />
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">환경설정</h1>
        <p className="mt-1 text-sm text-gray-500">사무소 운영에 필요한 설정을 관리합니다.</p>
      </div>

      <div className="flex gap-6">
        {/* Left Sub Menu (desktop) */}
        <nav className="hidden w-48 shrink-0 lg:block">
          <div className="sticky top-20 space-y-1">
            {settingsNav.map((item) => (
              <NavLink
                key={item.path}
                to={`/admin/settings/${item.path}`}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-primary-50 font-medium text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <span className="text-sm">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Mobile Tab Menu */}
        <div className="w-full lg:hidden">
          <div className="-mx-4 mb-4 overflow-x-auto px-4">
            <div className="flex gap-1">
              {settingsNav.map((item) => (
                <NavLink
                  key={item.path}
                  to={`/admin/settings/${item.path}`}
                  className={({ isActive }) =>
                    `shrink-0 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap ${
                      isActive ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`
                  }
                >
                  {item.icon} {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

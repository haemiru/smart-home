import { NavLink } from 'react-router-dom'

const tabs = [
  { label: '대시보드', path: '/admin/dashboard', icon: '📊' },
  { label: '매물', path: '/admin/properties', icon: '🏠' },
  { label: '고객', path: '/admin/crm', icon: '👥' },
  { label: '더보기', path: '/admin/more', icon: '⋯' },
]

interface AdminMobileNavProps {
  onOpenMore: () => void
}

export function AdminMobileNav({ onOpenMore }: AdminMobileNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white lg:hidden">
      <div className="flex items-center justify-around">
        {tabs.map((tab) =>
          tab.path === '/admin/more' ? (
            <button
              key={tab.path}
              onClick={onOpenMore}
              className="flex flex-1 flex-col items-center gap-0.5 py-2 text-xs text-gray-400"
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ) : (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
                  isActive ? 'font-medium text-primary-600' : 'text-gray-400'
                }`
              }
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </NavLink>
          )
        )}
      </div>
    </nav>
  )
}

import { NavLink } from 'react-router-dom'
import { useFeatureStore, isNavItemVisible } from '@/stores/featureStore'

const tabs = [
  { key: 'dashboard', label: '대시보드', path: '/admin/dashboard', icon: '📊' },
  { key: 'properties', label: '매물', path: '/admin/properties', icon: '🏠' },
  { key: 'customers', label: '고객', path: '/admin/customers', icon: '👥' },
  { key: 'more', label: '더보기', path: '/admin/more', icon: '⋯' },
]

interface AdminMobileNavProps {
  onOpenMore: () => void
}

export function AdminMobileNav({ onOpenMore }: AdminMobileNavProps) {
  const { features, plan, isLoaded } = useFeatureStore()

  const visibleTabs = isLoaded
    ? tabs.filter((tab) => tab.key === 'more' || isNavItemVisible(tab.key, features, plan))
    : tabs

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white lg:hidden">
      <div className="flex items-center justify-around">
        {visibleTabs.map((tab) =>
          tab.key === 'more' ? (
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

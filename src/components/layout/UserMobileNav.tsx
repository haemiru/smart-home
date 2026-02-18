import { NavLink } from 'react-router-dom'

const tabs = [
  { label: '홈', path: '/', icon: '🏠' },
  { label: '검색', path: '/properties', icon: '🔍' },
  { label: '찜', path: '/favorites', icon: '❤️' },
  { label: '상담', path: '/consultation', icon: '💬' },
  { label: 'MY', path: '/my', icon: '👤' },
]

export function UserMobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white lg:hidden">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.path === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
                isActive ? 'font-medium text-primary-600' : 'text-gray-400'
              }`
            }
          >
            <span className="text-lg">{tab.icon}</span>
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

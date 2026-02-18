import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { signOut } from '@/api/auth'
import { formatRelativeTime } from '@/utils/format'

interface AdminHeaderProps {
  onToggleSidebar: () => void
}

export function AdminHeader({ onToggleSidebar }: AdminHeaderProps) {
  const { user, agentProfile } = useAuthStore()
  const { notifications, unreadCount, markAsRead, markAllAsRead, refreshUnansweredCount, unansweredInquiryCount } = useNotificationStore()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Refresh unanswered count on mount
  useEffect(() => {
    void refreshUnansweredCount()
  }, [refreshUnansweredCount])

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth/login')
  }

  const handleNotifClick = (link?: string, id?: string) => {
    if (id) markAsRead(id)
    setIsNotifOpen(false)
    if (link) navigate(link)
  }

  const badgeCount = unreadCount + unansweredInquiryCount

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
      {/* Left: Hamburger + Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Link to="/admin/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white">
            S
          </div>
          <span className="hidden text-lg font-bold text-primary-700 sm:inline">Smart Home</span>
        </Link>
      </div>

      {/* Center: Search */}
      <div className="mx-4 hidden max-w-md flex-1 md:block">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="매물, 고객, 계약 검색..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm focus:border-primary-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
      </div>

      {/* Right: Notifications + Profile */}
      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {badgeCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white">
                {badgeCount > 9 ? '9+' : badgeCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {isNotifOpen && (
            <div className="absolute right-0 top-full mt-1 w-80 rounded-xl bg-white py-2 shadow-xl ring-1 ring-gray-200">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
                <p className="text-sm font-semibold">알림</p>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary-600 hover:underline"
                  >
                    모두 읽음
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-400">알림이 없습니다.</div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleNotifClick(n.link, n.id)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${!n.isRead ? 'bg-primary-50/50' : ''}`}
                    >
                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${n.type === 'inquiry' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                        {n.type === 'inquiry' ? '\uD83D\uDCE9' : '\uD83D\uDD14'}
                      </div>
                      <div className="flex-1">
                        <p className={`text-xs ${!n.isRead ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>{n.message}</p>
                        <p className="mt-0.5 text-[10px] text-gray-400">{formatRelativeTime(n.created_at)}</p>
                      </div>
                      {!n.isRead && (
                        <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary-600" />
                      )}
                    </button>
                  ))
                )}
              </div>
              <div className="border-t border-gray-100 px-4 py-2">
                <Link
                  to="/admin/inquiries"
                  onClick={() => setIsNotifOpen(false)}
                  className="block text-center text-xs text-primary-600 hover:underline"
                >
                  모든 문의 보기
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700">
              {user?.display_name?.charAt(0) || 'U'}
            </div>
            <svg className="hidden h-4 w-4 text-gray-400 sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 rounded-xl bg-white py-2 shadow-xl ring-1 ring-gray-200">
              <div className="border-b border-gray-100 px-4 py-2">
                <p className="text-sm font-medium">{user?.display_name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
                {agentProfile && (
                  <p className="mt-0.5 text-xs text-primary-600">{agentProfile.office_name}</p>
                )}
              </div>
              <Link
                to="/admin/settings"
                onClick={() => setIsProfileOpen(false)}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                환경설정
              </Link>
              <Link
                to="/"
                onClick={() => setIsProfileOpen(false)}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                사용자 포털
              </Link>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

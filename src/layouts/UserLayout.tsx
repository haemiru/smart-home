import { Outlet } from 'react-router-dom'
import { UserGNB } from '@/components/layout/UserGNB'
import { UserMobileNav } from '@/components/layout/UserMobileNav'
import { UserFooter } from '@/components/layout/UserFooter'
import { FloatingFAB } from '@/components/layout/FloatingFAB'

export function UserLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <UserGNB />
      <main className="flex-1 pb-16 lg:pb-0">
        <Outlet />
      </main>
      <UserFooter />
      <UserMobileNav />
      <FloatingFAB />
    </div>
  )
}

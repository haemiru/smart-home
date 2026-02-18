import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AdminHeader } from '@/components/layout/AdminHeader'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { AdminMobileNav } from '@/components/layout/AdminMobileNav'

export function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="px-4 pb-20 pt-4 lg:ml-64 lg:px-6 lg:pb-6">
        <Outlet />
      </main>
      <AdminMobileNav onOpenMore={() => setIsSidebarOpen(true)} />
    </div>
  )
}

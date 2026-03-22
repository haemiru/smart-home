import { useTenantStore } from '@/stores/tenantStore'
import { lazy, Suspense } from 'react'
import { useLocation } from 'react-router-dom'

const LandingPage = lazy(() => import('@/pages/LandingPage'))
const TenantNotFoundPage = lazy(() => import('@/pages/TenantNotFoundPage'))

function PageLoader() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
    </div>
  )
}

export function TenantGate({ children }: { children: React.ReactNode }) {
  const status = useTenantStore((s) => s.status)
  const { pathname } = useLocation()

  // Admin 포털과 인증 페이지는 테넌트 해석 없이 접근 가능
  const isAdminOrAuth = pathname.startsWith('/admin') || pathname.startsWith('/auth')

  switch (status) {
    case 'loading':
      return <PageLoader />

    case 'landing':
      if (isAdminOrAuth) return <>{children}</>
      return (
        <Suspense fallback={<PageLoader />}>
          <LandingPage />
        </Suspense>
      )

    case 'not_found':
      if (isAdminOrAuth) return <>{children}</>
      return (
        <Suspense fallback={<PageLoader />}>
          <TenantNotFoundPage />
        </Suspense>
      )

    case 'resolved':
      return <>{children}</>
  }
}

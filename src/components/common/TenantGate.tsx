import { useTenantStore } from '@/stores/tenantStore'
import { lazy, Suspense } from 'react'

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

  switch (status) {
    case 'loading':
      return <PageLoader />

    case 'landing':
      return (
        <Suspense fallback={<PageLoader />}>
          <LandingPage />
        </Suspense>
      )

    case 'not_found':
      return (
        <Suspense fallback={<PageLoader />}>
          <TenantNotFoundPage />
        </Suspense>
      )

    case 'resolved':
      return <>{children}</>
  }
}

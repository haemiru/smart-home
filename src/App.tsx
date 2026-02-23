import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { router } from './router'
import { useAuthStore } from './stores/authStore'
import { useFeatureStore } from './stores/featureStore'
import { useTenantStore } from './stores/tenantStore'

export default function App() {
  const initAuth = useAuthStore((s) => s.initialize)
  const initFeatures = useFeatureStore((s) => s.initialize)
  const initTenant = useTenantStore((s) => s.initialize)

  useEffect(() => {
    // Tenant resolution and auth run in parallel;
    // features depend on auth (plan), so they chain after auth.
    Promise.all([
      initTenant(),
      initAuth().then(() => initFeatures()),
    ])
  }, [initAuth, initFeatures, initTenant])

  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { fontSize: '14px' },
        }}
      />
    </>
  )
}

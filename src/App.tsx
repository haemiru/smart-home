import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { router } from './router'
import { useAuthStore } from './stores/authStore'
import { useFeatureStore } from './stores/featureStore'

export default function App() {
  const initAuth = useAuthStore((s) => s.initialize)
  const initFeatures = useFeatureStore((s) => s.initialize)

  useEffect(() => {
    // Auth must initialize first (sets plan), then features
    initAuth().then(() => initFeatures())
  }, [initAuth, initFeatures])

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

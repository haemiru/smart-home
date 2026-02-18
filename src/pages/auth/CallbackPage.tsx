import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export function CallbackPage() {
  const navigate = useNavigate()
  const { user, isLoading } = useAuthStore()

  useEffect(() => {
    if (isLoading) return

    if (user) {
      const target = user.role === 'customer' ? '/' : '/admin/dashboard'
      navigate(target, { replace: true })
    } else {
      navigate('/auth/login', { replace: true })
    }
  }, [user, isLoading, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        <p className="mt-4 text-sm text-gray-500">로그인 처리 중...</p>
      </div>
    </div>
  )
}

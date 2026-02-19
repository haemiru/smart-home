import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Button, Input } from '@/components/common'
import { signInWithEmail } from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const from = (location.state as { from?: Location })?.from?.pathname || '/'

  // Redirect if already logged in
  if (user) {
    const target = user.role === 'customer' ? '/' : '/admin/dashboard'
    navigate(target, { replace: true })
    return null
  }

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const data = await signInWithEmail(email, password)
      toast.success('로그인 성공!')
      const userRole = data.user?.user_metadata?.role
      const target = from !== '/' ? from
        : (userRole === 'agent' || userRole === 'staff') ? '/admin/dashboard'
        : '/'
      navigate(target, { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '로그인에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <h2 className="mb-6 text-center text-xl font-semibold">로그인</h2>

      <form onSubmit={handleEmailLogin} className="space-y-4">
        <Input
          id="email"
          label="이메일"
          type="email"
          placeholder="email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          id="password"
          label="비밀번호"
          type="password"
          placeholder="비밀번호를 입력하세요"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" className="w-full" isLoading={isLoading}>
          로그인
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        계정이 없으신가요?{' '}
        <Link to="/auth/signup" className="font-medium text-primary-600 hover:text-primary-700">
          회원가입
        </Link>
      </p>
    </div>
  )
}

import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Button, Input } from '@/components/common'
import { signInWithEmail, verifyMFACode, recordLogin } from '@/api/auth'
import { supabase } from '@/api/supabase'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // MFA state
  const [mfaRequired, setMfaRequired] = useState(false)
  const [mfaCode, setMfaCode] = useState('')
  const [mfaLoading, setMfaLoading] = useState(false)

  const from = (location.state as { from?: Location })?.from?.pathname || '/'

  // Redirect if already logged in
  if (user) {
    const target = user.role === 'customer' ? '/' : '/admin/dashboard'
    navigate(target, { replace: true })
    return null
  }

  const getRedirectTarget = (userRole?: string) => {
    if (from !== '/') return from
    return (userRole === 'agent' || userRole === 'staff') ? '/admin/dashboard' : '/'
  }

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const data = await signInWithEmail(email, password)

      // Check if MFA is required
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (aal && aal.currentLevel === 'aal1' && aal.nextLevel === 'aal2') {
        setMfaRequired(true)
        setIsLoading(false)
        return
      }

      recordLogin()
      toast.success('로그인 성공!')
      const userRole = data.user?.user_metadata?.role
      navigate(getRedirectTarget(userRole), { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '로그인에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMFAVerify = async (e: FormEvent) => {
    e.preventDefault()
    if (mfaCode.length !== 6) return
    setMfaLoading(true)
    try {
      await verifyMFACode(mfaCode)
      recordLogin()
      toast.success('로그인 성공!')
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      const userRole = currentUser?.user_metadata?.role
      navigate(getRedirectTarget(userRole), { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '인증 코드 확인에 실패했습니다.')
    } finally {
      setMfaLoading(false)
    }
  }

  // MFA code input step
  if (mfaRequired) {
    return (
      <div>
        <h2 className="mb-2 text-center text-xl font-semibold">2단계 인증</h2>
        <p className="mb-6 text-center text-sm text-gray-500">
          인증 앱에 표시된 6자리 코드를 입력하세요.
        </p>

        <form onSubmit={handleMFAVerify} className="space-y-4">
          <div>
            <label htmlFor="mfa-code" className="mb-1 block text-sm font-medium text-gray-700">인증 코드</label>
            <input
              id="mfa-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-center font-mono text-lg tracking-widest focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
              autoFocus
            />
          </div>
          <Button type="submit" className="w-full" isLoading={mfaLoading} disabled={mfaCode.length !== 6}>
            확인
          </Button>
        </form>

        <button
          onClick={() => { setMfaRequired(false); setMfaCode('') }}
          className="mt-4 block w-full text-center text-sm text-gray-500 hover:text-gray-700"
        >
          다른 계정으로 로그인
        </button>
      </div>
    )
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

import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Input } from '@/components/common'
import { signUpWithEmail, signInWithGoogle } from '@/api/auth'
import type { UserRole } from '@/types/database'
import toast from 'react-hot-toast'

type Step = 'role' | 'account' | 'agent-info'

export function SignupPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('role')
  const [role, setRole] = useState<UserRole>('customer')
  const [isLoading, setIsLoading] = useState(false)

  // Account fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')

  // Agent fields
  const [officeName, setOfficeName] = useState('')
  const [representative, setRepresentative] = useState('')
  const [businessNumber, setBusinessNumber] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [officeAddress, setOfficeAddress] = useState('')
  const [officePhone, setOfficePhone] = useState('')

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole)
    setStep('account')
  }

  const handleAccountSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error('비밀번호가 일치하지 않습니다.')
      return
    }
    if (password.length < 8) {
      toast.error('비밀번호는 8자 이상이어야 합니다.')
      return
    }
    if (role === 'agent') {
      setStep('agent-info')
    } else {
      handleSignUp()
    }
  }

  const handleSignUp = async (e?: FormEvent) => {
    e?.preventDefault()
    setIsLoading(true)
    try {
      await signUpWithEmail({
        email,
        password,
        displayName,
        phone: phone || undefined,
        role,
        agentData: role === 'agent' ? {
          officeName,
          representative,
          businessNumber,
          licenseNumber,
          address: officeAddress,
          phone: officePhone,
        } : undefined,
      })
      toast.success('회원가입이 완료되었습니다. 이메일을 확인해주세요.')
      navigate('/auth/login')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '회원가입에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    try {
      await signInWithGoogle()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Google 회원가입에 실패했습니다.')
    }
  }

  // Step 1: Role selection
  if (step === 'role') {
    return (
      <div>
        <h2 className="mb-6 text-center text-xl font-semibold">회원가입</h2>
        <p className="mb-4 text-center text-sm text-gray-500">회원 유형을 선택해주세요</p>

        <div className="space-y-3">
          <button
            onClick={() => handleRoleSelect('customer')}
            className="w-full rounded-lg border-2 border-gray-200 p-4 text-left transition-colors hover:border-primary-400 hover:bg-primary-50"
          >
            <p className="font-medium">일반회원 (고객)</p>
            <p className="mt-1 text-sm text-gray-500">매물 검색, 문의, 계약 확인</p>
          </button>

          <button
            onClick={() => handleRoleSelect('agent')}
            className="w-full rounded-lg border-2 border-gray-200 p-4 text-left transition-colors hover:border-primary-400 hover:bg-primary-50"
          >
            <p className="font-medium">공인중개사</p>
            <p className="mt-1 text-sm text-gray-500">매물 등록, 고객 관리, 계약 관리 등 올인원 업무</p>
          </button>
        </div>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">또는</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <Button variant="outline" className="w-full" onClick={handleGoogleSignup}>
          Google로 회원가입
        </Button>

        <p className="mt-6 text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{' '}
          <Link to="/auth/login" className="font-medium text-primary-600 hover:text-primary-700">
            로그인
          </Link>
        </p>
      </div>
    )
  }

  // Step 2: Account info
  if (step === 'account') {
    return (
      <div>
        <h2 className="mb-6 text-center text-xl font-semibold">
          {role === 'agent' ? '공인중개사 회원가입' : '회원가입'}
        </h2>

        <form onSubmit={handleAccountSubmit} className="space-y-4">
          <Input id="displayName" label="이름" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
          <Input id="email" label="이메일" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input id="phone" label="연락처" type="tel" placeholder="010-0000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input id="password" label="비밀번호" type="password" placeholder="8자 이상" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Input id="confirmPassword" label="비밀번호 확인" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setStep('role')}>
              이전
            </Button>
            <Button type="submit" className="flex-1" isLoading={role === 'customer' && isLoading}>
              {role === 'agent' ? '다음' : '가입하기'}
            </Button>
          </div>
        </form>
      </div>
    )
  }

  // Step 3: Agent info (only for agents)
  return (
    <div>
      <h2 className="mb-6 text-center text-xl font-semibold">중개사무소 정보</h2>
      <p className="mb-4 text-center text-sm text-gray-500">
        관리자 승인 전까지 기본 CRM만 이용 가능합니다
      </p>

      <form onSubmit={handleSignUp} className="space-y-4">
        <Input id="officeName" label="사무소명" value={officeName} onChange={(e) => setOfficeName(e.target.value)} required />
        <Input id="representative" label="대표자명" value={representative} onChange={(e) => setRepresentative(e.target.value)} required />
        <Input id="businessNumber" label="사업자등록번호" placeholder="000-00-00000" value={businessNumber} onChange={(e) => setBusinessNumber(e.target.value)} required />
        <Input id="licenseNumber" label="공인중개사 자격증 번호" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} required />
        <Input id="officeAddress" label="사무소 주소" value={officeAddress} onChange={(e) => setOfficeAddress(e.target.value)} required />
        <Input id="officePhone" label="사무소 전화번호" value={officePhone} onChange={(e) => setOfficePhone(e.target.value)} required />

        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={() => setStep('account')}>
            이전
          </Button>
          <Button type="submit" className="flex-1" isLoading={isLoading}>
            가입하기
          </Button>
        </div>
      </form>
    </div>
  )
}

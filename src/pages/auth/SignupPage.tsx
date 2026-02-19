import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Input } from '@/components/common'
import { signUpWithEmail, validateInviteCode } from '@/api/auth'
import type { UserRole } from '@/types/database'
import toast from 'react-hot-toast'

type Step = 'role' | 'account' | 'agent-info' | 'invite-code'

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

  // Staff invite code fields
  const [inviteCode, setInviteCode] = useState('')
  const [validatedOffice, setValidatedOffice] = useState<string | null>(null)
  const [validating, setValidating] = useState(false)

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
    } else if (role === 'staff') {
      setStep('invite-code')
    } else {
      handleSignUp()
    }
  }

  // Validate invite code with debounce
  useEffect(() => {
    if (inviteCode.length !== 8) {
      setValidatedOffice(null)
      return
    }

    const timer = setTimeout(async () => {
      setValidating(true)
      try {
        const result = await validateInviteCode(inviteCode)
        setValidatedOffice(result?.officeName ?? null)
        if (!result) {
          toast.error('유효하지 않은 초대코드입니다.')
        }
      } catch {
        setValidatedOffice(null)
      } finally {
        setValidating(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [inviteCode])

  const handleSignUp = async (e?: FormEvent) => {
    e?.preventDefault()
    setIsLoading(true)
    try {
      const result = await signUpWithEmail({
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
        staffInviteCode: role === 'staff' ? inviteCode.toUpperCase() : undefined,
      })

      if (result.session) {
        toast.success('회원가입이 완료되었습니다!')
        const target = (role === 'agent' || role === 'staff') ? '/admin/dashboard' : '/'
        navigate(target, { replace: true })
      } else {
        toast.success('회원가입이 완료되었습니다. 이메일을 확인해주세요.')
        navigate('/auth/login')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '회원가입에 실패했습니다.')
    } finally {
      setIsLoading(false)
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
            <p className="mt-1 text-sm text-gray-500">매물 등록, 고객 관리, 계약 관리 등 올인원 업무 (Free 요금제로 시작)</p>
          </button>

          <button
            onClick={() => handleRoleSelect('staff')}
            className="w-full rounded-lg border-2 border-gray-200 p-4 text-left transition-colors hover:border-primary-400 hover:bg-primary-50"
          >
            <p className="font-medium">소속원</p>
            <p className="mt-1 text-sm text-gray-500">소속 사무소의 초대코드로 가입</p>
          </button>
        </div>

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
    const stepTitle = role === 'agent'
      ? '공인중개사 회원가입'
      : role === 'staff'
        ? '소속원 회원가입'
        : '회원가입'

    return (
      <div>
        <h2 className="mb-6 text-center text-xl font-semibold">{stepTitle}</h2>

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
              {role === 'customer' ? '가입하기' : '다음'}
            </Button>
          </div>
        </form>
      </div>
    )
  }

  // Step 3a: Invite code (only for staff)
  if (step === 'invite-code') {
    return (
      <div>
        <h2 className="mb-6 text-center text-xl font-semibold">초대코드 입력</h2>
        <p className="mb-4 text-center text-sm text-gray-500">
          소속 사무소에서 받은 초대코드 8자리를 입력해주세요.
        </p>

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label htmlFor="inviteCode" className="mb-1 block text-sm font-medium text-gray-700">
              초대코드
            </label>
            <input
              id="inviteCode"
              type="text"
              maxLength={8}
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder="예: AB3F7K2M"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center font-mono text-lg tracking-[0.2em] focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              autoFocus
            />
          </div>

          {/* Validation status */}
          {validating && (
            <p className="text-center text-sm text-gray-400">확인 중...</p>
          )}

          {validatedOffice && (
            <div className="rounded-lg bg-green-50 p-4 text-center">
              <p className="text-sm font-medium text-green-800">
                {validatedOffice}
              </p>
              <p className="mt-1 text-xs text-green-600">
                위 사무소에 소속원으로 가입합니다.
              </p>
            </div>
          )}

          {inviteCode.length === 8 && !validating && !validatedOffice && (
            <p className="text-center text-sm text-red-500">
              유효하지 않은 초대코드입니다. 코드를 다시 확인해주세요.
            </p>
          )}

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setStep('account')}>
              이전
            </Button>
            <Button
              type="submit"
              className="flex-1"
              isLoading={isLoading}
              disabled={!validatedOffice || isLoading}
            >
              가입하기
            </Button>
          </div>
        </form>
      </div>
    )
  }

  // Step 3b: Agent info (only for agents)
  return (
    <div>
      <h2 className="mb-6 text-center text-xl font-semibold">중개사무소 정보</h2>
      <p className="mb-4 text-center text-sm text-gray-500">
        가입 즉시 Free 요금제로 시작합니다. 언제든지 업그레이드할 수 있습니다.
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

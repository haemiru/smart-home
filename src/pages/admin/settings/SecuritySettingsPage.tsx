import { useState, useEffect } from 'react'
import { fetchSecuritySettings } from '@/api/settings'
import type { SecuritySettings } from '@/api/settings'
import { changePassword, enrollTOTP, verifyTOTPEnrollment, unenrollTOTP } from '@/api/auth'
import { supabase } from '@/api/supabase'
import { formatDateTime } from '@/utils/format'
import toast from 'react-hot-toast'

type MfaStep = 'idle' | 'qr' | 'verify'

export function SecuritySettingsPage() {
  const [security, setSecurity] = useState<SecuritySettings | null>(null)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwLoading, setPwLoading] = useState(false)

  // 2FA state
  const [mfaStep, setMfaStep] = useState<MfaStep>('idle')
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null)
  const [mfaQrCode, setMfaQrCode] = useState<string | null>(null)
  const [mfaSecret, setMfaSecret] = useState<string | null>(null)
  const [mfaCode, setMfaCode] = useState('')
  const [mfaLoading, setMfaLoading] = useState(false)

  const loadSecurity = () => {
    fetchSecuritySettings()
      .then(setSecurity)
      .catch(() => setSecurity({ two_factor_enabled: false, login_records: [] }))
  }

  useEffect(() => {
    loadSecurity()
    // Also load existing factor ID for unenroll
    supabase.auth.mfa.listFactors().then(({ data }) => {
      const verified = data?.totp?.find((f) => f.status === 'verified')
      if (verified) setMfaFactorId(verified.id)
    })
  }, [])

  if (!security) return <div className="flex h-40 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>

  // ── Password Change ──
  const handlePasswordChange = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      toast.error('모든 필드를 입력해주세요.')
      return
    }
    if (newPw !== confirmPw) {
      toast.error('새 비밀번호가 일치하지 않습니다.')
      return
    }
    if (newPw.length < 8) {
      toast.error('비밀번호는 8자 이상이어야 합니다.')
      return
    }
    setPwLoading(true)
    try {
      await changePassword(currentPw, newPw)
      toast.success('비밀번호가 변경되었습니다.')
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '비밀번호 변경에 실패했습니다.')
    } finally {
      setPwLoading(false)
    }
  }

  // ── 2FA Enroll ──
  const handleStartEnroll = async () => {
    setMfaLoading(true)
    try {
      const data = await enrollTOTP()
      setMfaFactorId(data.id)
      setMfaQrCode(data.totp.qr_code)
      setMfaSecret(data.totp.secret)
      setMfaStep('qr')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '2FA 설정을 시작할 수 없습니다.')
    } finally {
      setMfaLoading(false)
    }
  }

  const handleVerifyEnroll = async () => {
    if (mfaCode.length !== 6 || !mfaFactorId) return
    setMfaLoading(true)
    try {
      await verifyTOTPEnrollment(mfaFactorId, mfaCode)
      toast.success('2단계 인증이 활성화되었습니다.')
      setMfaStep('idle')
      setMfaCode('')
      setMfaQrCode(null)
      setMfaSecret(null)
      setSecurity({ ...security, two_factor_enabled: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '인증 코드가 올바르지 않습니다.')
    } finally {
      setMfaLoading(false)
    }
  }

  // ── 2FA Unenroll ──
  const handleUnenroll = async () => {
    if (!mfaFactorId) return
    setMfaLoading(true)
    try {
      await unenrollTOTP(mfaFactorId)
      toast.success('2단계 인증이 해제되었습니다.')
      setMfaFactorId(null)
      setSecurity({ ...security, two_factor_enabled: false })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '2FA 해제에 실패했습니다.')
    } finally {
      setMfaLoading(false)
    }
  }

  const handleCancelEnroll = () => {
    // If we started enrollment but haven't verified, unenroll the pending factor
    if (mfaFactorId && !security.two_factor_enabled) {
      unenrollTOTP(mfaFactorId).catch(() => {})
    }
    setMfaStep('idle')
    setMfaCode('')
    setMfaQrCode(null)
    setMfaSecret(null)
  }

  return (
    <div className="space-y-5">
      {/* Password Change */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <h2 className="text-sm font-bold">비밀번호 변경</h2>
        <div className="mt-4 max-w-sm space-y-3">
          <div>
            <label className="mb-1 block text-xs text-gray-400">현재 비밀번호</label>
            <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">새 비밀번호</label>
            <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="8자 이상" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">새 비밀번호 확인</label>
            <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <button onClick={handlePasswordChange} disabled={pwLoading} className="rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
            {pwLoading ? '변경 중...' : '변경'}
          </button>
        </div>
      </div>

      {/* 2FA */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold">2단계 인증 (TOTP)</h2>
            <p className="mt-1 text-xs text-gray-400">
              Google Authenticator 등 인증 앱으로 로그인 시 추가 인증을 요구합니다.
            </p>
          </div>
          {mfaStep === 'idle' && (
            security.two_factor_enabled ? (
              <button
                onClick={handleUnenroll}
                disabled={mfaLoading}
                className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
              >
                {mfaLoading ? '처리 중...' : '해제'}
              </button>
            ) : (
              <button
                onClick={handleStartEnroll}
                disabled={mfaLoading}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {mfaLoading ? '처리 중...' : '활성화'}
              </button>
            )
          )}
        </div>

        {/* Status badge */}
        {mfaStep === 'idle' && (
          <div className="mt-3">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${security.two_factor_enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${security.two_factor_enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
              {security.two_factor_enabled ? '활성' : '비활성'}
            </span>
          </div>
        )}

        {/* QR Code step */}
        {mfaStep === 'qr' && mfaQrCode && (
          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="mb-3 text-sm font-medium text-blue-800">1. 인증 앱에서 QR 코드를 스캔하세요</p>
              <div className="flex justify-center">
                <img
                  src={mfaQrCode}
                  alt="TOTP QR Code"
                  className="h-48 w-48 rounded-lg border border-gray-200 bg-white p-2"
                />
              </div>
              {mfaSecret && (
                <div className="mt-3 text-center">
                  <p className="text-xs text-gray-500">QR 스캔이 안 되면 아래 키를 직접 입력하세요:</p>
                  <code className="mt-1 inline-block rounded bg-white px-3 py-1 font-mono text-xs text-gray-700 select-all">{mfaSecret}</code>
                </div>
              )}
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="mb-2 text-sm font-medium text-blue-800">2. 인증 앱에 표시된 6자리 코드를 입력하세요</p>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-36 rounded-lg border border-gray-200 px-3 py-2 text-center font-mono text-lg tracking-widest"
                />
                <button
                  onClick={handleVerifyEnroll}
                  disabled={mfaCode.length !== 6 || mfaLoading}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {mfaLoading ? '확인 중...' : '확인'}
                </button>
              </div>
            </div>
            <button onClick={handleCancelEnroll} className="text-sm text-gray-500 hover:text-gray-700">
              취소
            </button>
          </div>
        )}
      </div>

      {/* Login Records */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <h2 className="mb-3 text-sm font-bold">로그인 기록</h2>
        {security.login_records.length === 0 ? (
          <p className="text-sm text-gray-400">로그인 기록이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs text-gray-400">
                  <th className="pb-2 pr-4">일시</th>
                  <th className="pb-2 pr-4">IP</th>
                  <th className="pb-2">기기</th>
                </tr>
              </thead>
              <tbody>
                {security.login_records.map((rec, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2.5 pr-4 text-xs">{formatDateTime(rec.date)}</td>
                    <td className="py-2.5 pr-4 text-xs font-mono text-gray-500">{rec.ip}</td>
                    <td className="py-2.5 text-xs">{rec.device}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { fetchSecuritySettings } from '@/api/settings'
import type { SecuritySettings } from '@/api/settings'
import { formatDateTime } from '@/utils/format'
import toast from 'react-hot-toast'

export function SecuritySettingsPage() {
  const [security, setSecurity] = useState<SecuritySettings | null>(null)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')

  useEffect(() => {
    fetchSecuritySettings().then(setSecurity)
  }, [])

  if (!security) return <div className="flex h-40 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>

  const handlePasswordChange = () => {
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
    toast.success('비밀번호가 변경되었습니다.')
    setCurrentPw('')
    setNewPw('')
    setConfirmPw('')
  }

  const handleToggle2FA = () => {
    setSecurity({ ...security, two_factor_enabled: !security.two_factor_enabled })
    toast.success(security.two_factor_enabled ? '2단계 인증이 해제되었습니다.' : '2단계 인증이 활성화되었습니다.')
  }

  const handleTerminateSession = (sessionId: string) => {
    setSecurity({
      ...security,
      active_sessions: security.active_sessions.filter((s) => s.id !== sessionId),
    })
    toast.success('세션이 종료되었습니다.')
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
          <button onClick={handlePasswordChange} className="rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700">변경</button>
        </div>
      </div>

      {/* 2FA */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold">2단계 인증 (2FA)</h2>
            <p className="mt-1 text-xs text-gray-400">로그인 시 추가 인증을 요구하여 보안을 강화합니다.</p>
          </div>
          <button
            onClick={handleToggle2FA}
            className={`relative h-6 w-11 rounded-full transition-colors ${security.two_factor_enabled ? 'bg-primary-600' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${security.two_factor_enabled ? 'translate-x-5' : ''}`} />
          </button>
        </div>
      </div>

      {/* Login Records */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <h2 className="mb-3 text-sm font-bold">로그인 기록</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs text-gray-400">
                <th className="pb-2 pr-4">일시</th>
                <th className="pb-2 pr-4">IP</th>
                <th className="pb-2 pr-4">기기</th>
                <th className="pb-2">위치</th>
              </tr>
            </thead>
            <tbody>
              {security.login_records.map((rec, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-2.5 pr-4 text-xs">{formatDateTime(rec.date)}</td>
                  <td className="py-2.5 pr-4 text-xs font-mono text-gray-500">{rec.ip}</td>
                  <td className="py-2.5 pr-4 text-xs">{rec.device}</td>
                  <td className="py-2.5 text-xs">{rec.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <h2 className="mb-3 text-sm font-bold">활성 세션</h2>
        <div className="space-y-3">
          {security.active_sessions.map((session) => (
            <div key={session.id} className="flex items-center gap-4 rounded-lg border border-gray-100 p-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{session.device}</p>
                  {session.is_current && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">현재 세션</span>
                  )}
                </div>
                <p className="text-xs text-gray-400">IP: {session.ip} · 마지막 활동: {formatDateTime(session.last_active)}</p>
              </div>
              {!session.is_current && (
                <button onClick={() => handleTerminateSession(session.id)} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100">종료</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { fetchStaffList, inviteStaff, updateStaffRole, updateStaffPermissions, toggleStaffActive, deleteStaff } from '@/api/settings'
import type { StaffWithUser } from '@/api/settings'
import type { StaffRole } from '@/types/database'
import { formatDateTime } from '@/utils/format'
import toast from 'react-hot-toast'

const ROLE_LABELS: Record<StaffRole, string> = {
  associate_agent: '소속 공인중개사',
  assistant: '중개보조원',
}

const ROLE_OPTIONS: { value: StaffRole; label: string }[] = [
  { value: 'associate_agent', label: '소속 공인중개사' },
  { value: 'assistant', label: '중개보조원' },
]

type PermissionKey =
  | 'property_create'
  | 'property_delete'
  | 'contract_create'
  | 'contract_approve'
  | 'e_signature'
  | 'customer_view'
  | 'ai_tools'
  | 'co_brokerage'
  | 'settings'

const PERMISSION_LABELS: { key: PermissionKey; label: string }[] = [
  { key: 'property_create', label: '매물등록' },
  { key: 'property_delete', label: '매물삭제' },
  { key: 'contract_create', label: '계약서생성' },
  { key: 'contract_approve', label: '계약서승인' },
  { key: 'e_signature', label: '전자서명' },
  { key: 'customer_view', label: '고객열람' },
  { key: 'ai_tools', label: 'AI도구' },
  { key: 'co_brokerage', label: '공동중개' },
  { key: 'settings', label: '환경설정' },
]

export function StaffSettingsPage() {
  const [staffList, setStaffList] = useState<StaffWithUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<StaffRole>('associate_agent')
  const [inviting, setInviting] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const loadStaff = async () => {
    setIsLoading(true)
    try {
      const data = await fetchStaffList()
      setStaffList(data)
    } catch {
      toast.error('소속원 목록을 불러오지 못했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadStaff()
  }, [])

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error('이메일을 입력해주세요.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail.trim())) {
      toast.error('올바른 이메일 형식을 입력해주세요.')
      return
    }
    setInviting(true)
    try {
      await inviteStaff(inviteEmail.trim(), inviteRole)
      toast.success('초대가 완료되었습니다.')
      setShowInviteModal(false)
      setInviteEmail('')
      setInviteRole('associate_agent')
      await loadStaff()
    } catch {
      toast.error('초대에 실패했습니다.')
    } finally {
      setInviting(false)
    }
  }

  const handleRoleChange = async (staffId: string, role: StaffRole) => {
    try {
      await updateStaffRole(staffId, role)
      toast.success('역할이 변경되었습니다.')
      await loadStaff()
    } catch {
      toast.error('역할 변경에 실패했습니다.')
    }
  }

  const handlePermissionToggle = async (staff: StaffWithUser, permKey: PermissionKey) => {
    const current = (staff.permissions as Record<string, boolean>) ?? {}
    const updated = { ...current, [permKey]: !current[permKey] }
    try {
      await updateStaffPermissions(staff.id, updated)
      setStaffList((prev) =>
        prev.map((s) => (s.id === staff.id ? { ...s, permissions: updated } : s)),
      )
      toast.success('권한이 변경되었습니다.')
    } catch {
      toast.error('권한 변경에 실패했습니다.')
    }
  }

  const handleToggleActive = async (staffId: string) => {
    try {
      await toggleStaffActive(staffId)
      toast.success('상태가 변경되었습니다.')
      await loadStaff()
    } catch {
      toast.error('상태 변경에 실패했습니다.')
    }
  }

  const handleDelete = async (staffId: string) => {
    try {
      await deleteStaff(staffId)
      toast.success('소속원이 삭제되었습니다.')
      setConfirmDeleteId(null)
      if (expandedId === staffId) setExpandedId(null)
      await loadStaff()
    } catch {
      toast.error('삭제에 실패했습니다.')
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">소속원 관리</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            사무소 소속원을 초대하고 역할/권한을 관리합니다.
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
        >
          소속원 초대
        </button>
      </div>

      {/* Staff List Card */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-sm text-gray-400">
            불러오는 중...
          </div>
        ) : staffList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-sm text-gray-400">
            <span className="mb-2 text-3xl">👥</span>
            <p>등록된 소속원이 없습니다.</p>
            <p className="mt-1 text-xs">위의 [소속원 초대] 버튼으로 초대해보세요.</p>
          </div>
        ) : (
          <>
            {/* Table Header (desktop) */}
            <div className="hidden border-b border-gray-100 px-5 py-3 text-xs font-medium text-gray-500 lg:grid lg:grid-cols-12 lg:gap-3">
              <div className="col-span-3">이름</div>
              <div className="col-span-2">역할</div>
              <div className="col-span-1 text-center">상태</div>
              <div className="col-span-3">이메일</div>
              <div className="col-span-2">마지막 접속</div>
              <div className="col-span-1 text-center">관리</div>
            </div>

            {/* Staff Rows */}
            {staffList.map((staff) => {
              const isExpanded = expandedId === staff.id
              const perms = (staff.permissions as Record<string, boolean>) ?? {}

              return (
                <div key={staff.id} className="border-b border-gray-50 last:border-b-0">
                  {/* Row */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : staff.id)}
                    className="cursor-pointer px-5 py-4 transition-colors hover:bg-gray-50 lg:grid lg:grid-cols-12 lg:items-center lg:gap-3"
                  >
                    {/* Name */}
                    <div className="col-span-3 flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                        {staff.display_name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{staff.display_name}</p>
                        <p className="text-xs text-gray-400 lg:hidden">{staff.email}</p>
                      </div>
                    </div>

                    {/* Role */}
                    <div className="col-span-2 mt-2 lg:mt-0">
                      <span className="inline-block rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                        {ROLE_LABELS[staff.role]}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="col-span-1 mt-2 text-center lg:mt-0">
                      {staff.is_active ? (
                        <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          활성
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                          비활성
                        </span>
                      )}
                    </div>

                    {/* Email */}
                    <div className="col-span-3 hidden text-sm text-gray-600 lg:block">
                      {staff.email}
                    </div>

                    {/* Last Login */}
                    <div className="col-span-2 hidden text-xs text-gray-400 lg:block">
                      {formatDateTime(staff.last_login)}
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 hidden items-center justify-center gap-1 lg:flex">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleActive(staff.id)
                        }}
                        title={staff.is_active ? '비활성화' : '활성화'}
                        className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                      >
                        {staff.is_active ? (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setConfirmDeleteId(staff.id)
                        }}
                        title="삭제"
                        className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Mobile action buttons */}
                  <div className="flex gap-2 px-5 pb-3 lg:hidden">
                    <button
                      onClick={() => handleToggleActive(staff.id)}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                        staff.is_active
                          ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          : 'bg-green-50 text-green-700 hover:bg-green-100'
                      }`}
                    >
                      {staff.is_active ? '비활성화' : '활성화'}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(staff.id)}
                      className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
                    >
                      삭제
                    </button>
                    <span className="ml-auto text-xs text-gray-400">
                      {formatDateTime(staff.last_login)}
                    </span>
                  </div>

                  {/* Expanded Permission Matrix */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4">
                      {/* Role selector */}
                      <div className="mb-4 flex flex-wrap items-center gap-3">
                        <label className="text-sm font-medium text-gray-700">역할 변경</label>
                        <select
                          value={staff.role}
                          onChange={(e) => handleRoleChange(staff.id, e.target.value as StaffRole)}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        >
                          {ROLE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Permission toggles */}
                      <div>
                        <p className="mb-3 text-sm font-medium text-gray-700">권한 커스터마이징</p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                          {PERMISSION_LABELS.map(({ key, label }) => {
                            const enabled = !!perms[key]
                            return (
                              <button
                                key={key}
                                onClick={() => handlePermissionToggle(staff, key)}
                                className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                                  enabled
                                    ? 'border-primary-200 bg-primary-50 text-primary-700'
                                    : 'border-gray-200 bg-white text-gray-500'
                                }`}
                              >
                                <span className="truncate font-medium">{label}</span>
                                <div
                                  className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                                    enabled ? 'bg-primary-600' : 'bg-gray-300'
                                  }`}
                                >
                                  <div
                                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                                      enabled ? 'translate-x-4' : 'translate-x-0.5'
                                    }`}
                                  />
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">소속원 초대</h3>
            <p className="mt-1 text-sm text-gray-500">
              이메일로 초대장을 발송합니다.
            </p>

            <div className="mt-5 space-y-4">
              {/* Email */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">이메일</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  autoFocus
                />
              </div>

              {/* Role */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">역할</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as StaffRole)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowInviteModal(false)
                  setInviteEmail('')
                  setInviteRole('associate_agent')
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleInvite}
                disabled={inviting}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
              >
                {inviting ? '초대 중...' : '초대하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">소속원 삭제</h3>
            <p className="mt-2 text-sm text-gray-600">
              정말 이 소속원을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { fetchOfficeSettings, updateOfficeSettings } from '@/api/settings'
import type { BusinessHours } from '@/api/settings'
import type { AgentProfile } from '@/types/database'
import toast from 'react-hot-toast'

const DAYS = ['월', '화', '수', '목', '금', '토', '일'] as const
const SPECIALTY_OPTIONS = ['아파트', '오피스텔', '빌라', '상가', '사무실', '전원주택', '공장', '창고', '토지', '건물', '지식산업센터'] as const

const defaultBusinessHours: BusinessHours = Object.fromEntries(
  DAYS.map((day) => [day, { open: '09:00', close: '18:00', isOpen: true }])
)

export function OfficeSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Basic info
  const [officeName, setOfficeName] = useState('')
  const [representative, setRepresentative] = useState('')
  const [businessNumber, setBusinessNumber] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [fax, setFax] = useState('')

  // Business hours
  const [businessHours, setBusinessHours] = useState<BusinessHours>(defaultBusinessHours)

  // Logo
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  // Description
  const [description, setDescription] = useState('')

  // Specialties (ordered)
  const [specialties, setSpecialties] = useState<string[]>([])

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      setLoading(true)
      const data: AgentProfile = await fetchOfficeSettings()
      setOfficeName(data.office_name)
      setRepresentative(data.representative)
      setBusinessNumber(data.business_number)
      setLicenseNumber(data.license_number)
      setAddress(data.address)
      setPhone(data.phone)
      setFax(data.fax ?? '')
      setBusinessHours((data.business_hours as BusinessHours) ?? defaultBusinessHours)
      setLogoUrl(data.logo_url)
      setDescription(data.description ?? '')
      setSpecialties(data.specialties ?? [])
    } catch {
      toast.error('설정을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    try {
      setSaving(true)
      await updateOfficeSettings({
        office_name: officeName,
        representative,
        business_number: businessNumber,
        license_number: licenseNumber,
        address,
        phone,
        fax: fax || null,
        business_hours: businessHours as unknown as Record<string, unknown>,
        logo_url: logoUrl,
        description: description || null,
        specialties,
        insurance_info: null,
      })
      toast.success('저장되었습니다.')
    } catch {
      toast.error('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  function handleBusinessHoursChange(day: string, field: 'open' | 'close', value: string) {
    setBusinessHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }))
  }

  function handleBusinessHoursToggle(day: string) {
    setBusinessHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], isOpen: !prev[day].isOpen },
    }))
  }

  function handleSpecialtyToggle(specialty: string) {
    setSpecialties((prev) =>
      prev.includes(specialty) ? prev.filter((s) => s !== specialty) : [...prev, specialty]
    )
  }

  function handleSpecialtyMove(index: number, direction: 'up' | 'down') {
    setSpecialties((prev) => {
      const next = [...prev]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= next.length) return prev
      ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">사무소 정보</h2>
          <p className="mt-0.5 text-sm text-gray-500">중개사무소 기본 정보를 관리합니다.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-primary-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>

      {/* Basic Info Card */}
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">기본 정보</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">사무소명</label>
            <input
              type="text"
              value={officeName}
              onChange={(e) => setOfficeName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              placeholder="사무소명을 입력하세요"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">대표자명</label>
            <input
              type="text"
              value={representative}
              onChange={(e) => setRepresentative(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              placeholder="대표자명을 입력하세요"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">사업자등록번호</label>
            <input
              type="text"
              value={businessNumber}
              onChange={(e) => setBusinessNumber(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              placeholder="000-00-00000"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">공인중개사등록번호</label>
            <input
              type="text"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              placeholder="제0000-서울강남-00000호"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">주소</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              placeholder="사무소 주소를 입력하세요"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">연락처</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              placeholder="02-0000-0000"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">팩스</label>
            <input
              type="text"
              value={fax}
              onChange={(e) => setFax(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              placeholder="02-0000-0000"
            />
          </div>
        </div>
      </div>

      {/* Business Hours Card */}
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">영업시간</h3>
        <div className="space-y-3">
          {DAYS.map((day) => {
            const hours = businessHours[day] ?? { open: '09:00', close: '18:00', isOpen: true }
            return (
              <div key={day} className="flex items-center gap-3">
                <span className="w-8 shrink-0 text-center text-sm font-medium text-gray-700">
                  {day}
                </span>
                <button
                  type="button"
                  onClick={() => handleBusinessHoursToggle(day)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                    hours.isOpen ? 'bg-primary-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      hours.isOpen ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="w-12 shrink-0 text-xs text-gray-500">
                  {hours.isOpen ? '영업' : '휴무'}
                </span>
                {hours.isOpen ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={hours.open}
                      onChange={(e) => handleBusinessHoursChange(day, 'open', e.target.value)}
                      className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    />
                    <span className="text-sm text-gray-400">~</span>
                    <input
                      type="time"
                      value={hours.close}
                      onChange={(e) => handleBusinessHoursChange(day, 'close', e.target.value)}
                      className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">-</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Logo Upload Card */}
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">사무소 로고</h3>
        <div className="flex items-center gap-6">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50">
            {logoUrl ? (
              <img src={logoUrl} alt="사무소 로고" className="h-full w-full rounded-xl object-contain" />
            ) : (
              <span className="text-3xl text-gray-300">🏢</span>
            )}
          </div>
          <div>
            <button
              type="button"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              이미지 업로드
            </button>
            <p className="mt-2 text-xs text-gray-400">
              PNG, JPG 파일 (최대 2MB). Supabase Storage에 저장됩니다.
            </p>
          </div>
        </div>
      </div>

      {/* Description Card */}
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">소개글</h3>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
          placeholder="사무소 소개글을 입력하세요. 고객에게 공개됩니다."
        />
        <p className="mt-1 text-xs text-gray-400">{description.length}자</p>
      </div>

      {/* Specialties Card */}
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">전문 분야</h3>
        <p className="mb-3 text-sm text-gray-500">취급하는 부동산 유형을 선택하세요. 선택한 항목은 사용자 포털 메인에 표시됩니다.</p>

        {/* Selection */}
        <div className="flex flex-wrap gap-2">
          {SPECIALTY_OPTIONS.map((option) => {
            const isSelected = specialties.includes(option)
            return (
              <button
                key={option}
                type="button"
                onClick={() => handleSpecialtyToggle(option)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isSelected
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {option}
              </button>
            )
          })}
        </div>

        {/* Selected order */}
        {specialties.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-gray-500">표시 순서 (위/아래 버튼으로 변경)</p>
            <div className="space-y-1.5">
              {specialties.map((item, index) => (
                <div
                  key={item}
                  className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 ring-1 ring-gray-200"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary-100 text-xs font-bold text-primary-700">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium text-gray-800">{item}</span>
                  <button
                    type="button"
                    onClick={() => handleSpecialtyMove(index, 'up')}
                    disabled={index === 0}
                    className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 disabled:opacity-30 disabled:hover:bg-transparent"
                    title="위로"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSpecialtyMove(index, 'down')}
                    disabled={index === specialties.length - 1}
                    className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 disabled:opacity-30 disabled:hover:bg-transparent"
                    title="아래로"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSpecialtyToggle(item)}
                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    title="삭제"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Save Button */}
      <div className="flex justify-end pb-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  )
}

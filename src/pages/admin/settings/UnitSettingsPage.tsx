import { useState, useEffect } from 'react'
import { fetchUnitSettings, updateUnitSettings } from '@/api/settings'
import type { UnitSettings } from '@/api/settings'
import toast from 'react-hot-toast'

export function UnitSettingsPage() {
  const [settings, setSettings] = useState<UnitSettings | null>(null)

  useEffect(() => {
    fetchUnitSettings().then(setSettings)
  }, [])

  if (!settings) return <div className="flex h-40 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>

  const handleSave = async () => {
    await updateUnitSettings(settings)
    toast.success('저장되었습니다.')
  }

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!checked)} className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-primary-600' : 'bg-gray-300'}`}>
      <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  )

  const Radio = ({ value, current, onChange, label }: { value: string; current: string; onChange: (v: string) => void; label: string }) => (
    <label className="flex cursor-pointer items-center gap-2">
      <input type="radio" checked={current === value} onChange={() => onChange(value)} className="h-4 w-4 text-primary-600" />
      <span className="text-sm">{label}</span>
    </label>
  )

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <h2 className="text-sm font-bold">기본 단위 설정</h2>
        <p className="mt-1 text-xs text-gray-400">매물 정보 표시에 사용할 기본 단위를 설정합니다.</p>

        <div className="mt-6 space-y-6 divide-y divide-gray-100">
          {/* Area */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">면적</h3>
            <div className="flex gap-6">
              <Radio value="sqm" current={settings.area_unit} onChange={(v) => setSettings({ ...settings, area_unit: v as 'sqm' | 'pyeong' })} label="㎡ (제곱미터)" />
              <Radio value="pyeong" current={settings.area_unit} onChange={(v) => setSettings({ ...settings, area_unit: v as 'sqm' | 'pyeong' })} label="평" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">병행 표시 (예: 84.97㎡ / 25.7평)</span>
              <Toggle checked={settings.area_dual_display} onChange={(v) => setSettings({ ...settings, area_dual_display: v })} />
            </div>
          </div>

          {/* Price */}
          <div className="space-y-3 pt-6">
            <h3 className="text-sm font-medium text-gray-700">금액</h3>
            <div className="flex gap-6">
              <Radio value="man" current={settings.price_unit} onChange={(v) => setSettings({ ...settings, price_unit: v as 'man' | 'eok' })} label="만원" />
              <Radio value="eok" current={settings.price_unit} onChange={(v) => setSettings({ ...settings, price_unit: v as 'man' | 'eok' })} label="억원" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">자동 단위 전환 (1억 이상 시 억원 표시)</span>
              <Toggle checked={settings.price_auto_convert} onChange={(v) => setSettings({ ...settings, price_auto_convert: v })} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">천단위 구분자 (1,000)</span>
              <Toggle checked={settings.price_separator} onChange={(v) => setSettings({ ...settings, price_separator: v })} />
            </div>
          </div>

          {/* Distance */}
          <div className="space-y-3 pt-6">
            <h3 className="text-sm font-medium text-gray-700">거리</h3>
            <div className="flex gap-6">
              <Radio value="m" current={settings.distance_unit} onChange={(v) => setSettings({ ...settings, distance_unit: v as 'm' | 'km' })} label="m (미터)" />
              <Radio value="km" current={settings.distance_unit} onChange={(v) => setSettings({ ...settings, distance_unit: v as 'm' | 'km' })} label="km (킬로미터)" />
            </div>
          </div>

          {/* Date/Time */}
          <div className="space-y-3 pt-6">
            <h3 className="text-sm font-medium text-gray-700">날짜 형식</h3>
            <div className="flex flex-wrap gap-4">
              <Radio value="YYYY.MM.DD" current={settings.date_format} onChange={(v) => setSettings({ ...settings, date_format: v as UnitSettings['date_format'] })} label="2026.02.18" />
              <Radio value="YYYY-MM-DD" current={settings.date_format} onChange={(v) => setSettings({ ...settings, date_format: v as UnitSettings['date_format'] })} label="2026-02-18" />
              <Radio value="MM/DD/YYYY" current={settings.date_format} onChange={(v) => setSettings({ ...settings, date_format: v as UnitSettings['date_format'] })} label="02/18/2026" />
            </div>
          </div>

          <div className="space-y-3 pt-6">
            <h3 className="text-sm font-medium text-gray-700">시간 형식</h3>
            <div className="flex gap-6">
              <Radio value="24h" current={settings.time_format} onChange={(v) => setSettings({ ...settings, time_format: v as '24h' | '12h' })} label="24시간 (14:30)" />
              <Radio value="12h" current={settings.time_format} onChange={(v) => setSettings({ ...settings, time_format: v as '24h' | '12h' })} label="12시간 (오후 2:30)" />
            </div>
          </div>
        </div>
      </div>

      <button onClick={handleSave} className="w-full rounded-lg bg-primary-600 py-3 text-sm font-medium text-white hover:bg-primary-700">저장</button>
    </div>
  )
}

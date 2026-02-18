import { useState, useEffect } from 'react'
import { fetchFloatingSettings, updateFloatingSettings } from '@/api/settings'
import type { FloatingSettings } from '@/api/settings'
import toast from 'react-hot-toast'

export function FloatingSettingsPage() {
  const [settings, setSettings] = useState<FloatingSettings | null>(null)

  useEffect(() => {
    fetchFloatingSettings().then(setSettings)
  }, [])

  if (!settings) return <div className="flex h-40 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>

  const moveButton = (idx: number, dir: -1 | 1) => {
    const btns = [...settings.buttons]
    const targetIdx = idx + dir
    if (targetIdx < 0 || targetIdx >= btns.length) return
    const tmpOrder = btns[idx].sort_order
    btns[idx] = { ...btns[idx], sort_order: btns[targetIdx].sort_order }
    btns[targetIdx] = { ...btns[targetIdx], sort_order: tmpOrder }
    setSettings({ ...settings, buttons: btns.sort((a, b) => a.sort_order - b.sort_order) })
  }

  const updateButton = (key: string, data: Record<string, unknown>) => {
    setSettings({
      ...settings,
      buttons: settings.buttons.map((b) => b.key === key ? { ...b, ...data } : b),
    })
  }

  const handleSave = async () => {
    await updateFloatingSettings(settings)
    toast.success('저장되었습니다.')
  }

  return (
    <div className="space-y-5">
      {/* Button List */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <h2 className="text-sm font-bold">플로팅 버튼 설정</h2>
        <p className="mt-1 text-xs text-gray-400">사용자 포털에 표시할 플로팅 버튼을 설정합니다.</p>

        <div className="mt-4 space-y-3">
          {settings.buttons.sort((a, b) => a.sort_order - b.sort_order).map((btn, idx) => (
            <div key={btn.key} className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <button onClick={() => moveButton(idx, -1)} disabled={idx === 0} className="rounded p-1 text-xs text-gray-400 hover:bg-gray-100 disabled:opacity-30">▲</button>
                  <button onClick={() => moveButton(idx, 1)} disabled={idx === settings.buttons.length - 1} className="rounded p-1 text-xs text-gray-400 hover:bg-gray-100 disabled:opacity-30">▼</button>
                </div>
                <span className="text-lg">{btn.icon}</span>
                <span className="flex-1 text-sm font-medium">{btn.label}</span>
                <button
                  onClick={() => updateButton(btn.key, { is_enabled: !btn.is_enabled })}
                  className={`relative h-6 w-11 rounded-full transition-colors ${btn.is_enabled ? 'bg-primary-600' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${btn.is_enabled ? 'translate-x-5' : ''}`} />
                </button>
              </div>

              {btn.is_enabled && (
                <div className="mt-3 pl-14">
                  {btn.key === 'kakao' && (
                    <div>
                      <label className="mb-1 block text-xs text-gray-400">카카오 채널 URL</label>
                      <input type="text" value={btn.url || ''} onChange={(e) => updateButton(btn.key, { url: e.target.value })} placeholder="https://pf.kakao.com/..." className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                    </div>
                  )}
                  {btn.key === 'naver' && (
                    <div>
                      <label className="mb-1 block text-xs text-gray-400">네이버 예약 URL</label>
                      <input type="text" value={btn.url || ''} onChange={(e) => updateButton(btn.key, { url: e.target.value })} placeholder="https://booking.naver.com/..." className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                    </div>
                  )}
                  {btn.key === 'phone' && (
                    <div>
                      <label className="mb-1 block text-xs text-gray-400">사무소 대표번호</label>
                      <input type="text" value={btn.phone || ''} onChange={(e) => updateButton(btn.key, { phone: e.target.value })} placeholder="02-1234-5678" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* FAB Color */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <h2 className="text-sm font-bold">FAB 색상</h2>
        <div className="mt-3 flex items-center gap-4">
          <div className="h-10 w-10 rounded-full shadow-sm" style={{ backgroundColor: settings.fab_color }} />
          <input type="text" value={settings.fab_color} onChange={(e) => setSettings({ ...settings, fab_color: e.target.value })} className="w-32 rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="#4F46E5" />
          <div className="flex gap-2">
            {['#4F46E5', '#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED'].map((c) => (
              <button key={c} onClick={() => setSettings({ ...settings, fab_color: c })} className="h-7 w-7 rounded-full ring-2 ring-transparent hover:ring-gray-300" style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <h2 className="mb-3 text-sm font-bold">미리보기</h2>
        <div className="relative h-48 rounded-lg bg-gray-100">
          <div className="absolute right-4 bottom-4 flex flex-col items-end gap-2">
            {settings.buttons.filter((b) => b.is_enabled).sort((a, b) => a.sort_order - b.sort_order).map((btn) => (
              <div key={btn.key} className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-medium shadow-md">
                <span>{btn.icon}</span>
                <span>{btn.label}</span>
              </div>
            ))}
            <div className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg" style={{ backgroundColor: settings.fab_color }}>
              <span className="text-xl">+</span>
            </div>
          </div>
        </div>
      </div>

      <button onClick={handleSave} className="w-full rounded-lg bg-primary-600 py-3 text-sm font-medium text-white hover:bg-primary-700">저장</button>
    </div>
  )
}

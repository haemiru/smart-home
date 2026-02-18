import { useState, useEffect } from 'react'
import { fetchSearchSettings, updateSearchSettings } from '@/api/settings'
import type { SearchSettings } from '@/api/settings'
import toast from 'react-hot-toast'

const sortLabels: Record<string, string> = {
  newest: '최신순',
  price_asc: '가격 낮은순',
  price_desc: '가격 높은순',
  area_desc: '면적 넓은순',
  popular: '인기순',
}

export function SearchSettingsPage() {
  const [settings, setSettings] = useState<SearchSettings | null>(null)

  useEffect(() => {
    fetchSearchSettings().then(setSettings)
  }, [])

  if (!settings) return <div className="flex h-40 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>

  const moveItem = <T extends { sort_order: number }>(list: T[], idx: number, dir: -1 | 1): T[] => {
    const arr = [...list]
    const targetIdx = idx + dir
    if (targetIdx < 0 || targetIdx >= arr.length) return arr
    const tmp = arr[idx].sort_order
    arr[idx] = { ...arr[idx], sort_order: arr[targetIdx].sort_order }
    arr[targetIdx] = { ...arr[targetIdx], sort_order: tmp }
    return arr.sort((a, b) => a.sort_order - b.sort_order)
  }

  const handleSave = async () => {
    await updateSearchSettings(settings)
    toast.success('저장되었습니다.')
  }

  return (
    <div className="space-y-5">
      {/* Filter Groups */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <h2 className="text-sm font-bold">사이드 필터 설정</h2>
        <p className="mt-1 text-xs text-gray-400">검색 페이지에 표시할 필터 그룹과 순서를 설정합니다.</p>
        <div className="mt-4 space-y-2">
          {settings.filter_groups.sort((a, b) => a.sort_order - b.sort_order).map((fg, idx) => (
            <div key={fg.key} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3">
              <div className="flex gap-1">
                <button onClick={() => setSettings({ ...settings, filter_groups: moveItem(settings.filter_groups, idx, -1) })} disabled={idx === 0} className="rounded p-1 text-xs text-gray-400 hover:bg-gray-100 disabled:opacity-30">▲</button>
                <button onClick={() => setSettings({ ...settings, filter_groups: moveItem(settings.filter_groups, idx, 1) })} disabled={idx === settings.filter_groups.length - 1} className="rounded p-1 text-xs text-gray-400 hover:bg-gray-100 disabled:opacity-30">▼</button>
              </div>
              <span className="flex-1 text-sm">{fg.label}</span>
              <button
                onClick={() => {
                  const updated = settings.filter_groups.map((f) => f.key === fg.key ? { ...f, is_enabled: !f.is_enabled } : f)
                  setSettings({ ...settings, filter_groups: updated })
                }}
                className={`relative h-6 w-11 rounded-full transition-colors ${fg.is_enabled ? 'bg-primary-600' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${fg.is_enabled ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Search Cards */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <h2 className="text-sm font-bold">원클릭 조건 카드</h2>
        <p className="mt-1 text-xs text-gray-400">홈페이지에 표시할 빠른 검색 조건 카드를 설정합니다.</p>
        <div className="mt-4 space-y-2">
          {settings.quick_cards.sort((a, b) => a.sort_order - b.sort_order).map((card, idx) => (
            <div key={card.key} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3">
              <div className="flex gap-1">
                <button onClick={() => setSettings({ ...settings, quick_cards: moveItem(settings.quick_cards, idx, -1) })} disabled={idx === 0} className="rounded p-1 text-xs text-gray-400 hover:bg-gray-100 disabled:opacity-30">▲</button>
                <button onClick={() => setSettings({ ...settings, quick_cards: moveItem(settings.quick_cards, idx, 1) })} disabled={idx === settings.quick_cards.length - 1} className="rounded p-1 text-xs text-gray-400 hover:bg-gray-100 disabled:opacity-30">▼</button>
              </div>
              <span className="text-base">{card.icon}</span>
              <span className="flex-1 text-sm">{card.label}</span>
              <button
                onClick={() => {
                  const updated = settings.quick_cards.map((c) => c.key === card.key ? { ...c, is_enabled: !c.is_enabled } : c)
                  setSettings({ ...settings, quick_cards: updated })
                }}
                className={`relative h-6 w-11 rounded-full transition-colors ${card.is_enabled ? 'bg-primary-600' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${card.is_enabled ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Result Settings */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <h2 className="text-sm font-bold">검색 결과 설정</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs text-gray-400">기본 정렬</label>
            <select value={settings.default_sort} onChange={(e) => setSettings({ ...settings, default_sort: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
              {Object.entries(sortLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">페이지당 건수</label>
            <select value={settings.items_per_page} onChange={(e) => setSettings({ ...settings, items_per_page: Number(e.target.value) })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
              {[12, 24, 36].map((n) => <option key={n} value={n}>{n}건</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">기본 뷰 모드</label>
            <div className="flex gap-2">
              {(['grid', 'list'] as const).map((mode) => (
                <button key={mode} onClick={() => setSettings({ ...settings, default_view: mode })} className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${settings.default_view === mode ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {mode === 'grid' ? '그리드' : '리스트'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <button onClick={handleSave} className="w-full rounded-lg bg-primary-600 py-3 text-sm font-medium text-white hover:bg-primary-700">저장</button>
    </div>
  )
}

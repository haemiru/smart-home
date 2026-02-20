import { useState, useEffect } from 'react'
import { fetchSearchSettings, updateSearchSettings, fetchRegionSettings, updateRegionSettings } from '@/api/settings'
import type { SearchSettings, QuickSearchCard, RegionSetting } from '@/api/settings'
import { useCategories } from '@/hooks/useCategories'
import toast from 'react-hot-toast'

const sortLabels: Record<string, string> = {
  newest: '최신순',
  price_asc: '가격 낮은순',
  price_desc: '가격 높은순',
  area_desc: '면적 넓은순',
  popular: '인기순',
}

function CategoryBadges({ categories }: { categories?: string[] }) {
  if (!categories || categories.length === 0) {
    return <span className="text-[11px] text-gray-400">모든 카테고리</span>
  }
  return (
    <div className="flex flex-wrap gap-1">
      {categories.map((c) => (
        <span
          key={c}
          className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500"
        >
          {c}
        </span>
      ))}
    </div>
  )
}

export function SearchSettingsPage() {
  const [settings, setSettings] = useState<SearchSettings | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [regions, setRegions] = useState<RegionSetting[]>([])
  const [regionSaving, setRegionSaving] = useState(false)

  useEffect(() => {
    fetchSearchSettings().then(setSettings)
    fetchRegionSettings().then(setRegions).catch(() => setRegions([]))
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

  const handleAddCustomCard = (card: QuickSearchCard) => {
    setSettings({ ...settings, quick_cards: [...settings.quick_cards, card] })
    setShowAddModal(false)
    toast.success('커스텀 조건이 추가되었습니다. 저장 버튼을 눌러 반영하세요.')
  }

  const handleDeleteCustomCard = (key: string) => {
    setSettings({ ...settings, quick_cards: settings.quick_cards.filter((c) => c.key !== key) })
  }

  const handleSave = async () => {
    await updateSearchSettings(settings)
    toast.success('저장되었습니다.')
  }

  const handleRegionChange = (index: number, value: string) => {
    setRegions(regions.map((r, i) => i === index ? { name: value } : r))
  }

  const handleAddRegion = () => {
    if (regions.length >= 4) {
      toast.error('최대 4개까지 추가할 수 있습니다.')
      return
    }
    setRegions([...regions, { name: '' }])
  }

  const handleDeleteRegion = (index: number) => {
    setRegions(regions.filter((_, i) => i !== index))
  }

  const handleSaveRegions = async () => {
    const valid = regions.filter((r) => r.name.trim())
    setRegionSaving(true)
    try {
      await updateRegionSettings(valid)
      setRegions(valid)
      toast.success('지역 설정이 저장되었습니다.')
    } catch {
      toast.error('저장에 실패했습니다.')
    } finally {
      setRegionSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Region Settings */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold">지역별 인기매물 지역 설정</h2>
            <p className="mt-1 text-xs text-gray-400">사용자 포털에 표시할 지역을 설정합니다 (최대 4개)</p>
          </div>
          <button
            onClick={handleSaveRegions}
            disabled={regionSaving}
            className="rounded-lg bg-primary-600 px-4 py-2 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {regionSaving ? '저장 중...' : '저장'}
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {regions.map((region, idx) => (
            <div key={idx} className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 pl-3 pr-1">
              <input
                type="text"
                value={region.name}
                onChange={(e) => handleRegionChange(idx, e.target.value)}
                placeholder={`지역 ${idx + 1}`}
                className="w-28 border-none bg-transparent py-2 text-sm focus:outline-none"
              />
              <button
                onClick={() => handleDeleteRegion(idx)}
                className="rounded p-1 text-gray-400 hover:text-red-500"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
          {regions.length < 4 && (
            <button
              onClick={handleAddRegion}
              className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-xs font-medium text-gray-500 hover:border-primary-400 hover:text-primary-600"
            >
              + 추가
            </button>
          )}
        </div>
      </div>

      {/* Filter Groups */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <h2 className="text-sm font-bold">사이드 필터 설정</h2>
        <p className="mt-1 text-xs text-gray-400">검색 페이지에 표시할 필터 그룹과 순서를 설정합니다.</p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {settings.filter_groups.sort((a, b) => a.sort_order - b.sort_order).map((fg, idx) => (
            <div key={fg.key} className={`rounded-lg border p-3 ${fg.is_enabled ? 'border-primary-200 bg-primary-50/30' : 'border-gray-100'}`}>
              <div className="flex items-center justify-between">
                <div className="flex gap-0.5">
                  <button onClick={() => setSettings({ ...settings, filter_groups: moveItem(settings.filter_groups, idx, -1) })} disabled={idx === 0} className="rounded p-0.5 text-[10px] text-gray-400 hover:bg-gray-100 disabled:opacity-30">▲</button>
                  <button onClick={() => setSettings({ ...settings, filter_groups: moveItem(settings.filter_groups, idx, 1) })} disabled={idx === settings.filter_groups.length - 1} className="rounded p-0.5 text-[10px] text-gray-400 hover:bg-gray-100 disabled:opacity-30">▼</button>
                </div>
                <button
                  onClick={() => {
                    const updated = settings.filter_groups.map((f) => f.key === fg.key ? { ...f, is_enabled: !f.is_enabled } : f)
                    setSettings({ ...settings, filter_groups: updated })
                  }}
                  className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${fg.is_enabled ? 'bg-primary-600' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${fg.is_enabled ? 'translate-x-4' : ''}`} />
                </button>
              </div>
              <p className="mt-2 text-sm font-medium">{fg.label}</p>
              <div className="mt-1">
                <CategoryBadges categories={fg.categories} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Search Cards */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold">원클릭 조건 카드</h2>
            <p className="mt-1 text-xs text-gray-400">홈페이지에 표시할 빠른 검색 조건 카드를 설정합니다.</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-100"
          >
            + 조건 추가
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {settings.quick_cards.sort((a, b) => a.sort_order - b.sort_order).map((card, idx) => (
            <div key={card.key} className={`rounded-lg border p-3 ${card.is_enabled ? 'border-primary-200 bg-primary-50/30' : 'border-gray-100'}`}>
              <div className="flex items-center justify-between">
                <div className="flex gap-0.5">
                  <button onClick={() => setSettings({ ...settings, quick_cards: moveItem(settings.quick_cards, idx, -1) })} disabled={idx === 0} className="rounded p-0.5 text-[10px] text-gray-400 hover:bg-gray-100 disabled:opacity-30">▲</button>
                  <button onClick={() => setSettings({ ...settings, quick_cards: moveItem(settings.quick_cards, idx, 1) })} disabled={idx === settings.quick_cards.length - 1} className="rounded p-0.5 text-[10px] text-gray-400 hover:bg-gray-100 disabled:opacity-30">▼</button>
                </div>
                <div className="flex items-center gap-1">
                  {card.is_custom && (
                    <button
                      onClick={() => handleDeleteCustomCard(card.key)}
                      className="rounded p-0.5 text-xs text-gray-400 hover:bg-red-50 hover:text-red-500"
                      title="삭제"
                    >
                      🗑️
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const updated = settings.quick_cards.map((c) => c.key === card.key ? { ...c, is_enabled: !c.is_enabled } : c)
                      setSettings({ ...settings, quick_cards: updated })
                    }}
                    className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${card.is_enabled ? 'bg-primary-600' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${card.is_enabled ? 'translate-x-4' : ''}`} />
                  </button>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xl">{card.icon}</span>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">{card.label}</span>
                    {card.is_custom && (
                      <span className="rounded bg-violet-100 px-1 py-0.5 text-[9px] font-medium text-violet-600">커스텀</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-1">
                <CategoryBadges categories={card.categories} />
              </div>
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

      {showAddModal && (
        <AddQuickCardModal
          existingCards={settings.quick_cards}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddCustomCard}
        />
      )}
    </div>
  )
}

// ──────────────────────────────────────────
// Add Custom Quick Card Modal
// ──────────────────────────────────────────

function AddQuickCardModal({
  existingCards,
  onClose,
  onAdd,
}: {
  existingCards: QuickSearchCard[]
  onClose: () => void
  onAdd: (card: QuickSearchCard) => void
}) {
  const [label, setLabel] = useState('')
  const [icon, setIcon] = useState('')
  const [description, setDescription] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const { categories } = useCategories()

  const toggleCategory = (name: string) => {
    setSelectedCategories((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name],
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim()) {
      toast.error('라벨을 입력해주세요.')
      return
    }
    if (!icon.trim()) {
      toast.error('아이콘(이모지)을 입력해주세요.')
      return
    }
    if (!description.trim()) {
      toast.error('설명을 입력해주세요.')
      return
    }

    const maxOrder = existingCards.reduce((max, c) => Math.max(max, c.sort_order), 0)

    const card: QuickSearchCard = {
      key: `custom_${Date.now()}`,
      label: label.trim(),
      icon: icon.trim(),
      description: description.trim(),
      is_enabled: true,
      sort_order: maxOrder + 1,
      conditions: {},
      is_custom: true,
      categories: selectedCategories.length > 0 ? selectedCategories : undefined,
    }

    onAdd(card)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="border-b border-gray-100 px-6 py-4">
          <h3 className="text-base font-bold text-gray-900">커스텀 조건 추가</h3>
          <p className="mt-0.5 text-xs text-gray-500">사무소 맞춤 원클릭 검색 조건을 추가합니다.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {/* Label */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">라벨</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="예: 풀옵션"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          {/* Icon */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">아이콘 (이모지)</label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="이모지 입력 (예: ✨)"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              />
              {icon && <span className="text-2xl">{icon}</span>}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">설명</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="예: 에어컨·냉장고·세탁기 포함"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          {/* Categories */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">적용 카테고리</label>
            <p className="mb-2 text-[11px] text-gray-400">미선택 시 모든 카테고리에 표시됩니다.</p>
            <div className="flex flex-wrap gap-2">
              {categories.filter((c) => c.is_active).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.name)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    selectedCategories.includes(cat.name)
                      ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">미리보기</label>
            <div className="flex justify-center rounded-lg bg-gray-50 p-4">
              <div className="flex w-28 flex-col items-center gap-2 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
                <span className="text-3xl">{icon || '❓'}</span>
                <span className="text-sm font-medium text-gray-800">{label || '라벨'}</span>
                <span className="text-center text-[11px] text-gray-400">{description || '설명'}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg bg-gray-100 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-200"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-primary-600 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
            >
              추가
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

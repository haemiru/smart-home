import { useState, useEffect } from 'react'
import { fetchSettingsCategories, toggleCategory, reorderCategories, addCustomCategory } from '@/api/settings'
import type { PropertyCategory } from '@/types/database'
import toast from 'react-hot-toast'

type CategoryType = '주거' | '상업' | '산업' | '토지' | '건물' | '커스텀'

const TYPE_GROUPS: { type: CategoryType; label: string; icon: string; names: string[] }[] = [
  {
    type: '주거',
    label: '주거',
    icon: '🏠',
    names: ['아파트', '오피스텔(주거)', '빌라', '단독/다가구', '원룸/투룸', '도시형', '주상복합'],
  },
  {
    type: '상업',
    label: '상업',
    icon: '🏪',
    names: ['상가(일반)', '단지내상가', '사무실', '오피스텔(업무)', '지식산업센터'],
  },
  {
    type: '산업',
    label: '산업',
    icon: '🏭',
    names: ['공장', '창고'],
  },
  {
    type: '토지',
    label: '토지',
    icon: '🌍',
    names: ['대지', '임야', '농지'],
  },
  {
    type: '건물',
    label: '건물',
    icon: '🏦',
    names: ['건물(통매매)', '숙박/펜션'],
  },
]

export function CategorySettingsPage() {
  const [categories, setCategories] = useState<PropertyCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)

  const loadCategories = async () => {
    try {
      const data = await fetchSettingsCategories()
      setCategories(data)
    } catch {
      toast.error('카테고리 목록을 불러오지 못했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const handleToggle = async (id: string, currentActive: boolean) => {
    setSavingId(id)
    try {
      await toggleCategory(id, !currentActive)
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_active: !currentActive } : c))
      )
      toast.success(!currentActive ? '카테고리를 활성화했습니다.' : '카테고리를 비활성화했습니다.')
    } catch {
      toast.error('변경에 실패했습니다.')
    } finally {
      setSavingId(null)
    }
  }

  const handleMoveUp = async (cat: PropertyCategory) => {
    const sorted = [...categories].sort((a, b) => a.sort_order - b.sort_order)
    const idx = sorted.findIndex((c) => c.id === cat.id)
    if (idx <= 0) return

    const prev = sorted[idx - 1]
    const newOrder = sorted.map((c) => {
      if (c.id === cat.id) return { ...c, sort_order: prev.sort_order }
      if (c.id === prev.id) return { ...c, sort_order: cat.sort_order }
      return c
    })
    newOrder.sort((a, b) => a.sort_order - b.sort_order)

    setCategories(newOrder)
    try {
      await reorderCategories(newOrder.map((c) => c.id))
      toast.success('순서가 변경되었습니다.')
    } catch {
      toast.error('순서 변경에 실패했습니다.')
      loadCategories()
    }
  }

  const handleMoveDown = async (cat: PropertyCategory) => {
    const sorted = [...categories].sort((a, b) => a.sort_order - b.sort_order)
    const idx = sorted.findIndex((c) => c.id === cat.id)
    if (idx >= sorted.length - 1) return

    const next = sorted[idx + 1]
    const newOrder = sorted.map((c) => {
      if (c.id === cat.id) return { ...c, sort_order: next.sort_order }
      if (c.id === next.id) return { ...c, sort_order: cat.sort_order }
      return c
    })
    newOrder.sort((a, b) => a.sort_order - b.sort_order)

    setCategories(newOrder)
    try {
      await reorderCategories(newOrder.map((c) => c.id))
      toast.success('순서가 변경되었습니다.')
    } catch {
      toast.error('순서 변경에 실패했습니다.')
      loadCategories()
    }
  }

  const handleAddCustom = async (data: { name: string; icon: string; color: string }) => {
    try {
      const newCat = await addCustomCategory(data)
      setCategories((prev) => [...prev, newCat])
      setShowAddModal(false)
      toast.success(`"${data.name}" 카테고리가 추가되었습니다.`)
    } catch {
      toast.error('카테고리 추가에 실패했습니다.')
    }
  }

  // Group categories by type
  const grouped: { type: CategoryType; label: string; icon: string; items: PropertyCategory[] }[] =
    TYPE_GROUPS.map((g) => ({
      type: g.type,
      label: g.label,
      icon: g.icon,
      items: categories
        .filter((c) => c.is_system && g.names.includes(c.name))
        .sort((a, b) => a.sort_order - b.sort_order),
    }))

  const customCategories = categories
    .filter((c) => !c.is_system)
    .sort((a, b) => a.sort_order - b.sort_order)

  if (customCategories.length > 0) {
    grouped.push({
      type: '커스텀',
      label: '커스텀',
      icon: '🎨',
      items: customCategories,
    })
  }

  const sorted = [...categories].sort((a, b) => a.sort_order - b.sort_order)
  const activeCount = categories.filter((c) => c.is_active).length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">매물 카테고리</h2>
          <p className="mt-1 text-sm text-gray-500">
            사용할 매물 카테고리를 ON/OFF하고 표시 순서를 관리합니다.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          커스텀 카테고리 추가
        </button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
          <p className="text-xs text-gray-400">전체 카테고리</p>
          <p className="mt-1 text-2xl font-bold text-gray-800">{categories.length}개</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
          <p className="text-xs text-gray-400">활성화</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{activeCount}개</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
          <p className="text-xs text-gray-400">커스텀</p>
          <p className="mt-1 text-2xl font-bold text-purple-600">{customCategories.length}개</p>
        </div>
      </div>

      {/* Category Groups */}
      <div className="space-y-6">
        {grouped.map((group) => {
          if (group.items.length === 0) return null
          return (
            <div key={group.type} className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
              {/* Section Header */}
              <div className="border-b border-gray-100 px-5 py-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <span>{group.icon}</span>
                  <span>{group.label}</span>
                  <span className="ml-1 text-xs font-normal text-gray-400">
                    ({group.items.filter((c) => c.is_active).length}/{group.items.length})
                  </span>
                </h3>
              </div>

              {/* Category Items */}
              <div className="divide-y divide-gray-50">
                {group.items.map((cat) => {
                  const globalIdx = sorted.findIndex((c) => c.id === cat.id)
                  const isFirst = globalIdx === 0
                  const isLast = globalIdx === sorted.length - 1

                  return (
                    <div
                      key={cat.id}
                      className={`flex items-center gap-3 px-5 py-3 transition-colors ${
                        cat.is_active ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    >
                      {/* Icon */}
                      <span className="text-xl">{cat.icon || '📁'}</span>

                      {/* Name */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-medium ${
                              cat.is_active ? 'text-gray-900' : 'text-gray-400'
                            }`}
                          >
                            {cat.name}
                          </span>
                          {!cat.is_system && (
                            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-600">
                              커스텀
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Color Swatch */}
                      {cat.color && (
                        <div
                          className="h-5 w-5 shrink-0 rounded-full ring-1 ring-gray-200"
                          style={{ backgroundColor: cat.color }}
                          title={cat.color}
                        />
                      )}

                      {/* Sort Order */}
                      <span className="w-8 text-center text-xs text-gray-400">{cat.sort_order}</span>

                      {/* Reorder Buttons */}
                      <div className="flex shrink-0 gap-0.5">
                        <button
                          onClick={() => handleMoveUp(cat)}
                          disabled={isFirst}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-30"
                          title="위로 이동"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleMoveDown(cat)}
                          disabled={isLast}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-30"
                          title="아래로 이동"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      {/* Toggle */}
                      <button
                        onClick={() => handleToggle(cat.id, cat.is_active)}
                        disabled={savingId === cat.id}
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                          cat.is_active ? 'bg-primary-600' : 'bg-gray-300'
                        } ${savingId === cat.id ? 'opacity-60' : ''}`}
                        title={cat.is_active ? 'OFF로 전환' : 'ON으로 전환'}
                      >
                        <span
                          className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                            cat.is_active ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Custom Category Modal */}
      {showAddModal && (
        <AddCategoryModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddCustom}
        />
      )}
    </div>
  )
}

// ──────────────────────────────────────────
// Add Custom Category Modal
// ──────────────────────────────────────────

function AddCategoryModal({
  onClose,
  onAdd,
}: {
  onClose: () => void
  onAdd: (data: { name: string; icon: string; color: string }) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('')
  const [color, setColor] = useState('#6366F1')
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('카테고리 이름을 입력해주세요.')
      return
    }
    if (!icon.trim()) {
      toast.error('아이콘(이모지)을 입력해주세요.')
      return
    }
    const hexRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/
    if (!hexRegex.test(color)) {
      toast.error('올바른 HEX 색상 코드를 입력해주세요. (예: #FF5733)')
      return
    }
    setIsSaving(true)
    await onAdd({ name: name.trim(), icon: icon.trim(), color })
    setIsSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="border-b border-gray-100 px-6 py-4">
          <h3 className="text-base font-bold text-gray-900">커스텀 카테고리 추가</h3>
          <p className="mt-0.5 text-xs text-gray-500">사무소 맞춤 매물 카테고리를 추가합니다.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {/* Name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">카테고리 이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 재개발 구역"
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
                placeholder="이모지 입력 (예: 🏗️)"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              />
              {icon && <span className="text-2xl">{icon}</span>}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">색상 (HEX)</label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#6366F1"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              />
              <div
                className="h-9 w-9 shrink-0 rounded-lg ring-1 ring-gray-200"
                style={{ backgroundColor: /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color) ? color : '#E5E7EB' }}
              />
            </div>
          </div>

          {/* Preview */}
          {name && icon && (
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="mb-1.5 text-xs font-medium text-gray-400">미리보기</p>
              <div className="flex items-center gap-2">
                <span className="text-xl">{icon}</span>
                <span className="text-sm font-medium text-gray-900">{name}</span>
                {/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color) && (
                  <div
                    className="h-4 w-4 rounded-full ring-1 ring-gray-200"
                    style={{ backgroundColor: color }}
                  />
                )}
              </div>
            </div>
          )}
        </form>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            취소
          </button>
          <button
            onClick={handleSubmit as unknown as React.MouseEventHandler}
            disabled={isSaving}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {isSaving ? '저장 중...' : '추가'}
          </button>
        </div>
      </div>
    </div>
  )
}

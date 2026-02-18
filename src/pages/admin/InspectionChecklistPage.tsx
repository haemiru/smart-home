import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchInspectionById, completeInspection, updateInspection, checklistTemplate } from '@/api/inspections'
import type { Inspection, InspectionCheckItem, CheckItemStatus } from '@/types/database'
import { checkItemStatusLabel, checkItemStatusColor } from '@/utils/format'
import toast from 'react-hot-toast'

export function InspectionChecklistPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [inspection, setInspection] = useState<Inspection | null>(null)
  const [checklist, setChecklist] = useState<InspectionCheckItem[]>([])
  const [overallComment, setOverallComment] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    if (!id) return
    fetchInspectionById(id).then((data) => {
      if (data) {
        setInspection(data)
        setChecklist(data.checklist)
        setOverallComment(data.overall_comment ?? '')
        // Auto-expand first incomplete category
        const cats = checklistTemplate.map((c) => c.category)
        const firstIncomplete = cats.find((cat) =>
          data.checklist.some((item) => item.category === cat && item.status === null),
        )
        setExpandedCategory(firstIncomplete ?? cats[0])
      }
      setIsLoading(false)
    })
  }, [id])

  useEffect(() => {
    const onOnline = () => { setIsOnline(true); toast.success('온라인 상태 복원') }
    const onOffline = () => { setIsOnline(false); toast('오프라인 모드 — 데이터가 로컬에 저장됩니다', { icon: '📶' }) }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  const updateItemStatus = (itemId: string, status: CheckItemStatus) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, status } : item)),
    )
  }

  const updateItemNote = (itemId: string, note: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, note } : item)),
    )
  }

  const handleSave = async () => {
    if (!id) return
    setIsSaving(true)
    await updateInspection(id, { checklist, overall_comment: overallComment, status: 'in_progress' })
    setIsSaving(false)
    toast.success('저장되었습니다.')
  }

  const handleComplete = async () => {
    if (!id) return
    const unanswered = checklist.filter((c) => c.status === null).length
    if (unanswered > 0) {
      const confirm = window.confirm(`미점검 항목이 ${unanswered}개 있습니다. 완료하시겠습니까?`)
      if (!confirm) return
    }
    setIsSaving(true)
    await completeInspection(id, checklist, overallComment)
    setIsSaving(false)
    toast.success('임장이 완료되었습니다.')
    navigate(`/admin/inspection/${id}/report`)
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    )
  }

  if (!inspection) {
    return <div className="flex h-64 items-center justify-center text-gray-400">임장 정보를 찾을 수 없습니다.</div>
  }

  // Group checklist by category
  const categories = checklistTemplate.map((ct) => ({
    name: ct.category,
    items: checklist.filter((item) => item.category === ct.category),
  }))

  const totalItems = checklist.length
  const completedItems = checklist.filter((c) => c.status !== null).length
  const progress = Math.round((completedItems / totalItems) * 100)

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">현장 점검</h1>
          {!isOnline && (
            <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
              오프라인
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-gray-500">{inspection.property_title}</p>
        <p className="text-xs text-gray-400">{inspection.address}</p>
      </div>

      {/* Progress */}
      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">점검 진행률</span>
          <span className="font-bold text-primary-600">{completedItems}/{totalItems} ({progress}%)</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-primary-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Checklist Categories */}
      <div className="space-y-3">
        {categories.map((cat) => {
          const catCompleted = cat.items.filter((i) => i.status !== null).length
          const isExpanded = expandedCategory === cat.name

          return (
            <div key={cat.name} className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
              {/* Category Header */}
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : cat.name)}
                className="flex w-full items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold">{cat.name}</span>
                  <span className="text-xs text-gray-400">{catCompleted}/{cat.items.length}</span>
                </div>
                <svg className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Items */}
              {isExpanded && (
                <div className="border-t border-gray-100 px-4 pb-4">
                  {cat.items.map((item) => (
                    <ChecklistItem
                      key={item.id}
                      item={item}
                      onStatusChange={(status) => updateItemStatus(item.id, status)}
                      onNoteChange={(note) => updateItemNote(item.id, note)}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Overall Comment */}
      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
        <label className="mb-2 block text-sm font-bold">종합 의견</label>
        <textarea
          value={overallComment}
          onChange={(e) => setOverallComment(e.target.value)}
          placeholder="전반적인 매물 상태에 대한 의견을 작성하세요..."
          rows={4}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
      </div>

      {/* Action Buttons — Large touch targets for mobile */}
      <div className="flex gap-3 pb-6">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 rounded-xl bg-gray-100 py-4 text-sm font-bold text-gray-700 hover:bg-gray-200 active:bg-gray-300 disabled:opacity-50"
        >
          {isSaving ? '저장 중...' : '임시 저장'}
        </button>
        <button
          onClick={handleComplete}
          disabled={isSaving}
          className="flex-1 rounded-xl bg-primary-600 py-4 text-sm font-bold text-white hover:bg-primary-700 active:bg-primary-800 disabled:opacity-50"
        >
          점검 완료
        </button>
      </div>
    </div>
  )
}

function ChecklistItem({
  item,
  onStatusChange,
  onNoteChange,
}: {
  item: InspectionCheckItem
  onStatusChange: (status: CheckItemStatus) => void
  onNoteChange: (note: string) => void
}) {
  const [showNote, setShowNote] = useState(!!item.note)
  const statuses: CheckItemStatus[] = ['good', 'normal', 'bad']

  return (
    <div className="border-b border-gray-50 py-3 last:border-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{item.label}</span>
        <div className="flex shrink-0 gap-1">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => onStatusChange(s)}
              className={`min-w-[44px] rounded-lg px-2 py-2 text-xs font-medium transition-colors ${
                item.status === s
                  ? checkItemStatusColor[s]
                  : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
              }`}
            >
              {checkItemStatusLabel[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Note toggle + Photo placeholder */}
      <div className="mt-1.5 flex items-center gap-2">
        <button
          onClick={() => setShowNote(!showNote)}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          {showNote ? '메모 닫기' : '+ 메모'}
        </button>
        <button className="text-xs text-gray-400 hover:text-gray-600">
          + 사진
        </button>
      </div>

      {showNote && (
        <textarea
          value={item.note ?? ''}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="특이사항 메모..."
          rows={2}
          className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-primary-300 focus:outline-none"
        />
      )}
    </div>
  )
}

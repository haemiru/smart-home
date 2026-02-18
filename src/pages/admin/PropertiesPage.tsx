import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import type { Property, PropertyStatus } from '@/types/database'
import { fetchAdminProperties, updatePropertyStatus, deleteProperties } from '@/api/properties'
import { AdminPropertyTable } from '@/features/properties/components/AdminPropertyTable'
import { AdminPropertyCard } from '@/features/properties/components/AdminPropertyCard'
import { Button } from '@/components/common'
import { propertyStatusLabel } from '@/utils/format'
import toast from 'react-hot-toast'

const statusTabs: { key: PropertyStatus | 'all'; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'draft', label: '등록중' },
  { key: 'active', label: '광고중' },
  { key: 'contracted', label: '계약진행' },
  { key: 'completed', label: '거래완료' },
  { key: 'hold', label: '보류' },
]

type ViewMode = 'table' | 'card'

export function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [statusTab, setStatusTab] = useState<PropertyStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    setIsLoading(true)
    const data = await fetchAdminProperties({ statusTab, search: search || undefined })
    setProperties(data)
    setSelectedIds(new Set())
    setIsLoading(false)
  }, [statusTab, search])

  useEffect(() => {
    let cancelled = false
    fetchAdminProperties({ statusTab, search: search || undefined }).then((data) => {
      if (cancelled) return
      setProperties(data)
      setSelectedIds(new Set())
      setIsLoading(false)
    })
    return () => { cancelled = true }
  }, [statusTab, search])

  const handleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  const handleSelectAll = () => {
    if (properties.every((p) => selectedIds.has(p.id))) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(properties.map((p) => p.id)))
    }
  }

  const handleBulkStatus = async (status: PropertyStatus) => {
    if (selectedIds.size === 0) return
    await updatePropertyStatus([...selectedIds], status)
    toast.success(`${selectedIds.size}건 상태를 "${propertyStatusLabel[status]}"(으)로 변경했습니다.`)
    load()
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`${selectedIds.size}건의 매물을 삭제하시겠습니까?`)) return
    await deleteProperties([...selectedIds])
    toast.success(`${selectedIds.size}건 삭제했습니다.`)
    load()
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">매물 관리</h1>
        <Link to="/admin/properties/new">
          <Button>+ 매물 등록</Button>
        </Link>
      </div>

      {/* Status Tabs */}
      <div className="scrollbar-hide flex gap-1 overflow-x-auto">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusTab(tab.key)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              statusTab === tab.key ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Toolbar: Search + View Toggle + Bulk Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="매물명, 주소 검색"
            className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        {/* View Toggle */}
        <div className="flex rounded-lg border border-gray-200">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-2 text-xs font-medium ${viewMode === 'table' ? 'bg-gray-100 text-gray-900' : 'text-gray-500'}`}
          >
            테이블
          </button>
          <button
            onClick={() => setViewMode('card')}
            className={`px-3 py-2 text-xs font-medium ${viewMode === 'card' ? 'bg-gray-100 text-gray-900' : 'text-gray-500'}`}
          >
            카드
          </button>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{selectedIds.size}건 선택</span>
            <select
              onChange={(e) => { if (e.target.value) handleBulkStatus(e.target.value as PropertyStatus); e.target.value = '' }}
              className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs"
              defaultValue=""
            >
              <option value="" disabled>상태 변경</option>
              <option value="active">광고중</option>
              <option value="hold">보류</option>
              <option value="contracted">계약진행</option>
              <option value="completed">거래완료</option>
            </select>
            <Button variant="danger" size="sm" onClick={handleBulkDelete}>삭제</Button>
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-20 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>
      ) : viewMode === 'table' ? (
        <AdminPropertyTable properties={properties} selectedIds={selectedIds} onSelect={handleSelect} onSelectAll={handleSelectAll} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {properties.map((p) => (
            <AdminPropertyCard key={p.id} property={p} isSelected={selectedIds.has(p.id)} onSelect={handleSelect} />
          ))}
          {properties.length === 0 && <div className="col-span-full py-16 text-center text-sm text-gray-400">매물이 없습니다.</div>}
        </div>
      )}
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import type { Customer, CustomerType, CustomerSource } from '@/types/database'
import { fetchCustomers, updateCustomerType, getCustomerCountByType } from '@/api/customers'
import { customerTypeLabel, customerTypeColor, customerSourceLabel, formatRelativeTime } from '@/utils/format'
import { Button } from '@/components/common'
import toast from 'react-hot-toast'

type ViewMode = 'pipeline' | 'list'

const pipelineStages: CustomerType[] = ['lead', 'interest', 'consulting', 'contracting', 'completed']
const sourceOptions: { key: CustomerSource | 'all'; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'inquiry', label: '문의접수' },
  { key: 'direct', label: '직접등록' },
  { key: 'referral', label: '소개' },
  { key: 'website', label: '웹사이트' },
]

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [counts, setCounts] = useState<Record<CustomerType, number>>({ lead: 0, interest: 0, consulting: 0, contracting: 0, completed: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('pipeline')
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState<CustomerSource | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<CustomerType | 'all'>('all')

  const load = useCallback(async () => {
    const [data, countData] = await Promise.all([
      fetchCustomers({ search: search || undefined, source: sourceFilter, customerType: typeFilter }),
      getCustomerCountByType(),
    ])
    setCustomers(data)
    setCounts(countData)
    setIsLoading(false)
  }, [search, sourceFilter, typeFilter])

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetchCustomers({ search: search || undefined, source: sourceFilter, customerType: typeFilter }),
      getCustomerCountByType(),
    ]).then(([data, countData]) => {
      if (cancelled) return
      setCustomers(data)
      setCounts(countData)
      setIsLoading(false)
    })
    return () => { cancelled = true }
  }, [search, sourceFilter, typeFilter])

  const handleStageChange = async (customerId: string, newType: CustomerType) => {
    await updateCustomerType(customerId, newType)
    toast.success(`고객 단계를 "${customerTypeLabel[newType]}"(으)로 변경했습니다.`)
    void load()
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">고객 관리 (CRM)</h1>
        <Button onClick={() => toast('고객 직접 등록 기능은 추후 구현 예정입니다.')}>+ 고객 등록</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {pipelineStages.map((stage) => (
          <div key={stage} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
            <p className="text-xs text-gray-400">{customerTypeLabel[stage]}</p>
            <p className="mt-1 text-2xl font-bold">{counts[stage]}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="고객명, 연락처, 이메일 검색"
            className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value as CustomerSource | 'all')}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          {sourceOptions.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
        {viewMode === 'list' && (
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as CustomerType | 'all')}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="all">전체 단계</option>
            {pipelineStages.map((s) => <option key={s} value={s}>{customerTypeLabel[s]}</option>)}
          </select>
        )}
        <div className="flex rounded-lg border border-gray-200">
          <button
            onClick={() => setViewMode('pipeline')}
            className={`px-3 py-2 text-xs font-medium ${viewMode === 'pipeline' ? 'bg-gray-100 text-gray-900' : 'text-gray-500'}`}
          >
            파이프라인
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 text-xs font-medium ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-500'}`}
          >
            리스트
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-20 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>
      ) : viewMode === 'pipeline' ? (
        <PipelineView customers={customers} onStageChange={handleStageChange} />
      ) : (
        <ListView customers={customers} onStageChange={handleStageChange} />
      )}
    </div>
  )
}

// ============================================================
// Pipeline (Kanban) View
// ============================================================
function PipelineView({ customers, onStageChange }: { customers: Customer[]; onStageChange: (id: string, type: CustomerType) => void }) {
  const stageColors: Record<CustomerType, string> = {
    lead: 'border-t-gray-400',
    interest: 'border-t-blue-400',
    consulting: 'border-t-yellow-400',
    contracting: 'border-t-purple-400',
    completed: 'border-t-green-400',
  }

  return (
    <div className="scrollbar-hide flex gap-4 overflow-x-auto pb-4">
      {pipelineStages.map((stage) => {
        const stageCustomers = customers.filter((c) => c.customer_type === stage)
        return (
          <div key={stage} className="w-64 shrink-0">
            <div className={`mb-3 rounded-t-lg border-t-4 ${stageColors[stage]} bg-white px-3 py-2 shadow-sm ring-1 ring-gray-200`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{customerTypeLabel[stage]}</span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{stageCustomers.length}</span>
              </div>
            </div>
            <div className="space-y-2">
              {stageCustomers.map((c) => (
                <KanbanCard key={c.id} customer={c} onStageChange={onStageChange} />
              ))}
              {stageCustomers.length === 0 && (
                <div className="rounded-lg border-2 border-dashed border-gray-200 py-8 text-center text-xs text-gray-400">
                  고객 없음
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function KanbanCard({ customer: c, onStageChange }: { customer: Customer; onStageChange: (id: string, type: CustomerType) => void }) {
  const prefs = c.preferences as Record<string, string>
  return (
    <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-gray-200">
      <div className="flex items-start justify-between">
        <Link to={`/admin/customers/${c.id}`} className="text-sm font-semibold text-gray-800 hover:text-primary-700">
          {c.name}
        </Link>
        <div className="flex items-center gap-1">
          <span className="rounded bg-primary-50 px-1.5 py-0.5 text-[10px] font-bold text-primary-700">{c.score}점</span>
        </div>
      </div>
      {prefs.propertyType && (
        <p className="mt-1 text-xs text-gray-500">{prefs.propertyType}{prefs.region ? ` · ${prefs.region}` : ''}</p>
      )}
      {prefs.priceRange && (
        <p className="text-xs text-gray-400">{prefs.priceRange}</p>
      )}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] text-gray-400">{formatRelativeTime(c.updated_at)}</span>
        <select
          value={c.customer_type}
          onChange={(e) => onStageChange(c.id, e.target.value as CustomerType)}
          className="rounded border border-gray-200 px-1 py-0.5 text-[10px]"
        >
          {pipelineStages.map((s) => <option key={s} value={s}>{customerTypeLabel[s]}</option>)}
        </select>
      </div>
    </div>
  )
}

// ============================================================
// List (Table) View
// ============================================================
function ListView({ customers, onStageChange }: { customers: Customer[]; onStageChange: (id: string, type: CustomerType) => void }) {
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium text-gray-500">
            <th className="px-4 py-3">이름</th>
            <th className="px-4 py-3">연락처</th>
            <th className="hidden px-4 py-3 sm:table-cell">단계</th>
            <th className="hidden px-4 py-3 md:table-cell">소스</th>
            <th className="hidden px-4 py-3 lg:table-cell">선호조건</th>
            <th className="px-4 py-3">스코어</th>
            <th className="px-4 py-3">최근 활동</th>
            <th className="px-4 py-3">액션</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {customers.map((c) => {
            const prefs = c.preferences as Record<string, string>
            return (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link to={`/admin/customers/${c.id}`} className="font-medium text-gray-800 hover:text-primary-700">{c.name}</Link>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">{c.phone}</td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <select
                    value={c.customer_type}
                    onChange={(e) => onStageChange(c.id, e.target.value as CustomerType)}
                    className={`rounded-md px-2 py-0.5 text-xs font-semibold ${customerTypeColor[c.customer_type]}`}
                  >
                    {pipelineStages.map((s) => <option key={s} value={s}>{customerTypeLabel[s]}</option>)}
                  </select>
                </td>
                <td className="hidden px-4 py-3 text-xs text-gray-500 md:table-cell">{customerSourceLabel[c.source]}</td>
                <td className="hidden max-w-xs truncate px-4 py-3 text-xs text-gray-500 lg:table-cell">
                  {prefs.propertyType}{prefs.region ? ` · ${prefs.region}` : ''}{prefs.priceRange ? ` · ${prefs.priceRange}` : ''}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded bg-primary-50 px-2 py-0.5 text-xs font-bold text-primary-700">{c.score}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">{formatRelativeTime(c.updated_at)}</td>
                <td className="px-4 py-3">
                  <Link to={`/admin/customers/${c.id}`} className="rounded-md bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 hover:bg-primary-100">
                    상세
                  </Link>
                </td>
              </tr>
            )
          })}
          {customers.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-16 text-center text-sm text-gray-400">고객이 없습니다.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

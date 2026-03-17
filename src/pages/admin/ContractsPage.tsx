import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { Contract, ContractStatus, Property } from '@/types/database'
import { fetchContracts, fetchContractedPropertiesWithoutContract } from '@/api/contracts'
import { fetchPropertyById } from '@/api/properties'
import { Button } from '@/components/common'
import { contractStatusLabel, contractStatusColor, contractTemplateLabel, transactionTypeLabel, formatPrice, formatRelativeTime } from '@/utils/format'

const statusTabs: { key: ContractStatus | 'all'; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'drafting', label: '작성중' },
  { key: 'pending_sign', label: '서명대기' },
  { key: 'signed', label: '서명완료' },
  { key: 'completed', label: '계약완료' },
]

export function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [propertyCache, setPropertyCache] = useState<Record<string, Property>>({})
  const [pendingProperties, setPendingProperties] = useState<Property[]>([])

  // 계약서 미작성 매물 조회
  useEffect(() => {
    fetchContractedPropertiesWithoutContract()
      .then(setPendingProperties)
      .catch(() => setPendingProperties([]))
  }, [contracts]) // contracts 변경 시 재조회

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    fetchContracts({ status: statusFilter, search: search || undefined })
      .then((data) => {
        if (cancelled) return
        setContracts(data)

        const pids = [...new Set(data.filter((c) => c.property_id).map((c) => c.property_id!))]
        for (const pid of pids) {
          if (!propertyCache[pid]) {
            fetchPropertyById(pid).then((p) => {
              if (p && !cancelled) setPropertyCache((prev) => ({ ...prev, [pid]: p }))
            }).catch(() => {})
          }
        }
      })
      .catch(() => { if (!cancelled) setContracts([]) })
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, search])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">계약 관리</h1>
        <Link to="/admin/contracts/new">
          <Button>+ 계약서 작성</Button>
        </Link>
      </div>

      {/* Status Tabs */}
      <div className="scrollbar-hide flex gap-1 overflow-x-auto">
        {statusTabs.map((tab) => (
          <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${statusFilter === tab.key ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="계약번호, 매도인/매수인 검색"
          className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
      </div>

      {/* 계약서 작성중 매물 안내 — '전체' 또는 '작성중' 탭에서만 표시 */}
      {pendingProperties.length > 0 && (statusFilter === 'all' || statusFilter === 'drafting') && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="mb-2 text-sm font-semibold text-amber-800">📋 계약서 작성중 매물 {pendingProperties.length}건</p>
          <p className="mb-3 text-xs text-amber-600">매물 상태가 '계약진행'이며 계약서 작성이 필요합니다.</p>
          <div className="space-y-2">
            {pendingProperties.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-amber-100">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-800">{p.title}</p>
                  <p className="text-xs text-gray-400">{p.address}</p>
                </div>
                <Link to={`/admin/contracts/new?propertyId=${p.id}`}>
                  <Button className="shrink-0 px-3 py-1.5 text-xs">계약서 작성</Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="py-20 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium text-gray-500">
                <th className="px-4 py-3">계약번호</th>
                <th className="hidden px-4 py-3 sm:table-cell">매물</th>
                <th className="px-4 py-3">매도인/매수인</th>
                <th className="hidden px-4 py-3 md:table-cell">거래금액</th>
                <th className="px-4 py-3">상태</th>
                <th className="hidden px-4 py-3 lg:table-cell">생성일</th>
                <th className="px-4 py-3">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {contracts.map((ct) => {
                const seller = ct.seller_info as Record<string, string>
                const buyer = ct.buyer_info as Record<string, string>
                const price = ct.price_info as Record<string, number>
                const prop = ct.property_id ? propertyCache[ct.property_id] : null
                const mainPrice = ct.transaction_type === 'sale' ? price.salePrice : price.deposit
                return (
                  <tr key={ct.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{ct.contract_number}</p>
                      <p className="text-[10px] text-gray-400">{contractTemplateLabel[ct.template_type]}</p>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      {prop ? (
                        <p className="max-w-xs truncate text-xs text-gray-600">{prop.title}</p>
                      ) : (
                        <span className="text-xs text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs"><span className="text-gray-400">매도:</span> {seller.name || '-'}</p>
                      <p className="text-xs"><span className="text-gray-400">매수:</span> {buyer.name || '-'}</p>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <p className="font-medium text-gray-800">
                        {transactionTypeLabel[ct.transaction_type]} {formatPrice(mainPrice)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${contractStatusColor[ct.status]}`}>
                        {contractStatusLabel[ct.status]}
                      </span>
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-xs text-gray-400 lg:table-cell">
                      {formatRelativeTime(ct.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Link to={`/admin/contracts/${ct.id}/tracker`}
                          className="rounded-md bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 hover:bg-primary-100">
                          진행현황
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {contracts.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-16 text-center text-sm text-gray-400">계약이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

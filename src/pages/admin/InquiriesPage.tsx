import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { Inquiry, InquiryStatus, InquiryType } from '@/types/database'
import { fetchInquiries, getUnansweredCount, updateInquiryStatus } from '@/api/inquiries'
import { fetchPropertyById } from '@/api/properties'
import type { Property } from '@/types/database'
import { inquiryStatusLabel, inquiryStatusIcon, inquiryStatusColor, inquiryTypeLabel, formatRelativeTime } from '@/utils/format'
import toast from 'react-hot-toast'

const statusFilters: { key: InquiryStatus | 'all'; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'new', label: '새 문의' },
  { key: 'checked', label: '확인' },
  { key: 'in_progress', label: '진행중' },
  { key: 'answered', label: '답변완료' },
  { key: 'closed', label: '종결' },
]

const typeFilters: { key: InquiryType | 'all'; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'property', label: '매물문의' },
  { key: 'price', label: '시세문의' },
  { key: 'contract', label: '계약문의' },
  { key: 'other', label: '기타' },
]

export function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [unansweredCount, setUnansweredCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<InquiryType | 'all'>('all')
  const [unansweredOnly, setUnansweredOnly] = useState(false)
  const [search, setSearch] = useState('')
  const [propertyCache, setPropertyCache] = useState<Record<string, Property>>({})

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetchInquiries({ status: statusFilter, inquiryType: typeFilter, unansweredOnly, search: search || undefined }),
      getUnansweredCount(),
    ]).then(([data, count]) => {
      if (cancelled) return
      setInquiries(data)
      setUnansweredCount(count)
      setIsLoading(false)

      // Cache property info for linked inquiries
      const propertyIds = data.filter((i) => i.property_id).map((i) => i.property_id!)
      const unique = [...new Set(propertyIds)]
      for (const pid of unique) {
        if (!propertyCache[pid]) {
          fetchPropertyById(pid).then((p) => {
            if (p && !cancelled) {
              setPropertyCache((prev) => ({ ...prev, [pid]: p }))
            }
          })
        }
      }
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter, unansweredOnly, search])

  const handleStatusChange = async (id: string, status: InquiryStatus) => {
    await updateInquiryStatus(id, status)
    toast.success(`상태를 "${inquiryStatusLabel[status]}"(으)로 변경했습니다.`)
    const data = await fetchInquiries({ status: statusFilter, inquiryType: typeFilter, unansweredOnly, search: search || undefined })
    setInquiries(data)
    const count = await getUnansweredCount()
    setUnansweredCount(count)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">문의 관리</h1>
          {unansweredCount > 0 && (
            <span className="rounded-full bg-red-500 px-3 py-0.5 text-xs font-bold text-white">
              미답변 {unansweredCount}건
            </span>
          )}
        </div>
      </div>

      {/* Status Tabs */}
      <div className="scrollbar-hide flex gap-1 overflow-x-auto">
        {statusFilters.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === f.key ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
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
            placeholder="문의자, 내용, 접수번호 검색"
            className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as InquiryType | 'all')}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          {typeFilters.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={unansweredOnly}
            onChange={(e) => setUnansweredOnly(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary-600"
          />
          미답변만
        </label>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="py-20 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium text-gray-500">
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3">유형</th>
                <th className="px-4 py-3">문의자</th>
                <th className="hidden px-4 py-3 lg:table-cell">관련 매물</th>
                <th className="hidden px-4 py-3 sm:table-cell">내용</th>
                <th className="px-4 py-3">접수일</th>
                <th className="px-4 py-3">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inquiries.map((inq) => {
                const prop = inq.property_id ? propertyCache[inq.property_id] : null
                return (
                  <tr key={inq.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${inquiryStatusColor[inq.status]}`}>
                        <span>{inquiryStatusIcon[inq.status]}</span>
                        <span className="hidden sm:inline">{inquiryStatusLabel[inq.status]}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{inquiryTypeLabel[inq.inquiry_type]}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{inq.name}</p>
                      <p className="text-xs text-gray-400">{inq.phone}</p>
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      {prop ? (
                        <Link to={`/admin/properties/${prop.id}`} className="text-xs text-primary-600 hover:underline">
                          {prop.title}
                        </Link>
                      ) : inq.property_id ? (
                        <span className="text-xs text-gray-400">로딩중...</span>
                      ) : (
                        <span className="text-xs text-gray-300">-</span>
                      )}
                    </td>
                    <td className="hidden max-w-xs truncate px-4 py-3 text-xs text-gray-500 sm:table-cell">
                      {inq.content}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">
                      {formatRelativeTime(inq.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          to={`/admin/inquiries/${inq.id}`}
                          className="rounded-md bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 hover:bg-primary-100"
                        >
                          상세
                        </Link>
                        {inq.status === 'new' && (
                          <button
                            onClick={() => handleStatusChange(inq.id, 'checked')}
                            className="rounded-md bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700 hover:bg-orange-100"
                          >
                            확인
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {inquiries.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-sm text-gray-400">
                    문의가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

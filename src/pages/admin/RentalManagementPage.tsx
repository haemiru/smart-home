import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchRentalProperties, fetchRentalSummary, fetchRepairRequests, fetchPayments } from '@/api/rental'
import type { RentalProperty, RepairRequest, RentalPayment } from '@/types/database'
import { formatPrice, formatDate, rentalStatusLabel, rentalStatusColor, repairStatusLabel, repairStatusColor } from '@/utils/format'

export function RentalManagementPage() {
  const [properties, setProperties] = useState<RentalProperty[]>([])
  const [summary, setSummary] = useState({ totalProperties: 0, currentMonthCollectionRate: 0, expiringCount: 0, pendingRepairs: 0 })
  const [repairs, setRepairs] = useState<RepairRequest[]>([])
  const [allPayments, setAllPayments] = useState<Map<string, RentalPayment[]>>(new Map())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchRentalProperties(),
      fetchRentalSummary(),
      fetchRepairRequests(),
    ]).then(([props, sum, reps]) => {
      setProperties(props)
      setSummary(sum)
      setRepairs(reps)

      // Fetch current month payments for each property
      const paymentPromises = props
        .filter((p) => p.status !== 'vacant')
        .map((p) => fetchPayments(p.id).then((pays) => [p.id, pays] as const))
      Promise.all(paymentPromises).then((results) => {
        const map = new Map<string, RentalPayment[]>()
        for (const [id, pays] of results) map.set(id, pays)
        setAllPayments(map)
        setIsLoading(false)
      })
    })
  }, [])

  const getCurrentMonthPaymentStatus = (propertyId: string): 'paid' | 'unpaid' | 'none' => {
    const payments = allPayments.get(propertyId) ?? []
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const payment = payments.find((p) => p.payment_month.startsWith(currentMonth))
    if (!payment) return 'none'
    return payment.is_paid ? 'paid' : 'unpaid'
  }

  const getRepairCount = (propertyId: string): number => {
    return repairs.filter((r) => r.rental_property_id === propertyId && r.status !== 'completed').length
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">임대 관리</h1>
          <p className="mt-1 text-sm text-gray-500">임대 물건의 수납, 수리, 계약 현황을 한눈에 관리합니다.</p>
        </div>
        <Link
          to="/admin/rental-mgmt/new"
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          물건 추가
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
          <p className="text-xs text-gray-400">관리물건</p>
          <p className="mt-1 text-2xl font-bold text-gray-800">{summary.totalProperties}건</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
          <p className="text-xs text-gray-400">이번달 수납률</p>
          <p className={`mt-1 text-2xl font-bold ${summary.currentMonthCollectionRate >= 100 ? 'text-green-600' : 'text-orange-600'}`}>
            {summary.currentMonthCollectionRate}%
          </p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
          <p className="text-xs text-gray-400">만기임박</p>
          <p className={`mt-1 text-2xl font-bold ${summary.expiringCount > 0 ? 'text-red-600' : 'text-gray-800'}`}>
            {summary.expiringCount}건
          </p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
          <p className="text-xs text-gray-400">수리요청</p>
          <p className={`mt-1 text-2xl font-bold ${summary.pendingRepairs > 0 ? 'text-orange-600' : 'text-gray-800'}`}>
            {summary.pendingRepairs}건
          </p>
        </div>
      </div>

      {/* Property Table */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs text-gray-400">
                <th className="px-4 py-3">호수</th>
                <th className="px-4 py-3">임차인</th>
                <th className="px-4 py-3 text-right">보증금</th>
                <th className="px-4 py-3 text-right">월세</th>
                <th className="px-4 py-3 text-center">납부</th>
                <th className="px-4 py-3">만기일</th>
                <th className="px-4 py-3 text-center">수리</th>
                <th className="px-4 py-3 text-center">상태</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {properties.map((p) => {
                const payStatus = getCurrentMonthPaymentStatus(p.id)
                const repairCount = getRepairCount(p.id)

                return (
                  <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{p.unit_number}</p>
                        <p className="text-xs text-gray-400">{p.address.split(' ').slice(-1)[0]}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {p.tenant_name || <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-4 py-3 text-right">{p.deposit > 0 ? formatPrice(p.deposit) : '-'}</td>
                    <td className="px-4 py-3 text-right">{p.monthly_rent > 0 ? formatPrice(p.monthly_rent) : '-'}</td>
                    <td className="px-4 py-3 text-center">
                      {payStatus === 'paid' && <span title="완납">✅</span>}
                      {payStatus === 'unpaid' && <span title="미납">🔴</span>}
                      {payStatus === 'none' && <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {p.contract_end ? formatDate(p.contract_end) : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {repairCount > 0 ? <span title="수리접수">⚠️ {repairCount}</span> : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${rentalStatusColor[p.status]}`}>
                        {rentalStatusLabel[p.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/admin/rental-mgmt/${p.id}`} className="text-xs text-primary-600 hover:underline">
                        상세
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Repair Requests */}
      {repairs.filter((r) => r.status !== 'completed').length > 0 && (
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <h2 className="mb-3 text-sm font-bold">미완료 수리 요청</h2>
          <div className="space-y-2">
            {repairs.filter((r) => r.status !== 'completed').map((r) => {
              const prop = properties.find((p) => p.id === r.rental_property_id)
              return (
                <div key={r.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                  <div>
                    <p className="text-sm font-medium">{r.title}</p>
                    <p className="text-xs text-gray-400">{prop?.unit_number ?? ''} · {formatDate(r.requested_at)}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${repairStatusColor[r.status]}`}>
                    {repairStatusLabel[r.status]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

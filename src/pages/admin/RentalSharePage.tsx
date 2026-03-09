import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { fetchShareData } from '@/api/rental'
import type { RentalProperty, RentalPayment, RepairRequest } from '@/types/database'
import { formatPrice, formatDate, rentalStatusLabel, repairStatusLabel, repairStatusColor } from '@/utils/format'

export function RentalSharePage() {
  const { token } = useParams<{ token: string }>()
  const [property, setProperty] = useState<RentalProperty | null>(null)
  const [payments, setPayments] = useState<RentalPayment[]>([])
  const [repairs, setRepairs] = useState<RepairRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    fetchShareData(token)
      .then((data) => {
        if (!data) {
          setError('유효하지 않거나 만료된 링크입니다.')
        } else {
          setProperty(data.property)
          setPayments(data.payments.sort((a, b) => b.payment_month.localeCompare(a.payment_month)))
          setRepairs(data.repairs)
        }
      })
      .catch(() => setError('데이터를 불러올 수 없습니다.'))
      .finally(() => setIsLoading(false))
  }, [token])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-4xl">🔒</p>
          <p className="mt-4 text-lg font-bold text-gray-700">{error ?? '데이터를 불러올 수 없습니다.'}</p>
          <p className="mt-1 text-sm text-gray-400">링크가 만료되었거나 잘못된 링크입니다.</p>
        </div>
      </div>
    )
  }

  const chartPayments = [...payments].reverse().slice(-12)
  const paymentChartData = chartPayments.map((p) => ({
    month: p.payment_month.slice(5, 7) + '월',
    amount: p.amount,
    isPaid: p.is_paid,
  }))

  const totalPaid = payments.filter((p) => p.is_paid).length
  const totalPayments = payments.length
  const overallRate = totalPayments > 0 ? Math.round((totalPaid / totalPayments) * 100) : 0
  const totalRevenue = payments.filter((p) => p.is_paid).reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
          <p className="text-xs text-primary-200">임대 관리 현황 리포트</p>
          <h1 className="mt-1 text-xl font-bold">{property.address} {property.unit_number}</h1>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-primary-100">
            <span>임차인: {property.tenant_name || '-'}</span>
            <span>상태: {rentalStatusLabel[property.status]}</span>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-6 grid gap-4 sm:grid-cols-4">
          <SummaryCard label="보증금" value={formatPrice(property.deposit)} />
          <SummaryCard label="월세" value={formatPrice(property.monthly_rent)} />
          <SummaryCard label="수납률" value={`${overallRate}%`} />
          <SummaryCard label="총 수납액" value={formatPrice(totalRevenue)} />
        </div>

        {/* Contract Info */}
        <div className="mb-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <h2 className="mb-3 text-sm font-bold">계약 현황</h2>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex justify-between">
              <span className="text-gray-400">계약 시작</span>
              <span>{formatDate(property.contract_start)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">계약 만료</span>
              <span>{formatDate(property.contract_end)}</span>
            </div>
          </div>
        </div>

        {/* Payment Chart */}
        <div className="mb-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <h2 className="mb-3 text-sm font-bold">수납 현황</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}만`} />
                <Tooltip formatter={(value) => formatPrice(value as number)} />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {paymentChartData.map((entry, index) => (
                    <Cell key={index} fill={entry.isPaid ? '#22c55e' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment History */}
        <div className="mb-6 rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
          <div className="px-5 py-3">
            <h2 className="text-sm font-bold">수납 이력</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs text-gray-400">
                <th className="px-5 py-2">월</th>
                <th className="px-5 py-2 text-right">금액</th>
                <th className="px-5 py-2 text-center">상태</th>
                <th className="px-5 py-2">납부일</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-gray-100">
                  <td className="px-5 py-2">{p.payment_month.slice(0, 7)}</td>
                  <td className="px-5 py-2 text-right">{formatPrice(p.amount)}</td>
                  <td className="px-5 py-2 text-center">
                    {p.is_paid ? (
                      <span className="text-green-600">✅ 완납</span>
                    ) : (
                      <span className="text-red-600">🔴 미납</span>
                    )}
                  </td>
                  <td className="px-5 py-2 text-xs text-gray-500">{p.paid_date ? formatDate(p.paid_date) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Repair History */}
        {repairs.length > 0 && (
          <div className="mb-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <h2 className="mb-3 text-sm font-bold">수리 이력</h2>
            <div className="space-y-2">
              {repairs.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                  <div>
                    <p className="text-sm font-medium">{r.title}</p>
                    <p className="text-xs text-gray-400">
                      {formatDate(r.requested_at)}
                      {r.cost != null && ` · 비용: ${formatPrice(r.cost)}`}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${repairStatusColor[r.status]}`}>
                    {repairStatusLabel[r.status]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-[10px] text-gray-400">
          본 페이지는 읽기 전용 공유 페이지입니다. 스마트부동산 제공.
        </p>
      </div>
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-gray-800">{value}</p>
    </div>
  )
}

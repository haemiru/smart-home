import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { fetchRentalPropertyById, fetchPayments, fetchRepairRequests, togglePaymentStatus, createRepairRequest, updateRepairStatus, createShareLink } from '@/api/rental'
import type { RentalProperty, RentalPayment, RepairRequest, RepairRequestStatus } from '@/types/database'
import { formatPrice, formatDate, rentalStatusLabel, rentalStatusColor, repairStatusLabel, repairStatusColor } from '@/utils/format'
import toast from 'react-hot-toast'

type TabKey = 'payments' | 'repairs'

export function RentalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [property, setProperty] = useState<RentalProperty | null>(null)
  const [payments, setPayments] = useState<RentalPayment[]>([])
  const [repairs, setRepairs] = useState<RepairRequest[]>([])
  const [tab, setTab] = useState<TabKey>('payments')
  const [isLoading, setIsLoading] = useState(true)
  const [showRepairForm, setShowRepairForm] = useState(false)
  const [repairTitle, setRepairTitle] = useState('')
  const [repairDesc, setRepairDesc] = useState('')
  const [shareUrl, setShareUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    Promise.all([
      fetchRentalPropertyById(id),
      fetchPayments(id),
      fetchRepairRequests(id),
    ]).then(([prop, pays, reps]) => {
      setProperty(prop)
      setPayments(pays)
      setRepairs(reps)
      setIsLoading(false)
    })
  }, [id])

  const handleTogglePayment = async (paymentId: string) => {
    const updated = await togglePaymentStatus(paymentId)
    if (updated) {
      setPayments((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      toast.success(updated.is_paid ? '납부 확인' : '미납으로 변경')
    }
  }

  const handleCreateRepair = async () => {
    if (!id || !repairTitle) return
    const req = await createRepairRequest({ rental_property_id: id, title: repairTitle, description: repairDesc })
    setRepairs((prev) => [req, ...prev])
    setRepairTitle('')
    setRepairDesc('')
    setShowRepairForm(false)
    toast.success('수리 요청이 접수되었습니다.')
  }

  const handleRepairStatusChange = async (repairId: string, status: RepairRequestStatus) => {
    const updated = await updateRepairStatus(repairId, status)
    if (updated) {
      setRepairs((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
      toast.success(`상태가 "${repairStatusLabel[status]}"으로 변경되었습니다.`)
    }
  }

  const handleCreateShareLink = async () => {
    if (!id) return
    const { url } = await createShareLink(id, 30)
    setShareUrl(url)
    toast.success('공유 링크가 생성되었습니다.')
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    )
  }

  if (!property) {
    return <div className="flex h-64 items-center justify-center text-gray-400">물건 정보를 찾을 수 없습니다.</div>
  }

  // Payment chart data (last 12 months)
  const chartPayments = [...payments].reverse().slice(-12)
  const paymentChartData = chartPayments.map((p) => ({
    month: p.payment_month.slice(5, 7) + '월',
    amount: p.amount,
    isPaid: p.is_paid,
  }))

  const totalPaid = payments.filter((p) => p.is_paid).length
  const totalPayments = payments.length
  const overallRate = totalPayments > 0 ? Math.round((totalPaid / totalPayments) * 100) : 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{property.unit_number}</h1>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${rentalStatusColor[property.status]}`}>
              {rentalStatusLabel[property.status]}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">{property.address}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCreateShareLink} className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200">
            임대인 공유
          </button>
          <Link to="/admin/rental-mgmt" className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200">
            목록
          </Link>
        </div>
      </div>

      {shareUrl && (
        <div className="rounded-lg bg-blue-50 p-3">
          <p className="text-xs text-blue-700">
            공유 링크 (30일 유효): <code className="rounded bg-blue-100 px-1.5 py-0.5">{window.location.origin}{shareUrl}</code>
          </p>
        </div>
      )}

      {/* Tenant & Contract Info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <h2 className="mb-3 text-sm font-bold">임차인 정보</h2>
          <div className="space-y-2 text-sm">
            <InfoRow label="이름" value={property.tenant_name || '-'} />
            <InfoRow label="연락처" value={property.tenant_phone || '-'} />
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <h2 className="mb-3 text-sm font-bold">계약 정보</h2>
          <div className="space-y-2 text-sm">
            <InfoRow label="보증금" value={formatPrice(property.deposit)} />
            <InfoRow label="월세" value={formatPrice(property.monthly_rent)} />
            <InfoRow label="계약기간" value={`${formatDate(property.contract_start)} ~ ${formatDate(property.contract_end)}`} />
            <InfoRow label="수납률" value={`${overallRate}% (${totalPaid}/${totalPayments})`} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        <button
          onClick={() => setTab('payments')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'payments' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          수납 이력
        </button>
        <button
          onClick={() => setTab('repairs')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'repairs' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          수리 요청 ({repairs.length})
        </button>
      </div>

      {/* Payments Tab */}
      {tab === 'payments' && (
        <div className="space-y-4">
          {/* Payment Chart */}
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <h3 className="mb-3 text-sm font-bold">월별 수납 현황</h3>
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

          {/* Payment List */}
          <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs text-gray-400">
                  <th className="px-4 py-3">월</th>
                  <th className="px-4 py-3 text-right">금액</th>
                  <th className="px-4 py-3 text-center">상태</th>
                  <th className="px-4 py-3">납부일</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100">
                    <td className="px-4 py-2.5 font-medium">{p.payment_month.slice(0, 7)}</td>
                    <td className="px-4 py-2.5 text-right">{formatPrice(p.amount)}</td>
                    <td className="px-4 py-2.5 text-center">
                      {p.is_paid ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">완납</span>
                      ) : (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">미납</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">{p.paid_date ? formatDate(p.paid_date) : '-'}</td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => handleTogglePayment(p.id)}
                        className="text-xs text-primary-600 hover:underline"
                      >
                        {p.is_paid ? '취소' : '납부확인'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Repairs Tab */}
      {tab === 'repairs' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowRepairForm(!showRepairForm)}
              className="rounded-lg bg-primary-600 px-4 py-2 text-xs font-medium text-white hover:bg-primary-700"
            >
              수리 요청 접수
            </button>
          </div>

          {showRepairForm && (
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <h3 className="mb-3 text-sm font-bold">새 수리 요청</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={repairTitle}
                  onChange={(e) => setRepairTitle(e.target.value)}
                  placeholder="수리 제목"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
                <textarea
                  value={repairDesc}
                  onChange={(e) => setRepairDesc(e.target.value)}
                  placeholder="상세 설명"
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <button onClick={() => setShowRepairForm(false)} className="rounded-lg bg-gray-100 px-4 py-2 text-xs text-gray-600">
                    취소
                  </button>
                  <button onClick={handleCreateRepair} className="rounded-lg bg-primary-600 px-4 py-2 text-xs text-white">
                    접수
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {repairs.length === 0 ? (
              <div className="flex h-32 items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-400">
                수리 요청이 없습니다.
              </div>
            ) : (
              repairs.map((r) => (
                <div key={r.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold">{r.title}</h4>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${repairStatusColor[r.status]}`}>
                          {repairStatusLabel[r.status]}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">{r.description}</p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                        <span>접수: {formatDate(r.requested_at)}</span>
                        {r.completed_at && <span>완료: {formatDate(r.completed_at)}</span>}
                        {r.cost != null && <span>비용: {formatPrice(r.cost)}</span>}
                        {r.memo && <span>메모: {r.memo}</span>}
                      </div>
                    </div>
                    {r.status !== 'completed' && (
                      <select
                        value={r.status}
                        onChange={(e) => handleRepairStatusChange(r.id, e.target.value as RepairRequestStatus)}
                        className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
                      >
                        <option value="requested">접수</option>
                        <option value="confirmed">확인</option>
                        <option value="in_progress">진행중</option>
                        <option value="completed">완료</option>
                      </select>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-400">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  )
}

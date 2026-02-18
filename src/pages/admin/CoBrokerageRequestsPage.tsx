import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchSentRequests, fetchReceivedRequests, updateRequestStatus } from '@/api/co-brokerage'
import type { CoBrokerageRequest } from '@/types/database'
import { coBrokerageStatusLabel, coBrokerageStatusColor, formatRelativeTime } from '@/utils/format'
import toast from 'react-hot-toast'

type Tab = 'received' | 'sent'

export function CoBrokerageRequestsPage() {
  const [tab, setTab] = useState<Tab>('received')
  const [received, setReceived] = useState<CoBrokerageRequest[]>([])
  const [sent, setSent] = useState<CoBrokerageRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [approveModal, setApproveModal] = useState<CoBrokerageRequest | null>(null)
  const [commissionRatio, setCommissionRatio] = useState(50)

  useEffect(() => {
    setIsLoading(true)
    Promise.all([fetchReceivedRequests(), fetchSentRequests()]).then(([recv, snt]) => {
      setReceived(recv)
      setSent(snt)
      setIsLoading(false)
    })
  }, [])

  const handleApprove = async () => {
    if (!approveModal) return
    await updateRequestStatus(approveModal.id, 'approved', commissionRatio)
    setReceived(received.map((r) => r.id === approveModal.id ? { ...r, status: 'approved', commission_ratio: commissionRatio } : r))
    setApproveModal(null)
    toast.success('공동중개가 승인되었습니다.')
  }

  const handleReject = async (id: string) => {
    if (!confirm('거절하시겠습니까?')) return
    await updateRequestStatus(id, 'rejected')
    setReceived(received.map((r) => r.id === id ? { ...r, status: 'rejected' } : r))
    toast.success('요청이 거절되었습니다.')
  }

  const current = tab === 'received' ? received : sent
  const pendingCount = received.filter((r) => r.status === 'pending').length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">요청 관리</h1>
          <p className="mt-1 text-sm text-gray-500">공동중개 요청을 승인/거절하고 보낸 요청을 추적합니다.</p>
        </div>
        <Link to="/admin/co-brokerage" className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200">
          공유 매물 풀
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        <button
          onClick={() => setTab('received')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'received' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          받은 요청 {pendingCount > 0 && <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">{pendingCount}</span>}
        </button>
        <button
          onClick={() => setTab('sent')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'sent' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          보낸 요청
        </button>
      </div>

      {/* Request List */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      ) : current.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-400">
          {tab === 'received' ? '받은 요청이 없습니다.' : '보낸 요청이 없습니다.'}
        </div>
      ) : (
        <div className="space-y-3">
          {current.map((req) => (
            <div key={req.id} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${coBrokerageStatusColor[req.status]}`}>
                      {coBrokerageStatusLabel[req.status]}
                    </span>
                    <span className="text-[10px] text-gray-400">{formatRelativeTime(req.created_at)}</span>
                  </div>
                  <h3 className="mt-1 text-sm font-bold">{req.property_title}</h3>
                  <p className="text-xs text-gray-400">{req.address}</p>

                  {/* Requester/Agent info */}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-600">
                      {req.requester_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-medium">{req.requester_name}</p>
                      <p className="text-[10px] text-gray-400">{req.requester_office}</p>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="mt-2 rounded-lg bg-gray-50 p-2">
                    <p className="text-xs text-gray-600">{req.message}</p>
                  </div>

                  {/* Commission ratio if approved */}
                  {req.status === 'approved' && req.commission_ratio && (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <span className="text-gray-400">수수료 배분:</span>
                      <span className="font-medium text-primary-600">{req.commission_ratio}:{100 - req.commission_ratio}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {tab === 'received' && req.status === 'pending' && (
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => { setApproveModal(req); setCommissionRatio(50) }}
                      className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
                    >
                      승인
                    </button>
                    <button
                      onClick={() => handleReject(req.id)}
                      className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
                    >
                      거절
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approve Modal with Commission Ratio */}
      {approveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold">공동중개 승인</h2>
            <p className="mt-2 text-sm text-gray-600">{approveModal.property_title}</p>
            <p className="text-xs text-gray-400">{approveModal.requester_name} ({approveModal.requester_office})</p>

            <div className="mt-4">
              <label className="mb-2 block text-xs text-gray-400">수수료 배분 비율</label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-xs text-gray-400">본인</p>
                  <input
                    type="number"
                    min={10}
                    max={90}
                    value={commissionRatio}
                    onChange={(e) => setCommissionRatio(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-center text-sm font-bold"
                  />
                </div>
                <span className="text-gray-400">:</span>
                <div className="flex-1">
                  <p className="text-xs text-gray-400">요청자</p>
                  <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-center text-sm font-bold text-gray-600">
                    {100 - commissionRatio}
                  </div>
                </div>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div className="h-full bg-primary-600 transition-all" style={{ width: `${commissionRatio}%` }} />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={() => setApproveModal(null)} className="flex-1 rounded-lg bg-gray-100 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-200">취소</button>
              <button onClick={handleApprove} className="flex-1 rounded-lg bg-primary-600 py-2.5 text-sm font-medium text-white hover:bg-primary-700">승인</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

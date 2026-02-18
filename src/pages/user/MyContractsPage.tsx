import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Contract, ContractProcess } from '@/types/database'
import { fetchMyContracts, fetchContractById, fetchContractProcess, getStepDocuments } from '@/api/contracts'
import { contractStatusLabel, contractStatusColor, contractTemplateLabel, transactionTypeLabel, formatPrice, formatDate, formatDDay, dDayColor, formatDateTime } from '@/utils/format'

export function MyContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchMyContracts().then((data) => {
      if (!cancelled) { setContracts(data); setIsLoading(false) }
    })
    return () => { cancelled = true }
  }, [])

  if (isLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">내 계약 현황</h1>
        <Link to="/" className="text-sm text-primary-600 hover:underline">홈으로</Link>
      </div>

      {contracts.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-gray-400">진행중인 계약이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contracts.map((ct) => {
            const price = ct.price_info as Record<string, number>
            const mainPrice = ct.transaction_type === 'sale' ? price.salePrice : price.deposit
            return (
              <Link key={ct.id} to={`/my/contracts/${ct.id}`}
                className="block rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${contractStatusColor[ct.status]}`}>
                        {contractStatusLabel[ct.status]}
                      </span>
                      <span className="text-xs text-gray-400">{ct.contract_number}</span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-gray-800">
                      {contractTemplateLabel[ct.template_type]}
                    </p>
                    <p className="text-sm font-bold text-primary-700">
                      {transactionTypeLabel[ct.transaction_type]} {formatPrice(mainPrice)}
                    </p>
                  </div>
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Read-only tracker view for users
export function MyContractDetailPage() {
  const { id } = useParams()
  const [contract, setContract] = useState<Contract | null>(null)
  const [steps, setSteps] = useState<ContractProcess[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    Promise.all([
      fetchContractById(id),
      fetchContractProcess(id),
    ]).then(([ct, procs]) => {
      if (!cancelled) { setContract(ct); setSteps(procs); setIsLoading(false) }
    })
    return () => { cancelled = true }
  }, [id])

  if (isLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>
  }

  if (!contract) {
    return <div className="py-20 text-center"><p className="text-gray-500">계약을 찾을 수 없습니다.</p><Link to="/my/contracts" className="mt-3 inline-block text-sm text-primary-600 hover:underline">목록으로</Link></div>
  }

  const completedCount = steps.filter((s) => s.is_completed).length
  const progress = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0
  const price = contract.price_info as Record<string, number>
  const mainPrice = contract.transaction_type === 'sale' ? price.salePrice : price.deposit

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
        <Link to="/my/contracts" className="hover:text-gray-600">내 계약</Link>
        <span>/</span>
        <span className="text-gray-600">{contract.contract_number}</span>
      </div>

      {/* Summary */}
      <div className="mb-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <div className="flex items-center gap-2">
          <span className={`rounded-md px-2.5 py-0.5 text-xs font-semibold ${contractStatusColor[contract.status]}`}>
            {contractStatusLabel[contract.status]}
          </span>
          <span className="text-sm font-semibold">{contract.contract_number}</span>
        </div>
        <p className="mt-1 text-sm text-gray-500">{contractTemplateLabel[contract.template_type]}</p>
        <p className="mt-1 text-lg font-bold text-primary-700">
          {transactionTypeLabel[contract.transaction_type]} {formatPrice(mainPrice)}
        </p>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>진행률</span>
            <span>{progress}% ({completedCount}/{steps.length})</span>
          </div>
          <div className="mt-1 h-3 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Move-in guide link for lease contracts */}
        {contract.transaction_type !== 'sale' && (
          <Link
            to={`/my/move-in-guide/${contract.id}`}
            className="mt-4 flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-sm font-medium text-blue-700 hover:bg-blue-100"
          >
            <span>🏠</span>
            <span>전입신고 가이드 보기</span>
            <svg className="ml-auto h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>

      {/* Read-only Timeline */}
      <div className="space-y-4">
        {steps.map((step, idx) => {
          const docs = getStepDocuments(step.step_type, contract.transaction_type)
          return (
            <div key={step.id} className={`rounded-xl p-4 ${step.is_completed ? 'bg-green-50 ring-1 ring-green-200' : 'bg-white ring-1 ring-gray-200'}`}>
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  step.is_completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {step.is_completed ? '\u2713' : idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-semibold ${step.is_completed ? 'text-green-700' : 'text-gray-800'}`}>
                      {step.step_label}
                    </p>
                    {step.due_date && !step.is_completed && (
                      <span className={`text-sm ${dDayColor(step.due_date)}`}>{formatDDay(step.due_date)}</span>
                    )}
                  </div>

                  {step.due_date && (
                    <p className="text-xs text-gray-400">예정일: {formatDate(step.due_date)}</p>
                  )}
                  {step.is_completed && step.completed_at && (
                    <p className="text-xs text-green-600">완료: {formatDateTime(step.completed_at)}</p>
                  )}
                  {step.notes && (
                    <p className="mt-1 text-xs text-gray-500">{step.notes}</p>
                  )}

                  {/* Documents needed */}
                  {docs.length > 0 && !step.is_completed && (
                    <div className="mt-2">
                      <p className="text-[10px] font-medium text-gray-400">필요 서류</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {docs.map((doc) => (
                          <span key={doc} className="rounded bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">{doc}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

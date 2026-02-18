import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import type { Contract, ContractProcess, ContractStatus, Property } from '@/types/database'
import { fetchContractById, fetchContractProcess, toggleProcessStep, updateProcessStep, updateContractStatus, getStepDocuments } from '@/api/contracts'
import { fetchPropertyById } from '@/api/properties'
import { generateContent, saveGenerationLog } from '@/api/gemini'
import { saveMoveInGuide } from '@/api/moveInGuide'
import { requestSignature } from '@/api/legal'
import type { SignatureStatus } from '@/api/legal'
import { Button } from '@/components/common'
import { contractStatusLabel, contractStatusColor, contractTemplateLabel, transactionTypeLabel, formatPrice, formatDDay, dDayColor, formatDateTime } from '@/utils/format'
import toast from 'react-hot-toast'

export function ContractTrackerPage() {
  const { id } = useParams()
  const [contract, setContract] = useState<Contract | null>(null)
  const [steps, setSteps] = useState<ContractProcess[]>([])
  const [property, setProperty] = useState<Property | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isReviewing, setIsReviewing] = useState(false)
  const [reviewResult, setReviewResult] = useState<string | null>(null)
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false)
  const [signatureStatus, setSignatureStatus] = useState<SignatureStatus>('unsigned')
  const [isRequestingSignature, setIsRequestingSignature] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    Promise.all([
      fetchContractById(id),
      fetchContractProcess(id),
    ]).then(([ct, procs]) => {
      if (cancelled) return
      setContract(ct)
      setSteps(procs)
      setIsLoading(false)
      if (ct?.property_id) {
        fetchPropertyById(ct.property_id).then((p) => {
          if (!cancelled) setProperty(p)
        })
      }
    })
    return () => { cancelled = true }
  }, [id])

  const handleToggle = async (stepId: string) => {
    const updated = await toggleProcessStep(stepId)
    if (updated) {
      setSteps((prev) => prev.map((s) => s.id === stepId ? updated : s))
    }
  }

  const handleDateChange = async (stepId: string, date: string) => {
    await updateProcessStep(stepId, { due_date: date })
    setSteps((prev) => prev.map((s) => s.id === stepId ? { ...s, due_date: date } : s))
  }

  const handleNotesChange = async (stepId: string, notes: string) => {
    await updateProcessStep(stepId, { notes })
    setSteps((prev) => prev.map((s) => s.id === stepId ? { ...s, notes } : s))
  }

  const handleStatusChange = async (status: ContractStatus) => {
    if (!contract) return
    await updateContractStatus(contract.id, status)
    setContract((prev) => prev ? { ...prev, status } : prev)
    toast.success(`계약 상태를 "${contractStatusLabel[status]}"(으)로 변경했습니다.`)
  }

  const handleLegalReview = async () => {
    if (!contract) return
    setIsReviewing(true)
    setReviewResult(null)
    try {
      const seller = contract.seller_info as Record<string, string>
      const buyer = contract.buyer_info as Record<string, string>
      const price = contract.price_info as Record<string, number | string>
      const prompt = `아래 부동산 계약서 내용을 법률적으로 검토해주세요.

계약서 정보:
- 계약번호: ${contract.contract_number}
- 거래유형: ${transactionTypeLabel[contract.transaction_type]}
- 양식: ${contractTemplateLabel[contract.template_type]}
- 매도인/임대인: ${seller.name || '-'}, 연락처: ${seller.phone || '-'}
- 매수인/임차인: ${buyer.name || '-'}, 연락처: ${buyer.phone || '-'}
- 가격 정보: ${JSON.stringify(price)}
- 특약사항: ${contract.special_terms || '없음'}
${property ? `- 매물 주소: ${property.address}` : ''}

각 항목을 ✅적합 / ⚠️주의 / ❌위반으로 분류하고, 관련 법률 조항을 인용해주세요.
결과 형식:
[적합] 항목명 - 설명 (근거: 법률 조항)
[주의] 항목명 - 수정 권고 내용 (근거: 법률 조항)
[위반] 항목명 - 필수 수정 내용 (근거: 법률 조항)

마지막에 요약(적합 N건, 주의 N건, 위반 N건)을 표시해주세요.`

      const systemPrompt = `당신은 대한민국 부동산 법률 전문가입니다. 다음 법률을 기반으로 계약서를 검토합니다:
- 공인중개사법 (중개대상물 확인·설명 의무, 중개보수)
- 민법 (계약의 성립, 해제, 손해배상)
- 주택임대차보호법 (대항력, 우선변제권, 소액임차인 보호, 임차권등기명령)
- 상가건물 임대차보호법 (권리금 보호, 계약갱신요구권)
- 전자서명법 (전자문서의 효력)
- 부동산 거래신고 등에 관한 법률 (거래신고 의무)
- 개인정보 보호법 (개인정보 수집·이용)

정확한 법률 조항을 인용하고, 실무적으로 유용한 조언을 제공하세요.`

      const text = await generateContent(prompt, systemPrompt)
      setReviewResult(text)

      await saveGenerationLog({
        type: 'legal_review',
        input_data: { contract_id: contract.id, contract_number: contract.contract_number },
        output_text: text,
      })

      toast.success('AI 법률 검토가 완료되었습니다.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'AI 검토 중 오류가 발생했습니다.')
    } finally {
      setIsReviewing(false)
    }
  }

  const handleGenerateMoveInGuide = async () => {
    if (!contract || !property) return
    setIsGeneratingGuide(true)
    try {
      const buyer = contract.buyer_info as Record<string, string>
      const prompt = `아래 임대차 계약 정보를 기반으로 맞춤 전입신고 가이드를 작성해주세요.

매물 주소: ${property.address}
임차인: ${buyer.name || '-'}
계약유형: ${contract.transaction_type === 'jeonse' ? '전세' : '월세'}

다음 내용을 포함해주세요:
1. 관할 주민센터 안내 (주소 기반 추정)
2. 오프라인 전입신고 방법 및 필요 서류
3. 온라인 전입신고 방법 (정부24)
4. 확정일자 받는 방법
5. 전세보증보험(HUG/SGI) 가입 안내
6. 주택임대차보호법 핵심 사항:
   - 대항력 (전입신고 + 점유, 익일 0시 효력)
   - 우선변제권 (확정일자 + 대항력)
   - 소액임차인 최우선변제권
7. 체크리스트 (입주 전/당일/입주 후)

실용적이고 이해하기 쉬운 언어로 작성해주세요.`

      const systemPrompt = '당신은 부동산 전입신고 전문 상담사입니다. 주택임대차보호법에 근거한 정확한 정보를 제공하며, 임차인의 권리 보호를 위한 실질적인 안내를 제공합니다.'

      const text = await generateContent(prompt, systemPrompt)

      await saveMoveInGuide({
        contract_id: contract.id,
        content: text,
        address: property.address,
      })

      await saveGenerationLog({
        type: 'move_in_guide',
        input_data: { contract_id: contract.id, address: property.address },
        output_text: text,
      })

      toast.success('전입신고 가이드가 생성되었습니다. 고객 포털에서 확인할 수 있습니다.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '가이드 생성 중 오류가 발생했습니다.')
    } finally {
      setIsGeneratingGuide(false)
    }
  }

  const handleRequestSignature = async () => {
    if (!contract) return
    const buyer = contract.buyer_info as Record<string, string>
    if (!buyer.name || !buyer.phone) {
      toast.error('서명 대상자 정보가 부족합니다.')
      return
    }
    setIsRequestingSignature(true)
    try {
      const result = await requestSignature(contract.id, buyer.name, buyer.phone)
      setSignatureStatus(result.status)
      toast.success('전자서명 요청이 발송되었습니다. (카카오/네이버 연동 예정)')
    } catch {
      toast.error('전자서명 요청에 실패했습니다.')
    } finally {
      setIsRequestingSignature(false)
    }
  }

  const handleShare = () => {
    const url = `${window.location.origin}/my/contracts/${contract?.id}`
    navigator.clipboard.writeText(url)
    toast.success('공유 링크가 복사되었습니다.')
  }

  if (isLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>
  }

  if (!contract) {
    return <div className="py-20 text-center"><p className="text-gray-500">계약을 찾을 수 없습니다.</p><Link to="/admin/contracts" className="mt-3 inline-block text-sm text-primary-600 hover:underline">목록으로</Link></div>
  }

  const seller = contract.seller_info as Record<string, string>
  const buyer = contract.buyer_info as Record<string, string>
  const price = contract.price_info as Record<string, number | string>
  const completedCount = steps.filter((s) => s.is_completed).length
  const progress = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link to="/admin/contracts" className="hover:text-gray-600">계약 관리</Link>
        <span>/</span>
        <span className="text-gray-600">{contract.contract_number}</span>
      </div>

      {/* Contract Summary */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">{contract.contract_number}</h1>
              <span className={`rounded-md px-2.5 py-0.5 text-xs font-semibold ${contractStatusColor[contract.status]}`}>
                {contractStatusLabel[contract.status]}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">{contractTemplateLabel[contract.template_type]} · {transactionTypeLabel[contract.transaction_type]}</p>
            {property && <p className="mt-0.5 text-sm text-gray-500">{property.title} · {property.address}</p>}
          </div>
          <div className="flex items-center gap-2">
            <select value={contract.status} onChange={(e) => handleStatusChange(e.target.value as ContractStatus)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
              <option value="drafting">작성중</option>
              <option value="pending_sign">서명대기</option>
              <option value="signed">서명완료</option>
              <option value="completed">계약완료</option>
            </select>
            <Button variant="outline" size="sm" onClick={handleLegalReview} isLoading={isReviewing}>
              AI 법률 검토
            </Button>
            {contract.transaction_type !== 'sale' && property && (
              <Button variant="outline" size="sm" onClick={handleGenerateMoveInGuide} isLoading={isGeneratingGuide}>
                전입신고 가이드 발송
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleShare}>고객에게 공유</Button>
            <Button variant="outline" size="sm" onClick={handleRequestSignature} isLoading={isRequestingSignature}>
              전자서명 요청
            </Button>
          </div>
          {signatureStatus !== 'unsigned' && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="text-gray-400">서명 상태:</span>
              {signatureStatus === 'signing' && <span className="rounded-full bg-yellow-100 px-2 py-0.5 font-medium text-yellow-700">서명 진행중</span>}
              {signatureStatus === 'completed' && <span className="rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-700">서명 완료</span>}
            </div>
          )}
        </div>

        {/* Key info */}
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-400">{contract.transaction_type === 'sale' ? '매도인' : '임대인'}</p>
            <p className="mt-0.5 text-sm font-semibold">{seller.name || '-'}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-400">{contract.transaction_type === 'sale' ? '매수인' : '임차인'}</p>
            <p className="mt-0.5 text-sm font-semibold">{buyer.name || '-'}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-400">거래금액</p>
            <p className="mt-0.5 text-sm font-bold text-primary-700">
              {formatPrice(contract.transaction_type === 'sale' ? price.salePrice as number : price.deposit as number)}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-400">진행률</p>
            <p className="mt-0.5 text-sm font-bold text-primary-700">{progress}%</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1 text-right text-xs text-gray-400">{completedCount}/{steps.length} 단계 완료</p>
        </div>
      </div>

      {/* AI Legal Review Result */}
      {reviewResult && (
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold">AI 법률 검토 결과</h2>
            <button onClick={() => setReviewResult(null)} className="text-sm text-gray-400 hover:text-gray-600">닫기</button>
          </div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
            {reviewResult}
          </div>
          <div className="mt-4 rounded-lg bg-amber-50 p-3">
            <p className="text-xs text-amber-700">
              AI 법률 검토는 참고용이며, 최종 판단은 전문 법률가 자문을 권장합니다.
            </p>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <h2 className="mb-6 text-sm font-bold">계약 진행 타임라인</h2>
        <div className="relative space-y-6 pl-8">
          {/* Vertical line */}
          <div className="absolute bottom-0 left-3.5 top-0 w-0.5 bg-gray-200" />

          {steps.map((step, idx) => {
            const docs = getStepDocuments(step.step_type, contract.transaction_type)
            return (
              <div key={step.id} className="relative">
                {/* Circle */}
                <button onClick={() => handleToggle(step.id)}
                  className={`absolute -left-8 top-0.5 flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors ${
                    step.is_completed ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 bg-white text-gray-400 hover:border-primary-400'
                  }`}>
                  {step.is_completed ? '\u2713' : <span className="text-xs">{idx + 1}</span>}
                </button>

                <div className={`rounded-lg p-4 ${step.is_completed ? 'bg-green-50 ring-1 ring-green-200' : 'bg-gray-50 ring-1 ring-gray-200'}`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className={`text-sm font-semibold ${step.is_completed ? 'text-green-700' : 'text-gray-800'}`}>
                        {step.step_label}
                      </p>
                      {step.is_completed && step.completed_at && (
                        <p className="text-xs text-green-600">완료: {formatDateTime(step.completed_at)}</p>
                      )}
                    </div>
                    {step.due_date && !step.is_completed && (
                      <span className={`text-sm font-semibold ${dDayColor(step.due_date)}`}>
                        {formatDDay(step.due_date)}
                      </span>
                    )}
                  </div>

                  {/* Due date + Notes */}
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <div>
                      <label className="text-[10px] text-gray-400">예정일</label>
                      <input type="date" value={step.due_date ?? ''} onChange={(e) => handleDateChange(step.id, e.target.value)}
                        className="block rounded border border-gray-200 px-2 py-1 text-xs" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-400">메모</label>
                      <input type="text" value={step.notes ?? ''} onChange={(e) => handleNotesChange(step.id, e.target.value)}
                        placeholder="메모 입력..." className="block w-full rounded border border-gray-200 px-2 py-1 text-xs" />
                    </div>
                  </div>

                  {/* Documents */}
                  {docs.length > 0 && (
                    <div className="mt-2">
                      <p className="text-[10px] font-medium text-gray-400">필요 서류</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {docs.map((doc) => (
                          <span key={doc} className="rounded bg-white px-2 py-0.5 text-[10px] text-gray-500 ring-1 ring-gray-200">{doc}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

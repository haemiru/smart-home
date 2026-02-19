import { useState, useEffect } from 'react'
import { fetchBillingInfo, changePlan } from '@/api/settings'
import type { BillingInfo } from '@/api/settings'
import type { PlanType } from '@/types/database'
import { useFeatureStore } from '@/stores/featureStore'
import { useAuthStore } from '@/stores/authStore'
import { PLAN_INFO } from '@/config/planFeatures'
import { formatDate } from '@/utils/format'
import toast from 'react-hot-toast'

const plans: { key: PlanType; features: string[] }[] = [
  { key: 'free', features: ['매물 10건', '기본 CRM', '문의 관리', '계약 관리'] },
  { key: 'basic', features: ['매물 무제한', 'AI 도구', '데이터 분석', '임장/임대 관리', '공동중개'] },
  { key: 'pro', features: ['Basic 전체', 'AI 가상스테이징', 'SNS 포스팅', '실시간 채팅', '전자서명'] },
  { key: 'enterprise', features: ['Pro 전체', '전담 매니저', 'API 연동', '맞춤 개발'] },
]

export function BillingSettingsPage() {
  const [billing, setBilling] = useState<BillingInfo | null>(null)
  const [changing, setChanging] = useState(false)
  const setPlan = useFeatureStore((s) => s.setPlan)
  const agentProfile = useAuthStore((s) => s.agentProfile)

  useEffect(() => {
    fetchBillingInfo().then(setBilling)
  }, [])

  async function handleChangePlan(newPlan: PlanType) {
    if (billing?.current_plan === newPlan) return
    setChanging(true)
    try {
      await changePlan(newPlan)
      setPlan(newPlan)
      // Update authStore agentProfile locally
      if (agentProfile) {
        useAuthStore.setState({
          agentProfile: { ...agentProfile, subscription_plan: newPlan, subscription_started_at: new Date().toISOString() },
        })
      }
      const refreshed = await fetchBillingInfo()
      setBilling(refreshed)
      toast.success(`${PLAN_INFO[newPlan].label} 요금제로 변경되었습니다.`)
    } catch {
      toast.error('요금제 변경에 실패했습니다.')
    } finally {
      setChanging(false)
    }
  }

  if (!billing) return <div className="flex h-40 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>

  return (
    <div className="space-y-5">
      {/* Current Plan */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <h2 className="text-sm font-bold">현재 요금제</h2>
        <div className="mt-3 flex items-center gap-4">
          <div className={`rounded-lg px-4 py-2 ${PLAN_INFO[billing.current_plan].bgColor}`}>
            <p className={`text-lg font-bold ${PLAN_INFO[billing.current_plan].textColor}`}>{billing.plan_label}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">
              {billing.price === 0 ? '무료' : billing.price === -1 ? '별도 문의' : `월 ${billing.price.toLocaleString()}원`}
            </p>
            {billing.price > 0 && (
              <p className="text-xs text-gray-400">다음 결제일: {formatDate(billing.next_billing_date)}</p>
            )}
          </div>
        </div>
      </div>

      {/* Plan Comparison */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <h2 className="mb-4 text-sm font-bold">요금제 비교</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const info = PLAN_INFO[plan.key]
            const isCurrent = plan.key === billing.current_plan
            return (
              <div key={plan.key} className={`rounded-xl p-4 ring-1 ${isCurrent ? `${info.bgColor} ring-2` : 'ring-gray-200'}`} style={isCurrent ? { borderColor: info.color } : undefined}>
                <h3 className="text-sm font-bold">{info.label}</h3>
                <p className="mt-1 text-lg font-bold">
                  {info.price === -1 ? '별도 문의' : info.price === 0 ? '무료' : `${info.price.toLocaleString()}원`}
                  {info.price > 0 && <span className="text-xs font-normal text-gray-400">/월</span>}
                </p>
                <ul className="mt-3 space-y-1">
                  {plan.features.map((f) => (
                    <li key={f} className="text-xs text-gray-600">• {f}</li>
                  ))}
                </ul>
                <button
                  onClick={() => handleChangePlan(plan.key)}
                  disabled={isCurrent || changing}
                  className={`mt-3 w-full rounded-lg py-2 text-xs font-medium ${
                    isCurrent
                      ? 'bg-gray-100 text-gray-400'
                      : changing
                        ? 'bg-gray-200 text-gray-400'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  {isCurrent ? '현재 요금제' : changing ? '변경 중...' : '변경'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Payment History */}
      {billing.payment_history.length > 0 && (
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <h2 className="mb-3 text-sm font-bold">결제 이력</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs text-gray-400">
                  <th className="pb-2 pr-4">결제일</th>
                  <th className="pb-2 pr-4">금액</th>
                  <th className="pb-2 pr-4">내역</th>
                  <th className="pb-2">상태</th>
                </tr>
              </thead>
              <tbody>
                {billing.payment_history.map((p, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2.5 pr-4 text-xs">{formatDate(p.date)}</td>
                    <td className="py-2.5 pr-4">{p.amount.toLocaleString()}원</td>
                    <td className="py-2.5 pr-4 text-xs text-gray-500">{p.description}</td>
                    <td className="py-2.5">
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

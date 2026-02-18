import { useState, useEffect } from 'react'
import { fetchBillingInfo } from '@/api/settings'
import type { BillingInfo } from '@/api/settings'
import { formatDate } from '@/utils/format'
import toast from 'react-hot-toast'

const plans = [
  { key: 'free', label: 'Free', price: 0, features: ['매물 10건', '기본 CRM', '문의 관리'] },
  { key: 'basic', label: 'Basic', price: 29000, features: ['매물 무제한', 'AI 도구 기본', '데이터 분석', '임장 관리'] },
  { key: 'pro', label: 'Pro', price: 79000, features: ['Basic 전체', 'AI 고급 기능', 'SNS 포스팅', '실시간 채팅', '전자서명'] },
  { key: 'enterprise', label: 'Enterprise', price: -1, features: ['Pro 전체', '전담 매니저', 'API 연동', '맞춤 개발'] },
]

export function BillingSettingsPage() {
  const [billing, setBilling] = useState<BillingInfo | null>(null)

  useEffect(() => {
    fetchBillingInfo().then(setBilling)
  }, [])

  if (!billing) return <div className="flex h-40 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>

  return (
    <div className="space-y-5">
      {/* Current Plan */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <h2 className="text-sm font-bold">현재 요금제</h2>
        <div className="mt-3 flex items-center gap-4">
          <div className="rounded-lg bg-primary-50 px-4 py-2">
            <p className="text-lg font-bold text-primary-700">{billing.plan_label}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">월 {billing.price.toLocaleString()}원</p>
            <p className="text-xs text-gray-400">다음 결제일: {formatDate(billing.next_billing_date)}</p>
          </div>
        </div>
      </div>

      {/* Plan Comparison */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <h2 className="mb-4 text-sm font-bold">요금제 비교</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const isCurrent = plan.key === billing.current_plan
            return (
              <div key={plan.key} className={`rounded-xl p-4 ring-1 ${isCurrent ? 'bg-primary-50 ring-primary-300' : 'ring-gray-200'}`}>
                <h3 className="text-sm font-bold">{plan.label}</h3>
                <p className="mt-1 text-lg font-bold">
                  {plan.price === -1 ? '별도 문의' : plan.price === 0 ? '무료' : `${plan.price.toLocaleString()}원`}
                  {plan.price > 0 && <span className="text-xs font-normal text-gray-400">/월</span>}
                </p>
                <ul className="mt-3 space-y-1">
                  {plan.features.map((f) => (
                    <li key={f} className="text-xs text-gray-600">• {f}</li>
                  ))}
                </ul>
                <button
                  onClick={() => { if (!isCurrent) toast('요금제 변경은 준비중입니다.') }}
                  disabled={isCurrent}
                  className={`mt-3 w-full rounded-lg py-2 text-xs font-medium ${
                    isCurrent ? 'bg-gray-100 text-gray-400' : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  {isCurrent ? '현재 요금제' : '변경'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Payment History */}
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
    </div>
  )
}

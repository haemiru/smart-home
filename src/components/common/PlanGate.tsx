import { Link } from 'react-router-dom'
import { useFeatureStore, isNavItemVisible } from '@/stores/featureStore'
import { PLAN_INFO } from '@/config/planFeatures'
import type { PlanType } from '@/types/database'

interface PlanGateProps {
  navKey: string
  children: React.ReactNode
}

const PLAN_ORDER: PlanType[] = ['free', 'basic', 'pro', 'enterprise']

/** Wraps a route — renders children if the nav key is available in the current plan, otherwise shows upgrade prompt. */
export function PlanGate({ navKey, children }: PlanGateProps) {
  const { features, plan, isLoaded } = useFeatureStore()

  if (!isLoaded) return null

  if (isNavItemVisible(navKey, features, plan)) {
    return <>{children}</>
  }

  // Find the next plan that unlocks this feature
  const currentIdx = PLAN_ORDER.indexOf(plan)
  const nextPlan = PLAN_ORDER[currentIdx + 1] ?? 'enterprise'
  const nextInfo = PLAN_INFO[nextPlan]

  const NAV_LABELS: Record<string, string> = {
    'ai-tools': 'AI 도구',
    analytics: '데이터 분석',
    legal: '법률 행정',
    'co-brokerage': '공동중개',
    inspection: '임장 관리',
    'rental-mgmt': '임대 관리',
  }
  const featureLabel = NAV_LABELS[navKey] ?? navKey

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-3xl">
          🔒
        </div>
        <h2 className="text-lg font-bold text-gray-900">
          {featureLabel} 기능은 {nextInfo.label} 요금제부터 사용할 수 있습니다
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          현재 <span className={`font-semibold ${PLAN_INFO[plan].textColor}`}>{PLAN_INFO[plan].label}</span> 요금제를 이용 중입니다.
          업그레이드하면 더 많은 기능을 사용할 수 있습니다.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3">
          <Link
            to="/admin/settings/billing"
            className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
          >
            요금제 업그레이드
          </Link>
          <Link
            to="/admin/dashboard"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            대시보드로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  )
}

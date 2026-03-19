import { Link } from 'react-router-dom'
import { useFeatureStore, isNavItemVisible } from '@/stores/featureStore'
import { PLAN_INFO } from '@/config/planFeatures'
import type { PlanType } from '@/types/database'

interface PlanGateProps {
  navKey: string
  children: React.ReactNode
}

const PLAN_ORDER: PlanType[] = ['free', 'basic', 'pro']

type FeatureShowcase = {
  label: string
  icon: string
  features: { title: string; desc: string; icon: string }[]
}

const FEATURE_SHOWCASES: Record<string, FeatureShowcase> = {
  'ai-tools': {
    label: 'AI 도구',
    icon: '🤖',
    features: [
      { title: 'AI 매물설명 생성', desc: '매물 정보를 입력하면 플랫폼별(블로그/네이버/인스타) 맞춤 설명을 AI가 자동 생성합니다.', icon: '✍️' },
      { title: 'AI 법률검토', desc: '계약서를 7개 관련 법률 기준으로 자동 검토하여 적합/주의/위반 사항을 분류합니다.', icon: '⚖️' },
      { title: 'AI 고객 분석', desc: '고객의 활동 데이터를 분석하여 진성 고객 여부, 전환 확률, 추천 액션을 제공합니다.', icon: '📊' },
      { title: 'AI 문의 자동응답', desc: '고객 문의에 대한 답변 초안을 AI가 자동 생성하여 빠른 대응을 돕습니다.', icon: '💬' },
      { title: 'AI 입주 가이드', desc: '임대차 계약 시 세입자를 위한 맞춤 입주 가이드를 자동 생성합니다.', icon: '📋' },
    ],
  },
  analytics: {
    label: '데이터 분석',
    icon: '📈',
    features: [
      { title: '시세 조회 (AVM)', desc: '국토부 실거래가 기반 자동 시세 추정 및 적정가 산출로 정확한 가격 제안이 가능합니다.', icon: '💰' },
      { title: 'ROI 계산기', desc: '매입가, 대출, 임대수익 등을 입력하면 수익률/손익분기점을 자동 계산합니다.', icon: '🧮' },
      { title: '입지 분석', desc: '교통/학군/편의시설/유동인구/개발호재/치안 6개 항목 점수화 리포트를 제공합니다.', icon: '📍' },
      { title: '매수매도 신호등', desc: '거래량, 가격변동, 공급량, 금리, 미분양 5개 지표로 매수/관망/매도 시그널을 제공합니다.', icon: '🚦' },
    ],
  },
  legal: {
    label: '법률 행정',
    icon: '⚖️',
    features: [
      { title: '등기부등본 조회', desc: '주소 입력만으로 등기부등본 갑구/을구를 조회하고 위험 사항을 자동 분석합니다.', icon: '📄' },
      { title: '전자서명 연동', desc: '카카오/네이버 전자서명으로 비대면 계약 체결이 가능합니다. (Pro)', icon: '✒️' },
    ],
  },
  'co-brokerage': {
    label: '공동중개',
    icon: '🤝',
    features: [
      { title: '공유 매물 풀', desc: '다른 중개사무소가 공유한 매물을 검색하고 공동중개를 요청할 수 있습니다.', icon: '🏘️' },
      { title: '요청 관리', desc: '받은/보낸 공동중개 요청을 관리하고 수수료 비율을 협의할 수 있습니다.', icon: '📩' },
      { title: '정보 공개 단계', desc: '기본 → 승인 후 상세 → 계약 시 연락처 순으로 단계별 정보가 공개됩니다.', icon: '🔐' },
    ],
  },
  inspection: {
    label: '임장 관리',
    icon: '🔍',
    features: [
      { title: '모바일 체크리스트', desc: '구조/외관, 수도/배관, 전기/가스 등 23개 항목을 현장에서 바로 체크합니다.', icon: '📱' },
      { title: '사진 기록', desc: '항목별 사진을 촬영하여 기록하고 리포트에 자동 첨부합니다.', icon: '📸' },
      { title: 'AI 리포트', desc: '체크 결과를 기반으로 A~F 등급 리포트를 자동 생성합니다.', icon: '📝' },
    ],
  },
  'rental-mgmt': {
    label: '임대 관리',
    icon: '🏢',
    features: [
      { title: '수납 현황', desc: '임대료 입금 현황을 월별로 추적하고 미수금을 관리합니다.', icon: '💳' },
      { title: '수선 요청', desc: '임차인의 수리 요청을 접수/확인/완료 단계로 관리합니다.', icon: '🔧' },
      { title: '임대인 공유 링크', desc: '수납/수선 현황을 임대인에게 읽기전용 링크로 공유할 수 있습니다.', icon: '🔗' },
      { title: '만기 알림', desc: '임대차 계약 만기일이 다가오면 자동으로 알림을 받습니다.', icon: '⏰' },
    ],
  },
}

/** Wraps a route — renders children if the nav key is available in the current plan, otherwise shows feature showcase. */
export function PlanGate({ navKey, children }: PlanGateProps) {
  const { features, plan, isLoaded } = useFeatureStore()

  if (!isLoaded) return null

  if (isNavItemVisible(navKey, features, plan)) {
    return <>{children}</>
  }

  // Find the next plan that unlocks this feature
  const currentIdx = PLAN_ORDER.indexOf(plan)
  const nextPlan = PLAN_ORDER[currentIdx + 1] ?? 'pro'
  const nextInfo = PLAN_INFO[nextPlan]

  const showcase = FEATURE_SHOWCASES[navKey]
  if (!showcase) {
    // Fallback for unknown navKey
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-3xl">🔒</div>
          <h2 className="text-lg font-bold text-gray-900">이 기능은 {nextInfo.label} 요금제부터 사용할 수 있습니다</h2>
          <Link to="/admin/settings/billing" className="mt-6 inline-block rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-700">
            요금제 업그레이드
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      {/* Header */}
      <div className="text-center">
        <span className="text-5xl">{showcase.icon}</span>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">{showcase.label}</h1>
        <p className="mt-2 text-gray-500">
          <span className={`font-semibold ${nextInfo.textColor}`}>{nextInfo.label}</span> 요금제에서 사용할 수 있습니다
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {showcase.features.map((f) => (
          <div key={f.title} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-2xl">{f.icon}</span>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">{f.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="rounded-2xl bg-gradient-to-r from-primary-50 to-blue-50 p-8 text-center">
        <p className="text-base font-semibold text-gray-800">
          {nextInfo.label} 요금제로 업그레이드하고 {showcase.label} 기능을 사용해보세요
        </p>
        <p className="mt-1 text-sm text-gray-500">
          현재 <span className={`font-semibold ${PLAN_INFO[plan].textColor}`}>{PLAN_INFO[plan].label}</span> 요금제 이용 중
        </p>
        <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/admin/settings/billing"
            className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
          >
            {nextInfo.label} 요금제로 업그레이드 (월 {nextInfo.price.toLocaleString()}원)
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

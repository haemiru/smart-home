import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import type { Customer, CustomerActivity, CustomerType } from '@/types/database'
import { fetchCustomerById, fetchCustomerActivities, updateCustomer, updateCustomerType } from '@/api/customers'
import { fetchPropertyById } from '@/api/properties'
import { generateContent, saveGenerationLog } from '@/api/gemini'
import type { Property } from '@/types/database'
import { customerTypeLabel, customerTypeColor, customerSourceLabel, activityTypeLabel, formatDateTime, formatRelativeTime } from '@/utils/format'
import { Button } from '@/components/common'
import toast from 'react-hot-toast'

type TabKey = 'profile' | 'activity' | 'matching' | 'consultation' | 'memo' | 'analysis'
const tabs: { key: TabKey; label: string }[] = [
  { key: 'profile', label: '프로필' },
  { key: 'activity', label: '활동이력' },
  { key: 'matching', label: '매칭매물' },
  { key: 'consultation', label: '상담기록' },
  { key: 'analysis', label: '진성 분석' },
  { key: 'memo', label: '메모' },
]

const pipelineStages: CustomerType[] = ['lead', 'interest', 'consulting', 'contracting', 'completed']

export function CustomerDetailPage() {
  const { id } = useParams()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [activities, setActivities] = useState<CustomerActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('profile')
  const [propertyCache, setPropertyCache] = useState<Record<string, Property>>({})

  useEffect(() => {
    if (!id) return
    let cancelled = false
    Promise.all([
      fetchCustomerById(id),
      fetchCustomerActivities(id),
    ]).then(([cust, acts]) => {
      if (cancelled) return
      setCustomer(cust)
      setActivities(acts)
      setIsLoading(false)

      // Cache property info
      const pids = [...new Set(acts.filter((a) => a.property_id).map((a) => a.property_id!))]
      for (const pid of pids) {
        fetchPropertyById(pid).then((p) => {
          if (p && !cancelled) setPropertyCache((prev) => ({ ...prev, [pid]: p }))
        })
      }
    })
    return () => { cancelled = true }
  }, [id])

  const handleStageChange = async (type: CustomerType) => {
    if (!customer) return
    await updateCustomerType(customer.id, type)
    setCustomer((prev) => prev ? { ...prev, customer_type: type } : prev)
    toast.success(`단계를 "${customerTypeLabel[type]}"(으)로 변경했습니다.`)
  }

  const handleSaveMemo = async (newMemo: string) => {
    if (!customer) return
    await updateCustomer(customer.id, { memo: newMemo })
    setCustomer((prev) => prev ? { ...prev, memo: newMemo } : prev)
    toast.success('메모가 저장되었습니다.')
  }

  if (isLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>
  }

  if (!customer) {
    return <div className="py-20 text-center"><p className="text-gray-500">고객을 찾을 수 없습니다.</p><Link to="/admin/customers" className="mt-3 inline-block text-sm text-primary-600 hover:underline">목록으로</Link></div>
  }

  const prefs = customer.preferences as Record<string, string>

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link to="/admin/customers" className="hover:text-gray-600">고객 관리</Link>
        <span>/</span>
        <span className="text-gray-600">{customer.name}</span>
      </div>

      {/* Header Card */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-xl font-bold text-primary-700">
              {customer.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{customer.name}</h1>
                <span className={`rounded-md px-2.5 py-0.5 text-xs font-semibold ${customerTypeColor[customer.customer_type]}`}>
                  {customerTypeLabel[customer.customer_type]}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-gray-500">{customer.phone}{customer.email ? ` · ${customer.email}` : ''}</p>
              <p className="text-xs text-gray-400">{customerSourceLabel[customer.source]} · 등록 {formatRelativeTime(customer.created_at)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Score */}
            <div className="text-center">
              <p className="text-xs text-gray-400">스코어</p>
              <p className="text-2xl font-bold text-primary-700">{customer.score}</p>
            </div>
            {/* Stage dropdown */}
            <select
              value={customer.customer_type}
              onChange={(e) => handleStageChange(e.target.value as CustomerType)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              {pipelineStages.map((s) => <option key={s} value={s}>{customerTypeLabel[s]}</option>)}
            </select>
          </div>
        </div>

        {/* Score Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>스코어</span>
            <span>{customer.score}/200</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all"
              style={{ width: `${Math.min(100, (customer.score / 200) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="scrollbar-hide flex gap-1 overflow-x-auto border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <ProfileTab customer={customer} prefs={prefs} />
      )}
      {activeTab === 'activity' && (
        <ActivityTab activities={activities} propertyCache={propertyCache} />
      )}
      {activeTab === 'matching' && (
        <MatchingTab prefs={prefs} />
      )}
      {activeTab === 'consultation' && (
        <ConsultationTab />
      )}
      {activeTab === 'analysis' && (
        <AnalysisTab customer={customer} activities={activities} />
      )}
      {activeTab === 'memo' && (
        <MemoTab initialMemo={customer.memo ?? ''} onSave={handleSaveMemo} />
      )}
    </div>
  )
}

// ============================================================
// Profile Tab
// ============================================================
function ProfileTab({ customer, prefs }: { customer: Customer; prefs: Record<string, string> }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <h3 className="mb-4 text-sm font-semibold">기본 정보</h3>
        <div className="space-y-3 text-sm">
          {([
            ['이름', customer.name],
            ['연락처', customer.phone],
            ['이메일', customer.email || '-'],
            ['소스', customerSourceLabel[customer.source]],
            ['등록일', formatDateTime(customer.created_at)],
            ['최근 업데이트', formatDateTime(customer.updated_at)],
          ] as [string, string][]).map(([label, value]) => (
            <div key={label} className="flex justify-between">
              <span className="text-gray-400">{label}</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <h3 className="mb-4 text-sm font-semibold">선호 조건</h3>
        {Object.keys(prefs).length === 0 ? (
          <p className="text-sm text-gray-400">등록된 선호 조건이 없습니다.</p>
        ) : (
          <div className="space-y-3 text-sm">
            {Object.entries(prefs).map(([key, value]) => {
              const labelMap: Record<string, string> = {
                region: '선호 지역', propertyType: '매물 유형', priceRange: '가격대', area: '면적',
              }
              return (
                <div key={key} className="flex justify-between">
                  <span className="text-gray-400">{labelMap[key] || key}</span>
                  <span className="font-medium">{value}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Score Breakdown */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 lg:col-span-2">
        <h3 className="mb-4 text-sm font-semibold">스코어 산정 기준</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {([
            ['매물 열람', '+5점'],
            ['관심 저장', '+10점'],
            ['문의', '+20점'],
            ['임장 예약', '+30점'],
            ['계약서 열람', '+40점'],
            ['7일 미활동', '-15점'],
          ] as [string, string][]).map(([label, score]) => (
            <div key={label} className="rounded-lg bg-gray-50 p-3 text-center">
              <p className="text-xs text-gray-400">{label}</p>
              <p className={`mt-1 text-sm font-bold ${score.startsWith('-') ? 'text-red-500' : 'text-primary-700'}`}>{score}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Activity Timeline Tab
// ============================================================
function ActivityTab({ activities, propertyCache }: { activities: CustomerActivity[]; propertyCache: Record<string, Property> }) {
  const activityIcons: Record<string, string> = {
    view: '\uD83D\uDC41\uFE0F',
    favorite: '\u2764\uFE0F',
    inquiry: '\uD83D\uDCE9',
    appointment: '\uD83D\uDCC5',
    contract_view: '\uD83D\uDCDD',
  }

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
      <h3 className="mb-4 text-sm font-semibold">활동 이력</h3>
      {activities.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">활동 이력이 없습니다.</p>
      ) : (
        <div className="relative space-y-4 pl-6">
          {/* Timeline line */}
          <div className="absolute bottom-0 left-2.5 top-0 w-px bg-gray-200" />

          {activities.map((act) => {
            const prop = act.property_id ? propertyCache[act.property_id] : null
            return (
              <div key={act.id} className="relative">
                {/* Dot */}
                <div className="absolute -left-6 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs ring-2 ring-gray-200">
                  {activityIcons[act.activity_type] || '\u2022'}
                </div>
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{activityTypeLabel[act.activity_type]}</span>
                    {prop && (
                      <Link to={`/admin/properties/${prop.id}`} className="ml-1 text-primary-600 hover:underline">
                        {prop.title}
                      </Link>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">{formatDateTime(act.created_at)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ============================================================
// Matching Properties Tab (placeholder)
// ============================================================
function MatchingTab({ prefs }: { prefs: Record<string, string> }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
      <h3 className="mb-4 text-sm font-semibold">매칭 매물</h3>
      <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
        <div className="text-center">
          <p className="text-sm text-gray-400">고객 선호 조건 기반 매물 자동 매칭 (추후 구현)</p>
          {prefs.region && <p className="mt-1 text-xs text-gray-400">선호 지역: {prefs.region}</p>}
          {prefs.propertyType && <p className="text-xs text-gray-400">매물 유형: {prefs.propertyType}</p>}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Consultation Records Tab (placeholder)
// ============================================================
function ConsultationTab() {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">상담 기록</h3>
        <Button size="sm" onClick={() => toast('상담 기록 추가 기능은 추후 구현 예정입니다.')}>+ 상담 기록 추가</Button>
      </div>
      <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
        <p className="text-sm text-gray-400">상담 기록이 없습니다. (추후 구현 예정)</p>
      </div>
    </div>
  )
}

// ============================================================
// AI Analysis Tab
// ============================================================
function AnalysisTab({ customer, activities }: { customer: Customer; activities: CustomerActivity[] }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<string | null>(null)

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    setAnalysisResult(null)

    try {
      const prefs = customer.preferences as Record<string, string>

      // Aggregate activity data
      const activitySummary = activities.reduce<Record<string, number>>((acc, act) => {
        acc[act.activity_type] = (acc[act.activity_type] || 0) + 1
        return acc
      }, {})

      const prompt = `아래 고객 데이터를 분석하여 진성 고객 분석 리포트를 작성해주세요.

고객 정보:
- 이름: ${customer.name}
- 현재 단계: ${customerTypeLabel[customer.customer_type]}
- 스코어: ${customer.score}점
- 소스: ${customerSourceLabel[customer.source]}
- 등록일: ${customer.created_at}
- 최근 업데이트: ${customer.updated_at}
- 선호 조건: ${Object.entries(prefs).map(([k, v]) => `${k}: ${v}`).join(', ') || '없음'}
- 메모: ${customer.memo || '없음'}

활동 이력 집계:
${Object.entries(activitySummary).map(([type, count]) => `- ${activityTypeLabel[type]}: ${count}회`).join('\n')}
- 총 활동: ${activities.length}건
- 첫 활동: ${activities.length > 0 ? activities[activities.length - 1].created_at : '없음'}
- 최근 활동: ${activities.length > 0 ? activities[0].created_at : '없음'}

분석 결과를 다음 형식으로 작성해주세요:

## 진성도 스코어: __/100점
## 계약전환확률: __%

## 추정 프로필
- 추정 연령대: (신뢰도 %)
- 추정 목적: (신뢰도 %)
- 추정 가족구성: (신뢰도 %)
- 추정 예산: (신뢰도 %)
- 관심 지역: (신뢰도 %)

## 행동 근거
(활동 패턴 분석 3-5개)

## AI 추천 액션
1. (구체적 액션)
2. (구체적 액션)
3. (구체적 액션)`

      const systemPrompt = '당신은 부동산 CRM 분석 전문가입니다. 고객 행동 데이터를 분석하여 진성 고객 여부를 판단하고, 계약 전환 가능성을 예측합니다. 객관적이고 데이터에 근거한 분석을 제공하세요.'

      const text = await generateContent(prompt, systemPrompt)
      setAnalysisResult(text)

      await saveGenerationLog({
        type: 'customer_analysis',
        input_data: { customer_id: customer.id, customer_name: customer.name },
        output_text: text,
      })

      toast.success('AI 분석이 완료되었습니다.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'AI 분석 중 오류가 발생했습니다.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold">AI 고객 성향 분석</h3>
          <Button size="sm" onClick={handleAnalyze} isLoading={isAnalyzing}>
            {isAnalyzing ? '분석 중...' : '분석 실행'}
          </Button>
        </div>

        {!analysisResult && !isAnalyzing && (
          <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
            <div className="text-center">
              <p className="text-3xl">🧠</p>
              <p className="mt-2 text-sm text-gray-500">AI가 고객의 활동 이력과 선호 조건을 분석하여</p>
              <p className="text-sm text-gray-500">진성도, 계약전환확률, 추천 액션을 제공합니다.</p>
              <button
                onClick={handleAnalyze}
                className="mt-3 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
              >
                분석 시작하기
              </button>
            </div>
          </div>
        )}

        {analysisResult && (
          <div className="space-y-4">
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
              {analysisResult}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
              <button
                onClick={() => toast.success('맞춤 매물 추천 발송 기능은 추후 구현 예정입니다.')}
                className="rounded-lg bg-primary-600 px-4 py-2 text-xs font-medium text-white hover:bg-primary-700"
              >
                맞춤 매물 추천 발송
              </button>
              <button
                onClick={() => toast.success('상담 스크립트 생성 기능은 추후 구현 예정입니다.')}
                className="rounded-lg border border-primary-200 bg-primary-50 px-4 py-2 text-xs font-medium text-primary-700 hover:bg-primary-100"
              >
                상담 스크립트 생성
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// Memo Tab
// ============================================================
function MemoTab({ initialMemo, onSave }: { initialMemo: string; onSave: (memo: string) => void }) {
  const [memo, setMemo] = useState(initialMemo)

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
      <h3 className="mb-4 text-sm font-semibold">내부 메모</h3>
      <textarea
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        rows={8}
        placeholder="고객에 대한 내부 메모를 입력하세요..."
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
      />
      <div className="mt-3 flex justify-end">
        <Button onClick={() => onSave(memo)}>메모 저장</Button>
      </div>
    </div>
  )
}

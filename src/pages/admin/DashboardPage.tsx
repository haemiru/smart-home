import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import {
  fetchDashboardSummary, fetchMonthlyPerformance, fetchUnansweredInquiries,
  fetchInquiryStatusCounts,
  fetchTodaySchedule, fetchPropertyStats, fetchActivityFeed, fetchTodoList,
} from '@/api/dashboard'
import type {
  DashboardSummary, MonthlyPerformance, InquiryStatusCounts, ScheduleItem,
  PropertyStat, ActivityItem, TodoItem,
} from '@/api/dashboard'
import type { Inquiry } from '@/types/database'
import { formatRelativeTime, formatPrice, inquiryStatusIcon } from '@/utils/format'
import { PLAN_INFO } from '@/config/planFeatures'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export function DashboardPage() {
  const { user, agentProfile } = useAuthStore()
  const emptySummary: DashboardSummary = { newInquiries: 0, inquiryDelta: 0, activeContracts: 0, completedContracts: 0, totalProperties: 0, activeProperties: 0, contractedProperties: 0, completedProperties: 0, totalCustomers: 0 }
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary)
  const [performance, setPerformance] = useState<MonthlyPerformance | null>(null)
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [inquiryCounts, setInquiryCounts] = useState<InquiryStatusCounts>({ new: 0, checked: 0, in_progress: 0, answered: 0, closed: 0 })
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [propertyStats, setPropertyStats] = useState<PropertyStat[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [doneTodos, setDoneTodos] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('dashboard_done_todos')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch { return new Set() }
  })

  useEffect(() => {
    // 각 섹션 독립적으로 fetch — 하나가 느려도 다른 섹션에 영향 없음
    fetchDashboardSummary().then(setSummary).catch(() => {})
    fetchMonthlyPerformance().then(setPerformance).catch(() => {})
    fetchUnansweredInquiries().then(setInquiries).catch(() => {})
    fetchInquiryStatusCounts().then(setInquiryCounts).catch(() => {})
    fetchTodaySchedule().then(setSchedule).catch(() => {})
    fetchPropertyStats().then(setPropertyStats).catch(() => {})
    fetchActivityFeed().then(setActivities).catch(() => {})
    fetchTodoList().then(setTodos).catch(() => {})
  }, [])

  const delta = (cur: number, prev: number) => {
    const diff = cur - prev
    if (diff > 0) return <span className="text-xs text-green-600">+{diff}</span>
    if (diff < 0) return <span className="text-xs text-red-600">{diff}</span>
    return <span className="text-xs text-gray-400">-</span>
  }

  const todayItems = schedule.filter((s) => s.type === 'today')
  const tomorrowItems = schedule.filter((s) => s.type === 'tomorrow')

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">
          안녕하세요, {user?.display_name || '관리자'}님
          {agentProfile && (() => {
            const planInfo = PLAN_INFO[agentProfile.subscription_plan]
            return (
              <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${planInfo.bgColor} ${planInfo.textColor}`}>
                {planInfo.label}
              </span>
            )
          })()}
          {agentProfile?.is_verified && (
            <span className="ml-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">인증 중개사</span>
          )}
        </h1>
        <p className="mt-1 text-sm text-gray-500">오늘의 업무 현황을 확인하세요.</p>
      </div>

      {/* 1. Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/admin/inquiries" className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-2xl">📩</span>
            {summary.inquiryDelta !== 0 && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${summary.inquiryDelta > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {summary.inquiryDelta > 0 ? '+' : ''}{summary.inquiryDelta} 전일 대비
              </span>
            )}
          </div>
          <p className="mt-3 text-2xl font-bold text-red-600">{summary.newInquiries}건</p>
          <p className="text-sm text-gray-500">신규 문의</p>
        </Link>
        <Link to="/admin/contracts" className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 transition-shadow hover:shadow-md">
          <span className="text-2xl">📝</span>
          <p className="mt-3 text-2xl font-bold text-blue-600">{summary.activeContracts + summary.completedContracts}건</p>
          <p className="text-sm text-gray-500">계약</p>
          <div className="mt-1 flex gap-2 text-xs text-gray-400">
            {summary.activeContracts > 0 && <span className="text-blue-500">진행중 {summary.activeContracts}</span>}
            {summary.completedContracts > 0 && <span className="text-green-500">완료 {summary.completedContracts}</span>}
          </div>
        </Link>
        <Link to="/admin/properties" className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 transition-shadow hover:shadow-md">
          <span className="text-2xl">🏠</span>
          <p className="mt-3 text-2xl font-bold text-green-600">{summary.totalProperties}건</p>
          <p className="text-sm text-gray-500">등록 매물</p>
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-400">
            {summary.activeProperties > 0 && <span className="text-green-500">활성 {summary.activeProperties}</span>}
            {summary.contractedProperties > 0 && <span className="text-blue-500">계약중 {summary.contractedProperties}</span>}
            {summary.completedProperties > 0 && <span className="text-gray-500">완료 {summary.completedProperties}</span>}
          </div>
        </Link>
        <Link to="/admin/customers" className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 transition-shadow hover:shadow-md">
          <span className="text-2xl">👥</span>
          <p className="mt-3 text-2xl font-bold text-purple-600">{summary.totalCustomers}명</p>
          <p className="text-sm text-gray-500">관리 고객</p>
        </Link>
      </div>

      {/* 2-column layout for middle sections */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* 2. Monthly Performance */}
        {performance && (
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <h2 className="text-sm font-bold">이번 달 성과</h2>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-gray-400">매물 등록</p>
                <p className="text-lg font-bold">{performance.propertyRegistrations}건</p>
                <p>{delta(performance.propertyRegistrations, performance.prevPropertyRegistrations)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">계약 성사</p>
                <p className="text-lg font-bold">{performance.contractsClosed}건</p>
                <p>{delta(performance.contractsClosed, performance.prevContractsClosed)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">총 거래액</p>
                <p className="text-lg font-bold">{formatPrice(performance.totalTransactionAmount)}</p>
                <p>{delta(performance.totalTransactionAmount, performance.prevTransactionAmount)}</p>
              </div>
            </div>
            <div className="mt-4 h-36">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performance.monthlyTrend} barGap={2}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="registrations" name="매물등록" fill="#60A5FA" radius={[4, 4, 0, 0]} barSize={16} />
                  <Bar dataKey="contracts" name="계약성사" fill="#34D399" radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 3. Inquiry Status Overview */}
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">문의 현황</h2>
            <Link to="/admin/inquiries" className="text-xs text-primary-600 hover:underline">전체 보기</Link>
          </div>
          {/* Status summary cards */}
          {(() => {
            const total = inquiryCounts.new + inquiryCounts.checked + inquiryCounts.in_progress + inquiryCounts.answered + inquiryCounts.closed
            const items = [
              { label: '새문의', count: inquiryCounts.new, color: 'bg-red-500' },
              { label: '확인', count: inquiryCounts.checked, color: 'bg-orange-400' },
              { label: '진행중', count: inquiryCounts.in_progress, color: 'bg-yellow-400' },
              { label: '답변완료', count: inquiryCounts.answered, color: 'bg-green-500' },
              { label: '종결', count: inquiryCounts.closed, color: 'bg-gray-400' },
            ]
            const maxCount = Math.max(total, 1)
            return (
              <div className="mt-4 space-y-3">
                {items.map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="w-14 shrink-0 text-right text-xs text-gray-500">{item.label}</span>
                    <div className="flex-1">
                      {item.count > 0 ? (
                        <div className="h-6 w-full overflow-hidden rounded-full bg-gray-100">
                          <div
                            className={`flex h-full items-center rounded-full ${item.color} transition-all duration-500`}
                            style={{ width: `${Math.max((item.count / maxCount) * 100, 8)}%` }}
                          >
                            <span className="px-2 text-xs font-bold text-white">{item.count}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">0건</span>
                      )}
                    </div>
                  </div>
                ))}
                {total > 0 && (
                  <p className="text-right text-xs text-gray-400">총 {total}건</p>
                )}
              </div>
            )
          })()}
          {/* Unanswered list */}
          {inquiries.length > 0 && (
            <div className="mt-3 border-t border-gray-100 pt-3">
              <p className="mb-2 text-xs font-medium text-red-500">미답변 {inquiries.length}건</p>
              <div className="space-y-1.5">
                {inquiries.slice(0, 3).map((inq) => (
                  <Link key={inq.id} to={`/admin/inquiries/${inq.id}`} className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-gray-50">
                    <span className="text-xs">{inquiryStatusIcon[inq.status] || '🔵'}</span>
                    <span className="min-w-0 flex-1 truncate text-xs font-medium">{inq.name}</span>
                    <span className="shrink-0 text-[10px] text-gray-400">{formatRelativeTime(inq.created_at)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 4. Today's Schedule */}
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <h2 className="text-sm font-bold">오늘의 일정</h2>
          {todayItems.length === 0 && tomorrowItems.length === 0 ? (
            <div className="mt-4 flex h-24 items-center justify-center text-sm text-gray-400">예정된 일정이 없습니다.</div>
          ) : (
            <div className="mt-3 space-y-3">
              {todayItems.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium text-primary-600">오늘</p>
                  <div className="mt-1 space-y-2">
                    {todayItems.map((s) => (
                      <div key={s.id} className="flex items-center gap-3 rounded-lg bg-primary-50/50 p-2">
                        <span className="shrink-0 rounded bg-primary-100 px-2 py-0.5 text-xs font-bold text-primary-700">{s.time}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{s.title}</p>
                          <p className="text-xs text-gray-400">{s.address}{s.customer && ` · ${s.customer}`}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {tomorrowItems.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium text-gray-400">내일</p>
                  <div className="mt-1 space-y-2">
                    {tomorrowItems.map((s) => (
                      <div key={s.id} className="flex items-center gap-3 rounded-lg p-2">
                        <span className="shrink-0 rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{s.time}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{s.title}</p>
                          <p className="text-xs text-gray-400">{s.address}{s.customer && ` · ${s.customer}`}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 5. Property Stats */}
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">매물별 통계 (상위 5)</h2>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-400" />조회</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-300" />문의</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-yellow-300" />찜</span>
            </div>
          </div>
          {propertyStats.length === 0 ? (
            <div className="mt-4 flex h-24 items-center justify-center text-sm text-gray-400">매물 데이터가 없습니다.</div>
          ) : (
            <div className="mt-4 space-y-3">
              {propertyStats.map((p) => {
                const maxVal = Math.max(p.views, p.inquiries, p.favorites, 1)
                const bars = [
                  { value: p.views, color: 'bg-blue-400', textColor: 'text-white', label: '조회' },
                  { value: p.inquiries, color: 'bg-red-300', textColor: 'text-white', label: '문의' },
                  { value: p.favorites, color: 'bg-yellow-300', textColor: 'text-gray-700', label: '찜' },
                ]
                const hasAny = p.views > 0 || p.inquiries > 0 || p.favorites > 0
                return (
                  <div key={p.id}>
                    <p className="mb-1 truncate text-xs font-medium text-gray-700">{p.title || '(제목없음)'}</p>
                    {hasAny ? (
                      <div className="space-y-1">
                        {bars.map((bar) => bar.value > 0 ? (
                          <div key={bar.label} className="flex items-center gap-2">
                            <div className="h-4 flex-1 overflow-hidden rounded-full bg-gray-100">
                              <div className={`flex h-full items-center rounded-full ${bar.color} transition-all duration-500`} style={{ width: `${Math.max((bar.value / maxVal) * 100, 8)}%` }}>
                                <span className={`px-1.5 text-[10px] font-bold ${bar.textColor}`}>{bar.value}</span>
                              </div>
                            </div>
                          </div>
                        ) : null)}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-300">데이터 없음</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom 2-column */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* 6. Activity Feed */}
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <h2 className="text-sm font-bold">최근 활동</h2>
          {activities.length === 0 ? (
            <div className="mt-4 flex h-24 items-center justify-center text-sm text-gray-400">최근 활동이 없습니다.</div>
          ) : (
            <div className="mt-3 space-y-0">
              {activities.map((act, idx) => (
                <div key={act.id} className="flex gap-3 py-2">
                  <div className="flex flex-col items-center">
                    <span className="text-sm">{act.icon}</span>
                    {idx < activities.length - 1 && <div className="mt-1 w-px flex-1 bg-gray-200" />}
                  </div>
                  <div className="min-w-0 flex-1 pb-2">
                    {act.link ? (
                      <Link to={act.link} className="text-sm text-gray-700 hover:text-primary-600">{act.message}</Link>
                    ) : (
                      <p className="text-sm text-gray-700">{act.message}</p>
                    )}
                    <p className="text-[10px] text-gray-400">{formatRelativeTime(act.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 7. Todo List */}
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <h2 className="text-sm font-bold">할 일</h2>
          {todos.length === 0 ? (
            <div className="mt-4 flex h-24 items-center justify-center text-sm text-gray-400">처리할 할 일이 없습니다.</div>
          ) : (
            <div className="mt-3 space-y-2">
              {todos.map((todo) => {
                const iconMap = { inquiry: '📩', contract: '📝', repair: '🔧', expiring: '⏰' }
                const isDone = doneTodos.has(todo.id)
                return (
                  <div key={todo.id} className="flex items-start gap-3 rounded-lg border border-gray-100 p-3">
                    <button
                      onClick={() => {
                        const next = new Set(doneTodos)
                        if (next.has(todo.id)) next.delete(todo.id)
                        else next.add(todo.id)
                        setDoneTodos(next)
                        try { localStorage.setItem('dashboard_done_todos', JSON.stringify([...next])) } catch { /* skip */ }
                      }}
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                        isDone ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300'
                      }`}
                    >
                      {isDone && <span className="text-xs">✓</span>}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{iconMap[todo.type]}</span>
                        <Link to={todo.link} className={`text-sm font-medium hover:text-primary-600 ${isDone ? 'text-gray-400 line-through' : ''}`}>
                          {todo.label}
                        </Link>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-400">{todo.detail}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

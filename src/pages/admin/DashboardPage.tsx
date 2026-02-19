import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import {
  fetchDashboardSummary, fetchMonthlyPerformance, fetchUnansweredInquiries,
  fetchTodaySchedule, fetchPropertyStats, fetchActivityFeed, fetchTodoList,
} from '@/api/dashboard'
import type {
  DashboardSummary, MonthlyPerformance, ScheduleItem,
  PropertyStat, ActivityItem, TodoItem,
} from '@/api/dashboard'
import type { Inquiry } from '@/types/database'
import { formatRelativeTime, formatPrice, inquiryStatusIcon } from '@/utils/format'
import { PLAN_INFO } from '@/config/planFeatures'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export function DashboardPage() {
  const { user, agentProfile } = useAuthStore()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [performance, setPerformance] = useState<MonthlyPerformance | null>(null)
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [propertyStats, setPropertyStats] = useState<PropertyStat[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [todos, setTodos] = useState<TodoItem[]>([])

  useEffect(() => {
    Promise.all([
      fetchDashboardSummary(),
      fetchMonthlyPerformance(),
      fetchUnansweredInquiries(),
      fetchTodaySchedule(),
      fetchPropertyStats(),
      fetchActivityFeed(),
      fetchTodoList(),
    ]).then(([s, p, i, sc, ps, a, t]) => {
      setSummary(s)
      setPerformance(p)
      setInquiries(i)
      setSchedule(sc)
      setPropertyStats(ps)
      setActivities(a)
      setTodos(t)
    })
  }, [])

  if (!summary) {
    return (
      <div className="flex h-60 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    )
  }

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
          <p className="mt-3 text-2xl font-bold text-blue-600">{summary.activeContracts}건</p>
          <p className="text-sm text-gray-500">진행중 계약</p>
        </Link>
        <Link to="/admin/properties" className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 transition-shadow hover:shadow-md">
          <span className="text-2xl">🏠</span>
          <p className="mt-3 text-2xl font-bold text-green-600">{summary.totalProperties}건</p>
          <p className="text-sm text-gray-500">등록 매물 <span className="text-xs text-gray-400">(활성 {summary.activeProperties})</span></p>
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

        {/* 3. Unanswered Inquiries */}
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">미답변 문의</h2>
            <Link to="/admin/inquiries" className="text-xs text-primary-600 hover:underline">전체 보기</Link>
          </div>
          {inquiries.length === 0 ? (
            <div className="mt-4 flex h-24 items-center justify-center text-sm text-gray-400">미답변 문의가 없습니다.</div>
          ) : (
            <div className="mt-3 space-y-2">
              {inquiries.slice(0, 5).map((inq) => (
                <Link key={inq.id} to={`/admin/inquiries/${inq.id}`} className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50">
                  <span className="text-sm">{inquiryStatusIcon[inq.status] || '🔵'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{inq.name}</p>
                    <p className="truncate text-xs text-gray-400">{inq.content}</p>
                  </div>
                  <span className="shrink-0 text-[10px] text-gray-400">{formatRelativeTime(inq.created_at)}</span>
                </Link>
              ))}
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
          <h2 className="text-sm font-bold">매물별 조회 통계 (상위 5)</h2>
          <div className="mt-3 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={propertyStats} layout="vertical" barGap={1}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="title" tick={{ fontSize: 11 }} width={100} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="views" name="조회" fill="#93C5FD" barSize={8} radius={[0, 4, 4, 0]} />
                <Bar dataKey="inquiries" name="문의" fill="#FCA5A5" barSize={8} radius={[0, 4, 4, 0]} />
                <Bar dataKey="favorites" name="찜" fill="#FDE68A" barSize={8} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom 2-column */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* 6. Activity Feed */}
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <h2 className="text-sm font-bold">최근 활동</h2>
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
        </div>

        {/* 7. Todo List */}
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <h2 className="text-sm font-bold">할 일</h2>
          <div className="mt-3 space-y-2">
            {todos.map((todo) => {
              const iconMap = { inquiry: '📩', contract: '📝', repair: '🔧', expiring: '⏰' }
              return (
                <div key={todo.id} className="flex items-start gap-3 rounded-lg border border-gray-100 p-3">
                  <button
                    onClick={() => setTodos(todos.map((t) => t.id === todo.id ? { ...t, is_done: !t.is_done } : t))}
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                      todo.is_done ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300'
                    }`}
                  >
                    {todo.is_done && <span className="text-xs">✓</span>}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{iconMap[todo.type]}</span>
                      <Link to={todo.link} className={`text-sm font-medium hover:text-primary-600 ${todo.is_done ? 'text-gray-400 line-through' : ''}`}>
                        {todo.label}
                      </Link>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-400">{todo.detail}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

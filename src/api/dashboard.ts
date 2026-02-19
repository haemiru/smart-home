import { supabase } from '@/api/supabase'
import type { Inquiry } from '@/types/database'

export type DashboardSummary = {
  newInquiries: number
  inquiryDelta: number
  activeContracts: number
  totalProperties: number
  activeProperties: number
  totalCustomers: number
}

export type MonthlyPerformance = {
  propertyRegistrations: number
  contractsClosed: number
  totalTransactionAmount: number
  prevPropertyRegistrations: number
  prevContractsClosed: number
  prevTransactionAmount: number
  monthlyTrend: { month: string; registrations: number; contracts: number }[]
}

export type TodoItem = {
  id: string
  type: 'inquiry' | 'contract' | 'repair' | 'expiring'
  label: string
  detail: string
  link: string
  is_done: boolean
}

export type ActivityItem = {
  id: string
  icon: string
  message: string
  time: string
  link?: string
}

export type PropertyStat = {
  id: string
  title: string
  views: number
  inquiries: number
  favorites: number
}

export type ScheduleItem = {
  id: string
  time: string
  title: string
  address: string
  customer?: string
  type: 'today' | 'tomorrow'
}

// ─── Summary (Supabase COUNT queries) ────────────────

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const [
    { count: newInquiries },
    { count: activeContracts },
    { count: totalProperties },
    { count: activeProperties },
    { count: totalCustomers },
  ] = await Promise.all([
    supabase.from('inquiries').select('*', { count: 'exact', head: true }).in('status', ['new', 'checked', 'in_progress']),
    supabase.from('contracts').select('*', { count: 'exact', head: true }).in('status', ['drafting', 'pending_sign', 'signed']),
    supabase.from('properties').select('*', { count: 'exact', head: true }),
    supabase.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('customers').select('*', { count: 'exact', head: true }),
  ])

  return {
    newInquiries: newInquiries ?? 0,
    inquiryDelta: 0, // Would need historical data to compute delta
    activeContracts: activeContracts ?? 0,
    totalProperties: totalProperties ?? 0,
    activeProperties: activeProperties ?? 0,
    totalCustomers: totalCustomers ?? 0,
  }
}

// ─── Monthly Performance (mock — no aggregation table) ──

export async function fetchMonthlyPerformance(): Promise<MonthlyPerformance> {
  return {
    propertyRegistrations: 5,
    contractsClosed: 2,
    totalTransactionAmount: 135300,
    prevPropertyRegistrations: 3,
    prevContractsClosed: 1,
    prevTransactionAmount: 85000,
    monthlyTrend: [
      { month: '9월', registrations: 2, contracts: 1 },
      { month: '10월', registrations: 4, contracts: 2 },
      { month: '11월', registrations: 3, contracts: 1 },
      { month: '12월', registrations: 6, contracts: 3 },
      { month: '1월', registrations: 3, contracts: 1 },
      { month: '2월', registrations: 5, contracts: 2 },
    ],
  }
}

// ─── Unanswered Inquiries (Supabase) ──────────────────

export async function fetchUnansweredInquiries(): Promise<Inquiry[]> {
  const { data, error } = await supabase
    .from('inquiries')
    .select('*')
    .in('status', ['new', 'checked', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) throw error
  return data ?? []
}

// ─── Today's Schedule (mock — no schedule table) ──────

export async function fetchTodaySchedule(): Promise<ScheduleItem[]> {
  return [
    { id: 'sch-1', time: '10:30', title: '래미안 대치팰리스 102동 1502호', address: '서울 강남구 대치동', customer: '김철수', type: 'today' },
    { id: 'sch-2', time: '14:00', title: '힐스테이트 클래시안 205동 1201호', address: '서울 서초구 반포동', customer: '이영희', type: 'today' },
    { id: 'sch-3', time: '11:00', title: '역삼 아이파크 302동 801호', address: '서울 강남구 역삼동', customer: '박민수', type: 'tomorrow' },
  ]
}

// ─── Property Stats (Supabase top 5) ─────────────────

export async function fetchPropertyStats(): Promise<PropertyStat[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('id, title, view_count, inquiry_count, favorite_count')
    .order('view_count', { ascending: false })
    .limit(5)

  if (error) throw error

  return (data ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    views: p.view_count,
    inquiries: p.inquiry_count,
    favorites: p.favorite_count,
  }))
}

// ─── Activity Feed (mock — no unified activity table) ──

export async function fetchActivityFeed(): Promise<ActivityItem[]> {
  const now = new Date()
  const ago = (minutes: number) => new Date(now.getTime() - minutes * 60000).toISOString()
  return [
    { id: 'act-1', icon: '📩', message: '새 문의가 접수되었습니다.', time: ago(5), link: '/admin/inquiries' },
    { id: 'act-2', icon: '✍️', message: '계약서 서명 요청이 전송되었습니다.', time: ago(30), link: '/admin/contracts' },
    { id: 'act-3', icon: '👁️', message: '매물 조회수가 증가하고 있습니다.', time: ago(90) },
    { id: 'act-4', icon: '💬', message: '문의 답변이 발송되었습니다.', time: ago(180), link: '/admin/inquiries' },
    { id: 'act-5', icon: '📝', message: '새 계약서가 작성되었습니다.', time: ago(360), link: '/admin/contracts' },
    { id: 'act-6', icon: '🤝', message: '공동중개 요청이 접수되었습니다.', time: ago(720), link: '/admin/co-brokerage/requests' },
    { id: 'act-7', icon: '🔍', message: '임장이 완료되었습니다.', time: ago(1200) },
    { id: 'act-8', icon: '👤', message: '신규 고객이 등록되었습니다.', time: ago(1500), link: '/admin/customers' },
    { id: 'act-9', icon: '🏠', message: '새 매물이 등록되었습니다.', time: ago(2000) },
    { id: 'act-10', icon: '💰', message: '월세가 입금되었습니다.', time: ago(2800) },
  ]
}

// ─── Todo List (mock) ─────────────────────────────────

export async function fetchTodoList(): Promise<TodoItem[]> {
  return [
    { id: 'todo-1', type: 'inquiry', label: '미답변 문의 확인', detail: '답변 대기 중인 문의가 있습니다', link: '/admin/inquiries', is_done: false },
    { id: 'todo-2', type: 'contract', label: '계약 일정 확인', detail: '다가오는 잔금일을 확인하세요', link: '/admin/contracts', is_done: false },
    { id: 'todo-3', type: 'repair', label: '수리 요청 처리', detail: '미처리 수리 요청이 있습니다', link: '/admin/rental-mgmt', is_done: false },
    { id: 'todo-4', type: 'expiring', label: '만기 임박 임대', detail: '만기 임박 임대 물건을 확인하세요', link: '/admin/rental-mgmt', is_done: false },
  ]
}

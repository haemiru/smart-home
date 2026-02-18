// Mock API functions for admin dashboard
// Aggregates data from other mock APIs

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

// ─── Summary ────────────────────────────────────────

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  return {
    newInquiries: 3,
    inquiryDelta: 1,
    activeContracts: 2,
    totalProperties: 12,
    activeProperties: 8,
    totalCustomers: 7,
  }
}

// ─── Monthly Performance ────────────────────────────

export async function fetchMonthlyPerformance(): Promise<MonthlyPerformance> {
  return {
    propertyRegistrations: 5,
    contractsClosed: 2,
    totalTransactionAmount: 135300, // 만원
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

// ─── Unanswered Inquiries ───────────────────────────

export async function fetchUnansweredInquiries(): Promise<Inquiry[]> {
  // Return mock unanswered inquiries
  const now = new Date()
  return [
    {
      id: 'inq-6', inquiry_number: 'INQ-20260218-001', user_id: null, name: '한지연', phone: '010-2222-3333', email: 'han@example.com',
      inquiry_type: 'property', property_id: 'p4', preferred_visit_date: '2026-02-25',
      content: '역삼 센트럴 오피스텔 30㎡ 월세 조건 협의 가능한가요?',
      status: 'new', agent_id: 'agent-1',
      created_at: new Date(now.getTime() - 30 * 60000).toISOString(),
      updated_at: new Date(now.getTime() - 30 * 60000).toISOString(),
    },
    {
      id: 'inq-1', inquiry_number: 'INQ-20260217-001', user_id: null, name: '김철수', phone: '010-1234-5678', email: 'kim@example.com',
      inquiry_type: 'property', property_id: 'p1', preferred_visit_date: '2026-02-22',
      content: '래미안 레이카운티 매물 관련하여 문의드립니다.',
      status: 'new', agent_id: 'agent-1',
      created_at: new Date(now.getTime() - 3 * 3600000).toISOString(),
      updated_at: new Date(now.getTime() - 3 * 3600000).toISOString(),
    },
    {
      id: 'inq-3', inquiry_number: 'INQ-20260216-001', user_id: null, name: '박민수', phone: '010-5555-1234', email: null,
      inquiry_type: 'property', property_id: 'p5', preferred_visit_date: '2026-02-20',
      content: '잠실 엘리트 급매 매물 임장 가능한가요?',
      status: 'in_progress', agent_id: 'agent-1',
      created_at: new Date(now.getTime() - 26 * 3600000).toISOString(),
      updated_at: new Date(now.getTime() - 26 * 3600000).toISOString(),
    },
  ]
}

// ─── Today's Schedule ───────────────────────────────

export async function fetchTodaySchedule(): Promise<ScheduleItem[]> {
  return [
    { id: 'sch-1', time: '10:30', title: '래미안 대치팰리스 102동 1502호', address: '서울 강남구 대치동', customer: '김철수', type: 'today' },
    { id: 'sch-2', time: '14:00', title: '힐스테이트 클래시안 205동 1201호', address: '서울 서초구 반포동', customer: '이영희', type: 'today' },
    { id: 'sch-3', time: '11:00', title: '역삼 아이파크 302동 801호', address: '서울 강남구 역삼동', customer: '박민수', type: 'tomorrow' },
  ]
}

// ─── Property Stats (Top 5) ─────────────────────────

export async function fetchPropertyStats(): Promise<PropertyStat[]> {
  return [
    { id: 'p1', title: '래미안 대치팰리스', views: 342, inquiries: 12, favorites: 28 },
    { id: 'p2', title: '힐스테이트 클래시안', views: 287, inquiries: 8, favorites: 19 },
    { id: 'p3', title: '역삼 센트럴 타워', views: 245, inquiries: 6, favorites: 15 },
    { id: 'p4', title: '잠실 엘리트', views: 198, inquiries: 5, favorites: 22 },
    { id: 'p5', title: '반포 자이 아파트', views: 176, inquiries: 4, favorites: 11 },
  ]
}

// ─── Activity Feed ──────────────────────────────────

export async function fetchActivityFeed(): Promise<ActivityItem[]> {
  const now = new Date()
  const ago = (minutes: number) => new Date(now.getTime() - minutes * 60000).toISOString()
  return [
    { id: 'act-1', icon: '📩', message: '한지연님이 역삼 센트럴 오피스텔을 문의했습니다.', time: ago(5), link: '/admin/inquiries/inq-6' },
    { id: 'act-2', icon: '✍️', message: '계약서 CT-20260217-001 서명 요청이 전송되었습니다.', time: ago(30), link: '/admin/contracts/ct-2/tracker' },
    { id: 'act-3', icon: '👁️', message: '래미안 대치팰리스 조회수가 300을 돌파했습니다.', time: ago(90) },
    { id: 'act-4', icon: '💬', message: '김철수님에게 답변이 발송되었습니다.', time: ago(180), link: '/admin/inquiries/inq-1' },
    { id: 'act-5', icon: '📝', message: '힐스테이트 클래시안 계약서가 작성되었습니다.', time: ago(360), link: '/admin/contracts/ct-1/tracker' },
    { id: 'act-6', icon: '🤝', message: '한석규님이 공동중개를 요청했습니다.', time: ago(720), link: '/admin/co-brokerage/requests' },
    { id: 'act-7', icon: '🔍', message: '대치 쌍용 예가 201동 임장이 완료되었습니다.', time: ago(1200) },
    { id: 'act-8', icon: '👤', message: '신규 고객 박민수님이 등록되었습니다.', time: ago(1500), link: '/admin/customers/cust-3' },
    { id: 'act-9', icon: '🏠', message: '역삼 센트럴 타워 매물이 등록되었습니다.', time: ago(2000) },
    { id: 'act-10', icon: '💰', message: '임대 물건 101동 502호 월세가 입금되었습니다.', time: ago(2800) },
  ]
}

// ─── Todo List ───────────────────────────────────────

export async function fetchTodoList(): Promise<TodoItem[]> {
  return [
    { id: 'todo-1', type: 'inquiry', label: '미답변 문의 3건', detail: '한지연, 김철수, 박민수', link: '/admin/inquiries', is_done: false },
    { id: 'todo-2', type: 'contract', label: 'D-3 잔금일 (CT-20260217-001)', detail: '한지연 오피스텔 월세 잔금 3/1', link: '/admin/contracts/ct-2/tracker', is_done: false },
    { id: 'todo-3', type: 'contract', label: 'D-25 중도금 (CT-20260215-001)', detail: '최수진 힐스테이트 중도금 3/15', link: '/admin/contracts/ct-1/tracker', is_done: false },
    { id: 'todo-4', type: 'repair', label: '수리 요청 미처리 2건', detail: '101동 502호 수도꼭지, 203동 1201호 보일러', link: '/admin/rental-mgmt', is_done: false },
    { id: 'todo-5', type: 'expiring', label: '만기 임박 임대 1건', detail: '203동 1201호 (2026.04 만기)', link: '/admin/rental-mgmt', is_done: false },
  ]
}

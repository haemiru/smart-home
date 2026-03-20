import { supabase } from '@/api/supabase'
import type { Inquiry, InquiryStatus } from '@/types/database'

export type DashboardSummary = {
  newInquiries: number
  inquiryDelta: number
  activeContracts: number
  completedContracts: number
  totalProperties: number
  activeProperties: number
  contractedProperties: number
  completedProperties: number
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const safe = async (query: PromiseLike<{ count: number | null }> | any) => {
    try { const r = await query; return r?.count ?? 0 } catch { return 0 }
  }

  // 전일 대비 문의 증감 계산용
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const [newInquiries, todayInquiries, yesterdayInquiries, contractCount, completedContractCount, contractedProperties, completedProperties, totalProperties, activeProperties, totalCustomers] = await Promise.all([
    safe(supabase.from('inquiries').select('*', { count: 'exact', head: true }).in('status', ['new', 'checked'])),
    safe(supabase.from('inquiries').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString())),
    safe(supabase.from('inquiries').select('*', { count: 'exact', head: true }).gte('created_at', yesterday.toISOString()).lt('created_at', today.toISOString())),
    safe(supabase.from('contracts').select('*', { count: 'exact', head: true }).in('status', ['drafting', 'finalized'])),
    safe(supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('status', 'completed')),
    safe(supabase.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'contracted')),
    safe(supabase.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'completed')),
    safe(supabase.from('properties').select('*', { count: 'exact', head: true })),
    safe(supabase.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'active')),
    safe(supabase.from('customers').select('*', { count: 'exact', head: true })),
  ])

  // 진행중 계약: contracts 진행중 + 계약서 미작성 매물 (중복 제외를 위해 합산)
  const activeContracts = contractCount + Math.max(0, contractedProperties - contractCount)
  // 완료 계약: contracts 완료 + 거래완료 매물 (중복 제외)
  const completedContracts = completedContractCount + Math.max(0, completedProperties - completedContractCount)

  return {
    newInquiries,
    inquiryDelta: todayInquiries - yesterdayInquiries,
    activeContracts,
    completedContracts,
    totalProperties,
    activeProperties,
    contractedProperties,
    completedProperties,
    totalCustomers,
  }
}

// ─── Monthly Performance (Supabase) ─────────────────

const emptyPerformance: MonthlyPerformance = {
  propertyRegistrations: 0, contractsClosed: 0, totalTransactionAmount: 0,
  prevPropertyRegistrations: 0, prevContractsClosed: 0, prevTransactionAmount: 0,
  monthlyTrend: [],
}

export async function fetchMonthlyPerformance(): Promise<MonthlyPerformance> {
  try {
  const now = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  // Build 6 month range for trend
  const months: { start: Date; end: Date; label: string }[] = []
  for (let i = 5; i >= 0; i--) {
    const s = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const e = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
    months.push({ start: s, end: e, label: `${s.getMonth() + 1}월` })
  }

  // Fetch properties and contracts created in the last 6 months
  const sixMonthsAgo = months[0].start.toISOString()

  const [{ data: props }, { data: contracts }, { data: closedProps }] = await Promise.all([
    supabase.from('properties').select('created_at').gte('created_at', sixMonthsAgo),
    supabase.from('contracts').select('created_at, status, price_info').gte('created_at', sixMonthsAgo),
    // 계약진행중/완료 매물 (contracts 테이블에 레코드 없어도 매물 상태로 반영)
    supabase.from('properties').select('created_at, updated_at, status, sale_price, deposit').in('status', ['contracted', 'completed']),
  ])

  type PropRow = { created_at: string }
  type ContractRow = { created_at: string; status: string; price_info: Record<string, unknown> | null }
  type ClosedPropRow = { created_at: string; updated_at: string; status: string; sale_price: number | null; deposit: number | null }

  const propList: PropRow[] = (props ?? []) as PropRow[]
  const contractList: ContractRow[] = (contracts ?? []) as ContractRow[]
  const closedPropList: ClosedPropRow[] = (closedProps ?? []) as ClosedPropRow[]

  // contracts 테이블 기반 계약 성사
  const isClosed = (c: ContractRow) => c.status === 'completed'
  const getContractAmount = (c: ContractRow) => {
    const pi = c.price_info
    if (!pi) return 0
    const v = (pi as Record<string, number>).salePrice ?? (pi as Record<string, number>).deposit ?? 0
    return typeof v === 'number' ? v : 0
  }
  // 매물 상태 기반 계약 성사 (updated_at을 계약 시점으로 사용)
  const getPropAmount = (p: ClosedPropRow) => p.sale_price ?? p.deposit ?? 0

  const monthlyTrend = months.map(({ start, end, label }) => {
    const sISO = start.toISOString()
    const eISO = end.toISOString()
    const contractCount = contractList.filter((c) => c.created_at >= sISO && c.created_at < eISO && isClosed(c)).length
    const propContractCount = closedPropList.filter((p) => p.updated_at >= sISO && p.updated_at < eISO).length
    return {
      month: label,
      registrations: propList.filter((p) => p.created_at >= sISO && p.created_at < eISO).length,
      contracts: Math.max(contractCount, propContractCount),
    }
  })

  const thisISO = thisMonth.toISOString()
  const prevISO = prevMonth.toISOString()

  const thisProps = propList.filter((p) => p.created_at >= thisISO)
  const prevProps = propList.filter((p) => p.created_at >= prevISO && p.created_at < thisISO)

  // 이번 달 계약 성사: contracts 테이블 or 매물 상태 기반 중 큰 값
  const thisContractsFromTable = contractList.filter((c) => c.created_at >= thisISO && isClosed(c))
  const prevContractsFromTable = contractList.filter((c) => c.created_at >= prevISO && c.created_at < thisISO && isClosed(c))
  const thisContractsFromProps = closedPropList.filter((p) => p.updated_at >= thisISO)
  const prevContractsFromProps = closedPropList.filter((p) => p.updated_at >= prevISO && p.updated_at < thisISO)

  const thisClosedCount = Math.max(thisContractsFromTable.length, thisContractsFromProps.length)
  const prevClosedCount = Math.max(prevContractsFromTable.length, prevContractsFromProps.length)

  // 거래액: contracts 테이블 금액 우선, 없으면 매물 가격 사용
  const thisAmount = thisContractsFromTable.length > 0
    ? thisContractsFromTable.reduce((s, c) => s + getContractAmount(c), 0)
    : thisContractsFromProps.reduce((s, p) => s + getPropAmount(p), 0)
  const prevAmount = prevContractsFromTable.length > 0
    ? prevContractsFromTable.reduce((s, c) => s + getContractAmount(c), 0)
    : prevContractsFromProps.reduce((s, p) => s + getPropAmount(p), 0)

  return {
    propertyRegistrations: thisProps.length,
    contractsClosed: thisClosedCount,
    totalTransactionAmount: thisAmount,
    prevPropertyRegistrations: prevProps.length,
    prevContractsClosed: prevClosedCount,
    prevTransactionAmount: prevAmount,
    monthlyTrend,
  }
  } catch {
    return emptyPerformance
  }
}

// ─── Inquiry Status Counts (Supabase) ──────────────────

export type InquiryStatusCounts = {
  new: number
  checked: number
  in_progress: number
  answered: number
  closed: number
}

export async function fetchInquiryStatusCounts(): Promise<InquiryStatusCounts> {
  const safe = async (status: InquiryStatus) => {
    try {
      const { count } = await supabase.from('inquiries').select('*', { count: 'exact', head: true }).eq('status', status)
      return count ?? 0
    } catch { return 0 }
  }

  const [n, c, ip, a, cl] = await Promise.all([
    safe('new'), safe('checked'), safe('in_progress'), safe('answered'), safe('closed'),
  ])

  return { new: n, checked: c, in_progress: ip, answered: a, closed: cl }
}

// ─── Unanswered Inquiries (Supabase) ──────────────────

export async function fetchUnansweredInquiries(): Promise<Inquiry[]> {
  const { data, error } = await supabase
    .from('inquiries')
    .select('*')
    .in('status', ['new', 'checked'])
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) throw error
  return data ?? []
}

// ─── Today's Schedule (Supabase — inspections) ──────

export async function fetchTodaySchedule(): Promise<ScheduleItem[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dayAfter = new Date(today)
  dayAfter.setDate(dayAfter.getDate() + 2)

  const todayStr = today.toISOString().slice(0, 10)
  const tomorrowStr = tomorrow.toISOString().slice(0, 10)
  const dayAfterStr = dayAfter.toISOString().slice(0, 10)

  const items: ScheduleItem[] = []

  // 1) 임장 일정
  try {
    const { data } = await supabase
      .from('inspections')
      .select('id, scheduled_date, property_title, address')
      .gte('scheduled_date', todayStr)
      .lt('scheduled_date', dayAfterStr + 'T23:59:59')
      .order('scheduled_date', { ascending: true })

    for (const row of data ?? []) {
      const dateStr = typeof row.scheduled_date === 'string' ? row.scheduled_date.slice(0, 10) : ''
      const timeStr = typeof row.scheduled_date === 'string' && row.scheduled_date.length > 10
        ? row.scheduled_date.slice(11, 16) : '09:00'
      items.push({
        id: `ins-${row.id}`,
        time: timeStr,
        title: `🔍 임장: ${row.property_title ?? ''}`,
        address: row.address ?? '',
        type: dateStr === todayStr ? 'today' : 'tomorrow',
      })
    }
  } catch { /* skip */ }

  // 2) 계약 마감일 (미완료 단계)
  try {
    const { data } = await supabase
      .from('contract_process')
      .select('id, due_date, step_label, contract_id, is_completed')
      .eq('is_completed', false)
      .gte('due_date', todayStr)
      .lte('due_date', tomorrowStr)
      .order('due_date', { ascending: true })

    for (const row of data ?? []) {
      const dateStr = typeof row.due_date === 'string' ? row.due_date.slice(0, 10) : ''
      items.push({
        id: `cp-${row.id}`,
        time: '종일',
        title: `📝 계약: ${row.step_label}`,
        address: '',
        type: dateStr === todayStr ? 'today' : 'tomorrow',
      })
    }
  } catch { /* skip */ }

  // 3) 고객 방문 희망일
  try {
    const { data } = await supabase
      .from('inquiries')
      .select('id, preferred_visit_date, name, content')
      .gte('preferred_visit_date', todayStr)
      .lte('preferred_visit_date', tomorrowStr)
      .in('status', ['new', 'checked', 'in_progress'])
      .order('preferred_visit_date', { ascending: true })

    for (const row of data ?? []) {
      const dateStr = typeof row.preferred_visit_date === 'string' ? row.preferred_visit_date.slice(0, 10) : ''
      items.push({
        id: `visit-${row.id}`,
        time: '종일',
        title: `👤 방문 희망: ${row.name ?? ''}`,
        address: row.content ? row.content.slice(0, 30) : '',
        customer: row.name ?? undefined,
        type: dateStr === todayStr ? 'today' : 'tomorrow',
      })
    }
  } catch { /* skip */ }

  // 시간순 정렬 (시간 있는 것 우선, '종일'은 뒤로)
  items.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'today' ? -1 : 1
    if (a.time === '종일' && b.time !== '종일') return 1
    if (a.time !== '종일' && b.time === '종일') return -1
    return a.time.localeCompare(b.time)
  })

  return items
}

// ─── Property Stats (Supabase top 5) ─────────────────

export async function fetchPropertyStats(): Promise<PropertyStat[]> {
  // 충분한 양을 가져온 후 합산 점수(조회+문의+찜)로 정렬하여 상위 5개 반환
  const { data, error } = await supabase
    .from('properties')
    .select('id, title, view_count, inquiry_count, favorite_count')
    .order('view_count', { ascending: false })
    .limit(20)

  if (error) throw error

  return (data ?? [])
    .map((p) => ({
      id: p.id,
      title: p.title,
      views: p.view_count ?? 0,
      inquiries: p.inquiry_count ?? 0,
      favorites: p.favorite_count ?? 0,
    }))
    .sort((a, b) => (b.views + b.inquiries + b.favorites) - (a.views + a.inquiries + a.favorites))
    .slice(0, 5)
}

// ─── Activity Feed (Supabase — recent rows merged) ──

export async function fetchActivityFeed(): Promise<ActivityItem[]> {
  try {
    const [
      { data: inquiries },
      { data: contracts },
      { data: customers },
      { data: properties },
      { data: inspections },
    ] = await Promise.all([
      supabase.from('inquiries').select('id, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('contracts').select('id, created_at, status').order('created_at', { ascending: false }).limit(5),
      supabase.from('customers').select('id, created_at, name').order('created_at', { ascending: false }).limit(5),
      supabase.from('properties').select('id, created_at, title').order('created_at', { ascending: false }).limit(5),
      supabase.from('inspections').select('id, created_at, status').order('created_at', { ascending: false }).limit(5),
    ])

    const items: ActivityItem[] = []

    for (const row of inquiries ?? []) {
      items.push({ id: `inq-${row.id}`, icon: '\uD83D\uDCE9', message: '새 문의가 접수되었습니다.', time: row.created_at, link: '/admin/inquiries' })
    }
    for (const row of contracts ?? []) {
      const msg = row.status === 'completed'
        ? '계약이 체결되었습니다.'
        : '새 계약서가 작성되었습니다.'
      items.push({ id: `con-${row.id}`, icon: '\u270D\uFE0F', message: msg, time: row.created_at, link: '/admin/contracts' })
    }
    for (const row of customers ?? []) {
      items.push({ id: `cus-${row.id}`, icon: '\uD83D\uDC64', message: `신규 고객(${row.name ?? '이름없음'})이 등록되었습니다.`, time: row.created_at, link: '/admin/customers' })
    }
    for (const row of properties ?? []) {
      items.push({ id: `prp-${row.id}`, icon: '\uD83C\uDFE0', message: `매물 "${row.title ?? '제목없음'}" 이(가) 등록되었습니다.`, time: row.created_at })
    }
    for (const row of inspections ?? []) {
      const msg = row.status === 'completed' ? '임장이 완료되었습니다.' : '임장이 등록되었습니다.'
      items.push({ id: `ins-${row.id}`, icon: '\uD83D\uDD0D', message: msg, time: row.created_at, link: '/admin/inspection' })
    }

    items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    return items.slice(0, 10)
  } catch {
    return []
  }
}

// ─── Todo List (Supabase — dynamic counts) ──────────

export async function fetchTodoList(): Promise<TodoItem[]> {
  const safeCount = async (query: Promise<{ count: number | null }>) => {
    try { const r = await query; return (r as { count: number | null }).count ?? 0 } catch { return 0 }
  }

  const [unansweredCount, upcomingContractCount, repairCount, expiringCount] = await Promise.all([
    safeCount(supabase.from('inquiries').select('*', { count: 'exact', head: true }).in('status', ['new', 'checked']) as never),
    safeCount(supabase.from('contracts').select('*', { count: 'exact', head: true }).in('status', ['drafting', 'finalized']) as never),
    safeCount(supabase.from('repair_requests').select('*', { count: 'exact', head: true }).in('status', ['requested', 'confirmed']) as never),
    safeCount(supabase.from('rental_properties').select('*', { count: 'exact', head: true }).eq('status', 'expiring') as never),
  ])

  const items: TodoItem[] = []

  if (unansweredCount > 0) {
    items.push({ id: 'todo-inq', type: 'inquiry', label: '미답변 문의 확인', detail: `답변 대기 중인 문의 ${unansweredCount}건`, link: '/admin/inquiries', is_done: false })
  }
  if (upcomingContractCount > 0) {
    items.push({ id: 'todo-con', type: 'contract', label: '계약 일정 확인', detail: `진행 중인 계약 ${upcomingContractCount}건`, link: '/admin/contracts', is_done: false })
  }
  if (repairCount > 0) {
    items.push({ id: 'todo-rep', type: 'repair', label: '수리 요청 처리', detail: `미처리 수리 요청 ${repairCount}건`, link: '/admin/rental-mgmt', is_done: false })
  }
  if (expiringCount > 0) {
    items.push({ id: 'todo-exp', type: 'expiring', label: '만기 임박 임대', detail: `만기 임박 ${expiringCount}건`, link: '/admin/rental-mgmt', is_done: false })
  }

  return items
}

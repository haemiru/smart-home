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

// ─── Monthly Performance (Supabase) ─────────────────

export async function fetchMonthlyPerformance(): Promise<MonthlyPerformance> {
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

  const [{ data: props }, { data: contracts }] = await Promise.all([
    supabase.from('properties').select('created_at').gte('created_at', sixMonthsAgo),
    supabase.from('contracts').select('created_at, status, price_info').gte('created_at', sixMonthsAgo),
  ])

  type PropRow = { created_at: string }
  type ContractRow = { created_at: string; status: string; price_info: Record<string, unknown> | null }

  const propList: PropRow[] = (props ?? []) as PropRow[]
  const contractList: ContractRow[] = (contracts ?? []) as ContractRow[]

  const monthlyTrend = months.map(({ start, end, label }) => {
    const sISO = start.toISOString()
    const eISO = end.toISOString()
    return {
      month: label,
      registrations: propList.filter((p) => p.created_at >= sISO && p.created_at < eISO).length,
      contracts: contractList.filter((c) => c.created_at >= sISO && c.created_at < eISO && (c.status === 'signed' || c.status === 'completed')).length,
    }
  })

  const thisISO = thisMonth.toISOString()
  const prevISO = prevMonth.toISOString()

  const thisProps = propList.filter((p) => p.created_at >= thisISO)
  const prevProps = propList.filter((p) => p.created_at >= prevISO && p.created_at < thisISO)

  const isClosed = (c: ContractRow) => c.status === 'signed' || c.status === 'completed'
  const getAmount = (c: ContractRow) => {
    const pi = c.price_info
    if (!pi) return 0
    const v = (pi as Record<string, number>).salePrice ?? (pi as Record<string, number>).deposit ?? 0
    return typeof v === 'number' ? v : 0
  }

  const thisContracts = contractList.filter((c) => c.created_at >= thisISO && isClosed(c))
  const prevContracts = contractList.filter((c) => c.created_at >= prevISO && c.created_at < thisISO && isClosed(c))

  return {
    propertyRegistrations: thisProps.length,
    contractsClosed: thisContracts.length,
    totalTransactionAmount: thisContracts.reduce((s, c) => s + getAmount(c), 0),
    prevPropertyRegistrations: prevProps.length,
    prevContractsClosed: prevContracts.length,
    prevTransactionAmount: prevContracts.reduce((s, c) => s + getAmount(c), 0),
    monthlyTrend,
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

// ─── Today's Schedule (Supabase — inspections) ──────

export async function fetchTodaySchedule(): Promise<ScheduleItem[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dayAfter = new Date(today)
  dayAfter.setDate(dayAfter.getDate() + 2)

  const { data, error } = await supabase
    .from('inspections')
    .select('id, scheduled_date, property_title, address')
    .gte('scheduled_date', today.toISOString().slice(0, 10))
    .lt('scheduled_date', dayAfter.toISOString().slice(0, 10) + 'T23:59:59')
    .order('scheduled_date', { ascending: true })

  if (error) throw error

  const todayStr = today.toISOString().slice(0, 10)

  return (data ?? []).map((row) => {
    const dateStr = typeof row.scheduled_date === 'string' ? row.scheduled_date.slice(0, 10) : ''
    const timeStr = typeof row.scheduled_date === 'string' && row.scheduled_date.length > 10
      ? row.scheduled_date.slice(11, 16)
      : '09:00'
    return {
      id: row.id,
      time: timeStr,
      title: row.property_title ?? '',
      address: row.address ?? '',
      type: dateStr === todayStr ? 'today' as const : 'tomorrow' as const,
    }
  })
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

// ─── Activity Feed (Supabase — recent rows merged) ──

export async function fetchActivityFeed(): Promise<ActivityItem[]> {
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
    const msg = row.status === 'signed' || row.status === 'completed'
      ? '계약이 체결되었습니다.'
      : '새 계약서가 작성되었습니다.'
    items.push({ id: `con-${row.id}`, icon: '\u270D\uFE0F', message: msg, time: row.created_at, link: '/admin/contracts' })
  }
  for (const row of customers ?? []) {
    items.push({ id: `cus-${row.id}`, icon: '\uD83D\uDC64', message: `신규 고객(${row.name})이 등록되었습니다.`, time: row.created_at, link: '/admin/customers' })
  }
  for (const row of properties ?? []) {
    items.push({ id: `prp-${row.id}`, icon: '\uD83C\uDFE0', message: `매물 "${row.title}" 이(가) 등록되었습니다.`, time: row.created_at })
  }
  for (const row of inspections ?? []) {
    const msg = row.status === 'completed' ? '임장이 완료되었습니다.' : '임장이 등록되었습니다.'
    items.push({ id: `ins-${row.id}`, icon: '\uD83D\uDD0D', message: msg, time: row.created_at, link: '/admin/inspection' })
  }

  items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  return items.slice(0, 10)
}

// ─── Todo List (Supabase — dynamic counts) ──────────

export async function fetchTodoList(): Promise<TodoItem[]> {
  const [
    { count: unansweredCount },
    { count: repairCount },
    { count: expiringCount },
    { count: upcomingContractCount },
  ] = await Promise.all([
    supabase.from('inquiries').select('*', { count: 'exact', head: true }).in('status', ['new', 'checked', 'in_progress']),
    supabase.from('repair_requests').select('*', { count: 'exact', head: true }).in('status', ['requested', 'confirmed']),
    supabase.from('rental_properties').select('*', { count: 'exact', head: true }).eq('status', 'expiring'),
    supabase.from('contracts').select('*', { count: 'exact', head: true }).in('status', ['drafting', 'pending_sign']),
  ])

  const items: TodoItem[] = []

  if ((unansweredCount ?? 0) > 0) {
    items.push({ id: 'todo-inq', type: 'inquiry', label: '미답변 문의 확인', detail: `답변 대기 중인 문의 ${unansweredCount}건`, link: '/admin/inquiries', is_done: false })
  }
  if ((upcomingContractCount ?? 0) > 0) {
    items.push({ id: 'todo-con', type: 'contract', label: '계약 일정 확인', detail: `진행 중인 계약 ${upcomingContractCount}건`, link: '/admin/contracts', is_done: false })
  }
  if ((repairCount ?? 0) > 0) {
    items.push({ id: 'todo-rep', type: 'repair', label: '수리 요청 처리', detail: `미처리 수리 요청 ${repairCount}건`, link: '/admin/rental-mgmt', is_done: false })
  }
  if ((expiringCount ?? 0) > 0) {
    items.push({ id: 'todo-exp', type: 'expiring', label: '만기 임박 임대', detail: `만기 임박 ${expiringCount}건`, link: '/admin/rental-mgmt', is_done: false })
  }

  return items
}

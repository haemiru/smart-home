// Mock API functions for CRM (Customer Management)
// TODO: Replace with actual Supabase calls when backend is connected

import type { Customer, CustomerActivity, CustomerType, CustomerSource } from '@/types/database'

const _customers: Customer[] = [
  {
    id: 'cust-1', agent_id: 'agent-1', user_id: null, name: '김철수', phone: '010-1234-5678', email: 'kim@example.com',
    customer_type: 'interest', preferences: { region: '서초구', propertyType: '아파트', priceRange: '8억~12억', area: '60~85㎡' },
    score: 55, source: 'inquiry', memo: '래미안 레이카운티 관심. 59㎡ 선호.', created_at: '2026-02-17T14:30:00Z', updated_at: '2026-02-17T14:30:00Z',
  },
  {
    id: 'cust-2', agent_id: 'agent-1', user_id: null, name: '이영희', phone: '010-9876-5432', email: 'lee@example.com',
    customer_type: 'consulting', preferences: { region: '강남구', propertyType: '오피스텔', priceRange: '전세 3억~5억', area: '30~50㎡' },
    score: 75, source: 'inquiry', memo: '역삼동 오피스텔 전세/월세 상담 중', created_at: '2026-02-17T10:15:00Z', updated_at: '2026-02-17T11:00:00Z',
  },
  {
    id: 'cust-3', agent_id: 'agent-1', user_id: null, name: '박민수', phone: '010-5555-1234', email: null,
    customer_type: 'interest', preferences: { region: '송파구', propertyType: '아파트', priceRange: '15억~20억', area: '84㎡ 이상' },
    score: 80, source: 'inquiry', memo: '잠실 엘리트 급매 임장 예약', created_at: '2026-02-16T16:45:00Z', updated_at: '2026-02-17T09:00:00Z',
  },
  {
    id: 'cust-4', agent_id: 'agent-1', user_id: null, name: '최수진', phone: '010-7777-8888', email: 'choi@example.com',
    customer_type: 'contracting', preferences: { region: '강남구', propertyType: '아파트', priceRange: '10억~15억', area: '84㎡' },
    score: 120, source: 'inquiry', memo: '힐스테이트 클래시안 계약 진행 중', created_at: '2026-02-15T09:20:00Z', updated_at: '2026-02-15T14:30:00Z',
  },
  {
    id: 'cust-5', agent_id: 'agent-1', user_id: null, name: '정대현', phone: '010-3333-4444', email: null,
    customer_type: 'lead', preferences: { region: '송파구', propertyType: '아파트' },
    score: 20, source: 'inquiry', memo: '매물 등록 문의 — 매도인 후보', created_at: '2026-02-14T11:00:00Z', updated_at: '2026-02-14T16:00:00Z',
  },
  {
    id: 'cust-6', agent_id: 'agent-1', user_id: null, name: '한지연', phone: '010-2222-3333', email: 'han@example.com',
    customer_type: 'lead', preferences: { region: '강남구', propertyType: '오피스텔', priceRange: '월세 1,000/80' },
    score: 20, source: 'inquiry', memo: null, created_at: '2026-02-18T08:00:00Z', updated_at: '2026-02-18T08:00:00Z',
  },
  {
    id: 'cust-7', agent_id: 'agent-1', user_id: null, name: '윤서연', phone: '010-4444-5555', email: 'yoon@example.com',
    customer_type: 'completed', preferences: { region: '서초구', propertyType: '아파트', priceRange: '30억 이상' },
    score: 150, source: 'direct', memo: '반포 자이 133㎡ 거래 완료', created_at: '2026-01-20T10:00:00Z', updated_at: '2026-02-10T15:00:00Z',
  },
  {
    id: 'cust-8', agent_id: 'agent-1', user_id: null, name: '강동원', phone: '010-6666-7777', email: 'kang@example.com',
    customer_type: 'consulting', preferences: { region: '용산구', propertyType: '아파트', priceRange: '20억~30억', area: '112㎡' },
    score: 65, source: 'referral', memo: '윤서연님 소개. 용산 아이파크 관심.', created_at: '2026-02-12T14:00:00Z', updated_at: '2026-02-16T10:00:00Z',
  },
]

const _activities: CustomerActivity[] = [
  { id: 'act-1', customer_id: 'cust-1', activity_type: 'inquiry', property_id: 'p1', metadata: { inquiry_id: 'inq-1' }, created_at: '2026-02-17T14:30:00Z' },
  { id: 'act-2', customer_id: 'cust-1', activity_type: 'view', property_id: 'p1', metadata: {}, created_at: '2026-02-17T14:00:00Z' },
  { id: 'act-3', customer_id: 'cust-1', activity_type: 'view', property_id: 'p2', metadata: {}, created_at: '2026-02-17T13:50:00Z' },
  { id: 'act-4', customer_id: 'cust-1', activity_type: 'favorite', property_id: 'p1', metadata: {}, created_at: '2026-02-17T14:05:00Z' },
  { id: 'act-5', customer_id: 'cust-2', activity_type: 'inquiry', property_id: null, metadata: { inquiry_id: 'inq-2' }, created_at: '2026-02-17T10:15:00Z' },
  { id: 'act-6', customer_id: 'cust-3', activity_type: 'inquiry', property_id: 'p5', metadata: { inquiry_id: 'inq-3' }, created_at: '2026-02-16T16:45:00Z' },
  { id: 'act-7', customer_id: 'cust-3', activity_type: 'appointment', property_id: 'p5', metadata: { date: '2026-02-20' }, created_at: '2026-02-17T09:00:00Z' },
  { id: 'act-8', customer_id: 'cust-4', activity_type: 'inquiry', property_id: 'p2', metadata: { inquiry_id: 'inq-4' }, created_at: '2026-02-15T09:20:00Z' },
  { id: 'act-9', customer_id: 'cust-4', activity_type: 'contract_view', property_id: 'p2', metadata: {}, created_at: '2026-02-15T15:00:00Z' },
  { id: 'act-10', customer_id: 'cust-4', activity_type: 'view', property_id: 'p2', metadata: {}, created_at: '2026-02-14T11:00:00Z' },
  { id: 'act-11', customer_id: 'cust-4', activity_type: 'favorite', property_id: 'p2', metadata: {}, created_at: '2026-02-14T11:05:00Z' },
  { id: 'act-12', customer_id: 'cust-8', activity_type: 'view', property_id: 'p9', metadata: {}, created_at: '2026-02-16T10:00:00Z' },
  { id: 'act-13', customer_id: 'cust-8', activity_type: 'favorite', property_id: 'p9', metadata: {}, created_at: '2026-02-16T10:05:00Z' },
]

export interface CustomerFilters {
  customerType?: CustomerType | 'all'
  source?: CustomerSource | 'all'
  minScore?: number
  maxScore?: number
  search?: string
}

export async function fetchCustomers(filters: CustomerFilters = {}): Promise<Customer[]> {
  let result = [..._customers]

  if (filters.customerType && filters.customerType !== 'all') {
    result = result.filter((c) => c.customer_type === filters.customerType)
  }
  if (filters.source && filters.source !== 'all') {
    result = result.filter((c) => c.source === filters.source)
  }
  if (filters.minScore != null) {
    result = result.filter((c) => c.score >= filters.minScore!)
  }
  if (filters.maxScore != null) {
    result = result.filter((c) => c.score <= filters.maxScore!)
  }
  if (filters.search) {
    const q = filters.search.toLowerCase()
    result = result.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.email ?? '').toLowerCase().includes(q))
  }

  result.sort((a, b) => b.updated_at.localeCompare(a.updated_at))
  return result
}

export async function fetchCustomerById(id: string): Promise<Customer | null> {
  return _customers.find((c) => c.id === id) ?? null
}

export async function fetchCustomerActivities(customerId: string): Promise<CustomerActivity[]> {
  return _activities.filter((a) => a.customer_id === customerId).sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export async function createCustomer(data: {
  name: string
  phone: string
  email?: string
  customer_type?: CustomerType
  source?: CustomerSource
  preferences?: Record<string, unknown>
  memo?: string
}): Promise<Customer> {
  const now = new Date().toISOString()
  const customer: Customer = {
    id: `cust-${Date.now()}`,
    agent_id: 'agent-1',
    user_id: null,
    name: data.name,
    phone: data.phone,
    email: data.email ?? null,
    customer_type: data.customer_type ?? 'lead',
    preferences: data.preferences ?? {},
    score: data.source === 'inquiry' ? 20 : 0,
    source: data.source ?? 'direct',
    memo: data.memo ?? null,
    created_at: now,
    updated_at: now,
  }
  _customers.unshift(customer)
  return customer
}

export async function updateCustomer(id: string, data: Partial<Customer>): Promise<Customer | null> {
  const idx = _customers.findIndex((c) => c.id === id)
  if (idx === -1) return null
  _customers[idx] = { ..._customers[idx], ...data, updated_at: new Date().toISOString() }
  return _customers[idx]
}

export async function updateCustomerType(id: string, customerType: CustomerType): Promise<void> {
  const idx = _customers.findIndex((c) => c.id === id)
  if (idx !== -1) {
    _customers[idx] = { ..._customers[idx], customer_type: customerType, updated_at: new Date().toISOString() }
  }
}

export async function addCustomerActivity(data: {
  customer_id: string
  activity_type: CustomerActivity['activity_type']
  property_id?: string
  metadata?: Record<string, unknown>
}): Promise<void> {
  // Score adjustments
  const scoreMap: Record<string, number> = { view: 5, favorite: 10, inquiry: 20, appointment: 30, contract_view: 40 }
  const custIdx = _customers.findIndex((c) => c.id === data.customer_id)
  if (custIdx !== -1) {
    _customers[custIdx] = {
      ..._customers[custIdx],
      score: _customers[custIdx].score + (scoreMap[data.activity_type] ?? 0),
      updated_at: new Date().toISOString(),
    }
  }

  _activities.unshift({
    id: `act-${Date.now()}`,
    customer_id: data.customer_id,
    activity_type: data.activity_type,
    property_id: data.property_id ?? null,
    metadata: data.metadata ?? {},
    created_at: new Date().toISOString(),
  })
}

export async function getCustomerCountByType(): Promise<Record<CustomerType, number>> {
  const counts: Record<CustomerType, number> = { lead: 0, interest: 0, consulting: 0, contracting: 0, completed: 0 }
  for (const c of _customers) {
    counts[c.customer_type]++
  }
  return counts
}

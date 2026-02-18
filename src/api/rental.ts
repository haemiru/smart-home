// Mock API functions for rental management
// TODO: Replace with actual Supabase calls when backend is connected

import type { RentalProperty, RentalPayment, RepairRequest, RentalPropertyStatus, RepairRequestStatus } from '@/types/database'

// Mock data
const _rentalProperties: RentalProperty[] = [
  {
    id: 'rp-1', agent_id: 'agent-1', property_id: 'p4', address: '서울 강남구 역삼동 123-4 역삼타워', unit_number: '301호',
    tenant_name: '한지연', tenant_phone: '010-2222-3333', deposit: 1000, monthly_rent: 80,
    contract_start: '2025-04-01', contract_end: '2027-03-31', status: 'occupied', created_at: '2025-04-01T10:00:00Z',
  },
  {
    id: 'rp-2', agent_id: 'agent-1', property_id: null, address: '서울 강남구 역삼동 123-4 역삼타워', unit_number: '502호',
    tenant_name: '이민호', tenant_phone: '010-5555-6666', deposit: 2000, monthly_rent: 120,
    contract_start: '2025-06-01', contract_end: '2026-05-31', status: 'expiring', created_at: '2025-06-01T10:00:00Z',
  },
  {
    id: 'rp-3', agent_id: 'agent-1', property_id: null, address: '서울 서초구 서초동 200-1 서초빌라', unit_number: '201호',
    tenant_name: '', tenant_phone: '', deposit: 0, monthly_rent: 0,
    contract_start: '', contract_end: '', status: 'vacant', created_at: '2026-01-15T10:00:00Z',
  },
  {
    id: 'rp-4', agent_id: 'agent-1', property_id: null, address: '서울 강남구 대치동 890-5 대치프라자', unit_number: '1201호',
    tenant_name: '박서연', tenant_phone: '010-8888-9999', deposit: 5000, monthly_rent: 200,
    contract_start: '2025-09-01', contract_end: '2027-08-31', status: 'occupied', created_at: '2025-09-01T10:00:00Z',
  },
  {
    id: 'rp-5', agent_id: 'agent-1', property_id: null, address: '서울 마포구 서교동 395-3 홍대오피스텔', unit_number: '701호',
    tenant_name: '최준혁', tenant_phone: '010-1111-0000', deposit: 500, monthly_rent: 65,
    contract_start: '2025-12-01', contract_end: '2026-11-30', status: 'occupied', created_at: '2025-12-01T10:00:00Z',
  },
]

// Generate payment history
function generatePayments(rpId: string, monthlyRent: number, startDate: string): RentalPayment[] {
  const payments: RentalPayment[] = []
  if (!startDate) return payments
  const start = new Date(startDate)
  const now = new Date()
  let id = 1
  const current = new Date(start.getFullYear(), start.getMonth(), 1)
  while (current <= now) {
    const month = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-01`
    const isPast = current < new Date(now.getFullYear(), now.getMonth(), 1)
    const isCurrent = current.getFullYear() === now.getFullYear() && current.getMonth() === now.getMonth()
    // Some current month might be unpaid
    const isPaid = isPast || (isCurrent && Math.random() > 0.3)
    payments.push({
      id: `pay-${rpId}-${id++}`,
      rental_property_id: rpId,
      payment_month: month,
      amount: monthlyRent,
      is_paid: isPaid,
      paid_date: isPaid ? `${month.slice(0, 7)}-${String(Math.floor(Math.random() * 5) + 1).padStart(2, '0')}` : null,
      memo: null,
      created_at: month,
    })
    current.setMonth(current.getMonth() + 1)
  }
  return payments
}

const _payments: RentalPayment[] = [
  ...generatePayments('rp-1', 80, '2025-04-01'),
  ...generatePayments('rp-2', 120, '2025-06-01'),
  ...generatePayments('rp-4', 200, '2025-09-01'),
  ...generatePayments('rp-5', 65, '2025-12-01'),
]

const _repairRequests: RepairRequest[] = [
  {
    id: 'rep-1', rental_property_id: 'rp-1', title: '욕실 수전 누수',
    description: '욕실 세면대 수전에서 물이 떨어집니다. 수전 교체 부탁드립니다.',
    photos: [], status: 'in_progress', requested_at: '2026-02-10T14:00:00Z',
    completed_at: null, cost: null, memo: '업체 방문 예정 2/20',
  },
  {
    id: 'rep-2', rental_property_id: 'rp-2', title: '보일러 이상',
    description: '보일러 E2 에러코드가 뜹니다. 난방이 안 됩니다.',
    photos: [], status: 'requested', requested_at: '2026-02-16T09:00:00Z',
    completed_at: null, cost: null, memo: null,
  },
  {
    id: 'rep-3', rental_property_id: 'rp-4', title: '거실 조명 고장',
    description: '거실 LED 조명이 깜빡거립니다.',
    photos: [], status: 'completed', requested_at: '2026-01-20T11:00:00Z',
    completed_at: '2026-01-25T15:00:00Z', cost: 15, memo: 'LED 안정기 교체 완료',
  },
]

// API functions
export async function fetchRentalProperties(filter?: RentalPropertyStatus | 'all'): Promise<RentalProperty[]> {
  let result = [..._rentalProperties]
  if (filter && filter !== 'all') {
    result = result.filter((r) => r.status === filter)
  }
  return result
}

export async function fetchRentalPropertyById(id: string): Promise<RentalProperty | null> {
  return _rentalProperties.find((r) => r.id === id) ?? null
}

export async function createRentalProperty(data: Omit<RentalProperty, 'id' | 'agent_id' | 'created_at'>): Promise<RentalProperty> {
  const rp: RentalProperty = {
    ...data,
    id: `rp-${Date.now()}`,
    agent_id: 'agent-1',
    created_at: new Date().toISOString(),
  }
  _rentalProperties.push(rp)
  return rp
}

export async function updateRentalProperty(id: string, data: Partial<RentalProperty>): Promise<RentalProperty | null> {
  const idx = _rentalProperties.findIndex((r) => r.id === id)
  if (idx === -1) return null
  _rentalProperties[idx] = { ..._rentalProperties[idx], ...data }
  return _rentalProperties[idx]
}

export async function fetchPayments(rentalPropertyId: string): Promise<RentalPayment[]> {
  return _payments
    .filter((p) => p.rental_property_id === rentalPropertyId)
    .sort((a, b) => b.payment_month.localeCompare(a.payment_month))
}

export async function togglePaymentStatus(paymentId: string): Promise<RentalPayment | null> {
  const idx = _payments.findIndex((p) => p.id === paymentId)
  if (idx === -1) return null
  const isPaid = !_payments[idx].is_paid
  _payments[idx] = {
    ..._payments[idx],
    is_paid: isPaid,
    paid_date: isPaid ? new Date().toISOString().slice(0, 10) : null,
  }
  return _payments[idx]
}

export async function fetchRepairRequests(rentalPropertyId?: string): Promise<RepairRequest[]> {
  let result = [..._repairRequests]
  if (rentalPropertyId) {
    result = result.filter((r) => r.rental_property_id === rentalPropertyId)
  }
  result.sort((a, b) => b.requested_at.localeCompare(a.requested_at))
  return result
}

export async function createRepairRequest(data: {
  rental_property_id: string
  title: string
  description: string
}): Promise<RepairRequest> {
  const req: RepairRequest = {
    id: `rep-${Date.now()}`,
    rental_property_id: data.rental_property_id,
    title: data.title,
    description: data.description,
    photos: [],
    status: 'requested',
    requested_at: new Date().toISOString(),
    completed_at: null,
    cost: null,
    memo: null,
  }
  _repairRequests.unshift(req)
  return req
}

export async function updateRepairStatus(id: string, status: RepairRequestStatus, memo?: string, cost?: number): Promise<RepairRequest | null> {
  const idx = _repairRequests.findIndex((r) => r.id === id)
  if (idx === -1) return null
  _repairRequests[idx] = {
    ..._repairRequests[idx],
    status,
    memo: memo ?? _repairRequests[idx].memo,
    cost: cost ?? _repairRequests[idx].cost,
    completed_at: status === 'completed' ? new Date().toISOString() : _repairRequests[idx].completed_at,
  }
  return _repairRequests[idx]
}

// Dashboard summary
export async function fetchRentalSummary(): Promise<{
  totalProperties: number
  currentMonthCollectionRate: number
  expiringCount: number
  pendingRepairs: number
}> {
  const total = _rentalProperties.filter((r) => r.status !== 'vacant').length
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const currentPayments = _payments.filter((p) => p.payment_month.startsWith(currentMonth))
  const paidCount = currentPayments.filter((p) => p.is_paid).length
  const collectionRate = currentPayments.length > 0 ? Math.round((paidCount / currentPayments.length) * 100) : 100
  const expiringCount = _rentalProperties.filter((r) => r.status === 'expiring').length
  const pendingRepairs = _repairRequests.filter((r) => r.status !== 'completed').length

  return { totalProperties: total, currentMonthCollectionRate: collectionRate, expiringCount, pendingRepairs }
}

// Share link (mock token-based)
const _shareLinks: { id: string; rental_property_id: string; token: string; expires_at: string; created_at: string }[] = []

export async function createShareLink(rentalPropertyId: string, expiresInDays: number): Promise<{ token: string; url: string }> {
  const token = `share_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const expires = new Date()
  expires.setDate(expires.getDate() + expiresInDays)
  _shareLinks.push({
    id: `sl-${Date.now()}`,
    rental_property_id: rentalPropertyId,
    token,
    expires_at: expires.toISOString(),
    created_at: new Date().toISOString(),
  })
  return { token, url: `/admin/rental-mgmt/share/${token}` }
}

export async function fetchShareData(token: string): Promise<{
  property: RentalProperty
  payments: RentalPayment[]
  repairs: RepairRequest[]
} | null> {
  const link = _shareLinks.find((l) => l.token === token)
  if (!link) return null
  if (new Date(link.expires_at) < new Date()) return null
  const property = _rentalProperties.find((r) => r.id === link.rental_property_id)
  if (!property) return null
  const payments = _payments.filter((p) => p.rental_property_id === property.id)
  const repairs = _repairRequests.filter((r) => r.rental_property_id === property.id)
  return { property, payments, repairs }
}

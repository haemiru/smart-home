// Mock API functions for inquiries
// TODO: Replace with actual Supabase calls when backend is connected

import type { Inquiry, InquiryReply, InquiryStatus, InquiryType } from '@/types/database'

// Generate inquiry number: INQ-YYYYMMDD-NNN
let _seqCounter = 1
function generateInquiryNumber(): string {
  const d = new Date()
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const seq = String(_seqCounter++).padStart(3, '0')
  return `INQ-${date}-${seq}`
}

// Mock data
const _inquiries: Inquiry[] = [
  {
    id: 'inq-1', inquiry_number: 'INQ-20260217-001', user_id: null, name: '김철수', phone: '010-1234-5678', email: 'kim@example.com',
    inquiry_type: 'property', property_id: 'p1', preferred_visit_date: '2026-02-22', content: '래미안 레이카운티 매물 관련하여 문의드립니다. 실제 면적 확인 가능한지요?',
    status: 'new', agent_id: 'agent-1', created_at: '2026-02-17T14:30:00Z', updated_at: '2026-02-17T14:30:00Z',
  },
  {
    id: 'inq-2', inquiry_number: 'INQ-20260217-002', user_id: null, name: '이영희', phone: '010-9876-5432', email: 'lee@example.com',
    inquiry_type: 'price', property_id: null, preferred_visit_date: null, content: '강남구 역삼동 일대 오피스텔 시세가 궁금합니다. 전세와 월세 모두 알려주세요.',
    status: 'checked', agent_id: 'agent-1', created_at: '2026-02-17T10:15:00Z', updated_at: '2026-02-17T11:00:00Z',
  },
  {
    id: 'inq-3', inquiry_number: 'INQ-20260216-001', user_id: null, name: '박민수', phone: '010-5555-1234', email: null,
    inquiry_type: 'property', property_id: 'p5', preferred_visit_date: '2026-02-20', content: '잠실 엘리트 급매 매물 임장 가능한가요? 주말 오전 희망합니다.',
    status: 'in_progress', agent_id: 'agent-1', created_at: '2026-02-16T16:45:00Z', updated_at: '2026-02-17T09:00:00Z',
  },
  {
    id: 'inq-4', inquiry_number: 'INQ-20260215-001', user_id: null, name: '최수진', phone: '010-7777-8888', email: 'choi@example.com',
    inquiry_type: 'contract', property_id: 'p2', preferred_visit_date: null, content: '힐스테이트 클래시안 계약 진행하고 싶습니다. 중개보수와 절차 안내 부탁드립니다.',
    status: 'answered', agent_id: 'agent-1', created_at: '2026-02-15T09:20:00Z', updated_at: '2026-02-15T14:30:00Z',
  },
  {
    id: 'inq-5', inquiry_number: 'INQ-20260214-001', user_id: null, name: '정대현', phone: '010-3333-4444', email: null,
    inquiry_type: 'other', property_id: null, preferred_visit_date: null, content: '매물 등록하고 싶습니다. 송파구 잠실동 아파트인데 어떻게 진행하면 될까요?',
    status: 'closed', agent_id: 'agent-1', created_at: '2026-02-14T11:00:00Z', updated_at: '2026-02-14T16:00:00Z',
  },
  {
    id: 'inq-6', inquiry_number: 'INQ-20260218-001', user_id: null, name: '한지연', phone: '010-2222-3333', email: 'han@example.com',
    inquiry_type: 'property', property_id: 'p4', preferred_visit_date: '2026-02-25', content: '역삼 센트럴 오피스텔 30㎡ 월세 조건 협의 가능한가요? 보증금 올리고 월세 줄이고 싶습니다.',
    status: 'new', agent_id: 'agent-1', created_at: '2026-02-18T08:00:00Z', updated_at: '2026-02-18T08:00:00Z',
  },
]

const _replies: InquiryReply[] = [
  {
    id: 'reply-1', inquiry_id: 'inq-4', agent_id: 'agent-1',
    content: '안녕하세요 최수진님, 힐스테이트 클래시안 84㎡ 매매 관련 답변드립니다.\n\n매매가: 12억 3,000만원\n중개보수: 약 549만원 (거래금액의 0.4% + 부가세)\n\n계약 진행 절차:\n1. 매도인과 일정 조율\n2. 계약금 10% 지급\n3. 잔금일 협의 (통상 1~2개월)\n\n자세한 상담은 전화로 안내드리겠습니다.',
    sent_via: ['email', 'alimtalk'], sent_at: '2026-02-15T14:30:00Z', created_at: '2026-02-15T14:30:00Z',
  },
]

_seqCounter = 7

export interface InquiryFilters {
  status?: InquiryStatus | 'all'
  inquiryType?: InquiryType | 'all'
  unansweredOnly?: boolean
  search?: string
}

export async function fetchInquiries(filters: InquiryFilters = {}): Promise<Inquiry[]> {
  let result = [..._inquiries]

  if (filters.status && filters.status !== 'all') {
    result = result.filter((i) => i.status === filters.status)
  }
  if (filters.inquiryType && filters.inquiryType !== 'all') {
    result = result.filter((i) => i.inquiry_type === filters.inquiryType)
  }
  if (filters.unansweredOnly) {
    result = result.filter((i) => i.status === 'new' || i.status === 'checked' || i.status === 'in_progress')
  }
  if (filters.search) {
    const q = filters.search.toLowerCase()
    result = result.filter((i) => i.name.toLowerCase().includes(q) || i.content.toLowerCase().includes(q) || i.inquiry_number.toLowerCase().includes(q))
  }

  result.sort((a, b) => b.created_at.localeCompare(a.created_at))
  return result
}

export async function fetchInquiryById(id: string): Promise<Inquiry | null> {
  return _inquiries.find((i) => i.id === id) ?? null
}

export async function fetchInquiryReplies(inquiryId: string): Promise<InquiryReply[]> {
  return _replies.filter((r) => r.inquiry_id === inquiryId).sort((a, b) => a.created_at.localeCompare(b.created_at))
}

export async function createInquiry(data: {
  name: string
  phone: string
  email?: string
  inquiry_type: InquiryType
  property_id?: string
  preferred_visit_date?: string
  content: string
  user_id?: string
}): Promise<Inquiry> {
  const now = new Date().toISOString()
  const inquiry: Inquiry = {
    id: `inq-${Date.now()}`,
    inquiry_number: generateInquiryNumber(),
    user_id: data.user_id ?? null,
    name: data.name,
    phone: data.phone,
    email: data.email ?? null,
    inquiry_type: data.inquiry_type,
    property_id: data.property_id ?? null,
    preferred_visit_date: data.preferred_visit_date ?? null,
    content: data.content,
    status: 'new',
    agent_id: 'agent-1', // TODO: route to appropriate agent
    created_at: now,
    updated_at: now,
  }
  _inquiries.unshift(inquiry)
  return inquiry
}

export async function updateInquiryStatus(id: string, status: InquiryStatus): Promise<void> {
  const idx = _inquiries.findIndex((i) => i.id === id)
  if (idx !== -1) {
    _inquiries[idx] = { ..._inquiries[idx], status, updated_at: new Date().toISOString() }
  }
}

export async function createInquiryReply(data: {
  inquiry_id: string
  content: string
  sent_via: string[]
}): Promise<InquiryReply> {
  const now = new Date().toISOString()
  const reply: InquiryReply = {
    id: `reply-${Date.now()}`,
    inquiry_id: data.inquiry_id,
    agent_id: 'agent-1',
    content: data.content,
    sent_via: data.sent_via,
    sent_at: now,
    created_at: now,
  }
  _replies.push(reply)

  // Auto-update inquiry status to 'answered'
  const inqIdx = _inquiries.findIndex((i) => i.id === data.inquiry_id)
  if (inqIdx !== -1) {
    _inquiries[inqIdx] = { ..._inquiries[inqIdx], status: 'answered', updated_at: now }
  }

  return reply
}

export async function getUnansweredCount(): Promise<number> {
  return _inquiries.filter((i) => i.status === 'new' || i.status === 'checked' || i.status === 'in_progress').length
}

// User's own inquiries
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function fetchMyInquiries(_userId?: string): Promise<Inquiry[]> {
  // In mock, return all — in production, filter by user_id
  return [..._inquiries].sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export async function fetchMyInquiryReplies(inquiryId: string): Promise<InquiryReply[]> {
  return _replies.filter((r) => r.inquiry_id === inquiryId).sort((a, b) => a.created_at.localeCompare(b.created_at))
}

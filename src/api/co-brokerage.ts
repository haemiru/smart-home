// Mock API functions for co-brokerage features
// TODO: Replace with actual Supabase calls when backend is connected

import type { SharedProperty, CoBrokerageRequest, CoBrokerageRequestStatus } from '@/types/database'

const mockSharedProperties: SharedProperty[] = [
  {
    id: 'sp-1',
    property_id: 'p-ext-1',
    agent_id: 'u-agent-ext-1',
    agent_name: '이민호',
    office_name: '역삼 부동산',
    commission_ratio: 50,
    is_active: true,
    property_title: '역삼 아이파크 102동 1502호',
    address: '서울 강남구 역삼동 789-12',
    transaction_type: 'sale',
    sale_price: 158000,
    deposit: null,
    monthly_rent: null,
    exclusive_area_m2: 84.97,
    photos: [],
    created_at: '2026-02-10T00:00:00Z',
  },
  {
    id: 'sp-2',
    property_id: 'p-ext-2',
    agent_id: 'u-agent-ext-2',
    agent_name: '박서준',
    office_name: '서초 공인중개사',
    commission_ratio: 50,
    is_active: true,
    property_title: '반포 래미안 퍼스티지 503동 2301호',
    address: '서울 서초구 반포동 18-1',
    transaction_type: 'sale',
    sale_price: 285000,
    deposit: null,
    monthly_rent: null,
    exclusive_area_m2: 114.5,
    photos: [],
    created_at: '2026-02-08T00:00:00Z',
  },
  {
    id: 'sp-3',
    property_id: 'p-ext-3',
    agent_id: 'u-agent-ext-3',
    agent_name: '김태리',
    office_name: '대치 프라임 부동산',
    commission_ratio: 40,
    is_active: true,
    property_title: '대치 쌍용 예가 201동 801호',
    address: '서울 강남구 대치동 345-6',
    transaction_type: 'jeonse',
    sale_price: null,
    deposit: 80000,
    monthly_rent: null,
    exclusive_area_m2: 59.9,
    photos: [],
    created_at: '2026-02-05T00:00:00Z',
  },
  {
    id: 'sp-4',
    property_id: 'p-ext-4',
    agent_id: 'u-agent-ext-1',
    agent_name: '이민호',
    office_name: '역삼 부동산',
    commission_ratio: 50,
    is_active: true,
    property_title: '역삼 센트럴 오피스텔 1204호',
    address: '서울 강남구 역삼동 123-45',
    transaction_type: 'monthly',
    sale_price: null,
    deposit: 5000,
    monthly_rent: 120,
    exclusive_area_m2: 33.2,
    photos: [],
    created_at: '2026-02-01T00:00:00Z',
  },
  {
    id: 'sp-5',
    property_id: 'p-ext-5',
    agent_id: 'u-agent-ext-4',
    agent_name: '정유미',
    office_name: '송파 리얼티',
    commission_ratio: 50,
    is_active: true,
    property_title: '잠실 엘스 109동 1802호',
    address: '서울 송파구 잠실동 40',
    transaction_type: 'sale',
    sale_price: 225000,
    deposit: null,
    monthly_rent: null,
    exclusive_area_m2: 84.82,
    photos: [],
    created_at: '2026-01-28T00:00:00Z',
  },
]

const mockRequests: CoBrokerageRequest[] = [
  {
    id: 'cbr-1',
    shared_property_id: 'sp-1',
    requester_agent_id: 'u-agent-1',
    requester_name: '김중개',
    requester_office: '스마트 공인중개사사무소',
    requester_phone: '02-1234-5678',
    status: 'approved',
    message: '역삼 아이파크 매물에 관심 있는 고객이 있습니다. 공동중개 요청드립니다.',
    commission_ratio: 50,
    property_title: '역삼 아이파크 102동 1502호',
    address: '서울 강남구 역삼동 789-12',
    created_at: '2026-02-11T10:00:00Z',
    updated_at: '2026-02-11T14:00:00Z',
  },
  {
    id: 'cbr-2',
    shared_property_id: 'sp-5',
    requester_agent_id: 'u-agent-1',
    requester_name: '김중개',
    requester_office: '스마트 공인중개사사무소',
    requester_phone: '02-1234-5678',
    status: 'pending',
    message: '잠실 엘스 매물 공동중개 요청합니다. 매수 의향이 있는 VIP 고객입니다.',
    commission_ratio: null,
    property_title: '잠실 엘스 109동 1802호',
    address: '서울 송파구 잠실동 40',
    created_at: '2026-02-15T09:00:00Z',
    updated_at: '2026-02-15T09:00:00Z',
  },
  // Received request (from other agents)
  {
    id: 'cbr-3',
    shared_property_id: 'sp-own-1',
    requester_agent_id: 'u-agent-ext-5',
    requester_name: '한석규',
    requester_office: '강남 퍼스트 부동산',
    requester_phone: '02-9876-5432',
    status: 'pending',
    message: '래미안 대치팰리스 매물에 관심 있는 매수자가 있습니다.',
    commission_ratio: null,
    property_title: '래미안 대치팰리스 102동 1502호',
    address: '서울 강남구 대치동 890-5',
    created_at: '2026-02-16T11:00:00Z',
    updated_at: '2026-02-16T11:00:00Z',
  },
  {
    id: 'cbr-4',
    shared_property_id: 'sp-own-1',
    requester_agent_id: 'u-agent-ext-6',
    requester_name: '송강',
    requester_office: '선릉역 부동산',
    requester_phone: '02-5555-1234',
    status: 'approved',
    message: '대치팰리스 공동중개 요청 드립니다. 전세 전환도 가능한 고객입니다.',
    commission_ratio: 50,
    property_title: '래미안 대치팰리스 102동 1502호',
    address: '서울 강남구 대치동 890-5',
    created_at: '2026-02-12T15:00:00Z',
    updated_at: '2026-02-13T10:00:00Z',
  },
]

let _sharedProperties = [...mockSharedProperties]
let _requests = [...mockRequests]

const MY_AGENT_ID = 'u-agent-1'

// ──────────────────────────────────────────
// Shared Property Pool
// ──────────────────────────────────────────

export async function fetchSharedProperties(search?: string): Promise<SharedProperty[]> {
  let result = _sharedProperties.filter((sp) => sp.is_active && sp.agent_id !== MY_AGENT_ID)
  if (search) {
    const q = search.toLowerCase()
    result = result.filter(
      (sp) => sp.property_title.toLowerCase().includes(q) || sp.address.toLowerCase().includes(q) || sp.office_name.toLowerCase().includes(q),
    )
  }
  return result.sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export async function shareMyProperty(data: {
  property_id: string
  property_title: string
  address: string
  transaction_type: string
  sale_price?: number | null
  deposit?: number | null
  monthly_rent?: number | null
  exclusive_area_m2?: number | null
  commission_ratio: number
}): Promise<SharedProperty> {
  const sp: SharedProperty = {
    id: `sp-${Date.now()}`,
    property_id: data.property_id,
    agent_id: MY_AGENT_ID,
    agent_name: '김중개',
    office_name: '스마트 공인중개사사무소',
    commission_ratio: data.commission_ratio,
    is_active: true,
    property_title: data.property_title,
    address: data.address,
    transaction_type: data.transaction_type as SharedProperty['transaction_type'],
    sale_price: data.sale_price ?? null,
    deposit: data.deposit ?? null,
    monthly_rent: data.monthly_rent ?? null,
    exclusive_area_m2: data.exclusive_area_m2 ?? null,
    photos: [],
    created_at: new Date().toISOString(),
  }
  _sharedProperties.unshift(sp)
  return sp
}

// ──────────────────────────────────────────
// Co-Brokerage Requests
// ──────────────────────────────────────────

export async function createCoBrokerageRequest(data: {
  shared_property_id: string
  message: string
  property_title: string
  address: string
}): Promise<CoBrokerageRequest> {
  const req: CoBrokerageRequest = {
    id: `cbr-${Date.now()}`,
    shared_property_id: data.shared_property_id,
    requester_agent_id: MY_AGENT_ID,
    requester_name: '김중개',
    requester_office: '스마트 공인중개사사무소',
    requester_phone: '02-1234-5678',
    status: 'pending',
    message: data.message,
    commission_ratio: null,
    property_title: data.property_title,
    address: data.address,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  _requests.push(req)
  return req
}

export async function fetchSentRequests(): Promise<CoBrokerageRequest[]> {
  return _requests
    .filter((r) => r.requester_agent_id === MY_AGENT_ID)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export async function fetchReceivedRequests(): Promise<CoBrokerageRequest[]> {
  return _requests
    .filter((r) => r.requester_agent_id !== MY_AGENT_ID)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export async function updateRequestStatus(
  requestId: string,
  status: CoBrokerageRequestStatus,
  commissionRatio?: number,
): Promise<void> {
  const idx = _requests.findIndex((r) => r.id === requestId)
  if (idx !== -1) {
    _requests[idx] = {
      ..._requests[idx],
      status,
      commission_ratio: commissionRatio ?? _requests[idx].commission_ratio,
      updated_at: new Date().toISOString(),
    }
  }
}

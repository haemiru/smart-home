// Mock API functions for admin settings
// TODO: Replace with actual Supabase calls when backend is connected

import type { AgentProfile, AgentFeatureSetting, StaffMember, PropertyCategory, StaffRole, PlanType } from '@/types/database'

// ──────────────────────────────────────────
// Office Settings
// ──────────────────────────────────────────

export type BusinessHours = {
  [day: string]: { open: string; close: string; isOpen: boolean }
}

export type InsuranceInfo = {
  company: string
  policy_number: string
  expiry_date: string
}

const mockAgentProfile: AgentProfile = {
  id: 'ap-1',
  user_id: 'u-agent-1',
  office_name: '스마트 공인중개사사무소',
  representative: '김중개',
  business_number: '123-45-67890',
  license_number: '제2024-서울강남-00123호',
  address: '서울 강남구 역삼동 123-4 스마트빌딩 3층',
  phone: '02-1234-5678',
  fax: '02-1234-5679',
  business_hours: {
    월: { open: '09:00', close: '18:00', isOpen: true },
    화: { open: '09:00', close: '18:00', isOpen: true },
    수: { open: '09:00', close: '18:00', isOpen: true },
    목: { open: '09:00', close: '18:00', isOpen: true },
    금: { open: '09:00', close: '18:00', isOpen: true },
    토: { open: '10:00', close: '15:00', isOpen: true },
    일: { open: '10:00', close: '15:00', isOpen: false },
  },
  logo_url: null,
  description: '강남 지역 아파트 전문 중개사무소입니다. 20년 경력의 전문 중개사가 친절하게 상담해 드립니다.',
  specialties: ['아파트', '오피스텔', '상가'],
  insurance_info: {
    company: 'DB손해보험',
    policy_number: 'DB-2025-12345',
    expiry_date: '2026-12-31',
  },
  is_verified: true,
  subscription_plan: 'free',
  subscription_started_at: '2024-01-01T00:00:00Z',
  created_at: '2024-01-01T00:00:00Z',
}

let _agentProfile = { ...mockAgentProfile }

export async function fetchOfficeSettings(): Promise<AgentProfile> {
  return { ..._agentProfile }
}

export async function updateOfficeSettings(data: Partial<AgentProfile>): Promise<AgentProfile> {
  _agentProfile = { ..._agentProfile, ...data }
  return { ..._agentProfile }
}

// ──────────────────────────────────────────
// Staff Management
// ──────────────────────────────────────────

export type StaffWithUser = StaffMember & {
  display_name: string
  email: string
  phone: string | null
  last_login: string | null
}

const mockStaff: StaffWithUser[] = [
  {
    id: 'staff-1',
    agent_profile_id: 'ap-1',
    user_id: 'u-staff-1',
    role: 'lead_agent',
    permissions: {
      property_create: true, property_delete: true,
      contract_create: true, contract_approve: true, e_signature: true,
      customer_view: true, ai_tools: true, co_brokerage: true, settings: true,
    },
    is_active: true,
    created_at: '2024-06-01T00:00:00Z',
    display_name: '박공인',
    email: 'park@smartrealty.com',
    phone: '010-1234-5678',
    last_login: '2026-02-18T09:15:00Z',
  },
  {
    id: 'staff-2',
    agent_profile_id: 'ap-1',
    user_id: 'u-staff-2',
    role: 'associate_agent',
    permissions: {
      property_create: true, property_delete: false,
      contract_create: true, contract_approve: false, e_signature: false,
      customer_view: true, ai_tools: true, co_brokerage: false, settings: false,
    },
    is_active: true,
    created_at: '2025-01-15T00:00:00Z',
    display_name: '이소속',
    email: 'lee@smartrealty.com',
    phone: '010-2345-6789',
    last_login: '2026-02-17T14:30:00Z',
  },
  {
    id: 'staff-3',
    agent_profile_id: 'ap-1',
    user_id: 'u-staff-3',
    role: 'assistant',
    permissions: {
      property_create: true, property_delete: false,
      contract_create: false, contract_approve: false, e_signature: false,
      customer_view: true, ai_tools: false, co_brokerage: false, settings: false,
    },
    is_active: false,
    created_at: '2025-03-10T00:00:00Z',
    display_name: '최보조',
    email: 'choi@smartrealty.com',
    phone: '010-3456-7890',
    last_login: '2026-01-05T10:00:00Z',
  },
]

let _staff = [...mockStaff]

export async function fetchStaffList(): Promise<StaffWithUser[]> {
  return [..._staff]
}

export async function inviteStaff(email: string, role: StaffRole): Promise<StaffWithUser> {
  const newStaff: StaffWithUser = {
    id: `staff-${Date.now()}`,
    agent_profile_id: 'ap-1',
    user_id: `u-staff-${Date.now()}`,
    role,
    permissions: role === 'lead_agent'
      ? { property_create: true, property_delete: true, contract_create: true, contract_approve: true, e_signature: true, customer_view: true, ai_tools: true, co_brokerage: true, settings: true }
      : role === 'associate_agent'
        ? { property_create: true, property_delete: false, contract_create: true, contract_approve: false, e_signature: false, customer_view: true, ai_tools: true, co_brokerage: false, settings: false }
        : { property_create: true, property_delete: false, contract_create: false, contract_approve: false, e_signature: false, customer_view: true, ai_tools: false, co_brokerage: false, settings: false },
    is_active: true,
    created_at: new Date().toISOString(),
    display_name: email.split('@')[0],
    email,
    phone: null,
    last_login: null,
  }
  _staff.push(newStaff)
  return newStaff
}

export async function updateStaffRole(staffId: string, role: StaffRole): Promise<void> {
  const idx = _staff.findIndex((s) => s.id === staffId)
  if (idx !== -1) _staff[idx] = { ..._staff[idx], role }
}

export async function updateStaffPermissions(staffId: string, permissions: Record<string, unknown>): Promise<void> {
  const idx = _staff.findIndex((s) => s.id === staffId)
  if (idx !== -1) _staff[idx] = { ..._staff[idx], permissions }
}

export async function toggleStaffActive(staffId: string): Promise<void> {
  const idx = _staff.findIndex((s) => s.id === staffId)
  if (idx !== -1) _staff[idx] = { ..._staff[idx], is_active: !_staff[idx].is_active }
}

export async function deleteStaff(staffId: string): Promise<void> {
  _staff = _staff.filter((s) => s.id !== staffId)
}

// ──────────────────────────────────────────
// Feature Settings
// ──────────────────────────────────────────

export type FeatureGroup = {
  key: string
  label: string
  icon: string
  features: FeatureDefinition[]
}

export type FeatureDefinition = {
  key: string
  label: string
  description: string
  is_enabled: boolean
  is_locked: boolean
  is_pro: boolean
  gemini?: boolean
}

const featureGroups: FeatureGroup[] = [
  {
    key: 'core', label: '핵심업무', icon: '🔒',
    features: [
      { key: 'properties', label: '매물관리', description: '매물 등록, 수정, 삭제 및 상태 관리', is_enabled: true, is_locked: true, is_pro: false },
      { key: 'contracts', label: '계약서/확인설명서', description: '계약서 작성, 양식 관리, 확인설명서 자동 생성', is_enabled: true, is_locked: true, is_pro: false },
      { key: 'crm', label: '기본CRM', description: '고객 관리, 파이프라인, 활동 기록', is_enabled: true, is_locked: true, is_pro: false },
      { key: 'inquiries', label: '문의관리', description: '문의 접수, 답변, 상태 관리', is_enabled: true, is_locked: true, is_pro: false },
      { key: 'contract_tracker', label: '계약트래커', description: '계약 진행 단계 추적, D-Day, 필요서류', is_enabled: true, is_locked: true, is_pro: false },
      { key: 'basic_valuation', label: '기본시세', description: '시세 조회, 가격 동향 차트', is_enabled: true, is_locked: true, is_pro: false },
    ],
  },
  {
    key: 'ai', label: 'AI 도구', icon: '🤖',
    features: [
      { key: 'ai_description', label: 'AI매물설명', description: '플랫폼별 맞춤 매물 설명글 자동 생성', is_enabled: true, is_locked: false, is_pro: false, gemini: true },
      { key: 'ai_legal_review', label: 'AI법률검토', description: '계약서 법률 검토 및 위험 요소 분석', is_enabled: true, is_locked: false, is_pro: false, gemini: true },
      { key: 'ai_customer_analysis', label: 'AI고객성향', description: '고객 행동 분석, 진성도 평가, 전환 예측', is_enabled: true, is_locked: false, is_pro: false, gemini: true },
      { key: 'ai_chatbot', label: 'AI챗봇', description: '사용자 포털 AI 상담 챗봇', is_enabled: true, is_locked: false, is_pro: false, gemini: true },
      { key: 'ai_staging', label: 'AI가상스테이징', description: 'AI로 매물 사진 가상 인테리어 적용', is_enabled: false, is_locked: false, is_pro: true, gemini: true },
      { key: 'ai_reply_draft', label: 'AI답변초안', description: '문의에 대한 AI 답변 초안 생성', is_enabled: true, is_locked: false, is_pro: false, gemini: true },
    ],
  },
  {
    key: 'marketing', label: '마케팅&분석', icon: '📊',
    features: [
      { key: 'sns_posting', label: 'SNS포스팅', description: '플랫폼별 매물 홍보글 자동 생성', is_enabled: false, is_locked: false, is_pro: true },
      { key: 'avm', label: 'AVM', description: '자동 가치 평가 모델 기반 시세 분석', is_enabled: true, is_locked: false, is_pro: false },
      { key: 'location_report', label: '입지리포트', description: '교통, 학군, 편의시설 등 입지 분석', is_enabled: true, is_locked: false, is_pro: false },
      { key: 'roi_calculator', label: '수익률계산기', description: 'ROI, Cap Rate, 월별 현금흐름 계산', is_enabled: true, is_locked: false, is_pro: false },
      { key: 'buy_sell_signal', label: '매수매도신호등', description: '시장 지표 기반 매수/관망/매도 신호', is_enabled: true, is_locked: false, is_pro: false },
    ],
  },
  {
    key: 'customer_service', label: '고객서비스', icon: '👥',
    features: [
      { key: 'curation_alimtalk', label: '큐레이션&알림톡', description: '맞춤 매물 추천 및 카카오 알림톡 발송', is_enabled: false, is_locked: false, is_pro: true },
      { key: 'scoring', label: '스코어링', description: '고객 행동 기반 자동 점수 부여', is_enabled: true, is_locked: false, is_pro: false },
      { key: 'sincerity_analysis', label: '진성분석(AI)', description: 'AI 기반 고객 진성도 분석', is_enabled: true, is_locked: false, is_pro: false, gemini: true },
      { key: 'realtime_chat', label: '실시간채팅', description: '고객과 실시간 채팅 상담', is_enabled: false, is_locked: false, is_pro: true },
      { key: 'inspection_booking', label: '임장예약', description: '고객 임장 예약 접수 및 관리', is_enabled: false, is_locked: false, is_pro: false },
      { key: 'move_in_guide', label: '전입가이드', description: '임대차 계약 전입 절차 안내 생성', is_enabled: true, is_locked: false, is_pro: false },
    ],
  },
  {
    key: 'field', label: '현장&관리', icon: '📋',
    features: [
      { key: 'inspection', label: '임장체크리스트', description: '현장 점검 체크리스트 및 보고서', is_enabled: true, is_locked: false, is_pro: false },
      { key: 'rental_mgmt', label: '임대관리서비스', description: '임대 물건, 월세 수납, 수리 요청 관리', is_enabled: true, is_locked: false, is_pro: false },
    ],
  },
  {
    key: 'legal', label: '법률&행정', icon: '⚖️',
    features: [
      { key: 'registry', label: '등기부등본', description: '등기부등본 조회 및 권리 분석', is_enabled: true, is_locked: false, is_pro: false },
      { key: 'e_signature', label: '전자서명', description: '카카오/네이버 전자서명 연동', is_enabled: false, is_locked: false, is_pro: true },
    ],
  },
  {
    key: 'collaboration', label: '협업', icon: '🤝',
    features: [
      { key: 'co_brokerage', label: '공동중개', description: '매물 공유 풀 및 공동중개 요청 관리', is_enabled: true, is_locked: false, is_pro: false },
    ],
  },
  {
    key: 'floating', label: '플로팅버튼', icon: '💬',
    features: [
      { key: 'fab_kakao', label: '카카오상담', description: '카카오톡 채널 상담 연결', is_enabled: true, is_locked: false, is_pro: false },
      { key: 'fab_naver', label: '네이버예약', description: '네이버 예약 연결', is_enabled: false, is_locked: false, is_pro: false },
      { key: 'fab_phone', label: '전화상담', description: '사무소 대표번호 연결', is_enabled: true, is_locked: false, is_pro: false },
      { key: 'fab_inquiry', label: '문의하기', description: '빠른 문의 접수', is_enabled: true, is_locked: false, is_pro: false },
    ],
  },
]

let _featureSettings: AgentFeatureSetting[] = featureGroups.flatMap((g) =>
  g.features.map((f) => ({
    id: `fs-${f.key}`,
    agent_id: 'u-agent-1',
    feature_key: f.key,
    is_enabled: f.is_enabled,
    is_locked: f.is_locked,
    settings_json: null,
    updated_at: '2026-01-01T00:00:00Z',
  }))
)

export async function fetchFeatureGroups(): Promise<FeatureGroup[]> {
  // Merge current settings into groups
  return featureGroups.map((g) => ({
    ...g,
    features: g.features.map((f) => {
      const setting = _featureSettings.find((s) => s.feature_key === f.key)
      return {
        ...f,
        is_enabled: setting?.is_enabled ?? f.is_enabled,
      }
    }),
  }))
}

export async function toggleFeature(featureKey: string, enabled: boolean): Promise<void> {
  const idx = _featureSettings.findIndex((s) => s.feature_key === featureKey)
  if (idx !== -1) {
    _featureSettings[idx] = { ..._featureSettings[idx], is_enabled: enabled, updated_at: new Date().toISOString() }
  }
}

export async function fetchFeatureSettings(): Promise<AgentFeatureSetting[]> {
  return [..._featureSettings]
}

// ──────────────────────────────────────────
// Category Settings
// ──────────────────────────────────────────

const mockCategories: PropertyCategory[] = [
  // 주거
  { id: 'cat-apt', agent_id: null, name: '아파트', icon: '🏢', color: '#3B82F6', sort_order: 1, is_system: true, is_active: true, required_fields: null },
  { id: 'cat-officetel-r', agent_id: null, name: '오피스텔(주거)', icon: '🏨', color: '#6366F1', sort_order: 2, is_system: true, is_active: true, required_fields: null },
  { id: 'cat-villa', agent_id: null, name: '빌라', icon: '🏘️', color: '#8B5CF6', sort_order: 3, is_system: true, is_active: true, required_fields: null },
  { id: 'cat-house', agent_id: null, name: '단독/다가구', icon: '🏠', color: '#A855F7', sort_order: 4, is_system: true, is_active: true, required_fields: null },
  { id: 'cat-oneroom', agent_id: null, name: '원룸/투룸', icon: '🛏️', color: '#D946EF', sort_order: 5, is_system: true, is_active: true, required_fields: null },
  { id: 'cat-urban', agent_id: null, name: '도시형', icon: '🏙️', color: '#EC4899', sort_order: 6, is_system: true, is_active: false, required_fields: null },
  { id: 'cat-mixed', agent_id: null, name: '주상복합', icon: '🌆', color: '#F43F5E', sort_order: 7, is_system: true, is_active: false, required_fields: null },
  // 상업
  { id: 'cat-store', agent_id: null, name: '상가(일반)', icon: '🏪', color: '#F59E0B', sort_order: 8, is_system: true, is_active: true, required_fields: null },
  { id: 'cat-complex-store', agent_id: null, name: '단지내상가', icon: '🏬', color: '#D97706', sort_order: 9, is_system: true, is_active: false, required_fields: null },
  { id: 'cat-office', agent_id: null, name: '사무실', icon: '💼', color: '#10B981', sort_order: 10, is_system: true, is_active: true, required_fields: null },
  { id: 'cat-officetel-b', agent_id: null, name: '오피스텔(업무)', icon: '🏢', color: '#059669', sort_order: 11, is_system: true, is_active: true, required_fields: null },
  { id: 'cat-knowledge', agent_id: null, name: '지식산업센터', icon: '🏗️', color: '#14B8A6', sort_order: 12, is_system: true, is_active: false, required_fields: null },
  // 산업
  { id: 'cat-factory', agent_id: null, name: '공장', icon: '🏭', color: '#6B7280', sort_order: 13, is_system: true, is_active: false, required_fields: null },
  { id: 'cat-warehouse', agent_id: null, name: '창고', icon: '📦', color: '#9CA3AF', sort_order: 14, is_system: true, is_active: false, required_fields: null },
  // 토지
  { id: 'cat-land', agent_id: null, name: '대지', icon: '🌍', color: '#84CC16', sort_order: 15, is_system: true, is_active: false, required_fields: null },
  { id: 'cat-forest', agent_id: null, name: '임야', icon: '🌲', color: '#22C55E', sort_order: 16, is_system: true, is_active: false, required_fields: null },
  { id: 'cat-farm', agent_id: null, name: '농지', icon: '🌾', color: '#65A30D', sort_order: 17, is_system: true, is_active: false, required_fields: null },
  // 건물
  { id: 'cat-building', agent_id: null, name: '건물(통매매)', icon: '🏦', color: '#EF4444', sort_order: 18, is_system: true, is_active: false, required_fields: null },
  { id: 'cat-pension', agent_id: null, name: '숙박/펜션', icon: '🏕️', color: '#F97316', sort_order: 19, is_system: true, is_active: false, required_fields: null },
]

let _categories = [...mockCategories]

export async function fetchSettingsCategories(): Promise<PropertyCategory[]> {
  return [..._categories].sort((a, b) => a.sort_order - b.sort_order)
}

export async function toggleCategory(id: string, isActive: boolean): Promise<void> {
  const idx = _categories.findIndex((c) => c.id === id)
  if (idx !== -1) _categories[idx] = { ..._categories[idx], is_active: isActive }
}

export async function reorderCategories(orderedIds: string[]): Promise<void> {
  orderedIds.forEach((id, i) => {
    const idx = _categories.findIndex((c) => c.id === id)
    if (idx !== -1) _categories[idx] = { ..._categories[idx], sort_order: i + 1 }
  })
}

export async function addCustomCategory(data: { name: string; icon: string; color: string }): Promise<PropertyCategory> {
  const cat: PropertyCategory = {
    id: `cat-custom-${Date.now()}`,
    agent_id: 'u-agent-1',
    name: data.name,
    icon: data.icon,
    color: data.color,
    sort_order: _categories.length + 1,
    is_system: false,
    is_active: true,
    required_fields: null,
  }
  _categories.push(cat)
  return cat
}

// ──────────────────────────────────────────
// Search Settings
// ──────────────────────────────────────────

export type SearchFilterGroup = {
  key: string
  label: string
  is_enabled: boolean
  sort_order: number
}

export type QuickSearchCard = {
  key: string
  label: string
  icon: string
  is_enabled: boolean
  sort_order: number
  conditions: Record<string, unknown>
}

export type SearchSettings = {
  filter_groups: SearchFilterGroup[]
  quick_cards: QuickSearchCard[]
  default_sort: string
  items_per_page: number
  default_view: 'grid' | 'list'
  map_center: { lat: number; lng: number }
  map_zoom: number
}

const defaultSearchSettings: SearchSettings = {
  filter_groups: [
    { key: 'transaction_type', label: '거래방식', is_enabled: true, sort_order: 1 },
    { key: 'price', label: '금액별', is_enabled: true, sort_order: 2 },
    { key: 'area', label: '면적별', is_enabled: true, sort_order: 3 },
    { key: 'rooms', label: '방수별', is_enabled: true, sort_order: 4 },
    { key: 'floor', label: '층수별', is_enabled: true, sort_order: 5 },
    { key: 'direction', label: '방향별', is_enabled: false, sort_order: 6 },
    { key: 'built_year', label: '건축년도별', is_enabled: false, sort_order: 7 },
  ],
  quick_cards: [
    { key: 'new_built', label: '신축 매물', icon: '🆕', is_enabled: true, sort_order: 1, conditions: { built_within_years: 3 } },
    { key: 'station_near', label: '역세권', icon: '🚇', is_enabled: true, sort_order: 2, conditions: { walk_minutes: 10 } },
    { key: 'school_near', label: '학세권', icon: '🏫', is_enabled: true, sort_order: 3, conditions: { school_walk_minutes: 10 } },
    { key: 'park_near', label: '공세권', icon: '🌳', is_enabled: true, sort_order: 4, conditions: { park_walk_minutes: 10 } },
    { key: 'pet_friendly', label: '반려동물', icon: '🐕', is_enabled: true, sort_order: 5, conditions: { pets_allowed: true } },
    { key: 'parking', label: '주차 편리', icon: '🅿️', is_enabled: true, sort_order: 6, conditions: { parking_per_unit: 1 } },
    { key: 'low_maintenance', label: '관리비 저렴', icon: '💰', is_enabled: true, sort_order: 7, conditions: { max_maintenance: 15 } },
    { key: 'rooftop', label: '탑층', icon: '🌤️', is_enabled: true, sort_order: 8, conditions: { is_top_floor: true } },
    { key: 'south_facing', label: '남향', icon: '☀️', is_enabled: true, sort_order: 9, conditions: { direction: '남향' } },
    { key: 'elevator', label: '엘리베이터', icon: '🛗', is_enabled: true, sort_order: 10, conditions: { has_elevator: true } },
    { key: 'urgent', label: '급매물', icon: '🔥', is_enabled: true, sort_order: 11, conditions: { is_urgent: true } },
    { key: 'move_in_now', label: '즉시입주', icon: '📅', is_enabled: false, sort_order: 12, conditions: { move_in_immediate: true } },
  ],
  default_sort: 'newest',
  items_per_page: 12,
  default_view: 'grid',
  map_center: { lat: 37.5665, lng: 126.978 },
  map_zoom: 14,
}

let _searchSettings = { ...defaultSearchSettings }

export async function fetchSearchSettings(): Promise<SearchSettings> {
  return { ..._searchSettings }
}

export async function updateSearchSettings(data: Partial<SearchSettings>): Promise<void> {
  _searchSettings = { ..._searchSettings, ...data }
}

// ──────────────────────────────────────────
// Unit Settings
// ──────────────────────────────────────────

export type UnitSettings = {
  area_unit: 'sqm' | 'pyeong'
  area_dual_display: boolean
  price_unit: 'man' | 'eok'
  price_auto_convert: boolean
  price_separator: boolean
  distance_unit: 'm' | 'km'
  date_format: 'YYYY.MM.DD' | 'YYYY-MM-DD' | 'MM/DD/YYYY'
  time_format: '24h' | '12h'
}

let _unitSettings: UnitSettings = {
  area_unit: 'sqm',
  area_dual_display: true,
  price_unit: 'man',
  price_auto_convert: true,
  price_separator: true,
  distance_unit: 'm',
  date_format: 'YYYY.MM.DD',
  time_format: '24h',
}

export async function fetchUnitSettings(): Promise<UnitSettings> {
  return { ..._unitSettings }
}

export async function updateUnitSettings(data: Partial<UnitSettings>): Promise<void> {
  _unitSettings = { ..._unitSettings, ...data }
}

// ──────────────────────────────────────────
// Floating Button Settings
// ──────────────────────────────────────────

export type FloatingButtonConfig = {
  key: string
  label: string
  icon: string
  is_enabled: boolean
  sort_order: number
  url?: string
  phone?: string
}

export type FloatingSettings = {
  buttons: FloatingButtonConfig[]
  fab_color: string
}

let _floatingSettings: FloatingSettings = {
  buttons: [
    { key: 'kakao', label: '카카오상담', icon: '💬', is_enabled: true, sort_order: 1, url: 'https://pf.kakao.com/_example' },
    { key: 'naver', label: '네이버예약', icon: '📗', is_enabled: false, sort_order: 2, url: '' },
    { key: 'phone', label: '전화상담', icon: '📞', is_enabled: true, sort_order: 3, phone: '02-1234-5678' },
    { key: 'inquiry', label: '문의하기', icon: '✉️', is_enabled: true, sort_order: 4 },
  ],
  fab_color: '#4F46E5',
}

export async function fetchFloatingSettings(): Promise<FloatingSettings> {
  return JSON.parse(JSON.stringify(_floatingSettings))
}

export async function updateFloatingSettings(data: Partial<FloatingSettings>): Promise<void> {
  _floatingSettings = { ..._floatingSettings, ...data }
}

// ──────────────────────────────────────────
// Notification Settings
// ──────────────────────────────────────────

export type NotificationChannel = 'push' | 'email' | 'alimtalk'
export type NotificationType = 'inquiry' | 'inspection' | 'contract_schedule' | 'registry_change' | 'co_brokerage' | 'view_count' | 'market_change'

export type NotificationSetting = {
  type: NotificationType
  label: string
  channels: Record<NotificationChannel, boolean>
}

let _notificationSettings: NotificationSetting[] = [
  { type: 'inquiry', label: '문의 접수', channels: { push: true, email: true, alimtalk: false } },
  { type: 'inspection', label: '임장 예약', channels: { push: true, email: false, alimtalk: false } },
  { type: 'contract_schedule', label: '계약 일정', channels: { push: true, email: true, alimtalk: true } },
  { type: 'registry_change', label: '등기 변동', channels: { push: true, email: true, alimtalk: false } },
  { type: 'co_brokerage', label: '공동중개', channels: { push: true, email: false, alimtalk: false } },
  { type: 'view_count', label: '조회수 알림', channels: { push: false, email: false, alimtalk: false } },
  { type: 'market_change', label: '시세 변동', channels: { push: false, email: true, alimtalk: false } },
]

export async function fetchNotificationSettings(): Promise<NotificationSetting[]> {
  return [..._notificationSettings.map((s) => ({ ...s, channels: { ...s.channels } }))]
}

export async function updateNotificationSetting(type: NotificationType, channel: NotificationChannel, enabled: boolean): Promise<void> {
  const idx = _notificationSettings.findIndex((s) => s.type === type)
  if (idx !== -1) {
    _notificationSettings[idx] = {
      ..._notificationSettings[idx],
      channels: { ..._notificationSettings[idx].channels, [channel]: enabled },
    }
  }
}

// ──────────────────────────────────────────
// Integration Settings
// ──────────────────────────────────────────

export type IntegrationConfig = {
  key: string
  label: string
  icon: string
  category: string
  is_connected: boolean
  url?: string
  account_id?: string
}

let _integrations: IntegrationConfig[] = [
  { key: 'kakao_channel', label: '카카오톡채널', icon: '💬', category: '메시징', is_connected: true, url: 'https://pf.kakao.com/_example' },
  { key: 'naver_place', label: '네이버스마트플레이스', icon: '📗', category: '예약', is_connected: false, url: '' },
  { key: 'google_calendar', label: 'Google캘린더', icon: '📅', category: '일정', is_connected: false },
  { key: 'instagram', label: '인스타그램', icon: '📸', category: 'SNS', is_connected: false, account_id: '' },
  { key: 'blog', label: '블로그', icon: '📝', category: 'SNS', is_connected: false, url: '' },
  { key: 'band', label: '밴드', icon: '🎵', category: 'SNS', is_connected: false, url: '' },
  { key: 'kakao_esign', label: '카카오 전자서명', icon: '✍️', category: '전자서명', is_connected: false },
  { key: 'naver_esign', label: '네이버 전자서명', icon: '✍️', category: '전자서명', is_connected: false },
]

export async function fetchIntegrations(): Promise<IntegrationConfig[]> {
  return [..._integrations.map((i) => ({ ...i }))]
}

export async function toggleIntegration(key: string, connected: boolean, data?: { url?: string; account_id?: string }): Promise<void> {
  const idx = _integrations.findIndex((i) => i.key === key)
  if (idx !== -1) {
    _integrations[idx] = { ..._integrations[idx], is_connected: connected, ...data }
  }
}

// ──────────────────────────────────────────
// Billing / Plan
// ──────────────────────────────────────────

export type BillingInfo = {
  current_plan: PlanType
  plan_label: string
  price: number
  next_billing_date: string
  payment_history: { date: string; amount: number; description: string; status: string }[]
}

const PLAN_META: Record<PlanType, { label: string; price: number }> = {
  free: { label: 'Free', price: 0 },
  basic: { label: 'Basic', price: 29000 },
  pro: { label: 'Pro', price: 79000 },
  enterprise: { label: 'Enterprise', price: -1 },
}

export async function fetchBillingInfo(): Promise<BillingInfo> {
  const plan = _agentProfile.subscription_plan as PlanType
  const meta = PLAN_META[plan]
  return {
    current_plan: plan,
    plan_label: meta.label,
    price: meta.price,
    next_billing_date: '2026-03-01',
    payment_history: meta.price > 0
      ? [
          { date: '2026-02-01', amount: meta.price, description: `${meta.label} 요금제 (월간)`, status: '결제완료' },
          { date: '2026-01-01', amount: meta.price, description: `${meta.label} 요금제 (월간)`, status: '결제완료' },
          { date: '2025-12-01', amount: meta.price, description: `${meta.label} 요금제 (월간)`, status: '결제완료' },
        ]
      : [],
  }
}

export async function changePlan(plan: PlanType): Promise<void> {
  _agentProfile = {
    ..._agentProfile,
    subscription_plan: plan,
    subscription_started_at: new Date().toISOString(),
  }
}

// ──────────────────────────────────────────
// Security Settings
// ──────────────────────────────────────────

export type LoginRecord = {
  date: string
  ip: string
  device: string
  location: string
}

export type ActiveSession = {
  id: string
  device: string
  ip: string
  last_active: string
  is_current: boolean
}

export type SecuritySettings = {
  two_factor_enabled: boolean
  login_records: LoginRecord[]
  active_sessions: ActiveSession[]
}

export async function fetchSecuritySettings(): Promise<SecuritySettings> {
  return {
    two_factor_enabled: false,
    login_records: [
      { date: '2026-02-18T09:15:00Z', ip: '123.45.67.89', device: 'Chrome / Windows', location: '서울' },
      { date: '2026-02-17T14:30:00Z', ip: '123.45.67.89', device: 'Chrome / Windows', location: '서울' },
      { date: '2026-02-16T10:00:00Z', ip: '111.222.33.44', device: 'Safari / iPhone', location: '서울' },
      { date: '2026-02-15T08:45:00Z', ip: '123.45.67.89', device: 'Chrome / Windows', location: '서울' },
    ],
    active_sessions: [
      { id: 'sess-1', device: 'Chrome / Windows', ip: '123.45.67.89', last_active: '2026-02-18T09:15:00Z', is_current: true },
      { id: 'sess-2', device: 'Safari / iPhone', ip: '111.222.33.44', last_active: '2026-02-16T10:00:00Z', is_current: false },
    ],
  }
}

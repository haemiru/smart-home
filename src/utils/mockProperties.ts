import type { Property, PropertyCategory } from '@/types/database'
import type { PropertyFilters, SortOption } from '@/api/properties'

// ============================================
// Mock 카테고리 (12개)
// ============================================
const AGENT_ID = '00000000-0000-0000-0000-000000000001'

const mockCategories: PropertyCategory[] = [
  { id: 'cat-apt', agent_id: null, name: '아파트', icon: '🏢', color: '#3B82F6', sort_order: 1, is_system: true, is_active: true, required_fields: null },
  { id: 'cat-officetel', agent_id: null, name: '오피스텔', icon: '🏬', color: '#8B5CF6', sort_order: 2, is_system: true, is_active: true, required_fields: null },
  { id: 'cat-presale', agent_id: null, name: '분양권', icon: '📋', color: '#EC4899', sort_order: 3, is_system: true, is_active: true, required_fields: null },
  { id: 'cat-villa', agent_id: null, name: '빌라', icon: '🏘️', color: '#10B981', sort_order: 4, is_system: true, is_active: true, required_fields: null },
  { id: 'cat-house', agent_id: null, name: '주택', icon: '🏡', color: '#F59E0B', sort_order: 5, is_system: true, is_active: true, required_fields: null },
  { id: 'cat-oneroom', agent_id: null, name: '원룸', icon: '🚪', color: '#6366F1', sort_order: 6, is_system: true, is_active: true, required_fields: null },
  { id: 'cat-store', agent_id: null, name: '상가', icon: '🏪', color: '#EF4444', sort_order: 7, is_system: true, is_active: true, required_fields: null },
  { id: 'cat-office', agent_id: null, name: '사무실', icon: '🏢', color: '#0EA5E9', sort_order: 8, is_system: true, is_active: true, required_fields: null },
  { id: 'cat-land', agent_id: null, name: '토지', icon: '🌿', color: '#22C55E', sort_order: 9, is_system: true, is_active: true, required_fields: null },
  { id: 'cat-factory', agent_id: null, name: '공장/창고', icon: '🏭', color: '#78716C', sort_order: 10, is_system: true, is_active: true, required_fields: null },
  { id: 'cat-redevelop', agent_id: null, name: '재개발', icon: '🏗️', color: '#F97316', sort_order: 11, is_system: true, is_active: true, required_fields: null },
  { id: 'cat-pension', agent_id: null, name: '숙박/펜션', icon: '🏕️', color: '#14B8A6', sort_order: 12, is_system: true, is_active: true, required_fields: null },
]

// ============================================
// Helper
// ============================================
function photo(seed: string): string {
  return `https://picsum.photos/seed/${seed}/400/300`
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

// ============================================
// Mock 매물 (36개, 카테고리당 3개)
// ============================================
const mockProperties: Property[] = [
  // ── 아파트 (3) ──
  {
    id: 'prop-apt-01', agent_id: AGENT_ID, category_id: 'cat-apt',
    title: '래미안 퍼스티지 84㎡', transaction_type: 'sale',
    address: '서울 서초구 반포동 18-1', address_detail: '102동 1503호', dong: '102동', ho: '1503호',
    latitude: 37.5085, longitude: 127.0135,
    sale_price: 280000, deposit: null, monthly_rent: null, maintenance_fee: 35,
    supply_area_m2: 112, exclusive_area_m2: 84, rooms: 3, bathrooms: 2,
    total_floors: 35, floor: 15, direction: '남향',
    move_in_date: '2026-05-01', parking_per_unit: 1.5,
    has_elevator: true, pets_allowed: true,
    options: ['시스템에어컨', '빌트인냉장고', '식기세척기'],
    description: '한강뷰 로열층, 리모델링 완료',
    status: 'active', is_urgent: true, is_co_brokerage: false, co_brokerage_fee_ratio: null,
    internal_memo: null, view_count: 342, inquiry_count: 28, favorite_count: 56,
    built_year: 2009, tags: ['한강뷰', '로열층', '리모델링'],
    photos: [photo('apt-raemian-1'), photo('apt-raemian-2'), photo('apt-raemian-3')],
    created_at: daysAgo(3), updated_at: daysAgo(1),
  },
  {
    id: 'prop-apt-02', agent_id: AGENT_ID, category_id: 'cat-apt',
    title: '반포자이 59㎡', transaction_type: 'jeonse',
    address: '서울 서초구 반포동 20-8', address_detail: '105동 702호', dong: '105동', ho: '702호',
    latitude: 37.5078, longitude: 127.0180,
    sale_price: null, deposit: 120000, monthly_rent: null, maintenance_fee: 25,
    supply_area_m2: 79, exclusive_area_m2: 59, rooms: 2, bathrooms: 1,
    total_floors: 28, floor: 7, direction: '남동향',
    move_in_date: '2026-04-15', parking_per_unit: 1.2,
    has_elevator: true, pets_allowed: false,
    options: ['에어컨', '세탁기'],
    description: '깨끗한 전세, 반포역 도보 5분',
    status: 'active', is_urgent: false, is_co_brokerage: false, co_brokerage_fee_ratio: null,
    internal_memo: null, view_count: 187, inquiry_count: 15, favorite_count: 33,
    built_year: 2012, tags: ['역세권', '학군우수'],
    photos: [photo('apt-banpo-1'), photo('apt-banpo-2')],
    created_at: daysAgo(7), updated_at: daysAgo(5),
  },
  {
    id: 'prop-apt-03', agent_id: AGENT_ID, category_id: 'cat-apt',
    title: '잠실 리센츠 112㎡', transaction_type: 'monthly',
    address: '서울 송파구 잠실동 40-1', address_detail: '208동 2105호', dong: '208동', ho: '2105호',
    latitude: 37.5125, longitude: 127.0890,
    sale_price: null, deposit: 50000, monthly_rent: 200, maintenance_fee: 40,
    supply_area_m2: 145, exclusive_area_m2: 112, rooms: 4, bathrooms: 2,
    total_floors: 33, floor: 21, direction: '남향',
    move_in_date: '2026-03-20', parking_per_unit: 1.8,
    has_elevator: true, pets_allowed: true,
    options: ['시스템에어컨', '빌트인가전', '안마의자'],
    description: '잠실역 초역세권, 넓은 4룸',
    status: 'active', is_urgent: false, is_co_brokerage: false, co_brokerage_fee_ratio: null,
    internal_memo: null, view_count: 256, inquiry_count: 22, favorite_count: 44,
    built_year: 2008, tags: ['초역세권', '넓은평수', '주차편리'],
    photos: [photo('apt-lcentz-1'), photo('apt-lcentz-2'), photo('apt-lcentz-3')],
    created_at: daysAgo(2), updated_at: daysAgo(1),
  },

  // ── 오피스텔 (3) ──
  {
    id: 'prop-oft-01', agent_id: AGENT_ID, category_id: 'cat-officetel',
    title: '강남역 오피스텔 33㎡', transaction_type: 'monthly',
    address: '서울 강남구 역삼동 823-5', address_detail: '1204호', dong: null, ho: '1204호',
    latitude: 37.4979, longitude: 127.0276,
    sale_price: null, deposit: 3000, monthly_rent: 120, maintenance_fee: 12,
    supply_area_m2: 43, exclusive_area_m2: 33, rooms: 1, bathrooms: 1,
    total_floors: 20, floor: 12, direction: '남향',
    move_in_date: '즉시입주', parking_per_unit: 0.5,
    has_elevator: true, pets_allowed: false,
    options: ['에어컨', '냉장고', '세탁기', '전자레인지'],
    description: '강남역 3번출구 도보 2분, 풀옵션',
    status: 'active', is_urgent: true, is_co_brokerage: false, co_brokerage_fee_ratio: null,
    internal_memo: null, view_count: 412, inquiry_count: 35, favorite_count: 67,
    built_year: 2020, tags: ['역세권', '풀옵션', '즉시입주'],
    photos: [photo('oft-gangnam-1'), photo('oft-gangnam-2')],
    created_at: daysAgo(1), updated_at: daysAgo(0),
  },
  {
    id: 'prop-oft-02', agent_id: AGENT_ID, category_id: 'cat-officetel',
    title: '여의도 IFC 오피스텔 49㎡', transaction_type: 'sale',
    address: '서울 영등포구 여의도동 15-3', address_detail: '807호', dong: null, ho: '807호',
    latitude: 37.5256, longitude: 126.9246,
    sale_price: 55000, deposit: null, monthly_rent: null, maintenance_fee: 18,
    supply_area_m2: 63, exclusive_area_m2: 49, rooms: 1, bathrooms: 1,
    total_floors: 25, floor: 8, direction: '동향',
    move_in_date: '2026-06-01', parking_per_unit: 0.8,
    has_elevator: true, pets_allowed: false,
    options: ['에어컨', '냉장고', '세탁기'],
    description: '여의도 중심 업무지구, 투자용 추천',
    status: 'active', is_urgent: false, is_co_brokerage: false, co_brokerage_fee_ratio: null,
    internal_memo: null, view_count: 198, inquiry_count: 12, favorite_count: 29,
    built_year: 2018, tags: ['투자용', '업무지구'],
    photos: [photo('oft-yeouido-1'), photo('oft-yeouido-2')],
    created_at: daysAgo(10), updated_at: daysAgo(8),
  },
  {
    id: 'prop-oft-03', agent_id: AGENT_ID, category_id: 'cat-officetel',
    title: '성수동 신축 오피스텔 26㎡', transaction_type: 'monthly',
    address: '서울 성동구 성수동2가 289-10', address_detail: '501호', dong: null, ho: '501호',
    latitude: 37.5445, longitude: 127.0560,
    sale_price: null, deposit: 2000, monthly_rent: 95, maintenance_fee: 10,
    supply_area_m2: 33, exclusive_area_m2: 26, rooms: 1, bathrooms: 1,
    total_floors: 15, floor: 5, direction: '남서향',
    move_in_date: '즉시입주', parking_per_unit: 0.3,
    has_elevator: true, pets_allowed: true,
    options: ['에어컨', '냉장고', '세탁기', '인덕션'],
    description: '성수 핫플레이스, 2호선 역세권',
    status: 'active', is_urgent: false, is_co_brokerage: false, co_brokerage_fee_ratio: null,
    internal_memo: null, view_count: 305, inquiry_count: 25, favorite_count: 48,
    built_year: 2024, tags: ['신축', '반려동물', '역세권'],
    photos: [photo('oft-seongsu-1'), photo('oft-seongsu-2')],
    created_at: daysAgo(5), updated_at: daysAgo(3),
  },

  // ── 분양권 (3) ──
  {
    id: 'prop-pre-01', agent_id: AGENT_ID, category_id: 'cat-presale',
    title: '래미안 원펜타스 59㎡ 분양권', transaction_type: 'sale',
    address: '서울 서초구 반포동 1-1', address_detail: null, dong: null, ho: null,
    latitude: 37.5050, longitude: 127.0100,
    sale_price: 230000, deposit: null, monthly_rent: null, maintenance_fee: null,
    supply_area_m2: 79, exclusive_area_m2: 59, rooms: 2, bathrooms: 1,
    total_floors: 35, floor: null, direction: null,
    move_in_date: '2028-06-예정', parking_per_unit: 1.3,
    has_elevator: true, pets_allowed: false,
    options: null,
    description: '반포 대장주 분양권, 프리미엄 3억',
    status: 'active', is_urgent: false, is_co_brokerage: false, co_brokerage_fee_ratio: null,
    internal_memo: null, view_count: 567, inquiry_count: 45, favorite_count: 89,
    built_year: null, tags: ['분양권', '프리미엄', '반포'],
    photos: [photo('pre-raemian-1'), photo('pre-raemian-2')],
    created_at: daysAgo(4), updated_at: daysAgo(2),
  },
  {
    id: 'prop-pre-02', agent_id: AGENT_ID, category_id: 'cat-presale',
    title: '디에이치 아너힐즈 84㎡ 분양권', transaction_type: 'sale',
    address: '서울 강남구 개포동 12-1', address_detail: null, dong: null, ho: null,
    latitude: 37.4825, longitude: 127.0560,
    sale_price: 320000, deposit: null, monthly_rent: null, maintenance_fee: null,
    supply_area_m2: 112, exclusive_area_m2: 84, rooms: 3, bathrooms: 2,
    total_floors: 40, floor: null, direction: null,
    move_in_date: '2028-12-예정', parking_per_unit: 1.5,
    has_elevator: true, pets_allowed: false,
    options: null,
    description: '개포 재건축, 강남 학군 최고 입지',
    status: 'active', is_urgent: false, is_co_brokerage: false, co_brokerage_fee_ratio: null,
    internal_memo: null, view_count: 423, inquiry_count: 38, favorite_count: 72,
    built_year: null, tags: ['분양권', '강남학군', '재건축'],
    photos: [photo('pre-dh-1'), photo('pre-dh-2')],
    created_at: daysAgo(6), updated_at: daysAgo(4),
  },
  {
    id: 'prop-pre-03', agent_id: AGENT_ID, category_id: 'cat-presale',
    title: '과천 위버필드 74㎡ 분양권', transaction_type: 'sale',
    address: '경기 과천시 별양동 5-3', address_detail: null, dong: null, ho: null,
    latitude: 37.4290, longitude: 126.9870,
    sale_price: 130000, deposit: null, monthly_rent: null, maintenance_fee: null,
    supply_area_m2: 99, exclusive_area_m2: 74, rooms: 3, bathrooms: 2,
    total_floors: 30, floor: null, direction: null,
    move_in_date: '2027-09-예정', parking_per_unit: 1.4,
    has_elevator: true, pets_allowed: false,
    options: null,
    description: '과천 신도시, 4호선 역세권 분양권',
    status: 'active', is_urgent: true, is_co_brokerage: false, co_brokerage_fee_ratio: null,
    internal_memo: null, view_count: 312, inquiry_count: 27, favorite_count: 55,
    built_year: null, tags: ['분양권', '신도시', '역세권'],
    photos: [photo('pre-gwacheon-1'), photo('pre-gwacheon-2')],
    created_at: daysAgo(2), updated_at: daysAgo(1),
  },

  // ── 빌라 (3) ──
  {
    id: 'prop-villa-01', agent_id: AGENT_ID, category_id: 'cat-villa',
    title: '마포 신축빌라 66㎡', transaction_type: 'sale',
    address: '서울 마포구 합정동 381-15', address_detail: '3층', dong: null, ho: null,
    latitude: 37.5496, longitude: 126.9138,
    sale_price: 52000, deposit: null, monthly_rent: null, maintenance_fee: 8,
    supply_area_m2: 82, exclusive_area_m2: 66, rooms: 3, bathrooms: 1,
    total_floors: 4, floor: 3, direction: '남향',
    move_in_date: '즉시입주', parking_per_unit: 0.5,
    has_elevator: false, pets_allowed: true,
    options: ['에어컨', '세탁기', '냉장고'],
    description: '합정역 도보 7분, 올수리 신축급',
    status: 'active', is_urgent: false, is_co_brokerage: false, co_brokerage_fee_ratio: null,
    internal_memo: null, view_count: 145, inquiry_count: 11, favorite_count: 22,
    built_year: 2023, tags: ['신축', '올수리', '역세권'],
    photos: [photo('villa-mapo-1'), photo('villa-mapo-2')],
    created_at: daysAgo(8), updated_at: daysAgo(6),
  },
  {
    id: 'prop-villa-02', agent_id: AGENT_ID, category_id: 'cat-villa',
    title: '노원 빌라 53㎡', transaction_type: 'jeonse',
    address: '서울 노원구 상계동 713-2', address_detail: '2층', dong: null, ho: null,
    latitude: 37.6549, longitude: 127.0674,
    sale_price: null, deposit: 22000, monthly_rent: null, maintenance_fee: 5,
    supply_area_m2: 66, exclusive_area_m2: 53, rooms: 2, bathrooms: 1,
    total_floors: 4, floor: 2, direction: '동향',
    move_in_date: '2026-04-01', parking_per_unit: 0.3,
    has_elevator: false, pets_allowed: false,
    options: ['에어컨'],
    description: '깨끗한 전세, 노원역 도보 10분',
    status: 'active', is_urgent: false, is_co_brokerage: false, co_brokerage_fee_ratio: null,
    internal_memo: null, view_count: 89, inquiry_count: 7, favorite_count: 14,
    built_year: 2015, tags: ['전세', '깨끗'],
    photos: [photo('villa-nowon-1'), photo('villa-nowon-2')],
    created_at: daysAgo(12), updated_at: daysAgo(10),
  },
  {
    id: 'prop-villa-03', agent_id: AGENT_ID, category_id: 'cat-villa',
    title: '관악 테라스빌라 79㎡', transaction_type: 'sale',
    address: '서울 관악구 신림동 1432-8', address_detail: '4층(탑)', dong: null, ho: null,
    latitude: 37.4670, longitude: 126.9290,
    sale_price: 45000, deposit: null, monthly_rent: null, maintenance_fee: 7,
    supply_area_m2: 99, exclusive_area_m2: 79, rooms: 3, bathrooms: 2,
    total_floors: 4, floor: 4, direction: '남향',
    move_in_date: '즉시입주', parking_per_unit: 0.5,
    has_elevator: false, pets_allowed: true,
    options: ['에어컨', '냉장고', '세탁기', '테라스'],
    description: '탑층 테라스 빌라, 서울대입구역 인근',
    status: 'active', is_urgent: true, is_co_brokerage: false, co_brokerage_fee_ratio: null,
    internal_memo: null, view_count: 178, inquiry_count: 14, favorite_count: 31,
    built_year: 2021, tags: ['테라스', '탑층', '급매'],
    photos: [photo('villa-gwanak-1'), photo('villa-gwanak-2')],
    created_at: daysAgo(1), updated_at: daysAgo(0),
  },

  // ── 주택 (3) ──
  {
    id: 'prop-house-01', agent_id: AGENT_ID, category_id: 'cat-house',
    title: '북촌 한옥 132㎡', transaction_type: 'sale',
    address: '서울 종로구 가회동 11-103', address_detail: null, dong: null, ho: null,
    latitude: 37.5830, longitude: 126.9850,
    sale_price: 180000, deposit: null, monthly_rent: null, maintenance_fee: null,
    supply_area_m2: 165, exclusive_area_m2: 132, rooms: 4, bathrooms: 2,
    total_floors: 1, floor: 1, direction: '남향',
    move_in_date: '협의가능', parking_per_unit: 0,
    has_elevator: false, pets_allowed: false,
    options: null,
    description: '전통 한옥, 문화재 근처 고즈넉한 주택',
    status: 'active', is_urgent: false, is_co_brokerage: false, co_brokerage_fee_ratio: null,
    internal_memo: null, view_count: 523, inquiry_count: 18, favorite_count: 95,
    built_year: 1965, tags: ['한옥', '북촌', '문화재'],
    photos: [photo('house-bukchon-1'), photo('house-bukchon-2'), photo('house-bukchon-3')],
    created_at: daysAgo(15), updated_at: daysAgo(10),
  },
  {
    id: 'prop-house-02', agent_id: AGENT_ID, category_id: 'cat-house',
    title: '용인 타운하우스 198㎡', transaction_type: 'sale',
    address: '경기 용인시 수지구 풍덕천동 88-5', address_detail: null, dong: null, ho: null,
    latitude: 37.3220, longitude: 127.0980,
    sale_price: 95000, deposit: null, monthly_rent: null, maintenance_fee: 15,
    supply_area_m2: 245, exclusive_area_m2: 198, rooms: 5, bathrooms: 3,
    total_floors: 3, floor: null, direction: '남향',
    move_in_date: '2026-04-01', parking_per_unit: 2.0,
    has_elevator: false, pets_allowed: true,
    options: ['시스템에어컨', '빌트인가전', '정원'],
    description: '수지 프리미엄 타운하우스, 전원생활',
    status: 'active', is_urgent: false, is_co_brokerage: false, co_brokerage_fee_ratio: null,
    internal_memo: null, view_count: 234, inquiry_count: 16, favorite_count: 42,
    built_year: 2019, tags: ['타운하우스', '정원', '주차편리'],
    photos: [photo('house-yongin-1'), photo('house-yongin-2')],
    created_at: daysAgo(9), updated_at: daysAgo(7),
  },
  {
    id: 'prop-house-03', agent_id: AGENT_ID, category_id: 'cat-house',
    title: '평창동 단독주택 264㎡', transaction_type: 'sale',
    address: '서울 종로구 평창동 456-12', address_detail: null, dong: null, ho: null,
    latitude: 37.6120, longitude: 126.9750,
    sale_price: 350000, deposit: null, monthly_rent: null, maintenance_fee: null,
    supply_area_m2: 330, exclusive_area_m2: 264, rooms: 6, bathrooms: 4,
    total_floors: 2, floor: null, direction: '남향',
    move_in_date: '협의가능', parking_per_unit: 3.0,
    has_elevator: false, pets_allowed: true,
    options: ['정원', '수영장', '사우나'],
    description: '북한산 조망, 프라이빗 단독주택',
    status: 'active', is_urgent: false, is_co_brokerage: false, co_brokerage_fee_ratio: null,
    internal_memo: null, view_count: 678, inquiry_count: 8, favorite_count: 120,
    built_year: 2005, tags: ['단독주택', '북한산뷰', '프라이빗'],
    photos: [photo('house-pyeongchang-1'), photo('house-pyeongchang-2'), photo('house-pyeongchang-3')],
    created_at: daysAgo(20), updated_at: daysAgo(15),
  },

  // ── 원룸 (3) ──
  {
    id: 'prop-one-01', agent_id: AGENT_ID, category_id: 'cat-oneroom',
    title: '신촌 원룸 23㎡', transaction_type: 'monthly',
    address: '서울 서대문구 신촌동 134-8', address_detail: '301호', dong: null, ho: '301호',
    latitude: 37.5590, longitude: 126.9390,
    sale_price: null, deposit: 1000, monthly_rent: 55, maintenance_fee: 5,
    supply_area_m2: 28, exclusive_area_m2: 23, rooms: 1, bathrooms: 1,
    total_floors: 5, floor: 3, direction: '남향',
    move_in_date: '즉시입주', parking_per_unit: 0,
    has_elevator: false, pets_allowed: false,
    options: ['에어컨', '냉장고', '세탁기', '인덕션'],
    description: '신촌역 도보 3분, 대학가 풀옵션 원룸',
    status: 'active', is_urgent: false, is_co_brokerage: false, co_brokerage_fee_ratio: null,
    internal_memo: null, view_count: 289, inquiry_count: 32, favorite_count: 51,
    built_year: 2019, tags: ['풀옵션', '역세권', '대학가'],
    photos: [photo('one-sinchon-1'), photo('one-sinchon-2')],
    created_at: daysAgo(3), updated_at: daysAgo(1),
  },
  {
    id: 'prop-one-02', agent_id: AGENT_ID, category_id: 'cat-oneroom',
    title: '건대입구 원룸 19㎡', transaction_type: 'monthly',
    address: '서울 광진구 화양동 9-12', address_detail: '402호', dong: null, ho: '402호',
    latitude: 37.5410, longitude: 127.0690,
    sale_price: null, deposit: 500, monthly_rent: 50, maintenance_fee: 5,
    supply_area_m2: 23, exclusive_area_m2: 19, rooms: 1, bathrooms: 1,
    total_floors: 6, floor: 4, direction: '서향',
    move_in_date: '즉시입주', parking_per_unit: 0,
    has_elevator: true, pets_allowed: false,
    options: ['에어컨', '냉장고', '전자레인지'],
    description: '건대입구역 도보 5분, 깔끔 원룸',
    status: 'active', is_urgent: true, is_co_brokerage: false, co_brokerage_fee_ratio: null,
    internal_memo: null, view_count: 198, inquiry_count: 22, favorite_count: 38,
    built_year: 2020, tags: ['역세권', '깔끔', '즉시입주'],
    photos: [photo('one-konkuk-1'), photo('one-konkuk-2')],
    created_at: daysAgo(1), updated_at: daysAgo(0),
  },
  {
    id: 'prop-one-03', agent_id: AGENT_ID, category_id: 'cat-oneroom',
    title: '홍대 원룸 16㎡', transaction_type: 'monthly',
    address: '서울 마포구 서교동 395-7', address_detail: '503호', dong: null, ho: '503호',
    latitude: 37.5563, longitude: 126.9240,
    sale_price: null, deposit: 500, monthly_rent: 45, maintenance_fee: 4,
    supply_area_m2: 20, exclusive_area_m2: 16, rooms: 1, bathrooms: 1,
    total_floors: 5, floor: 5, direction: '동향',
    move_in_date: '2026-03-15', parking_per_unit: 0,
    has_elevator: false, pets_allowed: false,
    options: ['에어컨', '냉장고'],
    description: '홍대입구역 3분, 소형 원룸',
    status: 'active', is_urgent: false, is_co_brokerage: false, co_brokerage_fee_ratio: null,
    internal_memo: null, view_count: 156, inquiry_count: 18, favorite_count: 27,
    built_year: 2017, tags: ['역세권', '소형'],
    photos: [photo('one-hongdae-1'), photo('one-hongdae-2')],
    created_at: daysAgo(6), updated_at: daysAgo(4),
  },

  // ── 상가 (3) ──
  {
    id: 'prop-store-01', agent_id: AGENT_ID, category_id: 'cat-store',
    title: '강남 1층 코너 상가 99㎡', transaction_type: 'sale',
    address: '서울 강남구 논현동 123-4', address_detail: '1층 101호', dong: null, ho: '101호',
    latitude: 37.5110, longitude: 127.0230,
    sale_price: 180000, deposit: null, monthly_rent: null, maintenance_fee: 30,
    supply_area_m2: 132, exclusive_area_m2: 99, rooms: null, bathrooms: 1,
    total_floors: 8, floor: 1, direction: null,
    move_in_date: '협의가능', parking_per_unit: null,
    has_elevator: true, pets_allowed: false,
    options: null,
    description: '강남대로변 1층 코너, 유동인구 최다',
    status: 'active', is_urgent: false, is_co_brokerage: false, co_brokerage_fee_ratio: null,
    internal_memo: null, view_count: 345, inquiry_count: 25, favorite_count: 58,
    built_year: 2010, tags: ['1층', '코너', '대로변'],
    photos: [photo('store-gangnam-1'), photo('store-gangnam-2')],
    created_at: daysAgo(11), updated_at: daysAgo(8),
  },
  {
    id: 'prop-store-02', agent_id: AGENT_ID, category_id: 'cat-store',
    title: '홍대 상가 46㎡', transaction_type: 'monthly',
    address: '서울 마포구 서교동 358-12', address_detail: '1층', dong: null, ho: null,
    latitude: 37.5560, longitude: 126.9260,
    sale_price: null, deposit: 10000, monthly_rent: 350, maintenance_fee: 15,
    supply_area_m2: 59, exclusive_area_m2: 46, rooms: null, bathrooms: 1,
    total_floors: 5, floor: 1, direction: null,
    move_in_date: '즉시입주', parking_per_unit: null,
    has_elevator: false, pets_allowed: false,
    options: null,
    description: '홍대 메인거리, 카페/음식점 적합',
    status: 'active', is_urgent: true, is_co_brokerage: false, co_brokerage_fee_ratio: null,
    internal_memo: null, view_count: 267, inquiry_count: 20, favorite_count: 42,
    built_year: 2015, tags: ['1층', '메인거리', '즉시입주'],
    photos: [photo('store-hongdae-1'), photo('store-hongdae-2')],
    created_at: daysAgo(2), updated_at: daysAgo(1),
  },
  {
    id: 'prop-store-03', agent_id: AGENT_ID, category_id: 'cat-store',
    title: '잠실 롯데월드몰 인근 상가 66㎡', transaction_type: 'monthly',
    address: '서울 송파구 신천동 29-1', address_detail: '2층', dong: null, ho: null,
    latitude: 37.5136, longitude: 127.1020,
    sale_price: null, deposit: 15000, monthly_rent: 400, maintenance_fee: 20,
    supply_area_m2: 82, exclusive_area_m2: 66, rooms: null, bathrooms: 1,
    total_floors: 6, floor: 2, direction: null,
    move_in_date: '2026-04-01', parking_per_unit: null,
    has_elevator: true, pets_allowed: false,
    options: null,
    description: '잠실 핵심상권, 유동인구 풍부',
    status: 'active', is_urgent: false, is_co_brokerage: false, co_brokerage_fee_ratio: null,
    internal_memo: null, view_count: 189, inquiry_count: 14, favorite_count: 33,
    built_year: 2018, tags: ['핵심상권', '유동인구'],
    photos: [photo('store-jamsil-1'), photo('store-jamsil-2')],
    created_at: daysAgo(7), updated_at: daysAgo(5),
  },

  // ── 사무실 (3) ──
  {
    id: 'prop-office-01', agent_id: AGENT_ID, category_id: 'cat-office',
    title: '여의도 프라임 오피스 165㎡', transaction_type: 'monthly',
    address: '서울 영등포구 여의도동 23-1', address_detail: '15층', dong: null, ho: null,
    latitude: 37.5260, longitude: 126.9250,
    sale_price: null, deposit: 30000, monthly_rent: 800, maintenance_fee: 45,
    supply_area_m2: 198, exclusive_area_m2: 165, rooms: null, bathrooms: 2,
    total_floors: 30, floor: 15, direction: '남향',
    move_in_date: '즉시입주', parking_per_unit: null,
    has_elevator: true, pets_allowed: false,
    options: null,
    description: '여의도 금융중심지, A급 오피스',
    status: 'active', is_urgent: false, is_co_brokerage: false, co_brokerage_fee_ratio: null,
    internal_memo: null, view_count: 178, inquiry_count: 10, favorite_count: 25,
    built_year: 2015, tags: ['A급오피스', '금융중심', '여의도'],
    photos: [photo('office-yeouido-1'), photo('office-yeouido-2')],
    created_at: daysAgo(14), updated_at: daysAgo(10),
  },
  {
    id: 'prop-office-02', agent_id: AGENT_ID, category_id: 'cat-office',
    title: '강남 소형 사무실 33㎡', transaction_type: 'monthly',
    address: '서울 강남구 역삼동 678-15', address_detail: '5층 502호', dong: null, ho: '502호',
    latitude: 37.5000, longitude: 127.0380,
    sale_price: null, deposit: 5000, monthly_rent: 150, maintenance_fee: 10,
    supply_area_m2: 43, exclusive_area_m2: 33, rooms: null, bathrooms: 1,
    total_floors: 10, floor: 5, direction: '동향',
    move_in_date: '즉시입주', parking_per_unit: null,
    has_elevator: true, pets_allowed: false,
    options: null,
    description: '강남역 인근, 스타트업 맞춤형 소형 사무실',
    status: 'active', is_urgent: false, is_co_brokerage: false, co_brokerage_fee_ratio: null,
    internal_memo: null, view_count: 234, inquiry_count: 18, favorite_count: 37,
    built_year: 2018, tags: ['소형', '스타트업', '강남역'],
    photos: [photo('office-gangnam-1'), photo('office-gangnam-2')],
    created_at: daysAgo(5), updated_at: daysAgo(3),
  },
  {
    id: 'prop-office-03', agent_id: AGENT_ID, category_id: 'cat-office',
    title: '판교 테크원 사무실 231㎡', transaction_type: 'sale',
    address: '경기 성남시 분당구 삼평동 670', address_detail: '12층', dong: null, ho: null,
    latitude: 37.4020, longitude: 127.1090,
    sale_price: 120000, deposit: null, monthly_rent: null, maintenance_fee: 55,
    supply_area_m2: 280, exclusive_area_m2: 231, rooms: null, bathrooms: 2,
    total_floors: 20, floor: 12, direction: '남향',
    move_in_date: '협의가능', parking_per_unit: null,
    has_elevator: true, pets_allowed: false,
    options: null,
    description: '판교 IT밸리 중심, 대형 사무실',
    status: 'active', is_urgent: false, is_co_brokerage: false, co_brokerage_fee_ratio: null,
    internal_memo: null, view_count: 156, inquiry_count: 8, favorite_count: 19,
    built_year: 2020, tags: ['판교', 'IT밸리', '대형'],
    photos: [photo('office-pangyo-1'), photo('office-pangyo-2')],
    created_at: daysAgo(18), updated_at: daysAgo(14),
  },

  // ── 토지 (3) ──
  {
    id: 'prop-land-01', agent_id: AGENT_ID, category_id: 'cat-land',
    title: '양평 전원주택 부지 661㎡', transaction_type: 'sale',
    address: '경기 양평군 서종면 문호리 산 35-1', address_detail: null, dong: null, ho: null,
    latitude: 37.5500, longitude: 127.3100,
    sale_price: 35000, deposit: null, monthly_rent: null, maintenance_fee: null,
    supply_area_m2: 661, exclusive_area_m2: 661, rooms: null, bathrooms: null,
    total_floors: null, floor: null, direction: '남향',
    move_in_date: null, parking_per_unit: null,
    has_elevator: false, pets_allowed: false,
    options: null,
    description: '남한강 조망, 전원주택 부지 최적',
    status: 'active', is_urgent: false, is_co_brokerage: false, co_brokerage_fee_ratio: null,
    internal_memo: null, view_count: 234, inquiry_count: 12, favorite_count: 45,
    built_year: null, tags: ['전원주택부지', '남한강', '조망'],
    photos: [photo('land-yangpyeong-1'), photo('land-yangpyeong-2')],
    created_at: daysAgo(20), updated_at: daysAgo(15),
  },
  {
    id: 'prop-land-02', agent_id: AGENT_ID, category_id: 'cat-land',
    title: '파주 상업용지 992㎡', transaction_type: 'sale',
    address: '경기 파주시 운정신도시 교하동 288', address_detail: null, dong: null, ho: null,
    latitude: 37.7150, longitude: 126.7550,
    sale_price: 85000, deposit: null, monthly_rent: null, maintenance_fee: null,
    supply_area_m2: 992, exclusive_area_m2: 992, rooms: null, bathrooms: null,
    total_floors: null, floor: null, direction: null,
    move_in_date: null, parking_per_unit: null,
    has_elevator: false, pets_allowed: false,
    options: null,
    description: '운정신도시 상업지역, 대로변 코너',
    status: 'active', is_urgent: true, is_co_brokerage: false, co_brokerage_fee_ratio: null,
    internal_memo: null, view_count: 156, inquiry_count: 9, favorite_count: 28,
    built_year: null, tags: ['상업용지', '신도시', '대로변'],
    photos: [photo('land-paju-1'), photo('land-paju-2')],
    created_at: daysAgo(3), updated_at: daysAgo(1),
  },
  {
    id: 'prop-land-03', agent_id: AGENT_ID, category_id: 'cat-land',
    title: '제주 농지 1,322㎡', transaction_type: 'sale',
    address: '제주 서귀포시 남원읍 하례리 2345', address_detail: null, dong: null, ho: null,
    latitude: 33.2840, longitude: 126.6170,
    sale_price: 28000, deposit: null, monthly_rent: null, maintenance_fee: null,
    supply_area_m2: 1322, exclusive_area_m2: 1322, rooms: null, bathrooms: null,
    total_floors: null, floor: null, direction: null,
    move_in_date: null, parking_per_unit: null,
    has_elevator: false, pets_allowed: false,
    options: null,
    description: '제주 감귤밭, 농업용 또는 전원생활',
    status: 'active', is_urgent: false, is_co_brokerage: false, co_brokerage_fee_ratio: null,
    internal_memo: null, view_count: 312, inquiry_count: 15, favorite_count: 67,
    built_year: null, tags: ['제주', '농지', '전원생활'],
    photos: [photo('land-jeju-1'), photo('land-jeju-2')],
    created_at: daysAgo(25), updated_at: daysAgo(20),
  },

  // ── 공장/창고 (3) ──
  {
    id: 'prop-factory-01', agent_id: AGENT_ID, category_id: 'cat-factory',
    title: '화성 물류창고 990㎡', transaction_type: 'sale',
    address: '경기 화성시 향남읍 발안리 567-8', address_detail: null, dong: null, ho: null,
    latitude: 37.1280, longitude: 126.9120,
    sale_price: 65000, deposit: null, monthly_rent: null, maintenance_fee: null,
    supply_area_m2: 1320, exclusive_area_m2: 990, rooms: null, bathrooms: 2,
    total_floors: 2, floor: null, direction: null,
    move_in_date: '협의가능', parking_per_unit: null,
    has_elevator: false, pets_allowed: false,
    options: null,
    description: '서해안고속도로 IC 인근, 대형 물류창고',
    status: 'active', is_urgent: false, is_co_brokerage: false, co_brokerage_fee_ratio: null,
    internal_memo: null, view_count: 89, inquiry_count: 5, favorite_count: 12,
    built_year: 2016, tags: ['물류창고', '고속도로인접', '대형'],
    photos: [photo('factory-hwaseong-1'), photo('factory-hwaseong-2')],
    created_at: daysAgo(30), updated_at: daysAgo(25),
  },
  {
    id: 'prop-factory-02', agent_id: AGENT_ID, category_id: 'cat-factory',
    title: '인천 제조공장 1,650㎡', transaction_type: 'monthly',
    address: '인천 남동구 논현동 남동공단 645-12', address_detail: null, dong: null, ho: null,
    latitude: 37.3930, longitude: 126.7310,
    sale_price: null, deposit: 30000, monthly_rent: 1200, maintenance_fee: null,
    supply_area_m2: 2000, exclusive_area_m2: 1650, rooms: null, bathrooms: 3,
    total_floors: 3, floor: null, direction: null,
    move_in_date: '2026-05-01', parking_per_unit: null,
    has_elevator: true, pets_allowed: false,
    options: null,
    description: '남동공단 내, 제조업 적합',
    status: 'active', is_urgent: false, is_co_brokerage: false, co_brokerage_fee_ratio: null,
    internal_memo: null, view_count: 67, inquiry_count: 4, favorite_count: 8,
    built_year: 2008, tags: ['남동공단', '제조업', '화물차진입'],
    photos: [photo('factory-incheon-1'), photo('factory-incheon-2')],
    created_at: daysAgo(22), updated_at: daysAgo(18),
  },
  {
    id: 'prop-factory-03', agent_id: AGENT_ID, category_id: 'cat-factory',
    title: '이천 냉동창고 825㎡', transaction_type: 'sale',
    address: '경기 이천시 부발읍 무촌리 234-1', address_detail: null, dong: null, ho: null,
    latitude: 37.2710, longitude: 127.4200,
    sale_price: 42000, deposit: null, monthly_rent: null, maintenance_fee: null,
    supply_area_m2: 1100, exclusive_area_m2: 825, rooms: null, bathrooms: 1,
    total_floors: 1, floor: null, direction: null,
    move_in_date: '협의가능', parking_per_unit: null,
    has_elevator: false, pets_allowed: false,
    options: null,
    description: '냉동·냉장 설비 완비, 식품물류 최적',
    status: 'active', is_urgent: true, is_co_brokerage: false, co_brokerage_fee_ratio: null,
    internal_memo: null, view_count: 45, inquiry_count: 3, favorite_count: 6,
    built_year: 2012, tags: ['냉동창고', '식품물류', '급매'],
    photos: [photo('factory-icheon-1'), photo('factory-icheon-2')],
    created_at: daysAgo(5), updated_at: daysAgo(2),
  },

  // ── 재개발 (3) ──
  {
    id: 'prop-redev-01', agent_id: AGENT_ID, category_id: 'cat-redevelop',
    title: '한남3구역 재개발 빌라 지분', transaction_type: 'sale',
    address: '서울 용산구 한남동 657-3', address_detail: null, dong: null, ho: null,
    latitude: 37.5340, longitude: 127.0010,
    sale_price: 150000, deposit: null, monthly_rent: null, maintenance_fee: null,
    supply_area_m2: 46, exclusive_area_m2: 33, rooms: 2, bathrooms: 1,
    total_floors: 4, floor: 2, direction: null,
    move_in_date: null, parking_per_unit: null,
    has_elevator: false, pets_allowed: false,
    options: null,
    description: '한남3구역 관리처분 인가 완료, 입주권',
    status: 'active', is_urgent: false, is_co_brokerage: false, co_brokerage_fee_ratio: null,
    internal_memo: null, view_count: 789, inquiry_count: 55, favorite_count: 134,
    built_year: 1982, tags: ['한남3구역', '재개발', '입주권'],
    photos: [photo('redev-hannam-1'), photo('redev-hannam-2')],
    created_at: daysAgo(8), updated_at: daysAgo(5),
  },
  {
    id: 'prop-redev-02', agent_id: AGENT_ID, category_id: 'cat-redevelop',
    title: '흑석뉴타운 다세대 지분', transaction_type: 'sale',
    address: '서울 동작구 흑석동 321-8', address_detail: null, dong: null, ho: null,
    latitude: 37.5080, longitude: 126.9630,
    sale_price: 85000, deposit: null, monthly_rent: null, maintenance_fee: null,
    supply_area_m2: 39, exclusive_area_m2: 26, rooms: 1, bathrooms: 1,
    total_floors: 4, floor: 3, direction: null,
    move_in_date: null, parking_per_unit: null,
    has_elevator: false, pets_allowed: false,
    options: null,
    description: '흑석뉴타운 사업시행 인가, 조합원 지분',
    status: 'active', is_urgent: true, is_co_brokerage: false, co_brokerage_fee_ratio: null,
    internal_memo: null, view_count: 456, inquiry_count: 35, favorite_count: 78,
    built_year: 1985, tags: ['흑석뉴타운', '재개발', '조합원'],
    photos: [photo('redev-heukseok-1'), photo('redev-heukseok-2')],
    created_at: daysAgo(4), updated_at: daysAgo(2),
  },
  {
    id: 'prop-redev-03', agent_id: AGENT_ID, category_id: 'cat-redevelop',
    title: '영등포 재개발 상가 지분', transaction_type: 'sale',
    address: '서울 영등포구 영등포동 123-45', address_detail: null, dong: null, ho: null,
    latitude: 37.5158, longitude: 126.9074,
    sale_price: 62000, deposit: null, monthly_rent: null, maintenance_fee: null,
    supply_area_m2: 33, exclusive_area_m2: 23, rooms: null, bathrooms: null,
    total_floors: 3, floor: 1, direction: null,
    move_in_date: null, parking_per_unit: null,
    has_elevator: false, pets_allowed: false,
    options: null,
    description: '영등포 역세권 재개발, 상가 지분 매매',
    status: 'active', is_urgent: false, is_co_brokerage: false, co_brokerage_fee_ratio: null,
    internal_memo: null, view_count: 267, inquiry_count: 18, favorite_count: 45,
    built_year: 1978, tags: ['영등포', '역세권', '재개발'],
    photos: [photo('redev-ydp-1'), photo('redev-ydp-2')],
    created_at: daysAgo(12), updated_at: daysAgo(9),
  },

  // ── 숙박/펜션 (3) ──
  {
    id: 'prop-pension-01', agent_id: AGENT_ID, category_id: 'cat-pension',
    title: '가평 풀빌라 펜션', transaction_type: 'sale',
    address: '경기 가평군 청평면 호명리 234-5', address_detail: null, dong: null, ho: null,
    latitude: 37.7340, longitude: 127.4560,
    sale_price: 85000, deposit: null, monthly_rent: null, maintenance_fee: null,
    supply_area_m2: 496, exclusive_area_m2: 330, rooms: 8, bathrooms: 8,
    total_floors: 2, floor: null, direction: null,
    move_in_date: '협의가능', parking_per_unit: null,
    has_elevator: false, pets_allowed: true,
    options: ['수영장', 'BBQ', '노래방', '족구장'],
    description: '호명호수 인근, 객실 8개 풀빌라 펜션',
    status: 'active', is_urgent: false, is_co_brokerage: false, co_brokerage_fee_ratio: null,
    internal_memo: null, view_count: 345, inquiry_count: 22, favorite_count: 56,
    built_year: 2018, tags: ['풀빌라', '호수인근', '수영장'],
    photos: [photo('pension-gapyeong-1'), photo('pension-gapyeong-2'), photo('pension-gapyeong-3')],
    created_at: daysAgo(16), updated_at: daysAgo(12),
  },
  {
    id: 'prop-pension-02', agent_id: AGENT_ID, category_id: 'cat-pension',
    title: '강릉 해변 게스트하우스', transaction_type: 'sale',
    address: '강원 강릉시 주문진읍 향호리 567-2', address_detail: null, dong: null, ho: null,
    latitude: 37.8930, longitude: 128.8270,
    sale_price: 65000, deposit: null, monthly_rent: null, maintenance_fee: null,
    supply_area_m2: 330, exclusive_area_m2: 231, rooms: 6, bathrooms: 6,
    total_floors: 3, floor: null, direction: '동향',
    move_in_date: '협의가능', parking_per_unit: null,
    has_elevator: false, pets_allowed: false,
    options: ['해변뷰', '루프탑', 'BBQ'],
    description: '주문진해변 도보 1분, 오션뷰 게스트하우스',
    status: 'active', is_urgent: true, is_co_brokerage: false, co_brokerage_fee_ratio: null,
    internal_memo: null, view_count: 478, inquiry_count: 30, favorite_count: 89,
    built_year: 2020, tags: ['해변', '오션뷰', '게스트하우스'],
    photos: [photo('pension-gangneung-1'), photo('pension-gangneung-2'), photo('pension-gangneung-3')],
    created_at: daysAgo(3), updated_at: daysAgo(1),
  },
  {
    id: 'prop-pension-03', agent_id: AGENT_ID, category_id: 'cat-pension',
    title: '양양 서핑타운 숙박시설', transaction_type: 'sale',
    address: '강원 양양군 현남면 인구리 123-4', address_detail: null, dong: null, ho: null,
    latitude: 37.9870, longitude: 128.7520,
    sale_price: 120000, deposit: null, monthly_rent: null, maintenance_fee: null,
    supply_area_m2: 660, exclusive_area_m2: 462, rooms: 12, bathrooms: 12,
    total_floors: 3, floor: null, direction: null,
    move_in_date: '협의가능', parking_per_unit: null,
    has_elevator: true, pets_allowed: true,
    options: ['서핑샵', '카페', '루프탑바', '주차장'],
    description: '양양 서핑성지, 복합 숙박시설',
    status: 'active', is_urgent: false, is_co_brokerage: false, co_brokerage_fee_ratio: null,
    internal_memo: null, view_count: 567, inquiry_count: 35, favorite_count: 112,
    built_year: 2022, tags: ['서핑', '복합시설', '양양'],
    photos: [photo('pension-yangyang-1'), photo('pension-yangyang-2'), photo('pension-yangyang-3')],
    created_at: daysAgo(10), updated_at: daysAgo(7),
  },
]

// ============================================
// 카테고리별 허용 거래유형
// ============================================
type TxType = 'sale' | 'jeonse' | 'monthly'

function getAllowedTx(catId: string | null): TxType[] {
  switch (catId) {
    case 'cat-land': case 'cat-presale': case 'cat-redevelop': case 'cat-pension':
      return ['sale']
    case 'cat-store': case 'cat-office': case 'cat-factory':
      return ['sale', 'monthly']
    case 'cat-oneroom':
      return ['monthly', 'jeonse', 'monthly']
    default:
      return ['sale', 'jeonse', 'monthly']
  }
}

// ============================================
// 변형 생성: 기본 3개 → 30개/카테고리
// ============================================
const EXTRA_ADDRS = [
  '서울 강남구 역삼동', '서울 서초구 서초동', '서울 송파구 문정동', '서울 마포구 서교동',
  '서울 성동구 왕십리', '서울 용산구 한남동', '서울 강동구 암사동', '서울 영등포구 당산동',
  '서울 종로구 삼청동', '서울 동작구 사당동', '서울 노원구 공릉동', '서울 관악구 봉천동',
  '경기 성남시 분당구', '경기 용인시 수지구', '경기 고양시 일산서구', '경기 화성시 동탄',
  '경기 하남시 미사동', '경기 광명시 철산동', '경기 수원시 영통구', '경기 파주시 운정',
  // 지역별 인기매물 지도 카드 대응
  '서울 강남구 세곡동', '경기 광주시 오포읍', '충북 청주시 흥덕구 오송읍', '충북 청주시 흥덕구 봉명동',
]

const EXTRA_TAGS: string[][] = [
  ['역세권', '깔끔'], ['신축', '풀옵션'], ['남향', '조용한'], ['주차편리', '관리우수'],
  ['리모델링', '넓은평수'], ['초역세권', '즉시입주'], ['학군우수', '공원인접'], ['탑층', '조망좋은'],
  ['급매', '실입주'], ['투자용', '수익형'],
]

// 카테고리별 제목 변형 (지역명 없이 일반적인 매물 설명)
const VARIANT_TITLES: Record<string, string[]> = {
  'cat-apt': ['신축 아파트', '역세권 아파트', '브랜드 아파트', '리모델링 아파트', '대단지 아파트', '공원인접 아파트', '학군우수 아파트', '로얄층 아파트', '즉시입주 아파트'],
  'cat-officetel': ['역세권 오피스텔', '신축 오피스텔', '풀옵션 오피스텔', '수익형 오피스텔', '복층 오피스텔', '브랜드 오피스텔', '초역세권 오피스텔', '프리미엄 오피스텔', '소형 오피스텔'],
  'cat-presale': ['신규 분양권', '브랜드 분양권', '대단지 분양권', '역세권 분양권', '프리미엄 분양권', '공원인접 분양권', '학군우수 분양권', '리버뷰 분양권', '로얄층 분양권'],
  'cat-villa': ['신축 빌라', '테라스 빌라', '리모델링 빌라', '풀옵션 빌라', '역세권 빌라', '투룸 빌라', '대형 빌라', '복층 빌라', '즉시입주 빌라'],
  'cat-house': ['단독주택', '타운하우스', '전원주택', '한옥', '테라스하우스', '리모델링 주택', '신축 주택', '정원 주택', '프리미엄 주택'],
  'cat-oneroom': ['원룸', '풀옵션 원룸', '신축 원룸', '깔끔한 원룸', '역세권 원룸', '채광좋은 원룸', '복층 원룸', '옥탑 원룸', '리모델링 원룸'],
  'cat-store': ['1층 상가', '코너 상가', '역세권 상가', '신축 상가', '수익형 상가', '대로변 상가', '먹자골목 상가', '오피스상가', '복합상가'],
  'cat-office': ['사무실', '소형 사무실', '프라임 오피스', '공유오피스', '역세권 사무실', '신축 사무실', '코너 오피스', '전층 사무실', '소호 오피스'],
  'cat-land': ['주거용지', '상업용지', '전원주택 부지', '농지', '임야', '개발예정지', '투자용 토지', '나대지', '도로인접 토지'],
  'cat-factory': ['물류창고', '제조공장', '냉동창고', '소형 창고', '물류센터', '공장', '자동화 공장', '식품 공장', '중대형 창고'],
  'cat-redevelop': ['재개발 빌라 지분', '재건축 아파트 지분', '뉴타운 다세대 지분', '재개발 상가 지분', '정비구역 지분', '재건축 지분', '도시정비 지분', '재개발 단독 지분', '재건축 나대지'],
  'cat-pension': ['풀빌라 펜션', '해변 게스트하우스', '숙박시설', '리조트', '글램핑장', '독채 펜션', '캠핑장', '산장', '온천 숙소'],
}

/** 주소에서 동/읍/면 이름을 추출 (예: "서울 강남구 세곡동 107-1" → "세곡동") */
function extractDong(addr: string): string {
  const parts = addr.split(' ')
  const dong = parts.find(p => /[동읍면리]$/.test(p))
  return dong || parts[2] || ''
}

function expandProperties(bases: Property[]): Property[] {
  const all: Property[] = []

  for (const base of bases) {
    all.push(base)

    const txTypes = getAllowedTx(base.category_id)
    const baseSale = base.sale_price ?? base.deposit ?? 50000

    for (let v = 1; v <= 9; v++) {
      const tx = txTypes[v % txTypes.length]
      const factor = 0.75 + v * 0.055
      const areaMod = 0.85 + v * 0.033
      const ea = Math.round((base.exclusive_area_m2 ?? 50) * areaMod)

      let sp: number | null = null
      let dp: number | null = null
      let mr: number | null = null
      if (tx === 'sale') {
        sp = Math.round(baseSale * factor)
      } else if (tx === 'jeonse') {
        dp = Math.round(baseSale * 0.55 * factor)
      } else {
        dp = Math.round(baseSale * 0.07 * factor)
        mr = Math.round(baseSale * 0.003 * factor)
      }

      const newAddr = EXTRA_ADDRS[(v + all.length) % EXTRA_ADDRS.length] + ` ${100 + v * 7}-${v}`
      const dong = extractDong(newAddr)
      const variants = base.category_id ? VARIANT_TITLES[base.category_id] : undefined
      const variantTitle = variants ? variants[(v - 1) % variants.length] : '매물'
      const areaStr = ea >= 100 ? `${ea.toLocaleString()}㎡` : `${ea}㎡`

      all.push({
        ...base,
        id: `${base.id}-${v}`,
        title: `${dong} ${variantTitle} ${areaStr}`,
        transaction_type: tx,
        address: newAddr,
        sale_price: sp,
        deposit: dp,
        monthly_rent: mr,
        exclusive_area_m2: ea,
        supply_area_m2: Math.round(ea * 1.3),
        floor: base.floor ? Math.max(1, base.floor + v - 4) : null,
        is_urgent: v === 3 || v === 7,
        view_count: 40 + v * 50,
        inquiry_count: 2 + v * 5,
        favorite_count: 8 + v * 10,
        tags: EXTRA_TAGS[v % EXTRA_TAGS.length],
        photos: [photo(`${base.id}-${v}-a`), photo(`${base.id}-${v}-b`)],
        created_at: daysAgo(v * 4 + 1),
        updated_at: daysAgo(v),
      })
    }
  }
  return all
}

export const allMockProperties = expandProperties(mockProperties)

// ============================================
// Public API
// ============================================

export function getMockCategories(): PropertyCategory[] {
  return mockCategories
}

export function getMockProperties(
  filters: PropertyFilters = {},
  sort: SortOption = 'newest',
  page = 1,
  pageSize = 12,
): { data: Property[]; total: number } {
  let result = [...allMockProperties]

  // Filter: status (default active)
  const status = filters.status ?? 'active'
  result = result.filter((p) => p.status === status)

  // Filter: categoryId
  if (filters.categoryId) {
    result = result.filter((p) => p.category_id === filters.categoryId)
  }

  // Filter: transactionType
  if (filters.transactionType) {
    result = result.filter((p) => p.transaction_type === filters.transactionType)
  }

  // Filter: search (title or address)
  if (filters.search) {
    const q = filters.search.toLowerCase()
    result = result.filter(
      (p) => p.title.toLowerCase().includes(q) || p.address.toLowerCase().includes(q),
    )
  }

  // Filter: addressSearch
  if (filters.addressSearch) {
    const q = filters.addressSearch.toLowerCase()
    result = result.filter((p) => p.address.toLowerCase().includes(q))
  }

  // Filter: isUrgent
  if (filters.isUrgent) {
    result = result.filter((p) => p.is_urgent)
  }

  // Filter: price range
  if (filters.minPrice != null) {
    result = result.filter((p) => (p.sale_price ?? 0) >= filters.minPrice!)
  }
  if (filters.maxPrice != null) {
    result = result.filter((p) => (p.sale_price ?? 0) <= filters.maxPrice!)
  }

  // Filter: area range
  if (filters.minArea != null) {
    result = result.filter((p) => (p.exclusive_area_m2 ?? 0) >= filters.minArea!)
  }
  if (filters.maxArea != null) {
    result = result.filter((p) => (p.exclusive_area_m2 ?? 0) <= filters.maxArea!)
  }

  // Filter: rooms
  if (filters.rooms != null) {
    result = result.filter((p) => (p.rooms ?? 0) >= filters.rooms!)
  }

  // Filter: tags
  if (filters.tags && filters.tags.length > 0) {
    result = result.filter((p) =>
      filters.tags!.every((tag) => p.tags?.includes(tag)),
    )
  }

  // Sort
  const sortFns: Record<SortOption, (a: Property, b: Property) => number> = {
    newest: (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    price_asc: (a, b) => (a.sale_price ?? 0) - (b.sale_price ?? 0),
    price_desc: (a, b) => (b.sale_price ?? 0) - (a.sale_price ?? 0),
    area_desc: (a, b) => (b.exclusive_area_m2 ?? 0) - (a.exclusive_area_m2 ?? 0),
    popular: (a, b) => b.view_count - a.view_count,
  }
  result.sort(sortFns[sort] ?? sortFns.newest)

  // Paginate
  const total = result.length
  const start = (page - 1) * pageSize
  const data = result.slice(start, start + pageSize)

  return { data, total }
}

export function getMockPropertyById(id: string): Property | null {
  return allMockProperties.find((p) => p.id === id) ?? null
}

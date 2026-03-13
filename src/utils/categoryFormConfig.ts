/**
 * Category-specific form field configuration for property registration.
 * Controls which fields are visible/hidden and adds extra_info fields per category group.
 */

export type CategoryGroup =
  | 'residential'        // 아파트, 오피스텔, 빌라, 주택, 원룸
  | 'presale'            // 분양권
  | 'commercial'         // 상가
  | 'office'             // 사무실
  | 'knowledge_center'   // 지식산업센터
  | 'industrial'         // 공장/창고
  | 'land'               // 토지
  | 'redevelopment'      // 재개발
  | 'pension'            // 숙박/펜션

const GROUP_MAP: Record<string, CategoryGroup> = {
  '아파트': 'residential',
  '오피스텔': 'residential',
  '빌라': 'residential',
  '주택': 'residential',
  '원룸': 'residential',
  '분양권': 'presale',
  '상가': 'commercial',
  '사무실': 'office',
  '지식산업센터': 'knowledge_center',
  '공장/창고': 'industrial',
  '토지': 'land',
  '재개발': 'redevelopment',
  '숙박/펜션': 'pension',
}

export function getCategoryGroup(categoryName: string): CategoryGroup | null {
  return GROUP_MAP[categoryName] ?? null
}

// ─── Field visibility per group ───

type StructureFields = {
  supply_area: boolean
  exclusive_area: boolean
  rooms: boolean
  bathrooms: boolean
  floor: boolean
  total_floors: boolean
  direction: boolean
  built_year: boolean
}

type DetailFields = {
  move_in_date: boolean
  parking: boolean
  elevator: boolean
  pets: boolean
  options: boolean
}

type PriceOverrides = {
  maintenance_fee: boolean
  sale_label?: string      // override for sale price label
}

const defaultStructure: StructureFields = { supply_area: true, exclusive_area: true, rooms: true, bathrooms: true, floor: true, total_floors: true, direction: true, built_year: true }
const defaultDetail: DetailFields = { move_in_date: true, parking: true, elevator: true, pets: true, options: true }

export const STRUCTURE_VISIBILITY: Record<CategoryGroup, StructureFields> = {
  residential:   { ...defaultStructure },
  presale:       { ...defaultStructure, built_year: false },
  commercial:    { supply_area: false, exclusive_area: true, rooms: false, bathrooms: false, floor: true, total_floors: true, direction: false, built_year: true },
  office:            { supply_area: false, exclusive_area: true, rooms: false, bathrooms: false, floor: true, total_floors: true, direction: false, built_year: true },
  knowledge_center:  { supply_area: false, exclusive_area: true, rooms: false, bathrooms: false, floor: true, total_floors: true, direction: false, built_year: true },
  industrial:    { supply_area: false, exclusive_area: false, rooms: false, bathrooms: false, floor: false, total_floors: false, direction: false, built_year: false },
  land:          { supply_area: false, exclusive_area: false, rooms: false, bathrooms: false, floor: false, total_floors: false, direction: false, built_year: false },
  redevelopment: { supply_area: true, exclusive_area: true, rooms: true, bathrooms: true, floor: true, total_floors: true, direction: false, built_year: false },
  pension:       { supply_area: false, exclusive_area: false, rooms: true, bathrooms: true, floor: false, total_floors: false, direction: false, built_year: true },
}

export const DETAIL_VISIBILITY: Record<CategoryGroup, DetailFields> = {
  residential:   { ...defaultDetail },
  presale:       { move_in_date: false, parking: true, elevator: true, pets: false, options: true },
  commercial:    { move_in_date: true, parking: true, elevator: true, pets: false, options: true },
  office:            { move_in_date: true, parking: true, elevator: true, pets: false, options: true },
  knowledge_center:  { move_in_date: true, parking: true, elevator: true, pets: false, options: true },
  industrial:    { move_in_date: true, parking: false, elevator: false, pets: false, options: false },
  land:          { move_in_date: false, parking: false, elevator: false, pets: false, options: false },
  redevelopment: { move_in_date: true, parking: false, elevator: false, pets: false, options: false },
  pension:       { move_in_date: false, parking: true, elevator: false, pets: true, options: true },
}

export const PRICE_OVERRIDES: Record<CategoryGroup, PriceOverrides> = {
  residential:   { maintenance_fee: true },
  presale:       { maintenance_fee: true, sale_label: '분양가 (만원)' },
  commercial:    { maintenance_fee: true },
  office:            { maintenance_fee: true },
  knowledge_center:  { maintenance_fee: true },
  industrial:    { maintenance_fee: true },
  land:          { maintenance_fee: false },
  redevelopment: { maintenance_fee: false },
  pension:       { maintenance_fee: true },
}

// ─── Options (appliances) per group ───

const RESIDENTIAL_OPTIONS = ['에어컨', '냉장고', '세탁기', '가스레인지', '인덕션', '전자레인지', '옷장', '신발장', '침대', '책상', 'TV', '인터넷', 'CCTV', '현관보안', '비디오폰']
const PRESALE_OPTIONS = ['에어컨', '냉장고', '세탁기', '가스레인지', '인덕션', '전자레인지', '옷장', '신발장']
const COMMERCIAL_OPTIONS = ['에어컨', '인터넷', 'CCTV', '현관보안', '비디오폰']
const PENSION_OPTIONS = ['에어컨', '냉장고', 'TV', '인터넷', 'CCTV', '세탁기']

export const OPTIONS_PER_GROUP: Record<CategoryGroup, string[]> = {
  residential:   RESIDENTIAL_OPTIONS,
  presale:       PRESALE_OPTIONS,
  commercial:    COMMERCIAL_OPTIONS,
  office:            COMMERCIAL_OPTIONS,
  knowledge_center:  COMMERCIAL_OPTIONS,
  industrial:    [],
  land:          [],
  redevelopment: [],
  pension:       PENSION_OPTIONS,
}

// ─── Extra info fields per group ───

export type ExtraFieldDef = {
  key: string
  label: string
  type: 'text' | 'number' | 'select' | 'checkbox' | 'area'  // 'area' = number with ㎡/평 toggle
  placeholder?: string
  options?: string[]       // for select type
  step?: string            // for number type
  unit?: string            // suffix label (e.g., 'm', 'kW')
  showPriceHint?: boolean  // show formatPrice hint for price fields (만원)
  tab: 'structure' | 'detail' | 'price'  // which tab to render in
}

export const EXTRA_FIELDS: Record<CategoryGroup, ExtraFieldDef[]> = {
  residential: [
    { key: 'building_structure', label: '건물구조', type: 'select', options: ['철근콘크리트', '철골조', '철골철근콘크리트', '조적조', '목조', '경량철골'], tab: 'structure' },
    { key: 'building_usage', label: '건물용도', type: 'text', placeholder: '예: 단독주택, 다세대주택, 아파트', tab: 'structure' },
    { key: 'land_category', label: '지목', type: 'select', options: ['대', '전', '답', '임야', '잡종지', '기타'], tab: 'structure' },
    { key: 'land_area_m2', label: '토지면적', type: 'area', tab: 'structure' },
    { key: 'heating_type', label: '난방방식', type: 'select', options: ['개별난방', '중앙난방', '지역난방'], tab: 'structure' },
    { key: 'household_count', label: '세대수', type: 'number', placeholder: '예: 500', tab: 'structure' },
  ],
  presale: [
    { key: 'heating_type', label: '난방방식', type: 'select', options: ['개별난방', '중앙난방', '지역난방'], tab: 'structure' },
    { key: 'builder', label: '시공사', type: 'text', placeholder: '예: 삼성물산', tab: 'structure' },
    { key: 'expected_move_in', label: '입주예정일', type: 'text', placeholder: '예: 2027년 6월', tab: 'detail' },
    { key: 'premium', label: '프리미엄 (만원)', type: 'number', placeholder: '예: 5000', showPriceHint: true, tab: 'price' },
  ],
  commercial: [
    { key: 'building_structure', label: '건물구조', type: 'select', options: ['철근콘크리트', '철골조', '철골철근콘크리트', '조적조'], tab: 'structure' },
    { key: 'building_usage', label: '건물용도', type: 'text', placeholder: '예: 근린생활시설, 판매시설', tab: 'structure' },
    { key: 'land_category', label: '지목', type: 'select', options: ['대', '전', '답', '잡종지', '기타'], tab: 'structure' },
    { key: 'land_area_m2', label: '토지면적', type: 'area', tab: 'structure' },
    { key: 'frontage_width', label: '전면폭 (m)', type: 'number', step: '0.1', placeholder: '예: 5.5', tab: 'structure' },
    { key: 'ceiling_height', label: '층고 (m)', type: 'number', step: '0.1', placeholder: '예: 3.0', tab: 'structure' },
    { key: 'key_money', label: '권리금 (만원)', type: 'number', placeholder: '예: 5000', showPriceHint: true, tab: 'price' },
    { key: 'business_restriction', label: '업종제한', type: 'text', placeholder: '예: 음식점 불가, 제한없음', tab: 'detail' },
    { key: 'foot_traffic', label: '유동인구', type: 'select', options: ['매우많음', '많음', '보통', '적음'], tab: 'detail' },
  ],
  office: [
    { key: 'ceiling_height', label: '층고 (m)', type: 'number', step: '0.1', placeholder: '예: 2.7', tab: 'structure' },
    { key: 'building_structure', label: '건물구조', type: 'select', options: ['철근콘크리트', '철골조', '철골철근콘크리트', '조적조'], tab: 'structure' },
  ],
  knowledge_center: [
    { key: 'ceiling_height', label: '층고 (m)', type: 'number', step: '0.1', placeholder: '예: 2.7', tab: 'structure' },
    { key: 'building_structure', label: '건물구조', type: 'select', options: ['철근콘크리트', '철골조', '철골철근콘크리트'], tab: 'structure' },
    { key: 'household_count', label: '총 호실수', type: 'number', placeholder: '예: 200', tab: 'structure' },
    { key: 'business_restriction', label: '입주업종', type: 'text', placeholder: '예: 제조업, IT, 연구개발', tab: 'detail' },
  ],
  industrial: [
    { key: 'land_category', label: '지목', type: 'select', options: ['대', '전', '답', '임야', '잡종지', '기타'], tab: 'structure' },
    { key: 'land_area_m2', label: '대지면적', type: 'area', tab: 'structure' },
    // 건물면적, 층고, 건물구조는 buildings 배열로 관리 (PropertyFormPage에서 별도 UI 렌더링)
    { key: 'zoning', label: '용도지역', type: 'select', options: ['일반공업', '준공업', '전용공업', '계획관리', '자연녹지', '기타'], tab: 'structure' },
    { key: 'road_frontage', label: '접도', type: 'select', options: ['~4m', '4~8m', '8~12m', '12m~', '맹지'], tab: 'structure' },
    { key: 'power_capacity', label: '전력용량', type: 'text', placeholder: '예: 150kW', tab: 'detail' },
    { key: 'truck_25t', label: '25톤 진입 가능', type: 'checkbox', tab: 'detail' },
    { key: 'truck_wingbody', label: '윙바디 진입 가능', type: 'checkbox', tab: 'detail' },
    { key: 'truck_trailer_40ft', label: '40피트 트레일러 진입 가능', type: 'checkbox', tab: 'detail' },
    { key: 'loading_dock', label: 'Dock 시설', type: 'checkbox', tab: 'detail' },
    { key: 'cold_storage', label: '냉동/냉장시설', type: 'checkbox', tab: 'detail' },
  ],
  land: [
    { key: 'land_area_m2', label: '대지면적', type: 'area', tab: 'structure' },
    { key: 'land_category', label: '지목', type: 'select', options: ['대', '전', '답', '임야', '잡종지', '과수원', '목장용지', '기타'], tab: 'structure' },
    { key: 'zoning', label: '용도지역', type: 'select', options: ['제1종일반주거', '제2종일반주거', '제3종일반주거', '준주거', '일반상업', '근린상업', '준공업', '일반공업', '전용공업', '계획관리', '생산관리', '보전관리', '농림', '자연녹지', '보전녹지'], tab: 'structure' },
    { key: 'road_frontage', label: '도로접면', type: 'select', options: ['~4m', '4~8m', '8~12m', '12m~', '맹지'], tab: 'structure' },
    { key: 'bcr_far', label: '건폐율/용적률', type: 'text', placeholder: '예: 60%/200%', tab: 'structure' },
    { key: 'slope_terrain', label: '경사/지형', type: 'select', options: ['평지', '완경사(5%이내)', '경사(5~15%)', '급경사(15%이상)'], tab: 'structure' },
  ],
  redevelopment: [
    { key: 'project_phase', label: '사업단계', type: 'select', options: ['정비구역지정', '조합설립인가', '사업시행인가', '관리처분인가', '이주/철거', '착공', '일반분양', '입주'], tab: 'detail' },
    { key: 'member_price', label: '조합원분양가 (만원)', type: 'number', placeholder: '예: 50000', showPriceHint: true, tab: 'price' },
    { key: 'expected_households', label: '예상세대수', type: 'number', placeholder: '예: 3000', tab: 'structure' },
    { key: 'land_area_m2', label: '대지면적', type: 'area', tab: 'structure' },
    { key: 'zoning', label: '용도지역', type: 'select', options: ['제1종일반주거', '제2종일반주거', '제3종일반주거', '준주거', '일반상업', '근린상업', '기타'], tab: 'structure' },
  ],
  pension: [
    { key: 'land_area_m2', label: '대지면적', type: 'area', tab: 'structure' },
    { key: 'building_area_m2', label: '건물면적', type: 'area', tab: 'structure' },
    { key: 'room_count', label: '객실수', type: 'number', placeholder: '예: 10', tab: 'structure' },
    { key: 'building_structure', label: '건물구조', type: 'select', options: ['철근콘크리트', '경량철골', '목조', '조적조', '한옥'], tab: 'structure' },
    { key: 'monthly_avg_revenue', label: '월평균매출 (만원)', type: 'number', placeholder: '예: 3000', showPriceHint: true, tab: 'detail' },
    { key: 'business_license', label: '인허가', type: 'select', options: ['숙박업', '관광펜션업', '농어촌민박', '기타'], tab: 'detail' },
  ],
}

// ─── Buildings (공장/창고 복수 건물) ───

export const BUILDING_STRUCTURE_OPTIONS = ['철골조', '철근콘크리트', '조적조', '판넬조', '샌드위치패널']
export const BUILDING_USAGE_OPTIONS = ['생산동', '사무동', '창고동', '부속동', '기타']

export type BuildingFormItem = {
  name: string
  building_area_m2: string
  gross_floor_area_m2: string
  ceiling_height: string
  building_structure: string
  floors: string
  built_year: string
  usage: string
}

export const emptyBuilding: BuildingFormItem = {
  name: '',
  building_area_m2: '',
  gross_floor_area_m2: '',
  ceiling_height: '',
  building_structure: '',
  floors: '',
  built_year: '',
  usage: '',
}

// ─── Extra info form state type ───

export type ExtraInfoForm = {
  heating_type: string
  household_count: string
  expected_move_in: string
  builder: string
  premium: string
  business_restriction: string
  key_money: string
  foot_traffic: string
  frontage_width: string
  ceiling_height: string
  building_structure: string
  building_usage: string
  land_area_m2: string
  land_category: string
  zoning: string
  road_frontage: string
  bcr_far: string
  slope_terrain: string
  building_area_m2: string
  power_capacity: string
  truck_25t: boolean
  truck_wingbody: boolean
  truck_trailer_40ft: boolean
  loading_dock: boolean
  cold_storage: boolean
  project_phase: string
  member_price: string
  expected_households: string
  room_count: string
  monthly_avg_revenue: string
  business_license: string
  maintenance_per_pyeong: string
  rent_per_pyeong: string
}

export const emptyExtraInfo: ExtraInfoForm = {
  heating_type: '',
  household_count: '',
  expected_move_in: '',
  builder: '',
  premium: '',
  business_restriction: '',
  key_money: '',
  foot_traffic: '',
  frontage_width: '',
  ceiling_height: '',
  building_structure: '',
  building_usage: '',
  land_area_m2: '',
  land_category: '',
  zoning: '',
  road_frontage: '',
  bcr_far: '',
  slope_terrain: '',
  building_area_m2: '',
  power_capacity: '',
  truck_25t: false,
  truck_wingbody: false,
  truck_trailer_40ft: false,
  loading_dock: false,
  cold_storage: false,
  project_phase: '',
  member_price: '',
  expected_households: '',
  room_count: '',
  monthly_avg_revenue: '',
  business_license: '',
  maintenance_per_pyeong: '',
  rent_per_pyeong: '',
}

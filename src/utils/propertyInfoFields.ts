import type { Property } from '@/types/database'
import { formatDate, formatPrice } from '@/utils/format'
import { formatAreaByUnit } from '@/components/common/AreaUnitToggle'

export type InfoFieldDef = {
  key: string
  label: string
  getValue: (p: Property) => string
}

// ── 공통 필드 ──

const SUPPLY_AREA: InfoFieldDef = {
  key: 'supply_area', label: '공급면적',
  getValue: (p) => formatAreaByUnit(p.supply_area_m2),
}
const EXCLUSIVE_AREA: InfoFieldDef = {
  key: 'exclusive_area', label: '전용면적',
  getValue: (p) => formatAreaByUnit(p.exclusive_area_m2),
}
const ROOMS_BATHS: InfoFieldDef = {
  key: 'rooms_baths', label: '방/욕실',
  getValue: (p) => `${p.rooms ?? '-'}룸 / ${p.bathrooms ?? '-'}욕실`,
}
const FLOOR: InfoFieldDef = {
  key: 'floor', label: '해당층/총층',
  getValue: (p) => `${p.floor ?? '-'}층 / ${p.total_floors ?? '-'}층`,
}
const DIRECTION: InfoFieldDef = {
  key: 'direction', label: '방향',
  getValue: (p) => p.direction || '-',
}
const MOVE_IN: InfoFieldDef = {
  key: 'move_in', label: '입주가능일',
  getValue: (p) => formatDate(p.move_in_date),
}
const PARKING: InfoFieldDef = {
  key: 'parking', label: '주차',
  getValue: (p) => p.parking_per_unit != null ? `${p.parking_per_unit}대/세대` : '-',
}
const ELEVATOR: InfoFieldDef = {
  key: 'elevator', label: '엘리베이터',
  getValue: (p) => p.has_elevator ? '있음' : '없음',
}
const PETS: InfoFieldDef = {
  key: 'pets', label: '반려동물',
  getValue: (p) => p.pets_allowed ? '허용' : '불가',
}
const BUILT_YEAR: InfoFieldDef = {
  key: 'built_year', label: '준공연도',
  getValue: (p) => p.built_year ? `${p.built_year}년` : '-',
}

// ── 확장 필드 ──

const HOUSEHOLD_COUNT: InfoFieldDef = {
  key: 'household_count', label: '세대수',
  getValue: (p) => p.extra_info?.household_count ? `${p.extra_info.household_count}세대` : '-',
}
const HEATING_TYPE: InfoFieldDef = {
  key: 'heating_type', label: '난방방식',
  getValue: (p) => p.extra_info?.heating_type || '-',
}
const EXPECTED_MOVE_IN: InfoFieldDef = {
  key: 'expected_move_in', label: '입주예정일',
  getValue: (p) => p.extra_info?.expected_move_in || '-',
}
const BUILDER: InfoFieldDef = {
  key: 'builder', label: '시공사',
  getValue: (p) => p.extra_info?.builder || '-',
}
const PREMIUM: InfoFieldDef = {
  key: 'premium', label: '프리미엄',
  getValue: (p) => p.extra_info?.premium != null ? formatPrice(p.extra_info.premium) : '-',
}
const BUSINESS_RESTRICTION: InfoFieldDef = {
  key: 'business_restriction', label: '업종제한',
  getValue: (p) => p.extra_info?.business_restriction || '-',
}
const KEY_MONEY: InfoFieldDef = {
  key: 'key_money', label: '권리금',
  getValue: (p) => p.extra_info?.key_money != null ? formatPrice(p.extra_info.key_money) : '-',
}
const FOOT_TRAFFIC: InfoFieldDef = {
  key: 'foot_traffic', label: '유동인구',
  getValue: (p) => p.extra_info?.foot_traffic || '-',
}
const FRONTAGE_WIDTH: InfoFieldDef = {
  key: 'frontage_width', label: '전면폭',
  getValue: (p) => p.extra_info?.frontage_width ? `${p.extra_info.frontage_width}m` : '-',
}
const CEILING_HEIGHT: InfoFieldDef = {
  key: 'ceiling_height', label: '층고',
  getValue: (p) => p.extra_info?.ceiling_height ? `${p.extra_info.ceiling_height}m` : '-',
}
const BUILDING_STRUCTURE: InfoFieldDef = {
  key: 'building_structure', label: '건물구조',
  getValue: (p) => p.extra_info?.building_structure || '-',
}
const LAND_AREA: InfoFieldDef = {
  key: 'land_area', label: '대지면적',
  getValue: (p) => p.extra_info?.land_area_m2 ? formatAreaByUnit(p.extra_info.land_area_m2) : '-',
}
const LAND_CATEGORY: InfoFieldDef = {
  key: 'land_category', label: '지목',
  getValue: (p) => p.extra_info?.land_category || '-',
}
const ZONING: InfoFieldDef = {
  key: 'zoning', label: '용도지역',
  getValue: (p) => p.extra_info?.zoning || '-',
}
const ROAD_FRONTAGE: InfoFieldDef = {
  key: 'road_frontage', label: '도로접면',
  getValue: (p) => p.extra_info?.road_frontage || '-',
}
const BCR_FAR: InfoFieldDef = {
  key: 'bcr_far', label: '건폐율/용적률',
  getValue: (p) => p.extra_info?.bcr_far || '-',
}
const SLOPE_TERRAIN: InfoFieldDef = {
  key: 'slope_terrain', label: '경사/지형',
  getValue: (p) => p.extra_info?.slope_terrain || '-',
}
const BUILDING_AREA: InfoFieldDef = {
  key: 'building_area', label: '건물면적',
  getValue: (p) => p.extra_info?.building_area_m2 ? formatAreaByUnit(p.extra_info.building_area_m2) : '-',
}
const POWER_CAPACITY: InfoFieldDef = {
  key: 'power_capacity', label: '전력용량',
  getValue: (p) => p.extra_info?.power_capacity || '-',
}
const TRUCK_ACCESS: InfoFieldDef = {
  key: 'truck_access', label: '화물차진입',
  getValue: (p) => p.extra_info?.truck_access != null ? (p.extra_info.truck_access ? '가능' : '불가') : '-',
}
const LOADING_DOCK: InfoFieldDef = {
  key: 'loading_dock', label: '하역장',
  getValue: (p) => p.extra_info?.loading_dock != null ? (p.extra_info.loading_dock ? '있음' : '없음') : '-',
}
const COLD_STORAGE: InfoFieldDef = {
  key: 'cold_storage', label: '냉동냉장',
  getValue: (p) => p.extra_info?.cold_storage != null ? (p.extra_info.cold_storage ? '있음' : '없음') : '-',
}
const PROJECT_PHASE: InfoFieldDef = {
  key: 'project_phase', label: '사업단계',
  getValue: (p) => p.extra_info?.project_phase || '-',
}
const MEMBER_PRICE: InfoFieldDef = {
  key: 'member_price', label: '조합원분양가',
  getValue: (p) => p.extra_info?.member_price != null ? formatPrice(p.extra_info.member_price) : '-',
}
const EXPECTED_HOUSEHOLDS: InfoFieldDef = {
  key: 'expected_households', label: '예상세대수',
  getValue: (p) => p.extra_info?.expected_households ? `${p.extra_info.expected_households}세대` : '-',
}
const ROOM_COUNT: InfoFieldDef = {
  key: 'room_count', label: '객실수',
  getValue: (p) => p.extra_info?.room_count ? `${p.extra_info.room_count}실` : '-',
}
const MONTHLY_AVG_REVENUE: InfoFieldDef = {
  key: 'monthly_avg_revenue', label: '월평균매출',
  getValue: (p) => p.extra_info?.monthly_avg_revenue != null ? formatPrice(p.extra_info.monthly_avg_revenue) : '-',
}
const BUSINESS_LICENSE: InfoFieldDef = {
  key: 'business_license', label: '인허가',
  getValue: (p) => p.extra_info?.business_license || '-',
}

// ── 카테고리별 필드 매핑 ──

const RESIDENTIAL_BASE: InfoFieldDef[] = [
  SUPPLY_AREA, EXCLUSIVE_AREA, ROOMS_BATHS, FLOOR, DIRECTION,
  MOVE_IN, PARKING, ELEVATOR, PETS, BUILT_YEAR,
  HOUSEHOLD_COUNT, HEATING_TYPE,
]

const PRESALE_FIELDS: InfoFieldDef[] = [
  SUPPLY_AREA, EXCLUSIVE_AREA, ROOMS_BATHS, FLOOR, DIRECTION,
  MOVE_IN, PARKING, ELEVATOR, BUILT_YEAR,
  EXPECTED_MOVE_IN, BUILDER, PREMIUM,
]

const STORE_FIELDS: InfoFieldDef[] = [
  EXCLUSIVE_AREA, FLOOR, MOVE_IN, PARKING, ELEVATOR, BUILT_YEAR,
  BUSINESS_RESTRICTION, KEY_MONEY, FOOT_TRAFFIC, FRONTAGE_WIDTH,
]

const OFFICE_FIELDS: InfoFieldDef[] = [
  EXCLUSIVE_AREA, FLOOR, MOVE_IN, PARKING, ELEVATOR, BUILT_YEAR,
  CEILING_HEIGHT, BUILDING_STRUCTURE,
]

const LAND_FIELDS: InfoFieldDef[] = [
  LAND_AREA, LAND_CATEGORY, ZONING, ROAD_FRONTAGE, BCR_FAR, SLOPE_TERRAIN,
]

const FACTORY_FIELDS: InfoFieldDef[] = [
  LAND_AREA, BUILDING_AREA, FLOOR, MOVE_IN, PARKING, BUILT_YEAR,
  BUILDING_STRUCTURE, CEILING_HEIGHT, ZONING, ROAD_FRONTAGE, BCR_FAR,
  POWER_CAPACITY, TRUCK_ACCESS, LOADING_DOCK, COLD_STORAGE, LAND_CATEGORY,
]

const REDEVELOP_FIELDS: InfoFieldDef[] = [
  SUPPLY_AREA, EXCLUSIVE_AREA, ROOMS_BATHS, FLOOR, BUILT_YEAR,
  LAND_AREA, LAND_CATEGORY, ZONING, ROAD_FRONTAGE, BCR_FAR,
  PROJECT_PHASE, MEMBER_PRICE, EXPECTED_HOUSEHOLDS,
]

const PENSION_FIELDS: InfoFieldDef[] = [
  LAND_AREA, BUILDING_AREA, ROOMS_BATHS, PARKING, BUILT_YEAR,
  PETS, BUILDING_STRUCTURE,
  ROOM_COUNT, MONTHLY_AVG_REVENUE, BUSINESS_LICENSE,
]

const CATEGORY_FIELDS_MAP: Record<string, InfoFieldDef[]> = {
  '아파트': RESIDENTIAL_BASE,
  '오피스텔': RESIDENTIAL_BASE,
  '빌라': RESIDENTIAL_BASE,
  '주택': RESIDENTIAL_BASE,
  '원룸': RESIDENTIAL_BASE,
  '분양권': PRESALE_FIELDS,
  '상가': STORE_FIELDS,
  '사무실': OFFICE_FIELDS,
  '토지': LAND_FIELDS,
  '공장/창고': FACTORY_FIELDS,
  '재개발': REDEVELOP_FIELDS,
  '숙박/펜션': PENSION_FIELDS,
}

/** 카테고리명으로 표시할 기본 정보 필드 목록을 반환 */
export function getInfoFieldsForCategory(categoryName: string | undefined): InfoFieldDef[] {
  if (!categoryName) return RESIDENTIAL_BASE
  return CATEGORY_FIELDS_MAP[categoryName] ?? RESIDENTIAL_BASE
}

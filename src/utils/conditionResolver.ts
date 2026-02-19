import type { PropertyFilters } from '@/api/properties'
import type { Property } from '@/types/database'

// ──────────────────────────────────────────
// 자동 계산 조건 (기존 DB 컬럼 활용)
// ──────────────────────────────────────────

type AutoResolver = (value: unknown) => {
  filters?: Partial<PropertyFilters>
  clientFilter?: (p: Property) => boolean
}

const autoResolvers: Record<string, AutoResolver> = {
  built_within_years: (v) => ({
    filters: { minBuiltYear: new Date().getFullYear() - (v as number) },
  }),
  pets_allowed: () => ({
    filters: { petsAllowed: true },
  }),
  parking_per_unit: (v) => ({
    filters: { minParkingPerUnit: v as number },
  }),
  direction: (v) => ({
    filters: { direction: v as string },
  }),
  has_elevator: () => ({
    filters: { hasElevator: true },
  }),
  is_urgent: () => ({
    filters: { isUrgent: true },
  }),
  max_maintenance: (v) => ({
    filters: { maxMaintenanceFee: v as number },
  }),
  is_top_floor: () => ({
    clientFilter: (p: Property) =>
      p.floor != null && p.total_floors != null && p.floor === p.total_floors,
  }),
}

// ──────────────────────────────────────────
// 태그 매핑 (DB 컬럼 없음 → label을 태그로)
// ──────────────────────────────────────────

const tagConditionKeys: Record<string, string> = {
  walk_minutes: '역세권',
  school_walk_minutes: '학세권',
  park_walk_minutes: '공세권',
  truck_access: '화물차진입',
  loading_dock: '하역장',
  cold_storage: '냉동냉장',
  ceiling_height_min: '높은층고',
  power_capacity_min: '대용량전력',
  developable: '개발가능',
  road_frontage_min: '도로접면',
  max_slope: '평탄지',
  good_road: '접도양호',
  move_in_immediate: '즉시입주',
}

// ──────────────────────────────────────────
// resolveConditions
// ──────────────────────────────────────────

export type ResolvedConditions = {
  filters: Partial<PropertyFilters>
  tags: string[]
  clientFilters: ((p: Property) => boolean)[]
}

/**
 * 카드의 conditions 객체를 DB 쿼리 필터, 태그, 클라이언트 필터로 분류
 * @param conditions - quick_card.conditions 객체
 * @param cardLabel - 카드 라벨 (커스텀 조건의 태그 이름으로 사용)
 * @param isCustom - 관리자가 추가한 커스텀 조건 여부
 */
export function resolveConditions(
  conditions: Record<string, unknown>,
  cardLabel: string,
  isCustom = false,
): ResolvedConditions {
  const result: ResolvedConditions = { filters: {}, tags: [], clientFilters: [] }

  // 커스텀 조건은 항상 태그 기반
  if (isCustom) {
    result.tags.push(cardLabel)
    return result
  }

  for (const [key, value] of Object.entries(conditions)) {
    // 자동 계산 가능한 조건
    const resolver = autoResolvers[key]
    if (resolver) {
      const resolved = resolver(value)
      if (resolved.filters) Object.assign(result.filters, resolved.filters)
      if (resolved.clientFilter) result.clientFilters.push(resolved.clientFilter)
      continue
    }

    // 태그 기반 조건
    const tagName = tagConditionKeys[key]
    if (tagName) {
      result.tags.push(tagName)
      continue
    }
  }

  return result
}

// ──────────────────────────────────────────
// getTagBasedConditions — 매물 폼 체크박스용
// ──────────────────────────────────────────

export type TagConditionInfo = {
  tag: string
  conditionKey: string
  categories?: string[]
}

const RESIDENTIAL = ['아파트', '오피스텔', '분양권', '빌라', '주택', '원룸']
const COMMERCIAL = ['상가', '사무실']

const tagCategoryMap: Record<string, string[] | undefined> = {
  walk_minutes: undefined, // 모든 카테고리
  school_walk_minutes: RESIDENTIAL,
  park_walk_minutes: undefined,
  truck_access: ['공장/창고'],
  loading_dock: ['공장/창고'],
  cold_storage: ['공장/창고'],
  ceiling_height_min: ['공장/창고'],
  power_capacity_min: ['공장/창고'],
  developable: ['토지'],
  road_frontage_min: ['토지'],
  max_slope: ['토지'],
  good_road: ['공장/창고', '토지'],
  move_in_immediate: [...RESIDENTIAL, ...COMMERCIAL],
}

/**
 * 태그 기반 조건 목록 반환 (매물 등록/수정 폼의 체크박스용)
 */
export function getTagBasedConditions(): TagConditionInfo[] {
  return Object.entries(tagConditionKeys).map(([key, tag]) => ({
    tag,
    conditionKey: key,
    categories: tagCategoryMap[key],
  }))
}

// ============================================
// 필터 옵션
// ============================================
export const dealTypeFilters = [
  { id: 'sale', label: '매매' },
  { id: 'jeonse', label: '전세' },
  { id: 'monthly', label: '월세' },
] as const

export const priceFilters = [
  { id: 'under1', label: '~1억' },
  { id: '1to3', label: '1~3억' },
  { id: '3to5', label: '3~5억' },
  { id: '5to10', label: '5~10억' },
  { id: 'over10', label: '10억~' },
] as const

export const areaFilters = [
  { id: 'under10', label: '~10평' },
  { id: '10to20', label: '10~20평' },
  { id: '20to30', label: '20~30평' },
  { id: '30to40', label: '30~40평' },
  { id: 'over40', label: '40평~' },
] as const

export const roomFilters = [
  { id: '1room', label: '1룸' },
  { id: '2room', label: '2룸' },
  { id: '3room', label: '3룸' },
  { id: '4room', label: '4룸+' },
] as const

export const floorFilters = [
  { id: 'low', label: '저층(1~3)' },
  { id: 'mid', label: '중층(4~10)' },
  { id: 'high', label: '고층(11+)' },
] as const

export type FilterGroup = {
  id: string
  label: string
  options: readonly { id: string; label: string }[]
}

export const filterGroups: FilterGroup[] = [
  { id: 'dealType', label: '거래방식', options: dealTypeFilters },
  { id: 'price', label: '금액별', options: priceFilters },
  { id: 'area', label: '면적별', options: areaFilters },
  { id: 'rooms', label: '방수별', options: roomFilters },
  { id: 'floor', label: '층수별', options: floorFilters },
]

// ============================================
// 빠른 검색 조건
// ============================================
export const quickSearchConditions = [
  { id: 'new', label: '신축', icon: '🏠', description: '준공 2년 이내' },
  { id: 'urgent', label: '급매', icon: '🔥', description: '급하게 매도' },
  { id: 'station', label: '역세권', icon: '🚇', description: '도보 5분 이내' },
  { id: 'large', label: '넓은평수', icon: '📐', description: '40평 이상' },
  { id: 'parking', label: '주차편리', icon: '🅿️', description: '세대당 1대 이상' },
  { id: 'school', label: '학군좋은', icon: '🏫', description: '우수 학군 인근' },
  { id: 'pet', label: '반려동물OK', icon: '🐶', description: '반려동물 허용' },
  { id: 'elevator', label: '엘리베이터', icon: '🛗', description: '엘리베이터 있음' },
  { id: 'renovated', label: '올수리', icon: '🌅', description: '전체 리모델링' },
] as const

// ============================================
// 부동산 핫이슈
// ============================================
export const hotIssues = [
  { id: '1', title: '2026년 부동산 시장 전망: 전문가 분석', date: '2026-02-15', category: '시장동향' },
  { id: '2', title: '서울 재건축 규제 완화 법안 국회 통과', date: '2026-02-14', category: '정책/법률' },
  { id: '3', title: 'GTX-A 개통 효과, 수도권 역세권 시세 분석', date: '2026-02-13', category: '교통/개발' },
  { id: '4', title: '전세사기 예방 체크리스트 10가지', date: '2026-02-12', category: '안전/정보' },
  { id: '5', title: '2026년 공시지가 변동률 발표', date: '2026-02-10', category: '시장동향' },
]

// ============================================
// 분양정보
// ============================================
export const presaleInfos = [
  { id: '1', title: '래미안 원펜타스 (반포)', date: '2026-03-15', status: '청약접수중', area: '서울 서초구' },
  { id: '2', title: '힐스테이트 세운 (종로)', date: '2026-03-20', status: '청약예정', area: '서울 종로구' },
  { id: '3', title: '디에이치 아너힐즈 (개포)', date: '2026-04-01', status: '청약예정', area: '서울 강남구' },
  { id: '4', title: '과천 위버필드 (과천)', date: '2026-03-25', status: '청약접수중', area: '경기 과천시' },
]

// ============================================
// 유관기관 링크
// ============================================
export const relatedOrgLinks = [
  { id: '1', label: '부동산 전자계약 시스템', url: '#' },
  { id: '2', label: '국토교통부 실거래가 공개', url: '#' },
  { id: '3', label: '한국부동산원', url: '#' },
  { id: '4', label: '대법원 등기정보', url: '#' },
  { id: '5', label: '주택도시보증공사(HUG)', url: '#' },
  { id: '6', label: '한국감정원', url: '#' },
]

export const legalInfoLinks = [
  { id: '1', label: '공인중개사법', url: '#' },
  { id: '2', label: '주택임대차보호법', url: '#' },
  { id: '3', label: '부동산 거래신고 등에 관한 법률', url: '#' },
  { id: '4', label: '건축법', url: '#' },
]

// ============================================
// GNB 메뉴
// ============================================
export const gnbMenuItems = [
  { id: 'home', label: '홈', path: '/' },
  { id: 'market-price', label: '시세', path: '/market-price' },
  { id: 'properties', label: '매물', path: '/properties' },
  { id: 'map', label: '지도', path: '/map' },
  { id: 'urgent', label: '급매추천', path: '/urgent' },
  { id: 'presale', label: '분양정보', path: '/presale' },
  { id: 'hot-issues', label: '부동산핫이슈', path: '/hot-issues' },
  { id: 'find-agent', label: '중개사무소찾기', path: '/find-agent' },
] as const


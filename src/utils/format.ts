const PYEONG_RATIO = 3.305785

/** ㎡ → 평 */
export function sqmToPyeong(sqm: number): number {
  return Math.round((sqm / PYEONG_RATIO) * 100) / 100
}

/** 평 → ㎡ */
export function pyeongToSqm(pyeong: number): number {
  return Math.round(pyeong * PYEONG_RATIO * 100) / 100
}

/** 면적 표시: "84.97㎡(25.7평)" */
export function formatArea(sqm: number | null | undefined): string {
  if (sqm == null) return '-'
  return `${sqm}㎡(${sqmToPyeong(sqm)}평)`
}

/**
 * 가격(만원 단위) → "N억 N,NNN만원" 형식
 * 예: 95000 → "9억 5,000만"
 *     350 → "350만"
 *     120000 → "12억"
 */
export function formatPrice(manwon: number | null | undefined): string {
  if (manwon == null || manwon === 0) return '-'
  const eok = Math.floor(manwon / 10000)
  const remainder = manwon % 10000
  if (eok > 0 && remainder > 0) {
    return `${eok}억 ${remainder.toLocaleString()}만`
  }
  if (eok > 0) return `${eok}억`
  return `${manwon.toLocaleString()}만`
}

/** 거래유형별 가격 표시 */
export function formatPropertyPrice(
  txType: string,
  salePrice?: number | null,
  deposit?: number | null,
  monthlyRent?: number | null,
): string {
  switch (txType) {
    case 'sale':
      return formatPrice(salePrice)
    case 'jeonse':
      return formatPrice(deposit)
    case 'monthly':
      if (deposit != null && monthlyRent != null) {
        return `${formatPrice(deposit)} / 월 ${formatPrice(monthlyRent)}`
      }
      return formatPrice(monthlyRent)
    default:
      return '-'
  }
}

/** 숫자 → 천단위 콤마 */
export function formatNumber(num: number | string | null | undefined): string {
  if (num == null || num === '') return ''
  const n = typeof num === 'string' ? parseInt(num.replace(/,/g, ''), 10) : num
  if (isNaN(n)) return ''
  return n.toLocaleString()
}

/** 콤마 문자열 → 숫자 */
export function parseCommaNumber(str: string): number | null {
  const cleaned = str.replace(/,/g, '')
  const num = parseInt(cleaned, 10)
  return isNaN(num) ? null : num
}

/** 거래유형 한글 라벨 */
export const transactionTypeLabel: Record<string, string> = {
  sale: '매매',
  jeonse: '전세',
  monthly: '월세',
}

/** 매물 상태 한글 라벨 */
export const propertyStatusLabel: Record<string, string> = {
  draft: '등록중',
  active: '광고중',
  contracted: '계약진행',
  completed: '거래완료',
  hold: '보류',
}

/** 매물 상태별 배지 색상 */
export const propertyStatusColor: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  active: 'bg-green-100 text-green-700',
  contracted: 'bg-blue-100 text-blue-700',
  completed: 'bg-purple-100 text-purple-700',
  hold: 'bg-yellow-100 text-yellow-700',
}

/** 날짜 포맷: 2026-02-18 → 2026.02.18 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  return dateStr.slice(0, 10).replace(/-/g, '.')
}

/** 날짜/시간 포맷: 2026-02-18T09:30:00Z → 2026.02.18 09:30 */
export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 상대 시간: "방금 전", "5분 전", "3시간 전", "2일 전" */
export function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '방금 전'
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}일 전`
  return formatDate(dateStr)
}

/** 문의 상태 한글 라벨 */
export const inquiryStatusLabel: Record<string, string> = {
  new: '새 문의',
  checked: '확인',
  in_progress: '진행중',
  answered: '답변완료',
  closed: '종결',
}

/** 문의 상태 아이콘 */
export const inquiryStatusIcon: Record<string, string> = {
  new: '\uD83D\uDD34',
  checked: '\uD83D\uDFE0',
  in_progress: '\uD83D\uDFE1',
  answered: '\uD83D\uDFE2',
  closed: '\u26AB',
}

/** 문의 상태 색상 */
export const inquiryStatusColor: Record<string, string> = {
  new: 'bg-red-100 text-red-700',
  checked: 'bg-orange-100 text-orange-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  answered: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
}

/** 문의 유형 한글 라벨 */
export const inquiryTypeLabel: Record<string, string> = {
  property: '매물문의',
  price: '시세문의',
  contract: '계약문의',
  other: '기타',
}

/** 고객 단계 한글 라벨 */
export const customerTypeLabel: Record<string, string> = {
  lead: '리드',
  interest: '관심',
  consulting: '상담',
  contracting: '계약진행',
  completed: '완료',
}

/** 고객 단계 색상 */
export const customerTypeColor: Record<string, string> = {
  lead: 'bg-gray-100 text-gray-600',
  interest: 'bg-blue-100 text-blue-700',
  consulting: 'bg-yellow-100 text-yellow-700',
  contracting: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
}

/** 고객 소스 한글 라벨 */
export const customerSourceLabel: Record<string, string> = {
  inquiry: '문의접수',
  direct: '직접등록',
  referral: '소개',
  website: '웹사이트',
}

/** 활동 유형 한글 라벨 */
export const activityTypeLabel: Record<string, string> = {
  view: '매물 열람',
  favorite: '관심 저장',
  inquiry: '문의',
  appointment: '임장 예약',
  contract_view: '계약서 열람',
}

/** 계약서 상태 한글 라벨 */
export const contractStatusLabel: Record<string, string> = {
  drafting: '작성중',
  pending_sign: '서명대기',
  signed: '서명완료',
  completed: '계약완료',
}

/** 계약서 상태 색상 */
export const contractStatusColor: Record<string, string> = {
  drafting: 'bg-gray-100 text-gray-600',
  pending_sign: 'bg-yellow-100 text-yellow-700',
  signed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
}

/** 계약서 양식 한글 라벨 */
export const contractTemplateLabel: Record<string, string> = {
  apartment_sale: '아파트 매매',
  apartment_lease: '아파트 임대차',
  officetel_sale: '오피스텔 매매',
  officetel_lease: '오피스텔 임대차',
  commercial_sale: '상가 매매',
  commercial_lease: '상가 임대차',
  building_sale: '건물 매매',
  land_sale: '토지 매매',
  factory_sale: '공장/창고 매매',
  factory_lease: '공장/창고 임대차',
  knowledge_center_sale: '지식산업센터 매매',
  knowledge_center_lease: '지식산업센터 임대차',
}

/** 프로세스 단계 한글 라벨 */
export const contractStepLabel: Record<string, string> = {
  contract_signed: '계약 체결',
  down_payment: '계약금 입금',
  mid_payment: '중도금 입금',
  final_payment: '잔금 입금',
  ownership_transfer: '소유권이전등기',
  move_in_report: '전입신고',
  fixed_date: '확정일자',
  moving: '이사',
  maintenance_settle: '관리비 정산',
  completed: '거래 완료',
}

/** D-Day 계산 */
export function formatDDay(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return 'D-Day'
  if (diff > 0) return `D-${diff}`
  return `D+${Math.abs(diff)}`
}

/** 임장 상태 한글 라벨 */
export const inspectionStatusLabel: Record<string, string> = {
  scheduled: '예정',
  in_progress: '진행중',
  completed: '완료',
}

/** 임장 상태 색상 */
export const inspectionStatusColor: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
}

/** 점검 항목 상태 한글 라벨 */
export const checkItemStatusLabel: Record<string, string> = {
  good: '양호',
  normal: '보통',
  bad: '불량',
}

/** 점검 항목 상태 색상 */
export const checkItemStatusColor: Record<string, string> = {
  good: 'bg-green-100 text-green-700',
  normal: 'bg-yellow-100 text-yellow-700',
  bad: 'bg-red-100 text-red-700',
}

/** 임장 종합등급 라벨 */
export const inspectionGradeLabel: Record<string, string> = {
  A: '우수',
  B: '양호',
  C: '보통',
  D: '주의',
  F: '불량',
}

/** 임장 종합등급 색상 */
export const inspectionGradeColor: Record<string, string> = {
  A: 'text-green-600',
  B: 'text-blue-600',
  C: 'text-yellow-600',
  D: 'text-orange-600',
  F: 'text-red-600',
}

/** 임대 물건 상태 라벨 */
export const rentalStatusLabel: Record<string, string> = {
  occupied: '입주중',
  vacant: '공실',
  expiring: '만기임박',
}

/** 임대 물건 상태 색상 */
export const rentalStatusColor: Record<string, string> = {
  occupied: 'bg-green-100 text-green-700',
  vacant: 'bg-gray-100 text-gray-600',
  expiring: 'bg-red-100 text-red-700',
}

/** 수리 요청 상태 라벨 */
export const repairStatusLabel: Record<string, string> = {
  requested: '접수',
  confirmed: '확인',
  in_progress: '진행중',
  completed: '완료',
}

/** 수리 요청 상태 색상 */
export const repairStatusColor: Record<string, string> = {
  requested: 'bg-red-100 text-red-700',
  confirmed: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
}

/** D-Day 색상 */
export function dDayColor(dateStr: string | null | undefined): string {
  if (!dateStr) return 'text-gray-400'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000)
  if (diff < 0) return 'text-red-600 font-bold'
  if (diff === 0) return 'text-red-600 font-bold'
  if (diff <= 3) return 'text-orange-600 font-semibold'
  return 'text-gray-500'
}

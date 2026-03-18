import { supabase } from '@/api/supabase'

export type TradeRecord = {
  dealDate: string
  name: string
  dong: string
  exclusiveArea: number
  floor: number | null
  dealAmount: number
  builtYear: number | null
  dealType: 'trade' | 'rent'
  deposit: number | null
  monthlyRent: number | null
}

type ApiType =
  | 'apt_trade' | 'apt_rent'
  | 'officetel_trade' | 'officetel_rent'
  | 'row_house_trade' | 'row_house_rent'
  | 'house_trade' | 'house_rent'
  | 'land_trade' | 'commercial_trade' | 'factory_trade'

async function callApi(lawdCd: string, dealYmd: string, apiType: ApiType): Promise<TradeRecord[]> {
  const body = { lawdCd, dealYmd, apiType }

  if (import.meta.env.DEV) {
    const res = await fetch('/api/real-trade-price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`)
    return data.items ?? []
  }

  const { data, error } = await supabase.functions.invoke('real-trade-price', { body })
  if (error) throw new Error(error.message)
  if (data?.error) throw new Error(data.error)
  return data?.items ?? []
}

/** 최근 N개월 실거래가 조회 (여러 달 병렬 호출) */
export async function fetchRecentTrades(params: {
  lawdCd: string
  months: number
  apiType: ApiType
}): Promise<TradeRecord[]> {
  const { lawdCd, months, apiType } = params
  const now = new Date()
  const dealYmds: string[] = []

  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    dealYmds.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const results = await Promise.all(
    dealYmds.map((ym) => callApi(lawdCd, ym, apiType).catch(() => [] as TradeRecord[]))
  )

  return results.flat().sort((a, b) => b.dealDate.localeCompare(a.dealDate))
}

/** 매물 카테고리 → API 유형 매핑 */
export function getApiTypes(categoryName: string | undefined, transactionType: string): ApiType[] {
  const isSale = transactionType === 'sale'
  const name = categoryName ?? ''

  switch (name) {
    case '아파트':
      return isSale ? ['apt_trade'] : ['apt_rent']
    case '오피스텔':
      return isSale ? ['officetel_trade'] : ['officetel_rent']
    case '빌라': case '원룸':
      return isSale ? ['row_house_trade'] : ['row_house_rent']
    case '주택':
      return isSale ? ['house_trade'] : ['house_rent']
    case '토지':
      return ['land_trade']
    case '상가': case '사무실': case '지식산업센터':
      return ['commercial_trade']
    case '공장/창고':
      return ['factory_trade']
    default:
      return isSale ? ['apt_trade'] : ['apt_rent']
  }
}

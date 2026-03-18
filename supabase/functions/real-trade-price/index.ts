import { corsHeaders } from '../_shared/cors.ts'

// 국토부 실거래가 API 엔드포인트
const API_ENDPOINTS: Record<string, string> = {
  apt_trade: 'http://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev',
  apt_rent: 'http://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent',
  officetel_trade: 'http://apis.data.go.kr/1613000/RTMSDataSvcOffiTrade/getRTMSDataSvcOffiTrade',
  officetel_rent: 'http://apis.data.go.kr/1613000/RTMSDataSvcOffiRent/getRTMSDataSvcOffiRent',
  row_house_trade: 'http://apis.data.go.kr/1613000/RTMSDataSvcRHTrade/getRTMSDataSvcRHTrade',
  row_house_rent: 'http://apis.data.go.kr/1613000/RTMSDataSvcRHRent/getRTMSDataSvcRHRent',
  house_trade: 'http://apis.data.go.kr/1613000/RTMSDataSvcSHTrade/getRTMSDataSvcSHTrade',
  house_rent: 'http://apis.data.go.kr/1613000/RTMSDataSvcSHRent/getRTMSDataSvcSHRent',
  land_trade: 'http://apis.data.go.kr/1613000/RTMSDataSvcLandTrade/getRTMSDataSvcLandTrade',
  commercial_trade: 'http://apis.data.go.kr/1613000/RTMSDataSvcNrgTrade/getRTMSDataSvcNrgTrade',
}

interface RequestBody {
  lawdCd: string        // 5-digit 시군구코드
  dealYmd: string        // YYYYMM
  apiType: string        // key from API_ENDPOINTS
}

interface TradeRecord {
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

/** Extract text content from an XML tag */
function xmlTag(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`)
  const m = xml.match(re)
  return m ? m[1].trim() : ''
}

/** Parse XML items into TradeRecord array */
function parseItems(xml: string, apiType: string): TradeRecord[] {
  const items: TradeRecord[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match: RegExpExecArray | null

  const isRent = apiType.includes('rent')

  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1]
    const year = xmlTag(item, '년')
    const month = xmlTag(item, '월')
    const day = xmlTag(item, '일')
    const dealDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`

    // Name: different tag names per API
    const name = xmlTag(item, '아파트') || xmlTag(item, '단지') || xmlTag(item, '연립다세대') || xmlTag(item, '건물명') || ''
    const dong = xmlTag(item, '법정동')
    const exclusiveArea = parseFloat(xmlTag(item, '전용면적') || xmlTag(item, '대지면적') || '0')
    const floor = parseInt(xmlTag(item, '층')) || null
    const builtYear = parseInt(xmlTag(item, '건축년도')) || null

    if (isRent) {
      const deposit = parseInt(xmlTag(item, '보증금액')?.replace(/,/g, '')) || 0
      const monthly = parseInt(xmlTag(item, '월세금액')?.replace(/,/g, '')) || 0
      items.push({
        dealDate, name, dong, exclusiveArea, floor, builtYear,
        dealAmount: deposit,
        dealType: 'rent',
        deposit,
        monthlyRent: monthly || null,
      })
    } else {
      const amount = parseInt(xmlTag(item, '거래금액')?.replace(/,/g, '').trim()) || 0
      items.push({
        dealDate, name, dong, exclusiveArea, floor, builtYear,
        dealAmount: amount,
        dealType: 'trade',
        deposit: null,
        monthlyRent: null,
      })
    }
  }

  return items
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('MOLIT_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'MOLIT_API_KEY가 서버에 설정되지 않았습니다.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const { lawdCd, dealYmd, apiType } = (await req.json()) as RequestBody

    if (!lawdCd || !dealYmd || !apiType) {
      return new Response(
        JSON.stringify({ error: 'lawdCd, dealYmd, apiType은 필수 항목입니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const endpoint = API_ENDPOINTS[apiType]
    if (!endpoint) {
      return new Response(
        JSON.stringify({ error: `지원하지 않는 API 유형입니다: ${apiType}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const params = new URLSearchParams({
      serviceKey: apiKey,
      LAWD_CD: lawdCd,
      DEAL_YMD: dealYmd,
      pageNo: '1',
      numOfRows: '100',
    })

    const res = await fetch(`${endpoint}?${params}`)
    const xml = await res.text()

    // Check for API error
    const resultCode = xmlTag(xml, 'resultCode')
    if (resultCode && resultCode !== '00') {
      const resultMsg = xmlTag(xml, 'resultMsg')
      return new Response(
        JSON.stringify({ error: `국토부 API 오류: ${resultMsg} (${resultCode})` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const items = parseItems(xml, apiType)

    return new Response(
      JSON.stringify({ items, totalCount: items.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})

import { corsHeaders } from '../_shared/cors.ts'

// 인메모리 캐시 (Edge Function 인스턴스 수명 동안 유지, 1시간 TTL)
const cache = new Map<string, { data: unknown; cachedAt: number }>()
const CACHE_TTL_MS = 60 * 60 * 1000

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const clientId = Deno.env.get('NAVER_CLIENT_ID')
    const clientSecret = Deno.env.get('NAVER_CLIENT_SECRET')
    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: 'NAVER_CLIENT_ID/SECRET이 설정되지 않았습니다.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const { query = '부동산', display = 5 } = await req.json()

    // 캐시 확인
    const cacheKey = `${query}|${display}`
    const hit = cache.get(cacheKey)
    if (hit && (Date.now() - hit.cachedAt) < CACHE_TTL_MS) {
      return new Response(
        JSON.stringify(hit.data),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}&display=${display}&sort=date`
    const res = await fetch(url, {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
    })

    const data = await res.json()

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: data.errorMessage || `HTTP ${res.status}` }),
        { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // 캐시 저장
    cache.set(cacheKey, { data, cachedAt: Date.now() })

    return new Response(
      JSON.stringify(data),
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

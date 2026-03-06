import { corsHeaders } from '../_shared/cors.ts'

const GEMINI_MODEL = 'gemini-3.1-pro-preview'
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 1500

interface RequestBody {
  prompt: string
  systemPrompt?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY가 서버에 설정되지 않았습니다.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const { prompt, systemPrompt } = (await req.json()) as RequestBody

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'prompt는 필수 항목입니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const body: Record<string, unknown> = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 4096,
      },
    }

    if (systemPrompt) {
      body.systemInstruction = { parts: [{ text: systemPrompt }] }
    }

    let lastError: string | null = null

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => null)
          const msg = errData?.error?.message || `HTTP ${res.status}`
          // Don't retry on 4xx (except 429)
          if (res.status !== 429 && res.status < 500) {
            return new Response(
              JSON.stringify({ error: `Gemini API 오류: ${msg}`, statusCode: res.status }),
              { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
            )
          }
          lastError = `Gemini API 서버 오류: ${msg}`
          if (attempt < MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)))
            continue
          }
        }

        const data = await res.json()

        if (data.error) {
          return new Response(
            JSON.stringify({ error: `Gemini API 오류: ${data.error.message}`, statusCode: data.error.code }),
            { status: data.error.code || 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          )
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (!text) {
          return new Response(
            JSON.stringify({ error: 'Gemini API 응답에 텍스트가 없습니다.' }),
            { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          )
        }

        return new Response(
          JSON.stringify({ text }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err)
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)))
        }
      }
    }

    return new Response(
      JSON.stringify({ error: lastError || 'Gemini API 호출에 실패했습니다.' }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})

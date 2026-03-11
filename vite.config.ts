import { defineConfig, loadEnv, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// Load all env vars (including non-VITE_ ones) for server-side plugins
const env = loadEnv('', process.cwd(), '')

/** Vite dev server plugin: proxies /api/generate-content → Gemini API (key stays server-side) */
function geminiProxy(): PluginOption {
  return {
    name: 'gemini-proxy',
    configureServer(server) {
      server.middlewares.use('/api/generate-content', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' })
          res.end()
          return
        }
        const apiKey = env.GEMINI_API_KEY
        if (!apiKey) { res.writeHead(500); res.end(JSON.stringify({ error: 'GEMINI_API_KEY not set' })); return }

        let rawBody = ''
        for await (const chunk of req) rawBody += chunk
        const { prompt, systemPrompt } = JSON.parse(rawBody)

        const model = 'gemini-3.1-pro-preview'
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
        const body: Record<string, unknown> = {
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, topP: 0.95, topK: 40, maxOutputTokens: 4096 },
        }
        if (systemPrompt) body.systemInstruction = { parts: [{ text: systemPrompt }] }

        try {
          const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
          const data = await resp.json() as Record<string, unknown>
          if (!resp.ok) { res.writeHead(resp.status); res.end(JSON.stringify({ error: (data?.error as Record<string, unknown>)?.message || `HTTP ${resp.status}` })); return }
          const text = ((data.candidates as Array<Record<string, unknown>>)?.[0]?.content as Record<string, unknown>)?.parts as Array<Record<string, unknown>> | undefined
          const resultText = text?.[0]?.text as string | undefined
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ text: resultText || '' }))
        } catch (e) {
          res.writeHead(502)
          res.end(JSON.stringify({ error: e instanceof Error ? e.message : 'proxy error' }))
        }
      })
    },
  }
}

/** Vite dev server plugin: proxies /api/geocode → Kakao Local API */
function kakaoGeoProxy(): PluginOption {
  return {
    name: 'kakao-geo-proxy',
    configureServer(server) {
      server.middlewares.use('/api/geocode', async (req, res) => {
        const restKey = env.KAKAO_REST_KEY
        if (!restKey) { res.writeHead(500); res.end(JSON.stringify({ error: 'KAKAO_REST_KEY not set' })); return }

        const url = new URL(req.url || '/', 'http://localhost')
        const query = url.searchParams.get('query')
        if (!query) { res.writeHead(400); res.end(JSON.stringify({ error: 'query required' })); return }

        try {
          const resp = await fetch(
            `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(query)}`,
            { headers: { Authorization: `KakaoAK ${restKey}` } },
          )
          const data = await resp.json()
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(data))
        } catch (e) {
          res.writeHead(502)
          res.end(JSON.stringify({ error: e instanceof Error ? e.message : 'proxy error' }))
        }
      })

      server.middlewares.use('/api/reverse-geocode', async (req, res) => {
        const restKey = env.KAKAO_REST_KEY
        if (!restKey) { res.writeHead(500); res.end(JSON.stringify({ error: 'KAKAO_REST_KEY not set' })); return }

        const url = new URL(req.url || '/', 'http://localhost')
        const x = url.searchParams.get('x')
        const y = url.searchParams.get('y')
        if (!x || !y) { res.writeHead(400); res.end(JSON.stringify({ error: 'x, y required' })); return }

        try {
          const resp = await fetch(
            `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${x}&y=${y}`,
            { headers: { Authorization: `KakaoAK ${restKey}` } },
          )
          const data = await resp.json()
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(data))
        } catch (e) {
          res.writeHead(502)
          res.end(JSON.stringify({ error: e instanceof Error ? e.message : 'proxy error' }))
        }
      })
    },
  }
}

/** Vite dev server plugin: proxies /api/send-email → Resend API (key stays server-side) */
function resendEmailProxy(): PluginOption {
  return {
    name: 'resend-email-proxy',
    configureServer(server) {
      server.middlewares.use('/api/send-email', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' })
          res.end()
          return
        }
        const apiKey = env.RESEND_API_KEY
        if (!apiKey) { res.writeHead(500); res.end(JSON.stringify({ error: 'RESEND_API_KEY not set' })); return }

        let rawBody = ''
        for await (const chunk of req) rawBody += chunk
        const { to, subject, html, replyTo } = JSON.parse(rawBody)

        const payload: Record<string, unknown> = {
          from: 'onboarding@resend.dev',
          to,
          subject,
          html,
        }
        if (replyTo) payload.reply_to = replyTo

        try {
          const resp = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(payload),
          })
          const data = await resp.json() as Record<string, unknown>
          if (!resp.ok) {
            res.writeHead(resp.status, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: (data?.message as string) || `HTTP ${resp.status}` }))
            return
          }
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(data))
        } catch (e) {
          res.writeHead(502)
          res.end(JSON.stringify({ error: e instanceof Error ? e.message : 'proxy error' }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), geminiProxy(), kakaoGeoProxy(), resendEmailProxy()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    allowedHosts: true,
  },
})

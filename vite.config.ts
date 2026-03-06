import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

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
        const apiKey = process.env.GEMINI_API_KEY
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

export default defineConfig({
  plugins: [react(), tailwindcss(), geminiProxy()],
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

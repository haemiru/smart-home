// Gemini 3 Pro API utility
// Calls the Gemini REST API directly from the frontend
// TODO: Move to Supabase Edge Function for production (to protect API key)

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
const GEMINI_MODEL = 'gemini-3-pro'
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

const MAX_RETRIES = 2
const RETRY_DELAY_MS = 1500

export class GeminiError extends Error {
  statusCode?: number

  constructor(message: string, statusCode?: number) {
    super(message)
    this.name = 'GeminiError'
    this.statusCode = statusCode
  }
}

interface GeminiContent {
  role: string
  parts: { text: string }[]
}

interface GeminiResponse {
  candidates?: {
    content: {
      parts: { text: string }[]
    }
    finishReason: string
  }[]
  error?: {
    message: string
    code: number
  }
}

/**
 * Call Gemini generateContent API
 * @param prompt - User prompt
 * @param systemPrompt - Optional system instruction
 * @returns Generated text
 */
export async function generateContent(
  prompt: string,
  systemPrompt?: string,
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new GeminiError('VITE_GEMINI_API_KEY 환경변수가 설정되지 않았습니다.')
  }

  const contents: GeminiContent[] = [
    { role: 'user', parts: [{ text: prompt }] },
  ]

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: 0.8,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 4096,
    },
  }

  if (systemPrompt) {
    body.systemInstruction = {
      parts: [{ text: systemPrompt }],
    }
  }

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        const msg = errData?.error?.message || `HTTP ${res.status}`
        // Don't retry on 4xx (except 429)
        if (res.status !== 429 && res.status < 500) {
          throw new GeminiError(`Gemini API 오류: ${msg}`, res.status)
        }
        throw new GeminiError(`Gemini API 서버 오류: ${msg}`, res.status)
      }

      const data: GeminiResponse = await res.json()

      if (data.error) {
        throw new GeminiError(`Gemini API 오류: ${data.error.message}`, data.error.code)
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) {
        throw new GeminiError('Gemini API 응답에 텍스트가 없습니다.')
      }

      return text
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      // Don't retry non-retryable errors
      if (err instanceof GeminiError && err.statusCode && err.statusCode < 500 && err.statusCode !== 429) {
        throw err
      }
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)))
      }
    }
  }

  throw lastError || new GeminiError('Gemini API 호출에 실패했습니다.')
}

// ============================================================
// AI Generation Log (Supabase)
// ============================================================

import { supabase } from '@/api/supabase'
import { getAgentProfileId } from '@/api/helpers'
import type { AIGenerationLog, AIGenerationType } from '@/types/database'

export type { AIGenerationType, AIGenerationLog }

export async function saveGenerationLog(data: {
  type: AIGenerationType
  input_data: Record<string, unknown>
  output_text: string
}): Promise<AIGenerationLog> {
  const agentId = await getAgentProfileId()

  const { data: log, error } = await supabase
    .from('ai_generation_logs')
    .insert({
      agent_id: agentId,
      type: data.type,
      input_data: data.input_data,
      output_text: data.output_text,
    })
    .select()
    .single()

  if (error) throw error
  return log
}

export async function fetchGenerationLogs(type?: AIGenerationType): Promise<AIGenerationLog[]> {
  let query = supabase
    .from('ai_generation_logs')
    .select('*')
    .order('created_at', { ascending: false })

  if (type) {
    query = query.eq('type', type)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

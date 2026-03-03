// Gemini API utility — calls Supabase Edge Function (API key stays server-side)

import { supabase } from '@/api/supabase'
import { getAgentProfileId } from '@/api/helpers'
import type { AIGenerationLog, AIGenerationType } from '@/types/database'

export class GeminiError extends Error {
  statusCode?: number

  constructor(message: string, statusCode?: number) {
    super(message)
    this.name = 'GeminiError'
    this.statusCode = statusCode
  }
}

/**
 * Call Gemini API via Supabase Edge Function
 * @param prompt - User prompt
 * @param systemPrompt - Optional system instruction
 * @returns Generated text
 */
export async function generateContent(
  prompt: string,
  systemPrompt?: string,
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('generate-content', {
    body: { prompt, systemPrompt },
  })

  if (error) {
    throw new GeminiError(
      error.message || 'Edge Function 호출에 실패했습니다.',
    )
  }

  if (data?.error) {
    throw new GeminiError(data.error, data.statusCode)
  }

  if (!data?.text) {
    throw new GeminiError('Gemini API 응답에 텍스트가 없습니다.')
  }

  return data.text
}

// ============================================================
// AI Generation Log (Supabase)
// ============================================================

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

// Email sending via Resend API
// DEV: Vite dev server proxy at /api/send-email (API key stays server-side)
// PROD: Supabase Edge Function

import { supabase } from '@/api/supabase'

export class EmailError extends Error {
  statusCode?: number

  constructor(message: string, statusCode?: number) {
    super(message)
    this.name = 'EmailError'
    this.statusCode = statusCode
  }
}

interface SendEmailParams {
  to: string
  subject: string
  html: string
  replyTo?: string
}

interface SendEmailResult {
  success: boolean
  messageId?: string
}

/**
 * Send email via Resend API
 * - Dev: Vite server proxy at /api/send-email (API key stays server-side)
 * - Prod: Supabase Edge Function
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const { to, subject, html, replyTo } = params

  if (!to || !subject || !html) {
    throw new EmailError('to, subject, html은 필수 항목입니다.')
  }

  if (import.meta.env.DEV) {
    // Local dev → Vite server middleware proxy
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html, replyTo }),
    })
    const data = await res.json()
    if (!res.ok || data.error) {
      throw new EmailError(data.error || `HTTP ${res.status}`, res.status)
    }
    return { success: true, messageId: data.id }
  }

  // Production → Supabase Edge Function
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: { to, subject, html, replyTo },
  })

  if (error) {
    throw new EmailError(
      error.message || '이메일 전송에 실패했습니다.',
    )
  }

  if (data?.error) {
    throw new EmailError(data.error, data.statusCode)
  }

  return { success: true, messageId: data?.id }
}

import { supabase, supabaseAuth } from '@/api/supabase'
import { getAgentProfileId } from '@/api/helpers'
import { ensureCustomerFromInquiry } from '@/api/customers'
import type { Inquiry, InquiryReply, InquiryStatus, InquiryType } from '@/types/database'

export interface InquiryFilters {
  status?: InquiryStatus | 'all'
  inquiryType?: InquiryType | 'all'
  unansweredOnly?: boolean
  search?: string
}

export async function fetchInquiries(filters: InquiryFilters = {}): Promise<Inquiry[]> {
  let query = supabase.from('inquiries').select('*')

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters.inquiryType && filters.inquiryType !== 'all') {
    query = query.eq('inquiry_type', filters.inquiryType)
  }
  if (filters.unansweredOnly) {
    query = query.in('status', ['new', 'checked', 'in_progress'])
  }
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,content.ilike.%${filters.search}%,inquiry_number.ilike.%${filters.search}%`)
  }

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function fetchInquiryById(id: string): Promise<Inquiry | null> {
  const { data, error } = await supabase
    .from('inquiries')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function fetchInquiryReplies(inquiryId: string): Promise<InquiryReply[]> {
  const { data, error } = await supabase
    .from('inquiry_replies')
    .select('*')
    .eq('inquiry_id', inquiryId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function createInquiry(data: {
  name: string
  phone: string
  email?: string
  inquiry_type: InquiryType
  property_id?: string
  preferred_visit_date?: string
  content: string
  user_id?: string
  agent_id?: string
}): Promise<Inquiry> {
  // Use explicit agent_id if provided (multi-tenant), otherwise resolve from auth
  let agentId: string
  if (data.agent_id) {
    agentId = data.agent_id
  } else {
    agentId = await getAgentProfileId()
  }

  // Always use supabaseAuth for inquiry creation (handles both logged-in and anon properly)

  // Generate inquiry number via DB sequence, fallback to client-generated
  let inquiryNumber: string
  const { data: rpcResult, error: rpcError } = await supabaseAuth.rpc('generate_inquiry_number')
  if (rpcError || !rpcResult) {
    const now = new Date()
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    const rand = String(Math.floor(Math.random() * 900) + 100)
    inquiryNumber = `INQ-${dateStr}-${rand}`
  } else {
    inquiryNumber = rpcResult
  }

  const insertPayload = {
    inquiry_number: inquiryNumber,
    user_id: data.user_id ?? null,
    name: data.name,
    phone: data.phone,
    email: data.email ?? null,
    inquiry_type: data.inquiry_type,
    property_id: data.property_id ?? null,
    preferred_visit_date: data.preferred_visit_date ?? null,
    content: data.content,
    status: 'new' as const,
    agent_id: agentId,
  }

  const { error } = await supabaseAuth
    .from('inquiries')
    .insert(insertPayload)

  if (error) throw error

  // CRM 자동 등록 (실패해도 문의 생성은 유지)
  try {
    await ensureCustomerFromInquiry({
      name: data.name,
      phone: data.phone,
      email: data.email,
      inquiry_type: data.inquiry_type,
    })
  } catch { /* CRM 등록 실패 무시 — 문의 자체는 정상 저장됨 */ }

  // Return a constructed Inquiry object (SELECT after INSERT blocked by RLS for anon/non-agent users)
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    inquiry_number: inquiryNumber,
    user_id: data.user_id ?? null,
    name: data.name,
    phone: data.phone,
    email: data.email ?? null,
    inquiry_type: data.inquiry_type,
    property_id: data.property_id ?? null,
    preferred_visit_date: data.preferred_visit_date ?? null,
    content: data.content,
    status: 'new',
    agent_id: agentId,
    created_at: now,
    updated_at: now,
  } as Inquiry
}

export async function updateInquiryStatus(id: string, status: InquiryStatus): Promise<void> {
  const { error } = await supabase
    .from('inquiries')
    .update({ status })
    .eq('id', id)

  if (error) throw error
}

export async function createInquiryReply(data: {
  inquiry_id: string
  content: string
  sent_via: string[]
}): Promise<InquiryReply> {
  const agentId = await getAgentProfileId()

  const { data: reply, error } = await supabase
    .from('inquiry_replies')
    .insert({
      inquiry_id: data.inquiry_id,
      agent_id: agentId,
      content: data.content,
      sent_via: data.sent_via,
      sent_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error

  // Auto-update inquiry status to 'answered'
  await supabase
    .from('inquiries')
    .update({ status: 'answered' })
    .eq('id', data.inquiry_id)

  return reply
}

export async function getUnansweredCount(): Promise<number> {
  const { count, error } = await supabase
    .from('inquiries')
    .select('*', { count: 'exact', head: true })
    .in('status', ['new', 'checked'])

  if (error) throw error
  return count ?? 0
}

// User's own inquiries
export async function fetchMyInquiries(userId?: string): Promise<Inquiry[]> {
  if (!userId) {
    const { data: { user } } = await supabaseAuth.auth.getUser()
    userId = user?.id
  }
  if (!userId) return []

  const { data, error } = await supabase
    .from('inquiries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function fetchMyInquiryReplies(inquiryId: string): Promise<InquiryReply[]> {
  const { data, error } = await supabase
    .from('inquiry_replies')
    .select('*')
    .eq('inquiry_id', inquiryId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

import { supabase } from '@/api/supabase'
import { getCurrentUserId } from '@/api/helpers'
import type { SharedProperty, CoBrokerageRequest, CoBrokerageRequestStatus } from '@/types/database'

// ──────────────────────────────────────────
// Shared Property Pool
// ──────────────────────────────────────────

export async function fetchSharedProperties(search?: string): Promise<SharedProperty[]> {
  const userId = await getCurrentUserId()

  let query = supabase
    .from('shared_properties')
    .select('*')
    .eq('is_active', true)
    .neq('agent_id', userId)

  if (search) {
    query = query.or(`property_title.ilike.%${search}%,address.ilike.%${search}%,office_name.ilike.%${search}%`)
  }

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function shareMyProperty(data: {
  property_id: string
  property_title: string
  address: string
  transaction_type: string
  sale_price?: number | null
  deposit?: number | null
  monthly_rent?: number | null
  exclusive_area_m2?: number | null
  commission_ratio: number
}): Promise<SharedProperty> {
  const userId = await getCurrentUserId()

  // Fetch agent profile for name/office
  const { data: profile } = await supabase
    .from('agent_profiles')
    .select('representative, office_name')
    .eq('user_id', userId)
    .single()

  const { data: sp, error } = await supabase
    .from('shared_properties')
    .insert({
      property_id: data.property_id,
      agent_id: userId,
      agent_name: profile?.representative ?? '',
      office_name: profile?.office_name ?? '',
      commission_ratio: data.commission_ratio,
      property_title: data.property_title,
      address: data.address,
      transaction_type: data.transaction_type as SharedProperty['transaction_type'],
      sale_price: data.sale_price ?? null,
      deposit: data.deposit ?? null,
      monthly_rent: data.monthly_rent ?? null,
      exclusive_area_m2: data.exclusive_area_m2 ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return sp
}

// ──────────────────────────────────────────
// Co-Brokerage Requests
// ──────────────────────────────────────────

export async function createCoBrokerageRequest(data: {
  shared_property_id: string
  message: string
  property_title: string
  address: string
}): Promise<CoBrokerageRequest> {
  const userId = await getCurrentUserId()

  // Fetch agent profile for requester info
  const { data: profile } = await supabase
    .from('agent_profiles')
    .select('representative, office_name, phone')
    .eq('user_id', userId)
    .single()

  const { data: req, error } = await supabase
    .from('co_brokerage_requests')
    .insert({
      shared_property_id: data.shared_property_id,
      requester_agent_id: userId,
      requester_name: profile?.representative ?? '',
      requester_office: profile?.office_name ?? '',
      requester_phone: profile?.phone ?? '',
      message: data.message,
      property_title: data.property_title,
      address: data.address,
    })
    .select()
    .single()

  if (error) throw error
  return req
}

export async function fetchSentRequests(): Promise<CoBrokerageRequest[]> {
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('co_brokerage_requests')
    .select('*')
    .eq('requester_agent_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function fetchReceivedRequests(): Promise<CoBrokerageRequest[]> {
  const userId = await getCurrentUserId()

  // Received = requests on shared_properties owned by this user
  const { data, error } = await supabase
    .from('co_brokerage_requests')
    .select('*, shared_properties!inner(agent_id)')
    .eq('shared_properties.agent_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Strip the join data and return just the request
  return (data ?? []).map(({ shared_properties, ...req }) => req) as CoBrokerageRequest[]
}

export async function updateRequestStatus(
  requestId: string,
  status: CoBrokerageRequestStatus,
  commissionRatio?: number,
): Promise<void> {
  const updateData: Record<string, unknown> = { status }
  if (commissionRatio !== undefined) updateData.commission_ratio = commissionRatio

  const { error } = await supabase
    .from('co_brokerage_requests')
    .update(updateData)
    .eq('id', requestId)

  if (error) throw error
}

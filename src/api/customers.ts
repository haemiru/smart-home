import { supabase } from '@/api/supabase'
import { getAgentProfileId } from '@/api/helpers'
import type { Customer, CustomerActivity, CustomerType, CustomerSource } from '@/types/database'

export interface CustomerFilters {
  customerType?: CustomerType | 'all'
  source?: CustomerSource | 'all'
  minScore?: number
  maxScore?: number
  search?: string
}

export async function fetchCustomers(filters: CustomerFilters = {}): Promise<Customer[]> {
  let query = supabase.from('customers').select('*')

  if (filters.customerType && filters.customerType !== 'all') {
    query = query.eq('customer_type', filters.customerType)
  }
  if (filters.source && filters.source !== 'all') {
    query = query.eq('source', filters.source)
  }
  if (filters.minScore != null) {
    query = query.gte('score', filters.minScore)
  }
  if (filters.maxScore != null) {
    query = query.lte('score', filters.maxScore)
  }
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
  }

  query = query.order('updated_at', { ascending: false })

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function fetchCustomerById(id: string): Promise<Customer | null> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function fetchCustomerActivities(customerId: string): Promise<CustomerActivity[]> {
  const { data, error } = await supabase
    .from('customer_activities')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function createCustomer(data: {
  name: string
  phone: string
  email?: string
  customer_type?: CustomerType
  source?: CustomerSource
  preferences?: Record<string, unknown>
  memo?: string
}): Promise<Customer> {
  const agentId = await getAgentProfileId()
  const initialScore = data.source === 'inquiry' ? 20 : 0

  const { data: customer, error } = await supabase
    .from('customers')
    .insert({
      agent_id: agentId,
      name: data.name,
      phone: data.phone,
      email: data.email ?? null,
      customer_type: data.customer_type ?? 'lead',
      preferences: data.preferences ?? {},
      score: initialScore,
      source: data.source ?? 'direct',
      memo: data.memo ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return customer
}

export async function updateCustomer(id: string, data: Partial<Customer>): Promise<Customer | null> {
  const { data: customer, error } = await supabase
    .from('customers')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return customer
}

export async function updateCustomerType(id: string, customerType: CustomerType): Promise<void> {
  const { error } = await supabase
    .from('customers')
    .update({ customer_type: customerType })
    .eq('id', id)

  if (error) throw error
}

export async function addCustomerActivity(data: {
  customer_id: string
  activity_type: CustomerActivity['activity_type']
  property_id?: string
  metadata?: Record<string, unknown>
}): Promise<void> {
  // Insert activity
  const { error: actError } = await supabase
    .from('customer_activities')
    .insert({
      customer_id: data.customer_id,
      activity_type: data.activity_type,
      property_id: data.property_id ?? null,
      metadata: data.metadata ?? {},
    })

  if (actError) throw actError

  // Score adjustments
  const scoreMap: Record<string, number> = { view: 5, favorite: 10, inquiry: 20, appointment: 30, contract_view: 40 }
  const scoreIncrement = scoreMap[data.activity_type] ?? 0

  if (scoreIncrement > 0) {
    // Fetch current score and increment
    const { data: customer } = await supabase
      .from('customers')
      .select('score')
      .eq('id', data.customer_id)
      .single()

    if (customer) {
      await supabase
        .from('customers')
        .update({ score: customer.score + scoreIncrement })
        .eq('id', data.customer_id)
    }
  }
}

export async function getCustomerCountByType(): Promise<Record<CustomerType, number>> {
  const counts: Record<CustomerType, number> = { lead: 0, interest: 0, consulting: 0, contracting: 0, completed: 0 }

  const { data, error } = await supabase
    .from('customers')
    .select('customer_type')

  if (error) throw error
  if (data) {
    for (const c of data) {
      counts[c.customer_type]++
    }
  }
  return counts
}

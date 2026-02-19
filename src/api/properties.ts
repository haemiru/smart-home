import { supabase } from '@/api/supabase'
import { getAgentProfileId } from '@/api/helpers'
import type { Property, PropertyCategory, PropertyStatus, TransactionType } from '@/types/database'

export interface PropertyFilters {
  search?: string
  categoryId?: string
  transactionType?: TransactionType
  status?: PropertyStatus
  minPrice?: number
  maxPrice?: number
  minArea?: number
  maxArea?: number
  rooms?: number
  minFloor?: number
  maxFloor?: number
  direction?: string
  hasElevator?: boolean
  petsAllowed?: boolean
  isUrgent?: boolean
  tags?: string[]
  minBuiltYear?: number
  minParkingPerUnit?: number
  maxMaintenanceFee?: number
}

export type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'area_desc' | 'popular'

function applySorting(query: ReturnType<typeof supabase.from>, sort: SortOption) {
  switch (sort) {
    case 'newest': return query.order('created_at', { ascending: false })
    case 'price_asc': return query.order('sale_price', { ascending: true, nullsFirst: false })
    case 'price_desc': return query.order('sale_price', { ascending: false })
    case 'area_desc': return query.order('exclusive_area_m2', { ascending: false })
    case 'popular': return query.order('view_count', { ascending: false })
    default: return query.order('created_at', { ascending: false })
  }
}

export async function fetchProperties(
  filters: PropertyFilters = {},
  sort: SortOption = 'newest',
  page = 1,
  pageSize = 12,
): Promise<{ data: Property[]; total: number }> {
  let query = supabase
    .from('properties')
    .select('*', { count: 'exact' })

  // Default: active only for public portal
  if (filters.status) {
    query = query.eq('status', filters.status)
  } else {
    query = query.eq('status', 'active')
  }

  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,address.ilike.%${filters.search}%`)
  }
  if (filters.categoryId) query = query.eq('category_id', filters.categoryId)
  if (filters.transactionType) query = query.eq('transaction_type', filters.transactionType)
  if (filters.minPrice != null) query = query.gte('sale_price', filters.minPrice)
  if (filters.maxPrice != null) query = query.lte('sale_price', filters.maxPrice)
  if (filters.minArea != null) query = query.gte('exclusive_area_m2', filters.minArea)
  if (filters.maxArea != null) query = query.lte('exclusive_area_m2', filters.maxArea)
  if (filters.rooms != null) query = query.gte('rooms', filters.rooms)
  if (filters.direction) query = query.eq('direction', filters.direction)
  if (filters.hasElevator) query = query.eq('has_elevator', true)
  if (filters.petsAllowed) query = query.eq('pets_allowed', true)
  if (filters.isUrgent) query = query.eq('is_urgent', true)
  if (filters.tags && filters.tags.length > 0) query = query.contains('tags', filters.tags)
  if (filters.minBuiltYear != null) query = query.gte('built_year', filters.minBuiltYear)
  if (filters.minParkingPerUnit != null) query = query.gte('parking_per_unit', filters.minParkingPerUnit)
  if (filters.maxMaintenanceFee != null) query = query.lte('maintenance_fee', filters.maxMaintenanceFee)

  query = applySorting(query, sort)

  const start = (page - 1) * pageSize
  query = query.range(start, start + pageSize - 1)

  const { data, count, error } = await query

  if (error) throw error
  return { data: data ?? [], total: count ?? 0 }
}

export async function fetchAdminProperties(
  filters: PropertyFilters & { statusTab?: PropertyStatus | 'all' } = {},
  sort: SortOption = 'newest',
): Promise<Property[]> {
  // RLS automatically filters by agent
  let query = supabase.from('properties').select('*')

  if (filters.statusTab && filters.statusTab !== 'all') {
    query = query.eq('status', filters.statusTab)
  }
  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,address.ilike.%${filters.search}%`)
  }
  if (filters.categoryId) query = query.eq('category_id', filters.categoryId)
  if (filters.transactionType) query = query.eq('transaction_type', filters.transactionType)

  query = applySorting(query, sort)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function fetchPropertyById(id: string): Promise<Property | null> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function createProperty(
  data: Omit<Property, 'id' | 'created_at' | 'updated_at' | 'view_count' | 'inquiry_count' | 'favorite_count'>,
): Promise<Property> {
  const agentId = await getAgentProfileId()
  const { data: property, error } = await supabase
    .from('properties')
    .insert({ ...data, agent_id: agentId })
    .select()
    .single()

  if (error) throw error
  return property
}

export async function updateProperty(id: string, data: Partial<Property>): Promise<Property | null> {
  const { data: property, error } = await supabase
    .from('properties')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return property
}

export async function deleteProperties(ids: string[]): Promise<void> {
  const { error } = await supabase
    .from('properties')
    .delete()
    .in('id', ids)

  if (error) throw error
}

export async function updatePropertyStatus(ids: string[], status: PropertyStatus): Promise<void> {
  const { error } = await supabase
    .from('properties')
    .update({ status })
    .in('id', ids)

  if (error) throw error
}

export async function fetchCategories(): Promise<PropertyCategory[]> {
  const { data, error } = await supabase
    .from('property_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data ?? []
}

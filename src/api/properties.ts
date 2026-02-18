// Mock API functions for properties
// TODO: Replace with actual Supabase calls when backend is connected

import type { Property, PropertyStatus, TransactionType } from '@/types/database'
import { mockPropertyList, systemCategories } from '@/utils/propertyMockData'

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
}

export type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'area_desc' | 'popular'

let _properties = [...mockPropertyList]

function getMainPrice(p: Property): number {
  if (p.transaction_type === 'sale') return p.sale_price ?? 0
  return p.deposit ?? 0
}

export async function fetchProperties(
  filters: PropertyFilters = {},
  sort: SortOption = 'newest',
  page = 1,
  pageSize = 12,
): Promise<{ data: Property[]; total: number }> {
  let result = [..._properties]

  // Filters
  if (filters.search) {
    const q = filters.search.toLowerCase()
    result = result.filter((p) => p.title.toLowerCase().includes(q) || p.address.toLowerCase().includes(q))
  }
  if (filters.categoryId) result = result.filter((p) => p.category_id === filters.categoryId)
  if (filters.transactionType) result = result.filter((p) => p.transaction_type === filters.transactionType)
  if (filters.status) result = result.filter((p) => p.status === filters.status)
  else result = result.filter((p) => p.status === 'active') // default: active only for public
  if (filters.minPrice != null) result = result.filter((p) => getMainPrice(p) >= filters.minPrice!)
  if (filters.maxPrice != null) result = result.filter((p) => getMainPrice(p) <= filters.maxPrice!)
  if (filters.minArea != null) result = result.filter((p) => (p.exclusive_area_m2 ?? 0) >= filters.minArea!)
  if (filters.maxArea != null) result = result.filter((p) => (p.exclusive_area_m2 ?? 0) <= filters.maxArea!)
  if (filters.rooms != null) result = result.filter((p) => (p.rooms ?? 0) >= filters.rooms!)
  if (filters.direction) result = result.filter((p) => p.direction === filters.direction)
  if (filters.hasElevator) result = result.filter((p) => p.has_elevator)
  if (filters.petsAllowed) result = result.filter((p) => p.pets_allowed)
  if (filters.isUrgent) result = result.filter((p) => p.is_urgent)

  // Sort
  switch (sort) {
    case 'newest': result.sort((a, b) => b.created_at.localeCompare(a.created_at)); break
    case 'price_asc': result.sort((a, b) => getMainPrice(a) - getMainPrice(b)); break
    case 'price_desc': result.sort((a, b) => getMainPrice(b) - getMainPrice(a)); break
    case 'area_desc': result.sort((a, b) => (b.exclusive_area_m2 ?? 0) - (a.exclusive_area_m2 ?? 0)); break
    case 'popular': result.sort((a, b) => b.view_count - a.view_count); break
  }

  const total = result.length
  const start = (page - 1) * pageSize
  return { data: result.slice(start, start + pageSize), total }
}

export async function fetchAdminProperties(
  filters: PropertyFilters & { statusTab?: PropertyStatus | 'all' } = {},
  sort: SortOption = 'newest',
): Promise<Property[]> {
  let result = [..._properties]

  if (filters.statusTab && filters.statusTab !== 'all') {
    result = result.filter((p) => p.status === filters.statusTab)
  }
  if (filters.search) {
    const q = filters.search.toLowerCase()
    result = result.filter((p) => p.title.toLowerCase().includes(q) || p.address.toLowerCase().includes(q))
  }
  if (filters.categoryId) result = result.filter((p) => p.category_id === filters.categoryId)
  if (filters.transactionType) result = result.filter((p) => p.transaction_type === filters.transactionType)

  switch (sort) {
    case 'newest': result.sort((a, b) => b.created_at.localeCompare(a.created_at)); break
    case 'price_asc': result.sort((a, b) => getMainPrice(a) - getMainPrice(b)); break
    case 'price_desc': result.sort((a, b) => getMainPrice(b) - getMainPrice(a)); break
    case 'area_desc': result.sort((a, b) => (b.exclusive_area_m2 ?? 0) - (a.exclusive_area_m2 ?? 0)); break
    case 'popular': result.sort((a, b) => b.view_count - a.view_count); break
  }

  return result
}

export async function fetchPropertyById(id: string): Promise<Property | null> {
  return _properties.find((p) => p.id === id) ?? null
}

export async function createProperty(data: Omit<Property, 'id' | 'created_at' | 'updated_at' | 'view_count' | 'inquiry_count' | 'favorite_count'>): Promise<Property> {
  const now = new Date().toISOString()
  const property: Property = {
    ...data,
    id: `p${Date.now()}`,
    view_count: 0,
    inquiry_count: 0,
    favorite_count: 0,
    created_at: now,
    updated_at: now,
  }
  _properties.unshift(property)
  return property
}

export async function updateProperty(id: string, data: Partial<Property>): Promise<Property | null> {
  const idx = _properties.findIndex((p) => p.id === id)
  if (idx === -1) return null
  _properties[idx] = { ..._properties[idx], ...data, updated_at: new Date().toISOString() }
  return _properties[idx]
}

export async function deleteProperties(ids: string[]): Promise<void> {
  _properties = _properties.filter((p) => !ids.includes(p.id))
}

export async function updatePropertyStatus(ids: string[], status: PropertyStatus): Promise<void> {
  for (const id of ids) {
    const idx = _properties.findIndex((p) => p.id === id)
    if (idx !== -1) _properties[idx] = { ..._properties[idx], status, updated_at: new Date().toISOString() }
  }
}

export async function fetchCategories() {
  return systemCategories
}

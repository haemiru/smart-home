import { supabase } from '@/api/supabase'
import type { TenantProfile } from '@/types/database'

/** In-memory cache for tenant data (cleared on logout). */
let _cache: Map<string, TenantProfile> = new Map()

export async function fetchTenantBySlug(slug: string): Promise<TenantProfile | null> {
  const cached = _cache.get(`slug:${slug}`)
  if (cached) return cached

  const { data, error } = await supabase.rpc('resolve_tenant_by_slug', { _slug: slug })

  if (error || !data || data.length === 0) return null

  const tenant = data[0] as TenantProfile
  _cache.set(`slug:${slug}`, tenant)
  return tenant
}

export async function fetchTenantByDomain(domain: string): Promise<TenantProfile | null> {
  const cached = _cache.get(`domain:${domain}`)
  if (cached) return cached

  const { data, error } = await supabase.rpc('resolve_tenant_by_domain', { _domain: domain })

  if (error || !data || data.length === 0) return null

  const tenant = data[0] as TenantProfile
  _cache.set(`domain:${domain}`, tenant)
  return tenant
}

export async function fetchTenantById(id: string): Promise<TenantProfile | null> {
  const cached = _cache.get(`id:${id}`)
  if (cached) return cached

  const { data, error } = await supabase
    .from('agent_profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error || !data) return null

  const tenant = data as TenantProfile
  _cache.set(`id:${id}`, tenant)
  return tenant
}

export function clearTenantCache(): void {
  _cache = new Map()
}

import { supabase } from '@/api/supabase'
import { getCurrentUserId } from '@/api/helpers'
import type { Property } from '@/types/database'

export async function addFavorite(propertyId: string): Promise<void> {
  const userId = await getCurrentUserId()
  const { error } = await supabase
    .from('property_favorites')
    .upsert({ user_id: userId, property_id: propertyId }, { onConflict: 'user_id,property_id' })
  if (error) throw error
}

export async function removeFavorite(propertyId: string): Promise<void> {
  const userId = await getCurrentUserId()
  const { error } = await supabase
    .from('property_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('property_id', propertyId)
  if (error) throw error
}

export async function checkIsFavorite(propertyId: string): Promise<boolean> {
  const userId = await getCurrentUserId()
  const { count, error } = await supabase
    .from('property_favorites')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('property_id', propertyId)
  if (error) return false
  return (count ?? 0) > 0
}

export async function fetchFavoriteProperties(): Promise<Property[]> {
  const userId = await getCurrentUserId()

  // 1) Get favorite property IDs
  const { data: favs, error: favError } = await supabase
    .from('property_favorites')
    .select('property_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (favError || !favs || favs.length === 0) return []

  // 2) Fetch properties
  const ids = favs.map((f) => f.property_id)
  const { data: properties, error: propError } = await supabase
    .from('properties')
    .select('*')
    .in('id', ids)

  if (propError || !properties) return []

  // Preserve favorites order
  const orderMap = new Map(ids.map((id, i) => [id, i]))
  return properties.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0))
}

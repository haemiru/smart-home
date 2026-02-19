import { supabase } from '@/api/supabase'

let _agentProfileId: string | null = null
let _currentUserId: string | null = null

/**
 * Get the agent_profiles.id for the current user.
 * Used by properties, inquiries, customers, contracts, etc.
 */
export async function getAgentProfileId(): Promise<string> {
  if (_agentProfileId) return _agentProfileId

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('로그인이 필요합니다.')

  const { data, error } = await supabase
    .from('agent_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (error || !data) throw new Error('중개사 프로필을 찾을 수 없습니다.')

  _agentProfileId = data.id
  return data.id
}

/**
 * Get auth.uid() — the current user's id.
 * Used by inspections, rental, co-brokerage, etc.
 */
export async function getCurrentUserId(): Promise<string> {
  if (_currentUserId) return _currentUserId

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('로그인이 필요합니다.')

  _currentUserId = user.id
  return user.id
}

/**
 * Clear cached IDs (call on logout).
 */
export function clearCachedIds(): void {
  _agentProfileId = null
  _currentUserId = null
}

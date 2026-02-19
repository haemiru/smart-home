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

  // Try agent_profiles directly (works for agents)
  const { data, error } = await supabase
    .from('agent_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!error && data) {
    _agentProfileId = data.id
    return data.id
  }

  // Fallback for staff: look up via staff_members
  const { data: staffRow, error: staffError } = await supabase
    .from('staff_members')
    .select('agent_profile_id')
    .eq('user_id', user.id)
    .single()

  if (staffError || !staffRow) throw new Error('중개사 프로필을 찾을 수 없습니다.')

  _agentProfileId = staffRow.agent_profile_id
  return staffRow.agent_profile_id
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

import { supabase } from '@/api/supabase'
import { getAgentProfileId } from '@/api/helpers'
import type { MoveInGuide } from '@/types/database'

export async function fetchMoveInGuide(contractId: string): Promise<MoveInGuide | null> {
  const { data, error } = await supabase
    .from('move_in_guides')
    .select('*')
    .eq('contract_id', contractId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function saveMoveInGuide(data: {
  contract_id: string
  content: string
  address: string
}): Promise<MoveInGuide> {
  const agentId = await getAgentProfileId()

  // Upsert: if guide exists for this contract, update it
  const { data: guide, error } = await supabase
    .from('move_in_guides')
    .upsert(
      {
        contract_id: data.contract_id,
        agent_id: agentId,
        content: data.content,
        address: data.address,
      },
      { onConflict: 'contract_id' },
    )
    .select()
    .single()

  if (error) throw error
  return guide
}

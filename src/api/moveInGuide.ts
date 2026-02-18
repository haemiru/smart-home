// Mock API for move-in guides
// TODO: Replace with actual Supabase calls when backend is connected

import type { MoveInGuide } from '@/types/database'

const _guides: MoveInGuide[] = []

export async function fetchMoveInGuide(contractId: string): Promise<MoveInGuide | null> {
  return _guides.find((g) => g.contract_id === contractId) ?? null
}

export async function saveMoveInGuide(data: {
  contract_id: string
  content: string
  address: string
}): Promise<MoveInGuide> {
  // Remove existing guide for same contract
  const idx = _guides.findIndex((g) => g.contract_id === data.contract_id)
  if (idx !== -1) _guides.splice(idx, 1)

  const guide: MoveInGuide = {
    id: `mig-${Date.now()}`,
    contract_id: data.contract_id,
    agent_id: 'agent-1',
    content: data.content,
    address: data.address,
    created_at: new Date().toISOString(),
  }
  _guides.unshift(guide)
  return guide
}

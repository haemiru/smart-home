import { supabase } from '@/api/supabase'
import { getAgentProfileId } from '@/api/helpers'
import type { Contract, ContractProcess, ContractStatus, ContractTemplateType, ContractStepType, TransactionType } from '@/types/database'

// Template recommendation based on property category — pure function
export function recommendTemplate(categoryId: string | null, txType: TransactionType): ContractTemplateType {
  const isSale = txType === 'sale'
  switch (categoryId) {
    case 'cat-apt': return isSale ? 'apartment_sale' : 'apartment_lease'
    case 'cat-ofi': return isSale ? 'officetel_sale' : 'officetel_lease'
    case 'cat-sto': return isSale ? 'commercial_sale' : 'commercial_lease'
    case 'cat-off': return isSale ? 'commercial_sale' : 'commercial_lease'
    case 'cat-lan': return 'land_sale'
    case 'cat-vil': return isSale ? 'apartment_sale' : 'apartment_lease'
    case 'cat-hou': return isSale ? 'apartment_sale' : 'apartment_lease'
    case 'cat-one': return isSale ? 'officetel_sale' : 'officetel_lease'
    default: return isSale ? 'apartment_sale' : 'apartment_lease'
  }
}

// Default process steps based on transaction type — pure function
export function getDefaultProcessSteps(txType: TransactionType): { step_type: ContractStepType; step_label: string; sort_order: number }[] {
  if (txType === 'sale') {
    return [
      { step_type: 'contract_signed', step_label: '계약 체결', sort_order: 1 },
      { step_type: 'down_payment', step_label: '계약금 입금', sort_order: 2 },
      { step_type: 'mid_payment', step_label: '중도금 입금', sort_order: 3 },
      { step_type: 'final_payment', step_label: '잔금 입금', sort_order: 4 },
      { step_type: 'ownership_transfer', step_label: '소유권이전등기', sort_order: 5 },
      { step_type: 'completed', step_label: '거래 완료', sort_order: 6 },
    ]
  }
  // jeonse / monthly (lease)
  return [
    { step_type: 'contract_signed', step_label: '계약 체결', sort_order: 1 },
    { step_type: 'down_payment', step_label: '계약금 입금', sort_order: 2 },
    { step_type: 'final_payment', step_label: '잔금 입금', sort_order: 3 },
    { step_type: 'move_in_report', step_label: '전입신고', sort_order: 4 },
    { step_type: 'fixed_date', step_label: '확정일자', sort_order: 5 },
    { step_type: 'moving', step_label: '이사', sort_order: 6 },
    { step_type: 'maintenance_settle', step_label: '관리비 정산', sort_order: 7 },
    { step_type: 'completed', step_label: '거래 완료', sort_order: 8 },
  ]
}

// Required documents per step — pure function
export function getStepDocuments(stepType: ContractStepType, txType: TransactionType): string[] {
  const docs: Record<string, string[]> = {
    contract_signed: ['신분증 사본', '인감증명서', '등기부등본', '계약서 2부'],
    down_payment: ['계약금 입금 확인서'],
    mid_payment: ['중도금 입금 확인서'],
    final_payment: txType === 'sale'
      ? ['잔금 입금 확인서', '등기권리증', '인감증명서', '주민등록초본']
      : ['잔금 입금 확인서'],
    ownership_transfer: ['등기신청서', '취득세 납부 확인서', '등기권리증', '위임장'],
    move_in_report: ['전입신고서', '임대차계약서 사본', '신분증'],
    fixed_date: ['임대차계약서 원본', '확정일자 신청서'],
    moving: [],
    maintenance_settle: ['관리비 정산서', '검침표'],
    completed: [],
  }
  return docs[stepType] || []
}

export async function fetchContracts(filters: { status?: ContractStatus | 'all'; search?: string } = {}): Promise<Contract[]> {
  let query = supabase.from('contracts').select('*')

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters.search) {
    query = query.or(`contract_number.ilike.%${filters.search}%,seller_info->>name.ilike.%${filters.search}%,buyer_info->>name.ilike.%${filters.search}%`)
  }

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function fetchContractById(id: string): Promise<Contract | null> {
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function fetchContractProcess(contractId: string): Promise<ContractProcess[]> {
  const { data, error } = await supabase
    .from('contract_process')
    .select('*')
    .eq('contract_id', contractId)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function createContract(data: {
  property_id: string | null
  transaction_type: TransactionType
  template_type: ContractTemplateType
  seller_info: Record<string, unknown>
  buyer_info: Record<string, unknown>
  agent_info: Record<string, unknown>
  price_info: Record<string, unknown>
  special_terms?: string
}): Promise<Contract> {
  const agentId = await getAgentProfileId()

  // Generate contract number via DB sequence
  const { data: contractNumber, error: rpcError } = await supabase.rpc('generate_contract_number')
  if (rpcError) throw rpcError

  const { data: contract, error } = await supabase
    .from('contracts')
    .insert({
      contract_number: contractNumber,
      agent_id: agentId,
      property_id: data.property_id,
      transaction_type: data.transaction_type,
      template_type: data.template_type,
      seller_info: data.seller_info,
      buyer_info: data.buyer_info,
      agent_info: data.agent_info,
      price_info: data.price_info,
      special_terms: data.special_terms ?? null,
      status: 'drafting',
      confirmation_doc: {},
    })
    .select()
    .single()

  if (error) throw error

  // Auto-create process steps
  const steps = getDefaultProcessSteps(data.transaction_type)
  const processRows = steps.map((step) => ({
    contract_id: contract.id,
    step_type: step.step_type,
    step_label: step.step_label,
    sort_order: step.sort_order,
  }))

  const { error: stepsError } = await supabase
    .from('contract_process')
    .insert(processRows)

  if (stepsError) throw stepsError

  return contract
}

export async function updateContract(id: string, data: Partial<Contract>): Promise<Contract | null> {
  const { data: contract, error } = await supabase
    .from('contracts')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return contract
}

export async function updateContractStatus(id: string, status: ContractStatus): Promise<void> {
  const { error } = await supabase
    .from('contracts')
    .update({ status })
    .eq('id', id)

  if (error) throw error
}

export async function toggleProcessStep(stepId: string): Promise<ContractProcess | null> {
  // Fetch current state
  const { data: current, error: fetchError } = await supabase
    .from('contract_process')
    .select('*')
    .eq('id', stepId)
    .single()

  if (fetchError) {
    if (fetchError.code === 'PGRST116') return null
    throw fetchError
  }

  const isCompleted = !current.is_completed
  const { data: updated, error } = await supabase
    .from('contract_process')
    .update({
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
    })
    .eq('id', stepId)
    .select()
    .single()

  if (error) throw error
  return updated
}

export async function updateProcessStep(stepId: string, data: { due_date?: string; notes?: string }): Promise<void> {
  const updateData: Record<string, unknown> = {}
  if (data.due_date !== undefined) updateData.due_date = data.due_date
  if (data.notes !== undefined) updateData.notes = data.notes

  if (Object.keys(updateData).length === 0) return

  const { error } = await supabase
    .from('contract_process')
    .update(updateData)
    .eq('id', stepId)

  if (error) throw error
}

// User: fetch contracts they're party to
export async function fetchMyContracts(_userId?: string): Promise<Contract[]> {
  // For now, return all contracts visible to the user via RLS
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

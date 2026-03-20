import { supabase } from '@/api/supabase'
import { getAgentProfileId } from '@/api/helpers'
import type { Contract, ContractProcess, ContractStatus, ContractTemplateType, ContractStepType, TransactionType, Property } from '@/types/database'

// Template recommendation based on property category name — pure function
export function recommendTemplate(categoryName: string | null, txType: TransactionType): ContractTemplateType {
  const isSale = txType === 'sale'
  const name = (categoryName ?? '').trim()
  switch (name) {
    case '아파트':
    case '빌라':
    case '주택':
      return isSale ? 'apartment_sale' : 'apartment_lease'
    case '오피스텔':
    case '원룸':
      return isSale ? 'officetel_sale' : 'officetel_lease'
    case '상가':
    case '사무실':
      return isSale ? 'commercial_sale' : 'commercial_lease'
    case '토지':
      return isSale ? 'land_sale' : 'land_lease'
    case '공장/창고':
      return isSale ? 'factory_sale' : 'factory_lease'
    default:
      return isSale ? 'apartment_sale' : 'apartment_lease'
  }
}

// 계약서 price_info에서 진행 단계별 예정일 매핑
function buildStepDueDates(priceInfo: Record<string, unknown>, txType: TransactionType): Partial<Record<ContractStepType, string>> {
  const pi = priceInfo as Record<string, string | number | null>
  const downDate = pi.downPaymentDate ? String(pi.downPaymentDate) : null
  const midDate = pi.midPaymentDate ? String(pi.midPaymentDate) : null
  const finalDate = pi.finalPaymentDate ? String(pi.finalPaymentDate) : null
  const isSale = txType === 'sale'

  const map: Partial<Record<ContractStepType, string>> = {}
  if (downDate) {
    map.contract_signed = downDate  // 계약 체결일 = 계약금 지급일
    map.down_payment = downDate
  }
  if (midDate) map.mid_payment = midDate
  if (finalDate) {
    map.final_payment = finalDate
    if (!isSale) {
      map.maintenance_settle = finalDate  // 관리비 정산 = 잔금 지급일
      map.moving = finalDate              // 이사 = 잔금 지급일
    }
  }
  return map
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
    { step_type: 'maintenance_settle', step_label: '관리비 정산', sort_order: 4 },
    { step_type: 'moving', step_label: '이사', sort_order: 5 },
    { step_type: 'completed', step_label: '거래 완료', sort_order: 6 },
  ]
}

// Required documents per step — pure function
export function getStepDocuments(stepType: ContractStepType, txType: TransactionType): string[] {
  const isSale = txType === 'sale'
  const docs: Record<string, string[]> = {
    contract_signed: isSale
      ? ['신분증', '등기부등본', '국세·지방세 완납증명서']
      : ['신분증', '등기부등본', '국세·지방세 완납증명서', '확정일자 부여현황', '전입세대 확인서'],
    down_payment: [],
    mid_payment: ['중도금 입금 확인서'],
    final_payment: isSale
      ? ['등기권리증', '인감증명서', '주민등록초본']
      : [],
    ownership_transfer: ['등기신청서', '취득세 납부 확인서', '등기권리증', '위임장'],
    move_in_report: ['임대차 계약서', '신분증'],
    fixed_date: ['임대차 계약서'],
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

/** 매물 상태가 '계약진행'이지만 contracts 레코드가 없는 매물 조회 */
export async function fetchContractedPropertiesWithoutContract(): Promise<Property[]> {
  // 1) 계약진행 상태 매물
  const { data: contracted, error: e1 } = await supabase
    .from('properties')
    .select('*')
    .eq('status', 'contracted')
    .order('updated_at', { ascending: false })
  if (e1 || !contracted) return []

  if (contracted.length === 0) return []

  // 2) contracts 테이블에서 이미 연결된 property_id 목록
  const { data: existing } = await supabase
    .from('contracts')
    .select('property_id')
    .in('property_id', contracted.map((p) => p.id))
  const linkedIds = new Set((existing ?? []).map((c) => c.property_id))

  // 3) contracts에 없는 매물만 반환
  return contracted.filter((p) => !linkedIds.has(p.id))
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

type ContractInput = {
  property_id: string | null
  transaction_type: TransactionType
  template_type: ContractTemplateType
  seller_info: Record<string, unknown>
  buyer_info: Record<string, unknown>
  agent_info: Record<string, unknown>
  price_info: Record<string, unknown>
  special_terms?: string
  draft_data?: Record<string, unknown>
}

export async function createContract(data: ContractInput, status: ContractStatus = 'confirmation_writing'): Promise<Contract> {
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
      status,
      confirmation_doc: {},
      draft_data: status === 'contract_writing' ? (data.draft_data ?? null) : null,
    })
    .select()
    .single()

  if (error) throw error

  return contract
}

export async function updateDraftContract(id: string, data: ContractInput, status: ContractStatus = 'contract_writing'): Promise<Contract> {
  const updatePayload: Record<string, unknown> = {
    property_id: data.property_id,
    transaction_type: data.transaction_type,
    template_type: data.template_type,
    seller_info: data.seller_info,
    buyer_info: data.buyer_info,
    agent_info: data.agent_info,
    price_info: data.price_info,
    special_terms: data.special_terms ?? null,
    status,
    draft_data: status === 'contract_writing' ? (data.draft_data ?? null) : null,
  }

  const { data: contract, error } = await supabase
    .from('contracts')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return contract
}

/** 확인설명서 완료 → in_progress 전환 + 진행 단계 생성 */
export async function finalizeConfirmation(contractId: string): Promise<void> {
  const { data: contract, error } = await supabase
    .from('contracts')
    .update({ status: 'in_progress' })
    .eq('id', contractId)
    .select()
    .single()

  if (error) throw error

  // 기존 진행 단계 제거 후 재생성
  await supabase.from('contract_process').delete().eq('contract_id', contractId)

  const steps = getDefaultProcessSteps(contract.transaction_type)
  const pi = contract.price_info as Record<string, unknown>
  const dueDateMap = buildStepDueDates(pi, contract.transaction_type)
  const processRows = steps.map((step) => ({
    contract_id: contractId,
    step_type: step.step_type,
    step_label: step.step_label,
    sort_order: step.sort_order,
    due_date: dueDateMap[step.step_type] ?? null,
  }))

  const { error: stepsError } = await supabase
    .from('contract_process')
    .insert(processRows)

  if (stepsError) throw stepsError
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
export async function fetchMyContracts(_userId?: string): Promise<Contract[]> { // eslint-disable-line @typescript-eslint/no-unused-vars
  // For now, return all contracts visible to the user via RLS
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

// Mock API functions for contracts
// TODO: Replace with actual Supabase calls when backend is connected

import type { Contract, ContractProcess, ContractStatus, ContractTemplateType, ContractStepType, TransactionType } from '@/types/database'

// Contract number: CT-YYYYMMDD-NNN
let _seqCounter = 3
function generateContractNumber(): string {
  const d = new Date()
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const seq = String(_seqCounter++).padStart(3, '0')
  return `CT-${date}-${seq}`
}

// Template recommendation based on property category
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

// Default process steps based on transaction type
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

// Required documents per step
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

// Mock data
const _contracts: Contract[] = [
  {
    id: 'ct-1', contract_number: 'CT-20260215-001', agent_id: 'agent-1', property_id: 'p2',
    transaction_type: 'sale', template_type: 'apartment_sale',
    seller_info: { name: '박영진', phone: '010-1111-2222', idNumber: '******-*******', address: '서울 강남구 대치동 456' },
    buyer_info: { name: '최수진', phone: '010-7777-8888', idNumber: '******-*******', address: '서울 송파구 잠실동 789' },
    agent_info: { officeName: '스마트부동산', representative: '홍길동', licenseNumber: '12345-2024-00001', address: '서울 강남구 역삼동', phone: '02-1234-5678' },
    price_info: { salePrice: 123000, downPayment: 12300, downPaymentDate: '2026-02-15', midPayment: 55350, midPaymentDate: '2026-03-15', finalPayment: 55350, finalPaymentDate: '2026-04-15' },
    special_terms: '1. 매도인은 잔금일까지 근저당권 말소를 완료한다.\n2. 현 시설물 현상태 인도로 한다.',
    status: 'signed',
    confirmation_doc: { type: 'residential' },
    pdf_url: null,
    created_at: '2026-02-15T10:00:00Z', updated_at: '2026-02-15T14:00:00Z',
  },
  {
    id: 'ct-2', contract_number: 'CT-20260217-001', agent_id: 'agent-1', property_id: 'p4',
    transaction_type: 'monthly', template_type: 'officetel_lease',
    seller_info: { name: '김건물', phone: '010-3333-4444', address: '서울 강남구 역삼동 101' },
    buyer_info: { name: '한지연', phone: '010-2222-3333', address: '서울 서초구 서초동 200' },
    agent_info: { officeName: '스마트부동산', representative: '홍길동', licenseNumber: '12345-2024-00001', address: '서울 강남구 역삼동', phone: '02-1234-5678' },
    price_info: { deposit: 1000, monthlyRent: 80, downPayment: 100, downPaymentDate: '2026-02-17', finalPayment: 900, finalPaymentDate: '2026-03-01' },
    special_terms: '1. 임대인은 입주 전 도배 및 장판 교체를 완료한다.',
    status: 'pending_sign',
    confirmation_doc: { type: 'residential' },
    pdf_url: null,
    created_at: '2026-02-17T15:00:00Z', updated_at: '2026-02-17T15:00:00Z',
  },
]

const _processes: ContractProcess[] = [
  // ct-1 (sale) process
  { id: 'cp-1', contract_id: 'ct-1', step_type: 'contract_signed', step_label: '계약 체결', due_date: '2026-02-15', is_completed: true, completed_at: '2026-02-15T14:00:00Z', notes: '계약서 서명 완료', sort_order: 1, created_at: '2026-02-15T10:00:00Z' },
  { id: 'cp-2', contract_id: 'ct-1', step_type: 'down_payment', step_label: '계약금 입금', due_date: '2026-02-15', is_completed: true, completed_at: '2026-02-15T16:00:00Z', notes: '계약금 12,300만원 입금 확인', sort_order: 2, created_at: '2026-02-15T10:00:00Z' },
  { id: 'cp-3', contract_id: 'ct-1', step_type: 'mid_payment', step_label: '중도금 입금', due_date: '2026-03-15', is_completed: false, completed_at: null, notes: null, sort_order: 3, created_at: '2026-02-15T10:00:00Z' },
  { id: 'cp-4', contract_id: 'ct-1', step_type: 'final_payment', step_label: '잔금 입금', due_date: '2026-04-15', is_completed: false, completed_at: null, notes: null, sort_order: 4, created_at: '2026-02-15T10:00:00Z' },
  { id: 'cp-5', contract_id: 'ct-1', step_type: 'ownership_transfer', step_label: '소유권이전등기', due_date: '2026-04-20', is_completed: false, completed_at: null, notes: null, sort_order: 5, created_at: '2026-02-15T10:00:00Z' },
  { id: 'cp-6', contract_id: 'ct-1', step_type: 'completed', step_label: '거래 완료', due_date: null, is_completed: false, completed_at: null, notes: null, sort_order: 6, created_at: '2026-02-15T10:00:00Z' },
  // ct-2 (lease) process
  { id: 'cp-7', contract_id: 'ct-2', step_type: 'contract_signed', step_label: '계약 체결', due_date: '2026-02-17', is_completed: true, completed_at: '2026-02-17T15:00:00Z', notes: null, sort_order: 1, created_at: '2026-02-17T15:00:00Z' },
  { id: 'cp-8', contract_id: 'ct-2', step_type: 'down_payment', step_label: '계약금 입금', due_date: '2026-02-17', is_completed: false, completed_at: null, notes: null, sort_order: 2, created_at: '2026-02-17T15:00:00Z' },
  { id: 'cp-9', contract_id: 'ct-2', step_type: 'final_payment', step_label: '잔금 입금', due_date: '2026-03-01', is_completed: false, completed_at: null, notes: null, sort_order: 3, created_at: '2026-02-17T15:00:00Z' },
  { id: 'cp-10', contract_id: 'ct-2', step_type: 'move_in_report', step_label: '전입신고', due_date: '2026-03-02', is_completed: false, completed_at: null, notes: null, sort_order: 4, created_at: '2026-02-17T15:00:00Z' },
  { id: 'cp-11', contract_id: 'ct-2', step_type: 'fixed_date', step_label: '확정일자', due_date: '2026-03-02', is_completed: false, completed_at: null, notes: null, sort_order: 5, created_at: '2026-02-17T15:00:00Z' },
  { id: 'cp-12', contract_id: 'ct-2', step_type: 'moving', step_label: '이사', due_date: '2026-03-01', is_completed: false, completed_at: null, notes: null, sort_order: 6, created_at: '2026-02-17T15:00:00Z' },
  { id: 'cp-13', contract_id: 'ct-2', step_type: 'maintenance_settle', step_label: '관리비 정산', due_date: '2026-03-05', is_completed: false, completed_at: null, notes: null, sort_order: 7, created_at: '2026-02-17T15:00:00Z' },
  { id: 'cp-14', contract_id: 'ct-2', step_type: 'completed', step_label: '거래 완료', due_date: null, is_completed: false, completed_at: null, notes: null, sort_order: 8, created_at: '2026-02-17T15:00:00Z' },
]

export async function fetchContracts(filters: { status?: ContractStatus | 'all'; search?: string } = {}): Promise<Contract[]> {
  let result = [..._contracts]
  if (filters.status && filters.status !== 'all') {
    result = result.filter((c) => c.status === filters.status)
  }
  if (filters.search) {
    const q = filters.search.toLowerCase()
    result = result.filter((c) =>
      c.contract_number.toLowerCase().includes(q) ||
      (c.seller_info as Record<string, string>).name?.toLowerCase().includes(q) ||
      (c.buyer_info as Record<string, string>).name?.toLowerCase().includes(q),
    )
  }
  result.sort((a, b) => b.created_at.localeCompare(a.created_at))
  return result
}

export async function fetchContractById(id: string): Promise<Contract | null> {
  return _contracts.find((c) => c.id === id) ?? null
}

export async function fetchContractProcess(contractId: string): Promise<ContractProcess[]> {
  return _processes.filter((p) => p.contract_id === contractId).sort((a, b) => a.sort_order - b.sort_order)
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
  const now = new Date().toISOString()
  const contract: Contract = {
    id: `ct-${Date.now()}`,
    contract_number: generateContractNumber(),
    agent_id: 'agent-1',
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
    pdf_url: null,
    created_at: now,
    updated_at: now,
  }
  _contracts.unshift(contract)

  // Auto-create process steps
  const steps = getDefaultProcessSteps(data.transaction_type)
  for (const step of steps) {
    _processes.push({
      id: `cp-${Date.now()}-${step.sort_order}`,
      contract_id: contract.id,
      step_type: step.step_type,
      step_label: step.step_label,
      due_date: null,
      is_completed: false,
      completed_at: null,
      notes: null,
      sort_order: step.sort_order,
      created_at: now,
    })
  }

  return contract
}

export async function updateContract(id: string, data: Partial<Contract>): Promise<Contract | null> {
  const idx = _contracts.findIndex((c) => c.id === id)
  if (idx === -1) return null
  _contracts[idx] = { ..._contracts[idx], ...data, updated_at: new Date().toISOString() }
  return _contracts[idx]
}

export async function updateContractStatus(id: string, status: ContractStatus): Promise<void> {
  const idx = _contracts.findIndex((c) => c.id === id)
  if (idx !== -1) {
    _contracts[idx] = { ..._contracts[idx], status, updated_at: new Date().toISOString() }
  }
}

export async function toggleProcessStep(stepId: string): Promise<ContractProcess | null> {
  const idx = _processes.findIndex((p) => p.id === stepId)
  if (idx === -1) return null
  const isCompleted = !_processes[idx].is_completed
  _processes[idx] = {
    ..._processes[idx],
    is_completed: isCompleted,
    completed_at: isCompleted ? new Date().toISOString() : null,
  }
  return _processes[idx]
}

export async function updateProcessStep(stepId: string, data: { due_date?: string; notes?: string }): Promise<void> {
  const idx = _processes.findIndex((p) => p.id === stepId)
  if (idx !== -1) {
    if (data.due_date !== undefined) _processes[idx] = { ..._processes[idx], due_date: data.due_date }
    if (data.notes !== undefined) _processes[idx] = { ..._processes[idx], notes: data.notes }
  }
}

// User: fetch contracts they're party to
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function fetchMyContracts(_userId?: string): Promise<Contract[]> {
  return [..._contracts].sort((a, b) => b.created_at.localeCompare(a.created_at))
}

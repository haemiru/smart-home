import { supabase } from '@/api/supabase'
import { getCurrentUserId } from '@/api/helpers'
import type { Inspection, InspectionCheckItem, InspectionStatus, InspectionGrade } from '@/types/database'

// Standard checklist template — pure data
export const checklistTemplate: { category: string; items: string[] }[] = [
  {
    category: '구조/외관',
    items: ['외벽 상태 (균열, 박리)', '복도/계단 상태', '엘리베이터 작동'],
  },
  {
    category: '내부 상태',
    items: ['결로/곰팡이', '누수 흔적', '바닥재 상태', '도배 상태'],
  },
  {
    category: '수도/배관',
    items: ['수압 (주방/욕실)', '배수 상태', '온수 작동', '배관 누수'],
  },
  {
    category: '전기/가스',
    items: ['콘센트 작동', '조명 상태', '보일러 작동'],
  },
  {
    category: '창호/방범',
    items: ['창호 기밀성', '방충망 상태', '잠금장치 작동'],
  },
  {
    category: '옵션/가전',
    items: ['에어컨 작동', '냉장고 상태', '세탁기 상태'],
  },
  {
    category: '주차/환경',
    items: ['주차 공간', '소음 수준', '채광 상태'],
  },
]

// Pure function — create checklist items
export function createChecklistItems(): InspectionCheckItem[] {
  const items: InspectionCheckItem[] = []
  let id = 1
  for (const cat of checklistTemplate) {
    for (const label of cat.items) {
      items.push({
        id: `chk-${id++}`,
        category: cat.category,
        label,
        status: null,
        note: null,
        photo: null,
      })
    }
  }
  return items
}

// Pure function — calculate grade
export function calculateGrade(checklist: InspectionCheckItem[]): InspectionGrade {
  const rated = checklist.filter((c: InspectionCheckItem) => c.status !== null)
  if (rated.length === 0) return 'C'
  const goodCount = rated.filter((c: InspectionCheckItem) => c.status === 'good').length
  const badCount = rated.filter((c: InspectionCheckItem) => c.status === 'bad').length
  const goodRatio = goodCount / rated.length
  const badRatio = badCount / rated.length

  if (badRatio >= 0.4) return 'F'
  if (badRatio >= 0.25) return 'D'
  if (goodRatio >= 0.8) return 'A'
  if (goodRatio >= 0.6) return 'B'
  return 'C'
}

export async function fetchInspections(filter?: InspectionStatus | 'all'): Promise<Inspection[]> {
  let query = supabase.from('inspections').select('*')

  if (filter && filter !== 'all') {
    query = query.eq('status', filter)
  }

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function fetchInspectionById(id: string): Promise<Inspection | null> {
  const { data, error } = await supabase
    .from('inspections')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function createInspection(data: {
  property_id: string | null
  property_title: string
  address: string
  scheduled_date: string | null
}): Promise<Inspection> {
  const agentId = await getCurrentUserId()

  const { data: inspection, error } = await supabase
    .from('inspections')
    .insert({
      agent_id: agentId,
      property_id: data.property_id,
      property_title: data.property_title,
      address: data.address,
      status: data.scheduled_date ? 'scheduled' : 'in_progress',
      scheduled_date: data.scheduled_date,
      checklist: createChecklistItems() as unknown as InspectionCheckItem[],
      photos: [],
    })
    .select()
    .single()

  if (error) throw error
  return inspection
}

export async function updateInspection(id: string, data: Partial<Inspection>): Promise<Inspection | null> {
  const { data: inspection, error } = await supabase
    .from('inspections')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return inspection
}

export async function completeInspection(id: string, checklist: InspectionCheckItem[], overallComment: string): Promise<Inspection | null> {
  const grade = calculateGrade(checklist)

  const { data: inspection, error } = await supabase
    .from('inspections')
    .update({
      status: 'completed' as InspectionStatus,
      completed_date: new Date().toISOString().slice(0, 10),
      checklist: checklist as unknown as InspectionCheckItem[],
      overall_comment: overallComment,
      grade,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return inspection
}

export async function saveAIComment(id: string, comment: string): Promise<void> {
  const { error } = await supabase
    .from('inspections')
    .update({ ai_comment: comment })
    .eq('id', id)

  if (error) throw error
}

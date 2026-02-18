// Mock API functions for inspections
// TODO: Replace with actual Supabase calls when backend is connected

import type { Inspection, InspectionCheckItem, InspectionStatus, InspectionGrade, CheckItemStatus } from '@/types/database'

// Standard checklist template
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

export function calculateGrade(checklist: InspectionCheckItem[]): InspectionGrade {
  const rated = checklist.filter((c) => c.status !== null)
  if (rated.length === 0) return 'C'
  const goodCount = rated.filter((c) => c.status === 'good').length
  const badCount = rated.filter((c) => c.status === 'bad').length
  const goodRatio = goodCount / rated.length
  const badRatio = badCount / rated.length

  if (badRatio >= 0.4) return 'F'
  if (badRatio >= 0.25) return 'D'
  if (goodRatio >= 0.8) return 'A'
  if (goodRatio >= 0.6) return 'B'
  return 'C'
}

// Mock data
const _inspections: Inspection[] = [
  {
    id: 'ins-1',
    agent_id: 'agent-1',
    property_id: 'p1',
    property_title: '래미안 대치팰리스 102동 1502호',
    address: '서울 강남구 대치동 890-5',
    status: 'completed',
    scheduled_date: '2026-02-10',
    completed_date: '2026-02-10',
    checklist: (() => {
      const items = createChecklistItems()
      // Set some statuses for the completed inspection
      const statuses: CheckItemStatus[] = ['good', 'good', 'good', 'good', 'normal', 'good', 'good', 'normal', 'good', 'good', 'good', 'good', 'good', 'normal', 'good', 'good', 'bad', 'good', 'good', 'good', 'good', 'good', 'good']
      items.forEach((item, i) => { item.status = statuses[i] ?? 'good' })
      items[16].note = '에어컨 냉매 부족 — 보충 필요'
      return items
    })(),
    overall_comment: '전반적으로 양호한 상태. 에어컨 냉매 보충 필요.',
    grade: 'B',
    ai_comment: null,
    photos: [],
    created_at: '2026-02-09T10:00:00Z',
    updated_at: '2026-02-10T16:00:00Z',
  },
  {
    id: 'ins-2',
    agent_id: 'agent-1',
    property_id: 'p3',
    property_title: '힐스테이트 클래시안 201동 802호',
    address: '서울 서초구 반포동 123-4',
    status: 'scheduled',
    scheduled_date: '2026-02-20',
    completed_date: null,
    checklist: createChecklistItems(),
    overall_comment: null,
    grade: null,
    ai_comment: null,
    photos: [],
    created_at: '2026-02-17T09:00:00Z',
    updated_at: '2026-02-17T09:00:00Z',
  },
  {
    id: 'ins-3',
    agent_id: 'agent-1',
    property_id: 'p5',
    property_title: '반포 자이 아파트 103동 2201호',
    address: '서울 서초구 반포동 45-2',
    status: 'in_progress',
    scheduled_date: '2026-02-18',
    completed_date: null,
    checklist: (() => {
      const items = createChecklistItems()
      items[0].status = 'good'
      items[1].status = 'good'
      items[2].status = 'normal'
      items[2].note = '엘리베이터 다소 노후'
      return items
    })(),
    overall_comment: null,
    grade: null,
    ai_comment: null,
    photos: [],
    created_at: '2026-02-18T08:00:00Z',
    updated_at: '2026-02-18T10:00:00Z',
  },
]

export async function fetchInspections(filter?: InspectionStatus | 'all'): Promise<Inspection[]> {
  let result = [..._inspections]
  if (filter && filter !== 'all') {
    result = result.filter((i) => i.status === filter)
  }
  result.sort((a, b) => b.created_at.localeCompare(a.created_at))
  return result
}

export async function fetchInspectionById(id: string): Promise<Inspection | null> {
  return _inspections.find((i) => i.id === id) ?? null
}

export async function createInspection(data: {
  property_id: string | null
  property_title: string
  address: string
  scheduled_date: string | null
}): Promise<Inspection> {
  const now = new Date().toISOString()
  const inspection: Inspection = {
    id: `ins-${Date.now()}`,
    agent_id: 'agent-1',
    property_id: data.property_id,
    property_title: data.property_title,
    address: data.address,
    status: data.scheduled_date ? 'scheduled' : 'in_progress',
    scheduled_date: data.scheduled_date,
    completed_date: null,
    checklist: createChecklistItems(),
    overall_comment: null,
    grade: null,
    ai_comment: null,
    photos: [],
    created_at: now,
    updated_at: now,
  }
  _inspections.unshift(inspection)
  return inspection
}

export async function updateInspection(id: string, data: Partial<Inspection>): Promise<Inspection | null> {
  const idx = _inspections.findIndex((i) => i.id === id)
  if (idx === -1) return null
  _inspections[idx] = { ..._inspections[idx], ...data, updated_at: new Date().toISOString() }
  return _inspections[idx]
}

export async function completeInspection(id: string, checklist: InspectionCheckItem[], overallComment: string): Promise<Inspection | null> {
  const idx = _inspections.findIndex((i) => i.id === id)
  if (idx === -1) return null
  const grade = calculateGrade(checklist)
  _inspections[idx] = {
    ..._inspections[idx],
    status: 'completed',
    completed_date: new Date().toISOString().slice(0, 10),
    checklist,
    overall_comment: overallComment,
    grade,
    updated_at: new Date().toISOString(),
  }
  return _inspections[idx]
}

export async function saveAIComment(id: string, comment: string): Promise<void> {
  const idx = _inspections.findIndex((i) => i.id === id)
  if (idx !== -1) {
    _inspections[idx] = { ..._inspections[idx], ai_comment: comment, updated_at: new Date().toISOString() }
  }
}

import { useState, useRef, useEffect } from 'react'
import { generateContent, saveGenerationLog } from '@/api/gemini'
import { createInquiry } from '@/api/inquiries'
import { fetchProperties, fetchCategories } from '@/api/properties'
import { useTenantStore } from '@/stores/tenantStore'
import type { InquiryType, Property, PropertyCategory } from '@/types/database'
import { formatNumber } from '@/utils/format'
import toast from 'react-hot-toast'

type Message = {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

const txLabel: Record<string, string> = { sale: '매매', jeonse: '전세', monthly: '월세' }

function formatPropertyPrice(p: Property): string {
  if (p.transaction_type === 'sale' && p.sale_price) return `매매 ${formatNumber(p.sale_price)}만원`
  if (p.transaction_type === 'jeonse' && p.deposit) return `전세 ${formatNumber(p.deposit)}만원`
  if (p.transaction_type === 'monthly') {
    const dep = p.deposit ? `${formatNumber(p.deposit)}` : '0'
    const rent = p.monthly_rent ? `${formatNumber(p.monthly_rent)}` : '0'
    return `월세 ${dep}/${rent}만원`
  }
  return ''
}

function buildPropertySummary(p: Property, catMap: Record<string, string>): string {
  const parts: string[] = []
  parts.push(`[${p.title}]`)
  const cat = p.category_id ? catMap[p.category_id] : ''
  if (cat) parts.push(`유형: ${cat}`)
  parts.push(`거래: ${txLabel[p.transaction_type] ?? p.transaction_type}`)
  parts.push(`가격: ${formatPropertyPrice(p)}`)
  parts.push(`위치: ${p.address}`)
  if (p.exclusive_area_m2) parts.push(`전용면적: ${p.exclusive_area_m2}㎡`)
  if (p.rooms) parts.push(`방 ${p.rooms}개`)
  if (p.bathrooms) parts.push(`욕실 ${p.bathrooms}개`)
  if (p.floor) parts.push(`${p.floor}층`)
  if (p.direction) parts.push(`${p.direction}`)
  if (p.move_in_date) parts.push(`입주: ${p.move_in_date}`)
  if (p.description) parts.push(`설명: ${p.description.slice(0, 100)}`)
  return parts.join(' | ')
}

function buildSystemPrompt(
  officeName: string,
  representative: string,
  address: string,
  phone: string,
  specialties: string[] | null,
  description: string | null,
  properties: Property[],
  catMap: Record<string, string>,
): string {
  const propertiesList = properties.length > 0
    ? properties.map((p, i) => `${i + 1}. ${buildPropertySummary(p, catMap)}`).join('\n')
    : '현재 등록된 매물이 없습니다.'

  return `당신은 "${officeName}" 공인중개사 사무소의 AI 상담 어시스턴트입니다.

사무소 정보:
- 상호: ${officeName}
- 대표: ${representative}
- 주소: ${address}
- 전화: ${phone}
${specialties?.length ? `- 전문 분야: ${specialties.join(', ')}` : ''}
${description ? `- 소개: ${description}` : ''}

현재 등록된 매물 (총 ${properties.length}건):
${propertiesList}

역할:
- 고객이 매물을 물으면 위 매물 목록에서 조건에 맞는 매물을 찾아 안내
- 매물이 없으면 "현재 조건에 맞는 매물이 없지만, 문의를 남겨주시면 새 매물 등록 시 연락드리겠습니다" 안내
- 계약 절차 안내 (매매/전세/월세 절차, 필요 서류, 비용)
- 부동산 법률 기본 안내 (주택임대차보호법, 전입신고, 확정일자 등)
- 중개보수 안내 (거래금액별 요율표 기반)

규칙:
- 항상 정중하고 친절한 톤으로 응대
- 매물 추천 시 가격, 면적, 위치 등 핵심 정보 포함
- 법률 관련 답변 시 "참고용이며 정확한 상담은 전문가에게" 안내
- 더 자세한 상담이 필요하면 전화(${phone}) 또는 문의 접수 안내
- 답변은 간결하게 (3-5문장)
- 한국어로 응답
- 매물 목록에 없는 매물을 지어내지 말 것`
}

const QUICK_QUESTIONS = [
  '현재 매물 보여주세요',
  '매매 절차가 궁금해요',
  '전세 계약 시 주의사항은?',
  '중개보수는 얼마인가요?',
]

export function AIChatbot({ onClose }: { onClose: () => void }) {
  const tenant = useTenantStore((s) => s.tenant)
  const agentId = useTenantStore((s) => s.agentId)
  const officeName = tenant?.office_name ?? '부동산'

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `안녕하세요! ${officeName} AI 상담 어시스턴트입니다.\n\n매물 문의, 계약 절차, 법률 안내 등 도움이 필요하시면 편하게 말씀해주세요.`,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showInquiryForm, setShowInquiryForm] = useState(false)
  const [inquiryForm, setInquiryForm] = useState({ name: '', phone: '', content: '' })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load properties & categories once for context
  const systemPromptRef = useRef<string>('')
  const [contextReady, setContextReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function loadContext() {
      try {
        const [{ data: properties }, categories] = await Promise.all([
          fetchProperties({}, 'newest', 1, 50, agentId ?? undefined),
          fetchCategories(agentId ?? undefined),
        ])
        if (cancelled) return

        const catMap: Record<string, string> = {}
        categories.forEach((c: PropertyCategory) => { catMap[c.id] = c.name })

        systemPromptRef.current = buildSystemPrompt(
          tenant?.office_name ?? '부동산',
          tenant?.representative ?? '',
          tenant?.address ?? '',
          tenant?.phone ?? '',
          tenant?.specialties ?? null,
          tenant?.description ?? null,
          properties,
          catMap,
        )
      } catch {
        // Fallback: basic prompt without property data
        systemPromptRef.current = buildSystemPrompt(
          tenant?.office_name ?? '부동산',
          tenant?.representative ?? '',
          tenant?.address ?? '',
          tenant?.phone ?? '',
          tenant?.specialties ?? null,
          tenant?.description ?? null,
          [],
          {},
        )
      }
      if (!cancelled) setContextReady(true)
    }
    loadContext()
    return () => { cancelled = true }
  }, [agentId, tenant])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const conversationContext = messages
        .filter((m) => m.role !== 'system')
        .slice(-6)
        .map((m) => `${m.role === 'user' ? '고객' : '상담원'}: ${m.content}`)
        .join('\n')

      const prompt = `이전 대화:\n${conversationContext}\n\n고객: ${text}\n\n위 대화 맥락을 고려하여 답변해주세요.`

      const response = await generateContent(prompt, systemPromptRef.current)

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMsg])

      await saveGenerationLog({
        type: 'chatbot',
        input_data: { user_message: text },
        output_text: response,
      })
    } catch {
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '죄송합니다. 일시적인 오류가 발생했습니다.\n\n직접 문의를 남겨주시면 담당 중개사가 연락드리겠습니다.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMsg])
      setShowInquiryForm(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInquirySubmit = async () => {
    if (!inquiryForm.name || !inquiryForm.phone) {
      toast.error('이름과 연락처를 입력해주세요.')
      return
    }
    const inquiry = await createInquiry({
      name: inquiryForm.name,
      phone: inquiryForm.phone,
      inquiry_type: 'other' as InquiryType,
      content: inquiryForm.content || messages.filter((m) => m.role === 'user').map((m) => m.content).join('\n'),
      agent_id: agentId ?? undefined,
    })
    toast.success(`문의가 접수되었습니다. 접수번호: ${inquiry.inquiry_number}`)
    setShowInquiryForm(false)
    setInquiryForm({ name: '', phone: '', content: '' })

    const systemMsg: Message = {
      id: `system-${Date.now()}`,
      role: 'assistant',
      content: `문의가 접수되었습니다. (접수번호: ${inquiry.inquiry_number})\n\n영업시간 내에 담당 중개사가 연락드리겠습니다.`,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, systemMsg])
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 flex h-[500px] w-[360px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200 lg:bottom-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-primary-600 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <div>
            <p className="text-sm font-semibold text-white">AI 상담</p>
            <p className="text-[10px] text-primary-200">{officeName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInquiryForm(true)}
            className="rounded-lg bg-primary-500 px-2 py-1 text-[10px] font-medium text-white hover:bg-primary-400"
          >
            문의 접수
          </button>
          <button onClick={onClose} className="text-white hover:text-primary-200">
            ✕
          </button>
        </div>
      </div>

      {/* Context loading indicator */}
      {!contextReady && (
        <div className="bg-primary-50 px-3 py-1.5 text-center text-[10px] text-primary-600">
          매물 정보 불러오는 중...
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'rounded-br-md bg-primary-600 text-white'
                  : 'rounded-bl-md bg-gray-100 text-gray-700'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <p className={`mt-1 text-[10px] ${msg.role === 'user' ? 'text-primary-200' : 'text-gray-400'}`}>
                {msg.timestamp.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-gray-100 px-4 py-3">
              <div className="flex gap-1">
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0ms' }} />
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '150ms' }} />
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Inquiry Form Overlay */}
      {showInquiryForm && (
        <div className="border-t border-gray-200 bg-gray-50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-600">문의 접수</p>
            <button onClick={() => setShowInquiryForm(false)} className="text-xs text-gray-400">닫기</button>
          </div>
          <div className="space-y-2">
            <input
              type="text"
              value={inquiryForm.name}
              onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
              placeholder="이름 *"
              className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs"
            />
            <input
              type="tel"
              value={inquiryForm.phone}
              onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
              placeholder="연락처 *"
              className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs"
            />
            <textarea
              value={inquiryForm.content}
              onChange={(e) => setInquiryForm({ ...inquiryForm, content: e.target.value })}
              placeholder="문의 내용 (선택)"
              rows={2}
              className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs"
            />
            <button
              onClick={handleInquirySubmit}
              className="w-full rounded-lg bg-primary-600 py-2 text-xs font-medium text-white hover:bg-primary-700"
            >
              문의 접수하기
            </button>
          </div>
        </div>
      )}

      {/* Quick Questions */}
      {messages.length <= 1 && (
        <div className="border-t border-gray-100 px-3 py-2">
          <p className="mb-1.5 text-[10px] font-medium text-gray-400">자주 묻는 질문</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                disabled={!contextReady}
                className="rounded-full bg-gray-100 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-200 disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
            placeholder="메시지를 입력하세요..."
            disabled={isLoading}
            className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

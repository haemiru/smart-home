import { useState, useRef, useEffect } from 'react'
import { generateContent, saveGenerationLog } from '@/api/gemini'
import { createInquiry } from '@/api/inquiries'
import type { InquiryType } from '@/types/database'
import toast from 'react-hot-toast'

type Message = {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

const SYSTEM_PROMPT = `당신은 "스마트부동산" 공인중개사 사무소의 AI 상담 어시스턴트입니다.

사무소 정보:
- 상호: 스마트부동산
- 대표: 홍길동
- 주소: 서울 강남구 역삼동 123-45
- 전화: 02-1234-5678
- 영업시간: 평일 09:00-18:00, 토요일 10:00-14:00 (일/공휴일 휴무)
- 전문 분야: 강남/서초/송파 아파트, 오피스텔, 상가

역할:
- 매물 FAQ 자동 응답 (가격, 면적, 위치, 교통 등)
- 계약 절차 안내 (매매/전세/월세 절차, 필요 서류, 비용)
- 부동산 법률 기본 안내 (주택임대차보호법, 전입신고, 확정일자 등)
- 영업시간 외 문의 접수 안내

규칙:
- 항상 정중하고 친절한 톤으로 응대
- 법률 관련 답변 시 "참고용이며 정확한 상담은 전문가에게" 안내
- 구체적인 매물 추천은 "담당 중개사 연결" 안내
- 답변은 간결하게 (3-5문장)
- 한국어로 응답`

const QUICK_QUESTIONS = [
  '매매 절차가 궁금해요',
  '전세 계약 시 주의사항은?',
  '중개보수는 얼마인가요?',
  '전입신고 방법 알려주세요',
]

export function AIChatbot({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '안녕하세요! 스마트부동산 AI 상담 어시스턴트입니다.\n\n매물 문의, 계약 절차, 법률 안내 등 도움이 필요하시면 편하게 말씀해주세요.',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showInquiryForm, setShowInquiryForm] = useState(false)
  const [inquiryForm, setInquiryForm] = useState({ name: '', phone: '', content: '' })
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
      // Build conversation context
      const conversationContext = messages
        .filter((m) => m.role !== 'system')
        .slice(-6) // Last 6 messages for context
        .map((m) => `${m.role === 'user' ? '고객' : '상담원'}: ${m.content}`)
        .join('\n')

      const prompt = `이전 대화:\n${conversationContext}\n\n고객: ${text}\n\n위 대화 맥락을 고려하여 답변해주세요.`

      const response = await generateContent(prompt, SYSTEM_PROMPT)

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
            <p className="text-[10px] text-primary-200">스마트부동산</p>
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
                className="rounded-full bg-gray-100 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-200"
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

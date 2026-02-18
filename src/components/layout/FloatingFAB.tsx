import { useState, type FormEvent } from 'react'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { AIChatbot } from '@/components/layout/AIChatbot'
import { createInquiry } from '@/api/inquiries'
import type { InquiryType } from '@/types/database'
import toast from 'react-hot-toast'

// 실제로는 agent_feature_settings에서 가져옴
const fabConfig = {
  phone: { enabled: true, number: '02-1234-5678' },
  kakao: { enabled: true, url: 'https://pf.kakao.com/_example' },
  naver: { enabled: true, url: 'https://booking.naver.com/example' },
  inquiry: { enabled: true },
}

export function FloatingFAB() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isInquiryOpen, setIsInquiryOpen] = useState(false)
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)

  // Hide FAB when chatbot is open
  if (isChatbotOpen) {
    return <AIChatbot onClose={() => setIsChatbotOpen(false)} />
  }

  return (
    <>
      {/* FAB Group */}
      <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-2 lg:bottom-6">
        {/* Expanded buttons */}
        {isExpanded && (
          <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2">
            {/* AI Chatbot */}
            <button
              onClick={() => {
                setIsChatbotOpen(true)
                setIsExpanded(false)
              }}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-transform hover:scale-105"
            >
              <span>🤖</span>
              <span>AI 상담</span>
            </button>
            {fabConfig.phone.enabled && (
              <a
                href={`tel:${fabConfig.phone.number}`}
                className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-lg ring-1 ring-gray-200 transition-transform hover:scale-105"
              >
                <span>📞</span>
                <span className="hidden sm:inline">{fabConfig.phone.number}</span>
                <span className="sm:hidden">전화상담</span>
              </a>
            )}
            {fabConfig.kakao.enabled && (
              <a
                href={fabConfig.kakao.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full bg-[#FEE500] px-4 py-2.5 text-sm font-medium text-[#3C1E1E] shadow-lg transition-transform hover:scale-105"
              >
                <span>💬</span>
                <span>카카오상담</span>
              </a>
            )}
            {fabConfig.naver.enabled && (
              <a
                href={fabConfig.naver.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full bg-[#03C75A] px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-transform hover:scale-105"
              >
                <span>📅</span>
                <span>네이버예약</span>
              </a>
            )}
            {fabConfig.inquiry.enabled && (
              <button
                onClick={() => {
                  setIsInquiryOpen(true)
                  setIsExpanded(false)
                }}
                className="flex items-center gap-2 rounded-full bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-transform hover:scale-105"
              >
                <span>📩</span>
                <span>문의하기</span>
              </button>
            )}
          </div>
        )}

        {/* Main FAB */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all ${
            isExpanded
              ? 'bg-gray-600 rotate-45'
              : 'bg-primary-600 hover:bg-primary-700'
          }`}
        >
          <span className="text-2xl text-white">{isExpanded ? '✕' : '💬'}</span>
        </button>
      </div>

      {/* Inquiry Modal */}
      <InquiryModal isOpen={isInquiryOpen} onClose={() => setIsInquiryOpen(false)} />
    </>
  )
}

function InquiryModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    inquiryType: '',
    region: '',
    content: '',
    privacy: false,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.privacy) {
      toast.error('개인정보 수집 및 이용에 동의해주세요.')
      return
    }
    setIsSubmitting(true)
    const inquiryTypeMap: Record<string, InquiryType> = { buy: 'property', jeonse: 'property', monthly: 'property', sell: 'other', other: 'other' }
    const inquiry = await createInquiry({
      name: form.name,
      phone: form.phone,
      email: form.email || undefined,
      inquiry_type: inquiryTypeMap[form.inquiryType] ?? 'other',
      content: form.content + (form.region ? `\n\n관심지역: ${form.region}` : ''),
    })
    setIsSubmitting(false)
    toast.success(`문의가 접수되었습니다. 접수번호: ${inquiry.inquiry_number}`)
    setForm({ name: '', phone: '', email: '', inquiryType: '', region: '', content: '', privacy: false })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="문의하기" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="inquiry-name"
            label="이름 *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            id="inquiry-phone"
            label="연락처 *"
            type="tel"
            placeholder="010-0000-0000"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />
        </div>

        <Input
          id="inquiry-email"
          label="이메일"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">문의유형</label>
            <select
              value={form.inquiryType}
              onChange={(e) => setForm({ ...form, inquiryType: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">선택하세요</option>
              <option value="buy">매매 상담</option>
              <option value="jeonse">전세 상담</option>
              <option value="monthly">월세 상담</option>
              <option value="sell">매물 등록</option>
              <option value="other">기타</option>
            </select>
          </div>
          <Input
            id="inquiry-region"
            label="관심지역"
            placeholder="예: 강남구, 판교"
            value={form.region}
            onChange={(e) => setForm({ ...form, region: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">문의내용 *</label>
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={4}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="문의하실 내용을 입력해주세요"
          />
        </div>

        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={form.privacy}
            onChange={(e) => setForm({ ...form, privacy: e.target.checked })}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-xs text-gray-500">
            개인정보 수집 및 이용에 동의합니다. (이름, 연락처, 이메일은 상담 목적으로만 사용됩니다)
          </span>
        </label>

        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          문의 접수하기
        </Button>
      </form>
    </Modal>
  )
}

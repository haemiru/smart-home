import { useState, useEffect, type FormEvent } from 'react'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { AIChatbot } from '@/components/layout/AIChatbot'
import { createInquiry } from '@/api/inquiries'
import { fetchPublicFloatingSettings, type FloatingSettings } from '@/api/settings'
import { useTenantStore } from '@/stores/tenantStore'
import type { InquiryType } from '@/types/database'
import toast from 'react-hot-toast'

const defaultFabConfig = {
  phone: { enabled: true, number: '02-1234-5678' },
  kakao: { enabled: true, url: 'https://pf.kakao.com/_example' },
  naver: { enabled: true, url: 'https://booking.naver.com/example' },
  inquiry: { enabled: true },
}

function toFabConfig(settings: FloatingSettings) {
  const btn = (key: string) => settings.buttons.find((b) => b.key === key)
  return {
    phone: { enabled: btn('phone')?.is_enabled ?? true, number: btn('phone')?.phone ?? '02-1234-5678' },
    kakao: { enabled: btn('kakao')?.is_enabled ?? true, url: btn('kakao')?.url ?? '' },
    naver: { enabled: btn('naver')?.is_enabled ?? false, url: btn('naver')?.url ?? '' },
    inquiry: { enabled: btn('inquiry')?.is_enabled ?? true },
  }
}

export function FloatingFAB() {
  const [isInquiryOpen, setIsInquiryOpen] = useState(false)
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)
  const agentId = useTenantStore((s) => s.agentId)
  const [fabConfig, setFabConfig] = useState(defaultFabConfig)

  useEffect(() => {
    fetchPublicFloatingSettings(agentId ?? undefined)
      .then((settings) => setFabConfig(toFabConfig(settings)))
      .catch(() => {})
  }, [agentId])

  // Hide FAB when chatbot is open
  if (isChatbotOpen) {
    return <AIChatbot onClose={() => setIsChatbotOpen(false)} />
  }

  return (
    <>
      {/* FAB Group — always expanded, uniform width */}
      <div className="fixed bottom-20 right-4 z-50 flex w-40 flex-col gap-2 lg:bottom-6">
        <button
          onClick={() => setIsChatbotOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-transform hover:scale-105"
        >
          <span>🤖</span>
          <span>AI 상담</span>
        </button>
        {fabConfig.phone.enabled && (
          <a
            href={`tel:${fabConfig.phone.number}`}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-lg ring-1 ring-gray-200 transition-transform hover:scale-105"
          >
            <span>📞</span>
            <span>전화상담</span>
          </a>
        )}
        {fabConfig.kakao.enabled && (
          <a
            href={fabConfig.kakao.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#FEE500] px-4 py-2.5 text-sm font-medium text-[#3C1E1E] shadow-lg transition-transform hover:scale-105"
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
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#03C75A] px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-transform hover:scale-105"
          >
            <span>📅</span>
            <span>네이버예약</span>
          </a>
        )}
        {fabConfig.inquiry.enabled && (
          <button
            onClick={() => setIsInquiryOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-transform hover:scale-105"
          >
            <span>📩</span>
            <span>문의하기</span>
          </button>
        )}
      </div>

      {/* Inquiry Modal */}
      <InquiryModal isOpen={isInquiryOpen} onClose={() => setIsInquiryOpen(false)} agentId={agentId} />
    </>
  )
}

function InquiryModal({ isOpen, onClose, agentId }: { isOpen: boolean; onClose: () => void; agentId: string | null }) {
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
    try {
      const inquiryTypeMap: Record<string, InquiryType> = { buy: 'property', jeonse: 'property', monthly: 'property', sell: 'other', other: 'other' }
      const inquiry = await createInquiry({
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        inquiry_type: inquiryTypeMap[form.inquiryType] ?? 'other',
        content: form.content + (form.region ? `\n\n관심지역: ${form.region}` : ''),
        agent_id: agentId ?? undefined,
      })
      toast.success(`문의가 접수되었습니다. 접수번호: ${inquiry.inquiry_number}`)
      setForm({ name: '', phone: '', email: '', inquiryType: '', region: '', content: '', privacy: false })
      onClose()
    } catch (err) {
      console.error('[InquiryModal] createInquiry failed:', err)
      toast.error('문의 접수에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
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

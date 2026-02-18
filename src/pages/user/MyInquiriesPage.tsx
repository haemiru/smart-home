import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { Inquiry, InquiryReply } from '@/types/database'
import { fetchMyInquiries, fetchMyInquiryReplies } from '@/api/inquiries'
import { inquiryStatusLabel, inquiryStatusColor, inquiryTypeLabel, formatDateTime, formatRelativeTime } from '@/utils/format'

export function MyInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [replies, setReplies] = useState<Record<string, InquiryReply[]>>({})

  useEffect(() => {
    let cancelled = false
    fetchMyInquiries().then((data) => {
      if (cancelled) return
      setInquiries(data)
      setIsLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  const handleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
      return
    }
    setExpandedId(id)
    if (!replies[id]) {
      const data = await fetchMyInquiryReplies(id)
      setReplies((prev) => ({ ...prev, [id]: data }))
    }
  }

  if (isLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">내 문의 내역</h1>
        <Link to="/" className="text-sm text-primary-600 hover:underline">홈으로</Link>
      </div>

      {inquiries.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-gray-400">문의 내역이 없습니다.</p>
          <Link to="/search" className="mt-3 inline-block text-sm text-primary-600 hover:underline">매물 검색하기</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {inquiries.map((inq) => (
            <div key={inq.id} className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
              <button
                onClick={() => handleExpand(inq.id)}
                className="flex w-full items-center gap-3 p-4 text-left"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${inquiryStatusColor[inq.status]}`}>
                      {inquiryStatusLabel[inq.status]}
                    </span>
                    <span className="text-xs text-gray-400">{inquiryTypeLabel[inq.inquiry_type]}</span>
                    <span className="text-xs text-gray-400">{inq.inquiry_number}</span>
                  </div>
                  <p className="mt-1 truncate text-sm font-medium text-gray-800">{inq.content}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{formatRelativeTime(inq.created_at)}</p>
                </div>
                <svg className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${expandedId === inq.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expandedId === inq.id && (
                <div className="border-t border-gray-100 px-4 pb-4 pt-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex gap-2">
                      <span className="w-20 shrink-0 text-gray-400">접수일시</span>
                      <span>{formatDateTime(inq.created_at)}</span>
                    </div>
                    {inq.preferred_visit_date && (
                      <div className="flex gap-2">
                        <span className="w-20 shrink-0 text-gray-400">희망방문일</span>
                        <span>{inq.preferred_visit_date}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <span className="w-20 shrink-0 text-gray-400">문의내용</span>
                      <span className="whitespace-pre-wrap text-gray-700">{inq.content}</span>
                    </div>
                  </div>

                  {/* Replies */}
                  {replies[inq.id] && replies[inq.id].length > 0 && (
                    <div className="mt-4 space-y-3">
                      <p className="text-xs font-semibold text-gray-500">답변</p>
                      {replies[inq.id].map((reply) => (
                        <div key={reply.id} className="rounded-lg bg-primary-50 p-3">
                          <p className="whitespace-pre-wrap text-sm text-gray-700">{reply.content}</p>
                          <p className="mt-2 text-xs text-gray-400">{formatDateTime(reply.created_at)}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {replies[inq.id] && replies[inq.id].length === 0 && inq.status !== 'answered' && inq.status !== 'closed' && (
                    <p className="mt-3 text-xs text-gray-400">아직 답변이 없습니다. 빠른 시일 내 답변드리겠습니다.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

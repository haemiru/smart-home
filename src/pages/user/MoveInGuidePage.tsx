import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import type { MoveInGuide } from '@/types/database'
import { fetchMoveInGuide } from '@/api/moveInGuide'

export function MoveInGuidePage() {
  const { contractId } = useParams()
  const [guide, setGuide] = useState<MoveInGuide | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!contractId) return
    let cancelled = false
    fetchMoveInGuide(contractId).then((g) => {
      if (!cancelled) { setGuide(g); setIsLoading(false) }
    })
    return () => { cancelled = true }
  }, [contractId])

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    )
  }

  if (!guide) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-3xl">📋</p>
        <p className="mt-3 text-gray-500">전입신고 가이드가 아직 생성되지 않았습니다.</p>
        <p className="mt-1 text-sm text-gray-400">담당 중개사에게 문의해주세요.</p>
        <Link to="/my/contracts" className="mt-4 inline-block text-sm text-primary-600 hover:underline">
          내 계약으로 돌아가기
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
        <Link to="/my/contracts" className="hover:text-gray-600">내 계약</Link>
        <span>/</span>
        <span className="text-gray-600">전입신고 가이드</span>
      </div>

      {/* Header */}
      <div className="mb-6 rounded-xl bg-gradient-to-r from-primary-500 to-primary-700 p-6 text-white">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🏠</span>
          <div>
            <h1 className="text-xl font-bold">전입신고 가이드</h1>
            <p className="mt-0.5 text-sm text-primary-100">{guide.address}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700">
          {guide.content}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-4 rounded-lg bg-amber-50 p-4">
        <p className="text-xs text-amber-700">
          본 가이드는 AI가 생성한 참고 자료이며, 실제 절차는 관할 주민센터에 확인하시기 바랍니다.
          법률 상담이 필요한 경우 전문 법률가에게 자문을 받으시기를 권장합니다.
        </p>
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-3">
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200"
        >
          인쇄하기
        </button>
        <Link
          to="/my/contracts"
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          내 계약으로 돌아가기
        </Link>
      </div>
    </div>
  )
}

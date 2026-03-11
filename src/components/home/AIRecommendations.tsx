import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useHomeFilterStore } from '@/stores/homeFilterStore'
import { useTenantStore } from '@/stores/tenantStore'
import { fetchProperties } from '@/api/properties'
import type { Property } from '@/types/database'
import { PropertyCard } from './PropertyCard'

export function AIRecommendations() {
  const { session } = useAuthStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const agentId = useTenantStore((s) => s.agentId)
  const { selectedCategory } = useHomeFilterStore()
  const [recommended, setRecommended] = useState<Property[]>([])

  useEffect(() => {
    if (!session) return
    let cancelled = false
    fetchProperties({
      categoryId: selectedCategory || undefined,
    }, 'popular', 1, 6, agentId ?? undefined)
      .then(({ data }) => {
        if (!cancelled) setRecommended(data)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [session, agentId, selectedCategory])

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const amount = 300
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    })
  }

  if (!session) {
    return (
      <section>
        <h2 className="mb-4 text-lg font-bold text-gray-900">AI 추천 매물</h2>
        <div className="rounded-xl bg-gradient-to-r from-primary-50 to-blue-50 p-8 text-center">
          <span className="text-4xl">🤖</span>
          <p className="mt-3 font-medium text-gray-800">
            로그인하면 AI가 맞춤 매물을 추천해드려요
          </p>
          <p className="mt-1 text-sm text-gray-500">
            검색 패턴을 분석하여 최적의 매물을 찾아드립니다
          </p>
          <Link
            to="/auth/login"
            className="mt-4 inline-block rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            로그인하기
          </Link>
        </div>
      </section>
    )
  }

  if (recommended.length === 0) return null

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">AI 추천 매물</h2>
          <p className="text-sm text-gray-500">회원님의 검색 패턴을 분석하여 추천합니다</p>
        </div>
        <div className="hidden gap-1 sm:flex">
          <button
            onClick={() => scroll('left')}
            className="rounded-full border border-gray-200 p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => scroll('right')}
            className="rounded-full border border-gray-200 p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="scrollbar-hide -mx-4 flex gap-4 overflow-x-auto px-4 snap-x snap-mandatory"
      >
        {recommended.map((p) => (
          <div key={p.id} className="w-64 shrink-0 snap-start sm:w-72">
            <PropertyCard property={p} />
          </div>
        ))}
      </div>
    </section>
  )
}

import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHomeFilterStore } from '@/stores/homeFilterStore'
import { useCategories } from '@/hooks/useCategories'
import { fetchSearchSettings, type QuickSearchCard, defaultSearchSettings } from '@/api/settings'
import { getTagConditionKeyMap } from '@/utils/conditionResolver'
import { fetchProperties } from '@/api/properties'
import type { Property } from '@/types/database'
import { useTenantStore } from '@/stores/tenantStore'

const currentYear = new Date().getFullYear()

const CARD_GAP = 12 // gap-3
const AUTO_SCROLL_MS = 3000

function getVisibleCount(): number {
  if (typeof window === 'undefined') return 5
  if (window.innerWidth < 640) return 2
  if (window.innerWidth < 1024) return 3
  return 5
}

const tagKeyMap = getTagConditionKeyMap()

/** Count properties matching a quick-search card's conditions */
function countByCondition(conditions: Record<string, unknown>, props: Property[], cardLabel?: string, isCustom?: boolean): number {
  // 커스텀 카드는 라벨 자체가 태그
  if (isCustom && cardLabel) {
    return props.filter((p) => p.tags?.includes(cardLabel)).length
  }

  return props.filter((p) => {
    for (const [key, val] of Object.entries(conditions)) {
      switch (key) {
        case 'built_within_years':
          if (!p.built_year || currentYear - parseInt(p.built_year) > (val as number)) return false
          break
        case 'pets_allowed':
          if (!p.pets_allowed) return false
          break
        case 'parking_per_unit':
          if (!p.parking_per_unit || p.parking_per_unit < (val as number)) return false
          break
        case 'max_maintenance':
          if (!p.maintenance_fee || p.maintenance_fee > (val as number)) return false
          break
        case 'is_top_floor':
          if (!p.floor || !p.total_floors || p.floor !== p.total_floors) return false
          break
        case 'direction':
          if (p.direction !== val) return false
          break
        case 'has_elevator':
          if (!p.has_elevator) return false
          break
        case 'is_urgent':
          if (!p.is_urgent) return false
          break
        case 'move_in_immediate':
          if (!p.move_in_date?.includes('즉시')) return false
          break
        default: {
          // 태그 매핑: condition key → 한글 라벨로 변환 후 tags 배열에서 검색
          const tagLabel = tagKeyMap[key]
          if (tagLabel) {
            if (!p.tags?.includes(tagLabel)) return false
          } else {
            // 매핑에 없으면 key 자체를 태그에서 검색
            if (!p.tags?.some(t => t.includes(key))) return false
          }
        }
      }
    }
    return true
  }).length
}

export function QuickSearchGrid() {
  const navigate = useNavigate()
  const { selectedCategory } = useHomeFilterStore()
  const { categories } = useCategories()
  const agentId = useTenantStore((s) => s.agentId)
  const [cards, setCards] = useState<QuickSearchCard[]>([])
  const [activeProperties, setActiveProperties] = useState<Property[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [cardWidth, setCardWidth] = useState(0)
  const autoScrollTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const isPaused = useRef(false)

  useEffect(() => {
    fetchSearchSettings()
      .then((s) => setCards(s.quick_cards.filter((c) => c.is_enabled).sort((a, b) => a.sort_order - b.sort_order)))
      .catch(() => setCards(defaultSearchSettings.quick_cards.filter((c) => c.is_enabled).sort((a, b) => a.sort_order - b.sort_order)))
    fetchProperties({ status: 'active' }, 'newest', 1, 200, agentId ?? undefined)
      .then(({ data }) => setActiveProperties(data))
      .catch(() => {})
  }, [agentId])

  const categoryName = useMemo(() => {
    const cat = categories.find((c) => c.id === selectedCategory)
    return cat?.name ?? ''
  }, [categories, selectedCategory])

  const visibleCards = useMemo(() => {
    return categoryName
      ? cards.filter((c) => !c.categories || c.categories.includes(categoryName))
      : cards
  }, [categoryName, cards])

  const countMap = useMemo(() => {
    const map: Record<string, number> = {}
    for (const card of visibleCards) {
      map[card.key] = countByCondition(card.conditions, activeProperties, card.label, card.is_custom)
    }
    return map
  }, [visibleCards, activeProperties])

  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }, [])

  // Card width: fit exactly N cards in the visible container
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const update = () => {
      const count = getVisibleCount()
      setCardWidth(Math.floor((el.clientWidth - (count - 1) * CARD_GAP) / count))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [visibleCards.length])

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', checkScroll, { passive: true })
    window.addEventListener('resize', checkScroll)
    return () => {
      el.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [visibleCards, checkScroll])

  // Auto-scroll: 2 cards at a time
  useEffect(() => {
    const el = scrollRef.current
    if (!el || !cardWidth || visibleCards.length === 0) return

    autoScrollTimer.current = setInterval(() => {
      if (isPaused.current) return
      const container = scrollRef.current
      if (!container) return
      const maxScroll = container.scrollWidth - container.clientWidth
      if (maxScroll <= 0) return
      if (container.scrollLeft >= maxScroll - 1) {
        container.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        container.scrollBy({ left: 2 * (cardWidth + CARD_GAP), behavior: 'smooth' })
      }
    }, AUTO_SCROLL_MS)

    return () => {
      if (autoScrollTimer.current) clearInterval(autoScrollTimer.current)
    }
  }, [cardWidth, visibleCards])

  if (visibleCards.length === 0) return null

  const scrollBy2 = (dir: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const amount = 2 * (cardWidth + CARD_GAP)
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  const handleMouseEnter = () => { isPaused.current = true }
  const handleMouseLeave = () => { isPaused.current = false }

  const handleClick = (card: QuickSearchCard) => {
    navigate(`/search?quick=${card.key}`)
  }

  return (
    <section>
      <h2 className="mb-4 text-lg font-bold text-gray-900">원클릭 조건별 검색</h2>
      <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scrollBy2('left')}
            className="absolute -left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-gray-200 transition-all hover:bg-gray-50"
          >
            <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Scrollable cards */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {visibleCards.map((card) => (
            <button
              key={card.key}
              onClick={() => handleClick(card)}
              className="group relative flex shrink-0 flex-col rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              style={{ width: cardWidth || 192, scrollSnapAlign: 'start' }}
            >
              {/* Count badge */}
              <span className="absolute right-3 top-3 flex h-7 min-w-7 items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-bold text-white">
                {countMap[card.key] ?? 0}
              </span>
              {/* Description */}
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="inline-block h-4 w-0.5 rounded-full bg-blue-500" />
                {card.description || card.label}
              </span>
              {/* Title */}
              <span className="mt-1 text-left text-lg font-bold text-gray-900">{card.label}</span>
              {/* Icon */}
              <div className="mt-3 flex h-16 w-16 items-center justify-center self-end rounded-full bg-blue-50">
                <span className="text-3xl">{card.icon}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Right arrow */}
        {canScrollRight && (
          <button
            onClick={() => scrollBy2('right')}
            className="absolute -right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-gray-200 transition-all hover:bg-gray-50"
          >
            <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </section>
  )
}

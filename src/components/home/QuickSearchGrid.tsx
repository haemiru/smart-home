import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHomeFilterStore } from '@/stores/homeFilterStore'
import { useCategories } from '@/hooks/useCategories'
import { fetchSearchSettings, type QuickSearchCard } from '@/api/settings'

export function QuickSearchGrid() {
  const navigate = useNavigate()
  const { selectedCategory } = useHomeFilterStore()
  const { categories } = useCategories()
  const [cards, setCards] = useState<QuickSearchCard[]>([])

  useEffect(() => {
    fetchSearchSettings()
      .then((s) => setCards(s.quick_cards.filter((c) => c.is_enabled).sort((a, b) => a.sort_order - b.sort_order)))
      .catch(() => {})
  }, [])

  const categoryName = useMemo(() => {
    const cat = categories.find((c) => c.id === selectedCategory)
    return cat?.name ?? ''
  }, [categories, selectedCategory])

  const visibleCards = useMemo(() => {
    return categoryName
      ? cards.filter((c) => !c.categories || c.categories.includes(categoryName))
      : cards
  }, [categoryName, cards])

  if (visibleCards.length === 0) return null

  const handleClick = (card: QuickSearchCard) => {
    navigate(`/search?quick=${card.key}`)
  }

  return (
    <section>
      <h2 className="mb-4 text-lg font-bold text-gray-900">원클릭 조건별 검색</h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-3">
        {visibleCards.map((card) => (
          <button
            key={card.key}
            onClick={() => handleClick(card)}
            className="group flex flex-col items-center gap-2 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md hover:ring-primary-300"
          >
            <span className="text-3xl transition-transform group-hover:scale-110">
              {card.icon}
            </span>
            <span className="text-sm font-medium text-gray-800">{card.label}</span>
            {card.description && (
              <span className="text-[11px] text-gray-400">{card.description}</span>
            )}
          </button>
        ))}
      </div>
    </section>
  )
}

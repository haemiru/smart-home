import { useRef, useEffect } from 'react'
import { useHomeFilterStore } from '@/stores/homeFilterStore'
import { useCategories } from '@/hooks/useCategories'

export function CategoryTabs() {
  const { selectedCategory, setCategory } = useHomeFilterStore()
  const { categories, isLoading } = useCategories()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-select the first category once loaded
  useEffect(() => {
    if (!selectedCategory && categories.length > 0) {
      setCategory(categories[0].id)
    }
  }, [categories, selectedCategory, setCategory])

  if (isLoading || categories.length === 0) return null

  return (
    <section id="category-tabs" className="sticky top-16 z-20 border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl">
        <div
          ref={scrollRef}
          className="scrollbar-hide flex overflow-x-auto"
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

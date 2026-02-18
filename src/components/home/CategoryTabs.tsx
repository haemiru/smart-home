import { useRef } from 'react'
import { useHomeFilterStore } from '@/stores/homeFilterStore'
import { propertyCategories } from '@/utils/mockData'

export function CategoryTabs() {
  const { selectedCategory, setCategory } = useHomeFilterStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <section id="category-tabs" className="sticky top-16 z-20 border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl">
        <div
          ref={scrollRef}
          className="scrollbar-hide flex overflow-x-auto"
        >
          {propertyCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

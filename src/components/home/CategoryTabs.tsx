import { useRef, useEffect, useState, useMemo } from 'react'
import { useHomeFilterStore } from '@/stores/homeFilterStore'
import { useCategories } from '@/hooks/useCategories'
import { fetchAgentSpecialties } from '@/api/settings'
import { useTenantStore } from '@/stores/tenantStore'

export function CategoryTabs() {
  const { selectedCategory, setCategory } = useHomeFilterStore()
  const { categories, isLoading } = useCategories()
  const agentId = useTenantStore((s) => s.agentId)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [specialties, setSpecialties] = useState<string[]>([])
  const [specLoaded, setSpecLoaded] = useState(false)

  useEffect(() => {
    setSpecLoaded(false)
    fetchAgentSpecialties(agentId ?? undefined)
      .then((s) => { setSpecialties(s); setSpecLoaded(true) })
      .catch(() => setSpecLoaded(true))
  }, [agentId])

  // Show only specialties (in order). Fallback to all categories if none set.
  const sorted = useMemo(() => {
    if (specialties.length === 0) return categories
    return specialties
      .map((s) => categories.find((c) => c.name === s))
      .filter(Boolean) as typeof categories
  }, [categories, specialties])

  // Auto-select the first category once loaded
  useEffect(() => {
    if (specLoaded && sorted.length > 0) {
      // Always re-select first specialty when navigating to user portal
      setCategory(sorted[0].id)
    }
  }, [sorted, specLoaded, setCategory])

  if (isLoading || !specLoaded || sorted.length === 0) return null

  return (
    <section id="category-tabs" className="sticky top-16 z-20 border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl">
        <div
          ref={scrollRef}
          className="scrollbar-hide flex overflow-x-auto"
        >
          {sorted.map((cat) => (
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

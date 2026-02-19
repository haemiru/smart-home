import { useState, type FormEvent } from 'react'
import { useHomeFilterStore } from '@/stores/homeFilterStore'
import { heroQuickChips } from '@/utils/mockData'
import { useCategories } from '@/hooks/useCategories'

export function HeroSection() {
  const { searchQuery, setSearchQuery, setCategory } = useHomeFilterStore()
  const { categories } = useCategories()
  const [localQuery, setLocalQuery] = useState(searchQuery)

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    setSearchQuery(localQuery)
  }

  const handleChipClick = (chipLabel: string) => {
    // Match chip label to DB category name
    const match = categories.find((c) => c.name === chipLabel)
    if (match) setCategory(match.id)
    document.getElementById('category-tabs')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 25% 50%, white 1px, transparent 1px), radial-gradient(circle at 75% 50%, white 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:py-20 lg:py-24">
        <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
          당신의 완벽한 부동산,
          <br className="sm:hidden" />
          <span className="text-primary-200"> AI가 찾아드립니다</span>
        </h1>
        <p className="mt-3 text-sm text-primary-200 sm:text-base">
          전국 매물 검색부터 AI 맞춤 추천까지, 스마트한 부동산 경험
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mx-auto mt-8 max-w-2xl">
          <div className="flex overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="relative flex-1">
              <svg
                className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                placeholder="지역, 단지명, 주소를 검색하세요"
                className="w-full py-4 pl-12 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-base"
              />
            </div>
            <button
              type="submit"
              className="bg-primary-600 px-6 text-sm font-medium text-white transition-colors hover:bg-primary-700 sm:px-8 sm:text-base"
            >
              검색
            </button>
          </div>
        </form>

        {/* Quick Chips */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {heroQuickChips.map((chip) => (
            <button
              key={chip.id}
              onClick={() => handleChipClick(chip.label)}
              className="rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

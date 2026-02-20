import { useState, useEffect, type FormEvent } from 'react'
import { useHomeFilterStore } from '@/stores/homeFilterStore'
import { useCategories } from '@/hooks/useCategories'
import { fetchAgentSpecialties } from '@/api/settings'

const HERO_IMAGES: Record<string, string> = {
  '아파트': 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&q=80',
  '오피스텔': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&q=80',
  '빌라': 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1600&q=80',
  '상가': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80',
  '사무실': 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80',
  '전원주택': 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1600&q=80',
  '공장': 'https://images.unsplash.com/photo-1513828583688-c52571021e40?w=1600&q=80',
  '창고': 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1600&q=80',
  '토지': 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&q=80',
  '건물': 'https://images.unsplash.com/photo-1464938050520-ef2270bb8ce8?w=1600&q=80',
  '지식산업센터': 'https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=1600&q=80',
}

const DEFAULT_HERO_IMAGE = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1600&q=80'

export function HeroSection() {
  const { searchQuery, setSearchQuery, setCategory } = useHomeFilterStore()
  const { categories } = useCategories()
  const [localQuery, setLocalQuery] = useState(searchQuery)
  const [specialties, setSpecialties] = useState<string[]>([])
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    fetchAgentSpecialties()
      .then(setSpecialties)
      .catch(() => {})
  }, [])

  const heroImage = (specialties.length > 0 && HERO_IMAGES[specialties[0]]) || DEFAULT_HERO_IMAGE

  useEffect(() => {
    const img = new Image()
    img.src = heroImage
    img.onload = () => setImageLoaded(true)
  }, [heroImage])

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    setSearchQuery(localQuery)
  }

  const handleChipClick = (chipLabel: string) => {
    const match = categories.find((c) => c.name === chipLabel)
    if (match) setCategory(match.id)
    document.getElementById('category-tabs')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative overflow-hidden bg-primary-800">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
        style={{
          backgroundImage: `url(${heroImage})`,
          opacity: imageLoaded ? 1 : 0,
        }}
      />
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />

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

        {/* Quick Chips — from agent specialties */}
        {specialties.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {specialties.map((label) => (
              <button
                key={label}
                onClick={() => handleChipClick(label)}
                className="rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25"
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

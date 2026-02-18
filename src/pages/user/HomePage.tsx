import { HeroSection } from '@/components/home/HeroSection'
import { CategoryTabs } from '@/components/home/CategoryTabs'
import { PropertySidebar, PropertyFilterChips } from '@/components/home/PropertyFilters'
import { PropertyGrid } from '@/components/home/PropertyGrid'
import { QuickSearchGrid } from '@/components/home/QuickSearchGrid'
import { AIRecommendations } from '@/components/home/AIRecommendations'
import { UrgentCarousel } from '@/components/home/UrgentCarousel'
import { HotIssuesSection } from '@/components/home/HotIssuesSection'
import { RelatedLinksSection } from '@/components/home/RelatedLinksSection'

export function HomePage() {
  return (
    <div>
      {/* ① Hero Section */}
      <HeroSection />

      {/* ② Category Tabs */}
      <CategoryTabs />

      {/* ③ Sidebar Filters + Main Content (2-column) */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Mobile: Horizontal filter chips */}
        <PropertyFilterChips />

        <div className="flex gap-8">
          {/* Desktop: Left sidebar filters */}
          <PropertySidebar />

          {/* Main content */}
          <div className="min-w-0 flex-1 space-y-10">
            {/* a) 지역별 인기 매물 */}
            <PropertyGrid />

            {/* b) 원클릭 조건별 검색 */}
            <QuickSearchGrid />

            {/* c) AI 추천 매물 */}
            <AIRecommendations />

            {/* d) 급매/추천 캐러셀 */}
            <UrgentCarousel />
          </div>
        </div>
      </div>

      {/* ④ 부동산 핫이슈 + 분양정보 */}
      <div className="mx-auto max-w-7xl px-4 pb-6">
        <HotIssuesSection />
      </div>

      {/* ⑤⑥ 유관기관 + 법령 링크 */}
      <div className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <RelatedLinksSection />
        </div>
      </div>
    </div>
  )
}

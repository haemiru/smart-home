import { useMemo } from 'react'
import { useHomeFilterStore } from '@/stores/homeFilterStore'
import { mockProperties } from '@/utils/mockData'
import { PropertyCard } from './PropertyCard'

export function PropertyGrid() {
  const { selectedCategory, selectedDealType } = useHomeFilterStore()

  const filtered = useMemo(() => {
    return mockProperties.filter((p) => {
      if (p.category !== selectedCategory) return false
      if (selectedDealType) {
        const dealMap: Record<string, string> = { sale: '매매', jeonse: '전세', monthly: '월세' }
        if (p.dealType !== dealMap[selectedDealType]) return false
      }
      return true
    })
  }, [selectedCategory, selectedDealType])

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">지역별 인기 매물</h2>
        <span className="text-sm text-gray-500">{filtered.length}건</span>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-gray-50 py-16 text-center">
          <p className="text-gray-400">해당 조건의 매물이 없습니다.</p>
          <p className="mt-1 text-sm text-gray-400">다른 카테고리나 필터를 선택해보세요.</p>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useHomeFilterStore } from '@/stores/homeFilterStore'
import { fetchProperties } from '@/api/properties'
import { fetchPublicRegionSettings } from '@/api/settings'
import type { RegionSetting } from '@/api/settings'
import type { Property, TransactionType } from '@/types/database'
import { PropertyCard } from './PropertyCard'
import { RegionMapCard } from './RegionMapCard'

const dealTypeMap: Record<string, TransactionType> = { sale: 'sale', jeonse: 'jeonse', monthly: 'monthly' }

export function PropertyGrid() {
  const { selectedCategory, selectedDealType } = useHomeFilterStore()
  const [properties, setProperties] = useState<Property[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [regions, setRegions] = useState<RegionSetting[]>([])
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)

  // Load region settings once
  useEffect(() => {
    fetchPublicRegionSettings().then(setRegions).catch(() => setRegions([]))
  }, [])

  useEffect(() => {
    if (!selectedCategory) return
    let cancelled = false
    setLoading(true)

    fetchProperties({
      categoryId: selectedCategory,
      transactionType: selectedDealType ? dealTypeMap[selectedDealType] : undefined,
      addressSearch: selectedRegion ?? undefined,
    }, 'newest', 1, 12)
      .then(({ data, total }) => {
        if (!cancelled) {
          setProperties(data)
          setTotal(total)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProperties([])
          setTotal(0)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [selectedCategory, selectedDealType, selectedRegion])

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">지역별 인기 매물</h2>
        <span className="text-sm text-gray-500">{total}건</span>
      </div>

      {regions.length > 0 && (
        <div className="mb-6 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {regions.map((region) => (
            <RegionMapCard
              key={region.name}
              name={region.name}
              nameEn={region.nameEn}
              selected={selectedRegion === region.name}
              onClick={() => setSelectedRegion(selectedRegion === region.name ? null : region.name)}
            />
          ))}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl bg-gray-50 py-16 text-center">
          <p className="text-gray-400">매물을 불러오는 중...</p>
        </div>
      ) : properties.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {properties.map((p) => (
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

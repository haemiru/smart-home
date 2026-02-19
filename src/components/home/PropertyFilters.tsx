import { useMemo } from 'react'
import { useHomeFilterStore } from '@/stores/homeFilterStore'
import { useCategories } from '@/hooks/useCategories'
import { filterGroups, filterByCategory } from '@/utils/mockData'

function useFilterValues() {
  const store = useHomeFilterStore()
  const { categories } = useCategories()

  const categoryName = useMemo(() => {
    const cat = categories.find((c) => c.id === store.selectedCategory)
    return cat?.name ?? ''
  }, [categories, store.selectedCategory])

  const visibleGroups = useMemo(
    () => (categoryName ? filterByCategory(filterGroups, categoryName) : filterGroups),
    [categoryName],
  )

  const getSelectedValue = (groupId: string): string | null => {
    const map: Record<string, string | null> = {
      dealType: store.selectedDealType,
      price: store.selectedPrice,
      area: store.selectedArea,
      rooms: store.selectedRooms,
      floor: store.selectedFloor,
      largeArea: store.selectedLargeArea,
      ceilingHeight: store.selectedCeilingHeight,
      powerCapacity: store.selectedPowerCapacity,
      landType: store.selectedLandType,
      zoning: store.selectedZoning,
      roadFrontage: store.selectedRoadFrontage,
    }
    return map[groupId] ?? null
  }

  const hasAnyFilter = !!(
    store.selectedDealType ||
    store.selectedPrice ||
    store.selectedArea ||
    store.selectedRooms ||
    store.selectedFloor ||
    store.selectedLargeArea ||
    store.selectedCeilingHeight ||
    store.selectedPowerCapacity ||
    store.selectedLandType ||
    store.selectedZoning ||
    store.selectedRoadFrontage
  )

  return { store, visibleGroups, getSelectedValue, hasAnyFilter }
}

/** Desktop: Left sidebar (w-56) */
export function PropertySidebar() {
  const { store, visibleGroups, getSelectedValue, hasAnyFilter } = useFilterValues()

  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <div className="sticky top-32 space-y-5">
        {visibleGroups.map((group) => (
          <div key={group.id}>
            <h3 className="mb-2 text-sm font-semibold text-gray-800">{group.label}</h3>
            <div className="space-y-1">
              {group.options.map((opt) => {
                const isActive = getSelectedValue(group.id) === opt.id
                return (
                  <button
                    key={opt.id}
                    onClick={() => store.setFilter(group.id, opt.id)}
                    className={`block w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${
                      isActive
                        ? 'bg-primary-50 font-medium text-primary-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {hasAnyFilter && (
          <button
            onClick={store.resetFilters}
            className="w-full rounded-lg border border-gray-200 py-2 text-sm text-gray-500 hover:bg-gray-50"
          >
            필터 초기화
          </button>
        )}
      </div>
    </aside>
  )
}

/** Mobile: Horizontal scrolling filter chips */
export function PropertyFilterChips() {
  const { store, visibleGroups, getSelectedValue } = useFilterValues()

  return (
    <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-3 lg:hidden">
      {visibleGroups.map((group) => (
        <div key={group.id} className="flex shrink-0 items-center gap-1">
          <span className="text-xs font-medium text-gray-400">{group.label}</span>
          {group.options.map((opt) => {
            const isActive = getSelectedValue(group.id) === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => store.setFilter(group.id, opt.id)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            )
          })}
          <div className="mx-1 h-4 w-px bg-gray-200" />
        </div>
      ))}
    </div>
  )
}

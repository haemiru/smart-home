import { create } from 'zustand'

interface HomeFilterState {
  selectedCategory: string
  selectedDealType: string | null
  selectedPrice: string | null
  selectedArea: string | null
  selectedRooms: string | null
  selectedFloor: string | null
  selectedLargeArea: string | null
  selectedCeilingHeight: string | null
  selectedPowerCapacity: string | null
  selectedLandType: string | null
  selectedZoning: string | null
  selectedRoadFrontage: string | null
  searchQuery: string

  setCategory: (category: string) => void
  setFilter: (group: string, value: string | null) => void
  setSearchQuery: (query: string) => void
  resetFilters: () => void
}

const categoryFilterDefaults = {
  selectedArea: null,
  selectedRooms: null,
  selectedFloor: null,
  selectedLargeArea: null,
  selectedCeilingHeight: null,
  selectedPowerCapacity: null,
  selectedLandType: null,
  selectedZoning: null,
  selectedRoadFrontage: null,
} as const

export const useHomeFilterStore = create<HomeFilterState>((set) => ({
  selectedCategory: '',
  selectedDealType: null,
  selectedPrice: null,
  selectedArea: null,
  selectedRooms: null,
  selectedFloor: null,
  selectedLargeArea: null,
  selectedCeilingHeight: null,
  selectedPowerCapacity: null,
  selectedLandType: null,
  selectedZoning: null,
  selectedRoadFrontage: null,
  searchQuery: '',

  setCategory: (category) =>
    set({
      selectedCategory: category,
      // 카테고리 전환 시 카테고리별 필터 초기화 (거래방식·금액은 유지)
      ...categoryFilterDefaults,
    }),

  setFilter: (group, value) => {
    const key = {
      dealType: 'selectedDealType',
      price: 'selectedPrice',
      area: 'selectedArea',
      rooms: 'selectedRooms',
      floor: 'selectedFloor',
      largeArea: 'selectedLargeArea',
      ceilingHeight: 'selectedCeilingHeight',
      powerCapacity: 'selectedPowerCapacity',
      landType: 'selectedLandType',
      zoning: 'selectedZoning',
      roadFrontage: 'selectedRoadFrontage',
    }[group]
    if (key) {
      set((state) => ({
        [key]: state[key as keyof HomeFilterState] === value ? null : value,
      }))
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  resetFilters: () =>
    set({
      selectedDealType: null,
      selectedPrice: null,
      ...categoryFilterDefaults,
    }),
}))

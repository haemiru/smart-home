import { create } from 'zustand'
import type { PropertyCategoryId } from '@/utils/mockData'

interface HomeFilterState {
  selectedCategory: PropertyCategoryId
  selectedDealType: string | null
  selectedPrice: string | null
  selectedArea: string | null
  selectedRooms: string | null
  selectedFloor: string | null
  searchQuery: string

  setCategory: (category: PropertyCategoryId) => void
  setFilter: (group: string, value: string | null) => void
  setSearchQuery: (query: string) => void
  resetFilters: () => void
}

export const useHomeFilterStore = create<HomeFilterState>((set) => ({
  selectedCategory: 'apartment',
  selectedDealType: null,
  selectedPrice: null,
  selectedArea: null,
  selectedRooms: null,
  selectedFloor: null,
  searchQuery: '',

  setCategory: (category) => set({ selectedCategory: category }),

  setFilter: (group, value) => {
    const key = {
      dealType: 'selectedDealType',
      price: 'selectedPrice',
      area: 'selectedArea',
      rooms: 'selectedRooms',
      floor: 'selectedFloor',
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
      selectedArea: null,
      selectedRooms: null,
      selectedFloor: null,
    }),
}))

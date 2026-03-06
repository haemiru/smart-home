import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type AreaUnit = 'sqm' | 'pyeong'

interface AreaUnitState {
  unit: AreaUnit
  toggle: () => void
}

export const useAreaUnitStore = create<AreaUnitState>()(
  persist(
    (set) => ({
      unit: 'sqm',
      toggle: () => set((s) => ({ unit: s.unit === 'sqm' ? 'pyeong' : 'sqm' })),
    }),
    { name: 'area-unit' },
  ),
)

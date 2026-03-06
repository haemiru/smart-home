import { useAreaUnitStore } from '@/stores/areaUnitStore'
import { sqmToPyeong } from '@/utils/format'

/** Toggle button: click to switch between ㎡ and 평 */
export function AreaUnitToggle({ className = '' }: { className?: string }) {
  const { unit, toggle } = useAreaUnitStore()
  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex items-center gap-1 rounded border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 ${className}`}
      title="면적 단위 전환"
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      {unit === 'sqm' ? '㎡' : '평'}
    </button>
  )
}

/**
 * Format area value based on current unit store.
 * Uses getState() — call inside components that subscribe to useAreaUnitStore
 * or alongside AreaUnitToggle to ensure reactivity.
 */
export function formatAreaByUnit(sqm: number | null | undefined): string {
  if (sqm == null) return '-'
  const unit = useAreaUnitStore.getState().unit
  if (unit === 'pyeong') {
    return `${sqmToPyeong(sqm)}평`
  }
  return `${sqm}㎡`
}

/** React hook version — subscribes to store for automatic re-render */
export function useFormatArea() {
  const unit = useAreaUnitStore((s) => s.unit)
  return (sqm: number | null | undefined): string => {
    if (sqm == null) return '-'
    if (unit === 'pyeong') return `${sqmToPyeong(sqm)}평`
    return `${sqm}㎡`
  }
}

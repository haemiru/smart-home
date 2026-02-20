import { useMemo } from 'react'
import { regionMaps, regionParents } from '@/data/regionMaps'
import type { RegionMapData } from '@/data/regionMaps'

type Props = {
  name: string
  nameEn?: string
  selected: boolean
  onClick: () => void
}

/* ── Region → map data lookup ── */

function findMap(name: string): { data: RegionMapData; highlights: string[] } | null {
  // 1. Exact match in regionParents (e.g. "청주시 흥덕구" → "충청북도")
  if (regionParents[name]) {
    const d = regionMaps[regionParents[name]]
    if (d) return { data: d, highlights: [name] }
  }

  // 2. Name is a province itself (e.g. "세종특별자치시")
  if (regionMaps[name]) {
    return { data: regionMaps[name], highlights: Object.keys(regionMaps[name].regions) }
  }

  // 3. Partial match in province names (e.g. "세종시" → "세종특별자치시")
  for (const prov of Object.keys(regionMaps)) {
    const short = prov.replace(/특별자치시$|특별자치도$|특별시$|광역시$|도$/, '')
    if (name.includes(short) || short.includes(name.replace(/시$|도$/, ''))) {
      return { data: regionMaps[prov], highlights: Object.keys(regionMaps[prov].regions) }
    }
  }

  // 4. Prefix match (e.g. "청주시" → highlights all "청주시 *" in 충청북도)
  for (const [region, parent] of Object.entries(regionParents)) {
    if (region.startsWith(name) || name.startsWith(region)) {
      const d = regionMaps[parent]
      if (d) {
        const hl = Object.keys(d.regions).filter(r => r.startsWith(name) || name.startsWith(r))
        if (hl.length > 0) return { data: d, highlights: hl }
      }
    }
  }

  // 5. Suffix/contains match (e.g. "흥덕구" → "청주시 흥덕구", "상당구" → "청주시 상당구")
  for (const [region, parent] of Object.entries(regionParents)) {
    if (region.endsWith(name) || region.includes(name)) {
      const d = regionMaps[parent]
      if (d) {
        const hl = Object.keys(d.regions).filter(r => r.endsWith(name) || r.includes(name))
        if (hl.length > 0) return { data: d, highlights: hl }
      }
    }
  }

  return null
}

/* ── Component ── */

export function RegionMapCard({ name, nameEn, selected, onClick }: Props) {
  const match = useMemo(() => findMap(name), [name])

  if (!match) return null

  const { data, highlights } = match
  const hlSet = new Set(highlights)

  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 flex-col items-center rounded-2xl px-4 py-3 transition-all ${
        selected ? 'bg-white shadow-lg ring-2 ring-blue-500' : 'bg-gray-50 hover:bg-white hover:shadow-md'
      }`}
      style={{ minWidth: 260 }}
    >
      <svg viewBox={data.viewBox} className="h-48 w-56">
        {Object.entries(data.regions).map(([rName, path]) => (
          <path
            key={rName}
            d={path}
            fill={hlSet.has(rName) ? '#1D4ED8' : '#DBEAFE'}
            stroke="#93C5FD"
            strokeWidth={0.4}
          />
        ))}
      </svg>
      {nameEn && (
        <span className="mt-1 text-[10px] font-medium tracking-widest text-gray-400">
          {nameEn.toUpperCase()}
        </span>
      )}
      <span className={`${nameEn ? '' : 'mt-1 '}text-base font-bold text-gray-800`}>{name}</span>
    </button>
  )
}

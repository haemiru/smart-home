import { useMemo } from 'react'

type Props = {
  name: string
  nameEn?: string
  selected: boolean
  onClick: () => void
  highlight?: boolean
}

/* ── Seeded PRNG ── */

function hash(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function rng(seed: number) {
  let s = ((seed % 2147483647) + 2147483647) % 2147483647 || 1
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

/* ── Catmull-Rom → Cubic Bézier (closed loop) ── */

function smooth(pts: [number, number][]): string {
  const n = pts.length
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]
    const p1 = pts[i]
    const p2 = pts[(i + 1) % n]
    const p3 = pts[(i + 2) % n]
    d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
  }
  return d + 'Z'
}

/* ── Map data generation ── */

function genMap(name: string, hi: boolean) {
  const rand = rng(hash(name))
  const cx = 55, cy = 50

  // Outer boundary — polar coords with noise
  const outer: [number, number][] = []
  for (let i = 0; i < 18; i++) {
    const a = (Math.PI * 2 * i) / 18
    const r = 32 + rand() * 14
    outer.push([cx + r * Math.cos(a), cy + r * Math.sin(a)])
  }

  // Jittered 5×5 grid → 4×4 = 16 cells
  const gs = 5, cw = 20
  const sx = cx - (gs - 1) * cw / 2
  const sy = cy - (gs - 1) * cw / 2
  const gp: [number, number][][] = []
  for (let r = 0; r < gs; r++) {
    gp[r] = []
    for (let c = 0; c < gs; c++) {
      gp[r][c] = [sx + c * cw + (rand() - 0.5) * 7, sy + r * cw + (rand() - 0.5) * 7]
    }
  }

  // Highlight one center-ish cell
  const hR = 1 + Math.floor(rand() * 2)
  const hC = 1 + Math.floor(rand() * 2)

  const cells: { d: string; fill: boolean }[] = []
  for (let r = 0; r < gs - 1; r++) {
    for (let c = 0; c < gs - 1; c++) {
      const cn = [gp[r][c], gp[r][c + 1], gp[r + 1][c + 1], gp[r + 1][c]]
      const mx = (cn[0][0] + cn[1][0] + cn[2][0] + cn[3][0]) / 4
      const my = (cn[0][1] + cn[1][1] + cn[2][1] + cn[3][1]) / 4
      const k = 0.88
      const sc = cn.map(([px, py]): [number, number] => [mx + (px - mx) * k, my + (py - my) * k])
      cells.push({
        d: `M${sc[0][0].toFixed(1)},${sc[0][1].toFixed(1)}L${sc[1][0].toFixed(1)},${sc[1][1].toFixed(1)}L${sc[2][0].toFixed(1)},${sc[2][1].toFixed(1)}L${sc[3][0].toFixed(1)},${sc[3][1].toFixed(1)}Z`,
        fill: hi && r === hR && c === hC,
      })
    }
  }

  return { outerPath: smooth(outer), cells }
}

/* ── Component ── */

export function RegionMapCard({ name, nameEn, selected, onClick, highlight = true }: Props) {
  const { outerPath, cells } = useMemo(() => genMap(name, highlight), [name, highlight])
  const clipId = `rc${hash(name)}`

  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 flex-col items-center rounded-2xl px-4 py-3 transition-all ${
        selected ? 'bg-white shadow-lg ring-2 ring-teal-500' : 'bg-gray-50 hover:bg-white hover:shadow-md'
      }`}
      style={{ minWidth: 130 }}
    >
      <svg viewBox="0 0 110 100" className="h-20 w-24">
        <defs>
          <clipPath id={clipId}>
            <path d={outerPath} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          {cells.map((cell, i) => (
            <path
              key={i}
              d={cell.d}
              fill={cell.fill ? '#0F766E' : '#CCFBF1'}
              stroke="#A7F3D0"
              strokeWidth={0.5}
            />
          ))}
        </g>
        <path d={outerPath} fill="none" stroke="#5EEAD4" strokeWidth={1.5} />
      </svg>
      {nameEn && (
        <span className="mt-1.5 text-[10px] font-medium tracking-widest text-gray-400">
          {nameEn.toUpperCase()}
        </span>
      )}
      <span className={`${nameEn ? '' : 'mt-1.5 '}text-base font-bold text-gray-800`}>{name}</span>
    </button>
  )
}

#!/usr/bin/env node
// Downloads Korean administrative boundary GeoJSON and generates SVG path data.
// Level 1: 시/도 → 시/군/구 (from statgarten/maps)
// Level 2: 시/군/구 → 읍/면/동 (from raqoon886/Local_HangJeongDong)
// Run: node scripts/generate-region-maps.mjs

import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const SIGUNGGU_BASE = 'https://raw.githubusercontent.com/statgarten/maps/main/json/'
const DONG_BASE = 'https://raw.githubusercontent.com/raqoon886/Local_HangJeongDong/master/'

const PROVINCES = [
  '서울특별시', '부산광역시', '대구광역시', '인천광역시',
  '광주광역시', '대전광역시', '울산광역시', '세종특별자치시',
  '경기도', '강원도', '충청북도', '충청남도',
  '전라북도', '전라남도', '경상북도', '경상남도', '제주특별자치도',
]

/* ── Douglas-Peucker simplification ── */

function perpDist(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len === 0) return Math.hypot(p[0] - a[0], p[1] - a[1])
  return Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / len
}

function simplify(pts, eps) {
  if (pts.length <= 2) return pts
  let dmax = 0, idx = 0
  for (let i = 1; i < pts.length - 1; i++) {
    const d = perpDist(pts[i], pts[0], pts[pts.length - 1])
    if (d > dmax) { dmax = d; idx = i }
  }
  if (dmax > eps) {
    const left = simplify(pts.slice(0, idx + 1), eps)
    const right = simplify(pts.slice(idx), eps)
    return [...left.slice(0, -1), ...right]
  }
  return [pts[0], pts[pts.length - 1]]
}

function presample(ring, max = 400) {
  if (ring.length <= max) return ring
  const step = ring.length / max
  return Array.from({ length: max }, (_, i) => ring[Math.floor(i * step)])
}

/* ── Coordinate processing ── */

function getBounds(features) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  const scan = (coords) => {
    for (const [x, y] of coords) {
      if (x < minX) minX = x; if (x > maxX) maxX = x
      if (y < minY) minY = y; if (y > maxY) maxY = y
    }
  }
  for (const f of features) {
    const { type, coordinates } = f.geometry
    if (type === 'Polygon') coordinates.forEach(scan)
    else if (type === 'MultiPolygon') coordinates.flat().forEach(scan)
  }
  return { minX, minY, maxX, maxY }
}

function processRing(ring, bounds, scale, eps, flipY = true) {
  const sampled = presample(ring)
  const normalized = sampled.map(([x, y]) => [
    (x - bounds.minX) * scale,
    flipY ? (bounds.maxY - y) * scale : (y - bounds.minY) * scale,
  ])
  return simplify(normalized, eps)
}

function ptsToSvg(pts) {
  if (pts.length < 3) return ''
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`
  for (let i = 1; i < pts.length; i++) {
    d += `L${pts[i][0].toFixed(1)},${pts[i][1].toFixed(1)}`
  }
  return d + 'Z'
}

function featureToPath(geom, bounds, scale, eps, flipY = true) {
  const rings = geom.type === 'Polygon'
    ? geom.coordinates
    : geom.coordinates.flat()
  return rings
    .map(r => ptsToSvg(processRing(r, bounds, scale, eps, flipY)))
    .filter(Boolean)
    .join('')
}

/* ── Main ── */

async function main() {
  const maps = {}
  const parents = {}
  const VB = 200

  // ═══════════════════════════════════════════
  // Phase 1: 시/도 → 시/군/구 (statgarten/maps)
  // ═══════════════════════════════════════════
  console.log('📍 Phase 1: 시/군/구 level\n')

  for (const prov of PROVINCES) {
    const fileName = `${prov}_시군구_경계.json`
    const url = SIGUNGGU_BASE + encodeURIComponent(fileName)
    process.stdout.write(`  ${prov}... `)

    try {
      const res = await fetch(url)
      if (!res.ok) { console.log(`⚠ ${res.status}`); continue }

      const geo = await res.json()
      if (!geo.features?.length) { console.log('⚠ empty'); continue }

      const bounds = getBounds(geo.features)
      const rangeX = bounds.maxX - bounds.minX
      const rangeY = bounds.maxY - bounds.minY
      const maxRange = Math.max(rangeX, rangeY)
      const scale = VB / maxRange
      const vbW = rangeX * scale
      const vbH = rangeY * scale

      const regions = {}
      for (const f of geo.features) {
        const name = f.properties.title
        if (!name) continue
        const path = featureToPath(f.geometry, bounds, scale, 0.8)
        if (path) {
          regions[name] = path
          parents[name] = prov
        }
      }

      maps[prov] = { viewBox: `0 0 ${vbW.toFixed(1)} ${vbH.toFixed(1)}`, regions }
      console.log(`✓ ${Object.keys(regions).length} regions`)
    } catch (e) {
      console.log(`✗ ${e.message}`)
    }
  }

  // ═══════════════════════════════════════════
  // Phase 2: 시/군/구 → 읍/면/동 (raqoon886)
  // ═══════════════════════════════════════════
  console.log('\n📍 Phase 2: 읍/면/동 level\n')

  for (const prov of PROVINCES) {
    const fileName = `hangjeongdong_${prov}.geojson`
    const url = DONG_BASE + encodeURIComponent(fileName)
    process.stdout.write(`  ${prov}... `)

    try {
      const res = await fetch(url)
      if (!res.ok) { console.log(`⚠ ${res.status}`); continue }

      const geo = await res.json()
      if (!geo.features?.length) { console.log('⚠ empty'); continue }

      // Group features by 시/군/구 (sggnm)
      const groups = {}
      for (const f of geo.features) {
        const sggnm = f.properties.sggnm
        if (!sggnm) continue
        if (!groups[sggnm]) groups[sggnm] = []
        groups[sggnm].push(f)
      }

      let dongCount = 0
      for (const [sggnm, features] of Object.entries(groups)) {
        // Build the full 시/군/구 key matching Phase 1 data
        // sggnm examples: "충주시", "청주시흥덕구" (no space)
        // Phase 1 names: "충주시", "청주시 흥덕구" (with space)
        const sggKey = sggnm.replace(/시([가-힣]+[구군])$/, '시 $1')

        const bounds = getBounds(features)
        const rangeX = bounds.maxX - bounds.minX
        const rangeY = bounds.maxY - bounds.minY
        if (rangeX === 0 || rangeY === 0) continue
        const maxRange = Math.max(rangeX, rangeY)
        const scale = VB / maxRange
        const vbW = rangeX * scale
        const vbH = rangeY * scale

        const regions = {}
        for (const f of features) {
          // Last part of adm_nm (e.g. "충청북도 청주시흥덕구 오송읍" → "오송읍")
          const fullName = f.properties.adm_nm
          const dongName = fullName.split(' ').pop()
          if (!dongName) continue
          const path = featureToPath(f.geometry, bounds, scale, 0.8, true)
          if (path) {
            regions[dongName] = path
            parents[dongName] = sggKey
          }
        }

        if (Object.keys(regions).length > 0) {
          maps[sggKey] = { viewBox: `0 0 ${vbW.toFixed(1)} ${vbH.toFixed(1)}`, regions }
          dongCount += Object.keys(regions).length
        }
      }

      console.log(`✓ ${Object.keys(groups).length} 시군구, ${dongCount} 읍면동`)
    } catch (e) {
      console.log(`✗ ${e.message}`)
    }
  }

  // Province name aliases
  for (const prov of PROVINCES) {
    const short = prov.replace(/특별자치시$|특별자치도$|특별시$|광역시$/, '')
    if (short && short !== prov) {
      if (!parents[short + '시']) parents[short + '시'] = prov
      if (!parents[short]) parents[short] = prov
    }
    if (prov.endsWith('도')) {
      const s = prov.replace(/도$/, '')
      if (!parents[s]) parents[s] = prov
    }
  }

  const ts = [
    '// Auto-generated — run: node scripts/generate-region-maps.mjs',
    '// Sources: statgarten/maps (MIT), raqoon886/Local_HangJeongDong',
    '',
    'export type RegionMapData = { viewBox: string; regions: Record<string, string> }',
    '',
    `export const regionMaps: Record<string, RegionMapData> = ${JSON.stringify(maps)}`,
    '',
    `export const regionParents: Record<string, string> = ${JSON.stringify(parents)}`,
    '',
  ].join('\n')

  const outPath = join(ROOT, 'src', 'data', 'regionMaps.ts')
  mkdirSync(join(ROOT, 'src', 'data'), { recursive: true })
  writeFileSync(outPath, ts, 'utf-8')

  const sizeKB = (Buffer.byteLength(ts) / 1024).toFixed(0)
  console.log(`\n✅ ${outPath}`)
  console.log(`   ${Object.keys(maps).length} maps, ${Object.keys(parents).length} entries, ${sizeKB}KB`)
}

console.log('🗺️  Generating Korean region map data...\n')
main().catch(console.error)

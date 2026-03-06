import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default marker icon path issue with bundlers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface KakaoMapProps {
  latitude?: number | null
  longitude?: number | null
  onLocationChange?: (data: { latitude: number; longitude: number; address: string }) => void
  readOnly?: boolean
}

const POSTCODE_SDK_URL = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'

// --- Daum Postcode SDK ---
let postcodeLoadPromise: Promise<void> | null = null

function loadPostcodeSDK(): Promise<void> {
  if (postcodeLoadPromise) return postcodeLoadPromise

  if (window.daum?.Postcode) {
    postcodeLoadPromise = Promise.resolve()
    return postcodeLoadPromise
  }

  postcodeLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = POSTCODE_SDK_URL
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      postcodeLoadPromise = null
      reject(new Error('Failed to load Postcode SDK'))
    }
    document.head.appendChild(script)
  })

  return postcodeLoadPromise
}

/** Open Daum Postcode popup and return selected address */
export function openAddressSearch(): Promise<daum.PostcodeResult> {
  return loadPostcodeSDK().then(
    () =>
      new Promise((resolve) => {
        new window.daum.Postcode({
          oncomplete: (data) => resolve(data),
        }).open()
      }),
  )
}

/** Geocode address using Nominatim (free, no API key) */
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=kr`,
      { headers: { 'Accept-Language': 'ko' } },
    )
    const data = await res.json()
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    }
  } catch { /* ignore */ }
  return null
}

// Default center: Seoul City Hall
const DEFAULT_LAT = 37.5665
const DEFAULT_LNG = 126.978

export function KakaoMap({ latitude, longitude, onLocationChange, readOnly = false }: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const lat = latitude ?? DEFAULT_LAT
    const lng = longitude ?? DEFAULT_LNG

    const map = L.map(containerRef.current).setView([lat, lng], latitude ? 16 : 8)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)

    mapRef.current = map

    if (latitude && longitude) {
      const marker = L.marker([latitude, longitude]).addTo(map)
      markerRef.current = marker
    }

    if (!readOnly) {
      map.on('click', async (e: L.LeafletMouseEvent) => {
        const { lat: clickLat, lng: clickLng } = e.latlng

        if (markerRef.current) {
          markerRef.current.setLatLng([clickLat, clickLng])
        } else {
          markerRef.current = L.marker([clickLat, clickLng]).addTo(map)
        }

        // Reverse geocode
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${clickLat}&lon=${clickLng}&format=json`,
            { headers: { 'Accept-Language': 'ko' } },
          )
          const data = await res.json()
          onLocationChange?.({
            latitude: clickLat,
            longitude: clickLng,
            address: data.display_name || '',
          })
        } catch {
          onLocationChange?.({
            latitude: clickLat,
            longitude: clickLng,
            address: '',
          })
        }
      })
    }

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly])

  // Update marker when coordinates change externally
  useEffect(() => {
    if (!mapRef.current) return
    if (latitude && longitude) {
      if (markerRef.current) {
        markerRef.current.setLatLng([latitude, longitude])
      } else {
        markerRef.current = L.marker([latitude, longitude]).addTo(mapRef.current)
      }
      mapRef.current.setView([latitude, longitude], 16)
    }
  }, [latitude, longitude])

  return <div ref={containerRef} className="w-full rounded-lg border border-gray-200" style={{ height: '42vw', maxHeight: '400px' }} />
}

/** Geocode an address string and return coordinates */
export { geocodeAddress }

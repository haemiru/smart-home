import { useState, useEffect, useCallback } from 'react'
import { mockProperties } from '@/utils/mockData'

const urgentItems = mockProperties.filter((p) => p.isUrgent || p.matchRate)

export function UrgentCarousel() {
  const [current, setCurrent] = useState(0)

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % urgentItems.length)
  }, [])

  useEffect(() => {
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [next])

  if (urgentItems.length === 0) return null

  return (
    <section>
      <h2 className="mb-4 text-lg font-bold text-gray-900">급매 · 추천 매물</h2>
      <div className="relative overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {urgentItems.map((p) => (
            <div key={p.id} className="flex w-full shrink-0 gap-4 p-4 sm:p-6">
              <div className="h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-32 sm:w-44">
                <img src={p.imageUrl} alt={p.title} className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <span className={`rounded px-2 py-0.5 text-xs font-semibold ${
                    p.dealType === '매매' ? 'bg-blue-100 text-blue-700' :
                    p.dealType === '전세' ? 'bg-green-100 text-green-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {p.dealType}
                  </span>
                  {p.isUrgent && (
                    <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">급매</span>
                  )}
                </div>
                <p className="mt-2 text-lg font-bold text-gray-900">{p.price}</p>
                <p className="text-sm text-gray-700">{p.title}</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {p.address} · {p.area.sqm}㎡({p.area.pyeong}평)
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-1.5 pb-3">
          {urgentItems.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === current ? 'w-6 bg-primary-600' : 'w-1.5 bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

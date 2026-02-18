import type { MockProperty } from '@/utils/mockData'

interface PropertyCardProps {
  property: MockProperty
  showMatchRate?: boolean
}

const dealTypeBadgeColor: Record<string, string> = {
  '매매': 'bg-blue-100 text-blue-700',
  '전세': 'bg-green-100 text-green-700',
  '월세': 'bg-orange-100 text-orange-700',
}

export function PropertyCard({ property, showMatchRate }: PropertyCardProps) {
  return (
    <div className="group cursor-pointer overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200 transition-shadow hover:shadow-md">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <img
          src={property.imageUrl}
          alt={property.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {/* Badges */}
        <div className="absolute left-2 top-2 flex gap-1">
          <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${dealTypeBadgeColor[property.dealType] || 'bg-gray-100 text-gray-700'}`}>
            {property.dealType}
          </span>
          {property.isUrgent && (
            <span className="rounded-md bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
              급매
            </span>
          )}
        </div>
        {showMatchRate && property.matchRate && (
          <div className="absolute right-2 top-2 rounded-full bg-primary-600 px-2.5 py-0.5 text-xs font-bold text-white">
            {property.matchRate}% 매칭
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-lg font-bold text-gray-900">{property.price}</p>
        <p className="mt-0.5 text-sm font-medium text-gray-700 truncate">{property.title}</p>
        <p className="mt-0.5 text-xs text-gray-500">
          {property.address} · {property.area.sqm}㎡({property.area.pyeong}평)
          {property.floor && ` · ${property.floor}`}
        </p>
        {property.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {property.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

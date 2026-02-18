import { quickSearchConditions } from '@/utils/mockData'

export function QuickSearchGrid() {
  return (
    <section>
      <h2 className="mb-4 text-lg font-bold text-gray-900">원클릭 조건별 검색</h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-3">
        {quickSearchConditions.map((cond) => (
          <button
            key={cond.id}
            className="group flex flex-col items-center gap-2 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md hover:ring-primary-300"
          >
            <span className="text-3xl transition-transform group-hover:scale-110">
              {cond.icon}
            </span>
            <span className="text-sm font-medium text-gray-800">{cond.label}</span>
            <span className="text-[11px] text-gray-400">{cond.description}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

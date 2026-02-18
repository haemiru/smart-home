import { hotIssues, presaleInfos } from '@/utils/mockData'

export function HotIssuesSection() {
  return (
    <section className="grid gap-6 lg:grid-cols-2">
      {/* Hot Issues */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">부동산 핫이슈</h2>
          <button className="text-sm text-primary-600 hover:text-primary-700">더보기</button>
        </div>
        <div className="divide-y divide-gray-100 rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
          {hotIssues.map((issue) => (
            <button
              key={issue.id}
              className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-gray-50"
            >
              <span className="shrink-0 rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                {issue.category}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-800">{issue.title}</p>
                <p className="mt-0.5 text-xs text-gray-400">{issue.date}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Presale Info */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">분양정보</h2>
          <button className="text-sm text-primary-600 hover:text-primary-700">더보기</button>
        </div>
        <div className="divide-y divide-gray-100 rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
          {presaleInfos.map((info) => (
            <button
              key={info.id}
              className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-gray-50"
            >
              <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${
                info.status === '청약접수중'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {info.status}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-800">{info.title}</p>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-400">
                  <span>{info.area}</span>
                  <span>·</span>
                  <span>{info.date}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

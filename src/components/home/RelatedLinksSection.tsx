import { relatedOrgLinks, legalInfoLinks } from '@/utils/mockData'

export function RelatedLinksSection() {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 text-lg font-bold text-gray-900">유관기관</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {relatedOrgLinks.map((link) => (
            <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" title={link.label}
              className="flex items-center justify-center rounded-xl border border-gray-200 bg-white p-3 transition-all hover:border-primary-200 hover:shadow-md">
              <img src={link.logo} alt={link.label} className="h-14 w-full object-contain" loading="lazy" />
            </a>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-gray-900">부동산 종합정보 · 관련 법령</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {legalInfoLinks.map((link) => (
            <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:border-primary-200 hover:text-primary-600 hover:shadow-md">
              {link.label}
              <svg className="ml-auto h-4 w-4 shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}

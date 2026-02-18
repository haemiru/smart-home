import { relatedOrgLinks, legalInfoLinks } from '@/utils/mockData'

export function RelatedLinksSection() {
  return (
    <div className="space-y-6">
      {/* 유관기관 링크 바 */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-gray-900">유관기관</h2>
        <div className="flex flex-wrap gap-2">
          {relatedOrgLinks.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 transition-colors hover:border-primary-300 hover:text-primary-600"
            >
              {link.label}
            </a>
          ))}
        </div>
      </section>

      {/* 부동산종합정보 · 관련 법령 */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-gray-900">부동산 종합정보 · 관련 법령</h2>
        <div className="flex flex-wrap gap-2">
          {legalInfoLinks.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 transition-colors hover:border-primary-300 hover:text-primary-600"
            >
              {link.label}
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}

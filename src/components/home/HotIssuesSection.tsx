import { useState, useEffect } from 'react'
import { fetchNaverNews, type NewsItem } from '@/api/naverNews'

function formatRelDate(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffH = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffH < 1) return '방금 전'
  if (diffH < 24) return `${diffH}시간 전`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `${diffD}일 전`
  return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
}

export function HotIssuesSection() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [policy, setPolicy] = useState<NewsItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetchNaverNews('부동산 시세 동향', 5),
      fetchNaverNews('부동산 정책 법률', 5),
    ]).then(([n, p]) => {
      if (!cancelled) { setNews(n); setPolicy(p) }
    }).catch(() => {})
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [])

  const renderList = (items: NewsItem[]) => (
    <div className="divide-y divide-gray-100 rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
      {items.length === 0 && !isLoading ? (
        <p className="p-6 text-center text-sm text-gray-400">뉴스를 불러올 수 없습니다.</p>
      ) : items.map((item, i) => (
        <a key={i} href={item.link} target="_blank" rel="noopener noreferrer"
          className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-gray-50">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-800 line-clamp-2">{item.title}</p>
            <p className="mt-1 text-xs text-gray-400">{formatRelDate(item.pubDate)}</p>
          </div>
        </a>
      ))}
    </div>
  )

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div>
        <h2 className="mb-4 text-lg font-bold text-gray-900">부동산 시세/동향</h2>
        {isLoading ? (
          <div className="flex h-48 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
          </div>
        ) : renderList(news)}
      </div>
      <div>
        <h2 className="mb-4 text-lg font-bold text-gray-900">부동산 정책/법률</h2>
        {isLoading ? (
          <div className="flex h-48 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
          </div>
        ) : renderList(policy)}
      </div>
    </section>
  )
}

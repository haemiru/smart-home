import { supabase } from '@/api/supabase'

export type NewsItem = {
  title: string
  link: string
  description: string
  pubDate: string
}

/** 네이버 뉴스 검색 */
export async function fetchNaverNews(query = '부동산', display = 5): Promise<NewsItem[]> {
  if (import.meta.env.DEV) {
    const res = await fetch(`/api/naver-news?query=${encodeURIComponent(query)}&display=${display}&sort=date`)
    const data = await res.json()
    if (!res.ok || data.errorCode) return []
    return (data.items ?? []).map(cleanItem)
  }

  const { data, error } = await supabase.functions.invoke('naver-news', {
    body: { query, display },
  })
  if (error || data?.error) return []
  return (data?.items ?? []).map(cleanItem)
}

function cleanItem(item: Record<string, string>): NewsItem {
  return {
    title: stripHtml(item.title),
    link: item.originallink || item.link,
    description: stripHtml(item.description),
    pubDate: item.pubDate,
  }
}

function stripHtml(html: string): string {
  return html?.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>') ?? ''
}

import { useState, useEffect, useMemo } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { fetchAllAgents, updateAgentPlan } from '@/api/superAdmin'
import type { AdminAgent } from '@/api/superAdmin'
import toast from 'react-hot-toast'

const PLAN_OPTIONS = [
  { value: 'free', label: 'Free', color: 'bg-gray-100 text-gray-700' },
  { value: 'basic', label: 'Basic', color: 'bg-blue-100 text-blue-700' },
  { value: 'pro', label: 'Pro', color: 'bg-purple-100 text-purple-700' },
] as const

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export function SuperAdminPage() {
  const { user, isLoading: authLoading, isInitialized } = useAuthStore()
  const [agents, setAgents] = useState<AdminAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const email = user?.email ?? ''
  const isSuperAdmin = email === 'junominu@gmail.com'

  // Debug
  console.log('[SuperAdmin] isInitialized:', isInitialized, 'authLoading:', authLoading, 'user:', user?.email, 'isSuperAdmin:', isSuperAdmin)

  const loadAgents = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAllAgents()
      setAgents(data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '데이터를 불러올 수 없습니다.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isInitialized || authLoading) return
    if (isSuperAdmin) {
      loadAgents()
    } else {
      setLoading(false)
    }
  }, [isInitialized, authLoading, isSuperAdmin])

  const handlePlanChange = async (agentId: string, newPlan: string) => {
    setUpdatingId(agentId)
    try {
      await updateAgentPlan(agentId, newPlan)
      setAgents((prev) =>
        prev.map((a) => (a.agent_id === agentId ? { ...a, subscription_plan: newPlan } : a))
      )
      toast.success('플랜이 변경되었습니다.')
    } catch (err) {
      const msg = err instanceof Error ? err.message : '플랜 변경에 실패했습니다.'
      toast.error(msg)
    } finally {
      setUpdatingId(null)
    }
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return agents
    const q = search.toLowerCase()
    return agents.filter(
      (a) =>
        a.email.toLowerCase().includes(q) ||
        (a.office_name ?? '').toLowerCase().includes(q) ||
        (a.representative ?? '').toLowerCase().includes(q) ||
        (a.slug ?? '').toLowerCase().includes(q)
    )
  }, [agents, search])

  const stats = useMemo(() => {
    const total = agents.length
    const free = agents.filter((a) => a.subscription_plan === 'free').length
    const basic = agents.filter((a) => a.subscription_plan === 'basic').length
    const pro = agents.filter((a) => a.subscription_plan === 'pro').length
    const properties = agents.reduce((sum, a) => sum + (a.property_count ?? 0), 0)
    return { total, free, basic, pro, properties }
  }, [agents])

  // Wait for auth to initialize
  if (!isInitialized || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    )
  }

  // Unauthorized
  if (!isSuperAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900">접근 권한이 없습니다</h2>
          <p className="mt-2 text-sm text-gray-500">이 페이지는 슈퍼 관리자만 접근할 수 있습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                슈퍼 관리자
                <span className="ml-2 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">ADMIN</span>
              </h1>
              <p className="mt-1 text-sm text-gray-500">가입자 관리 — 전체 중개사 계정 현황</p>
            </div>
            <button
              onClick={loadAgents}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
            >
              <svg className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
              </svg>
              새로고침
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Summary Cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: '전체 가입자', value: `${stats.total}명`, bg: 'bg-white' },
            { label: 'Free', value: `${stats.free}명`, bg: 'bg-gray-50' },
            { label: 'Basic', value: `${stats.basic}명`, bg: 'bg-blue-50' },
            { label: 'Pro', value: `${stats.pro}명`, bg: 'bg-purple-50' },
            { label: '총 매물', value: `${stats.properties.toLocaleString()}건`, bg: 'bg-green-50' },
          ].map((card) => (
            <div key={card.label} className={`rounded-xl ${card.bg} border border-gray-200 p-4 shadow-sm`}>
              <p className="text-xs font-medium text-gray-500">{card.label}</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative max-w-md">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              placeholder="이메일, 사무소명, 대표자, Slug 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['이메일', '사무소명', '대표자', 'Slug', '플랜', '매물수', '가입일', '인증', '플랜 변경'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center">
                      <div className="mx-auto h-6 w-6 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-sm text-gray-400">
                      {search ? '검색 결과가 없습니다.' : '등록된 가입자가 없습니다.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((agent) => {
                    const planInfo = PLAN_OPTIONS.find((p) => p.value === agent.subscription_plan) ?? PLAN_OPTIONS[0]
                    return (
                      <tr key={agent.agent_id} className="hover:bg-gray-50 transition-colors">
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">{agent.email}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{agent.office_name || '-'}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{agent.representative || '-'}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                          {agent.slug ? (
                            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">{agent.slug}</code>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${planInfo.color}`}>
                            {planInfo.label}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 text-right tabular-nums">
                          {agent.property_count.toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                          {formatDate(agent.created_at)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-center">
                          {agent.is_verified ? (
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-600">
                              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </span>
                          ) : (
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <select
                            value={agent.subscription_plan}
                            onChange={(e) => handlePlanChange(agent.agent_id, e.target.value)}
                            disabled={updatingId === agent.agent_id}
                            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
                          >
                            {PLAN_OPTIONS.map((p) => (
                              <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          {!loading && filtered.length > 0 && (
            <div className="border-t border-gray-100 bg-gray-50 px-4 py-2.5 text-xs text-gray-500">
              {search ? `검색 결과: ${filtered.length}명` : `전체: ${agents.length}명`}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

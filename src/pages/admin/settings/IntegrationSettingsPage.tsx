import { useState, useEffect } from 'react'
import { fetchIntegrations, toggleIntegration } from '@/api/settings'
import type { IntegrationConfig } from '@/api/settings'
import toast from 'react-hot-toast'

const categoryOrder = ['메시징', '예약', '일정', 'SNS', '전자서명']

export function IntegrationSettingsPage() {
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editUrl, setEditUrl] = useState('')

  useEffect(() => {
    fetchIntegrations().then((data) => {
      setIntegrations(data)
      setIsLoading(false)
    })
  }, [])

  const grouped = categoryOrder.map((cat) => ({
    category: cat,
    items: integrations.filter((i) => i.category === cat),
  })).filter((g) => g.items.length > 0)

  const handleToggle = async (item: IntegrationConfig) => {
    if (item.is_connected) {
      await toggleIntegration(item.key, false)
      setIntegrations(integrations.map((i) => i.key === item.key ? { ...i, is_connected: false } : i))
      toast.success(`${item.label} 연동이 해제되었습니다.`)
    } else {
      setEditingKey(item.key)
      setEditUrl(item.url || item.account_id || '')
    }
  }

  const handleConnect = async () => {
    if (!editingKey) return
    const item = integrations.find((i) => i.key === editingKey)
    if (!item) return
    const data = item.url !== undefined ? { url: editUrl } : { account_id: editUrl }
    await toggleIntegration(editingKey, true, data)
    setIntegrations(integrations.map((i) => i.key === editingKey ? { ...i, is_connected: true, ...data } : i))
    setEditingKey(null)
    toast.success(`${item.label} 연동이 완료되었습니다.`)
  }

  if (isLoading) return <div className="flex h-40 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-bold">외부 서비스 연동</h2>
        <p className="mt-1 text-xs text-gray-400">외부 서비스를 연동하여 업무를 확장합니다.</p>
      </div>

      {grouped.map((group) => (
        <div key={group.category} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <h3 className="mb-3 text-xs font-medium text-gray-400">{group.category}</h3>
          <div className="space-y-3">
            {group.items.map((item) => (
              <div key={item.key} className="flex items-center gap-4 rounded-lg border border-gray-100 p-3">
                <span className="text-xl">{item.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.label}</p>
                  {item.is_connected && (
                    <p className="text-xs text-green-600">연동됨</p>
                  )}
                </div>
                <button
                  onClick={() => handleToggle(item)}
                  className={`rounded-lg px-4 py-1.5 text-xs font-medium ${
                    item.is_connected
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  {item.is_connected ? '해제' : '연동'}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Connect Modal */}
      {editingKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-sm font-bold">서비스 연동</h3>
            <p className="mt-2 text-xs text-gray-400">
              {integrations.find((i) => i.key === editingKey)?.label} 연동 정보를 입력해주세요.
            </p>
            <input
              type="text"
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
              placeholder="URL 또는 계정 ID"
              className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <div className="mt-4 flex gap-3">
              <button onClick={() => setEditingKey(null)} className="flex-1 rounded-lg bg-gray-100 py-2 text-sm font-medium text-gray-600">취소</button>
              <button onClick={handleConnect} className="flex-1 rounded-lg bg-primary-600 py-2 text-sm font-medium text-white">연동</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

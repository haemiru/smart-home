import { useAuthStore } from '@/stores/authStore'

export function DashboardPage() {
  const { user, agentProfile } = useAuthStore()

  return (
    <div>
      <h1 className="text-2xl font-bold">대시보드</h1>
      <p className="mt-2 text-gray-600">
        안녕하세요, {user?.display_name}님
        {agentProfile && !agentProfile.is_verified && (
          <span className="ml-2 inline-block rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
            승인 대기중
          </span>
        )}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: '등록 매물', value: '-', icon: '🏠' },
          { label: '진행 계약', value: '-', icon: '📝' },
          { label: '전체 고객', value: '-', icon: '👥' },
          { label: '이번 달 문의', value: '-', icon: '💬' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <p className="mt-3 text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

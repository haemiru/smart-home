import { useState, useEffect } from 'react'
import { fetchFeatureGroups, toggleFeature } from '@/api/settings'
import type { FeatureGroup } from '@/api/settings'
import { useFeatureStore } from '@/stores/featureStore'
import { getRequiredPlan, PLAN_INFO, isFeatureInPlan } from '@/config/planFeatures'
import toast from 'react-hot-toast'

const PLAN_ORDER = ['free', 'basic', 'pro', 'enterprise'] as const

export function FeatureSettingsPage() {
  const [groups, setGroups] = useState<FeatureGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingKey, setTogglingKey] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    featureKey: string
    featureLabel: string
  } | null>(null)
  const plan = useFeatureStore((s) => s.plan)

  useEffect(() => {
    loadFeatures()
  }, [])

  async function loadFeatures() {
    try {
      const data = await fetchFeatureGroups()
      setGroups(data)
    } catch {
      toast.error('기능 설정을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function handleToggle(featureKey: string, featureLabel: string, currentEnabled: boolean) {
    // Turning OFF: show confirm dialog
    if (currentEnabled) {
      setConfirmDialog({ featureKey, featureLabel })
      return
    }
    // Turning ON: apply immediately
    await applyToggle(featureKey, true)
  }

  async function applyToggle(featureKey: string, enabled: boolean) {
    setTogglingKey(featureKey)
    try {
      await toggleFeature(featureKey, enabled)
      setGroups((prev) =>
        prev.map((g) => ({
          ...g,
          features: g.features.map((f) =>
            f.key === featureKey ? { ...f, is_enabled: enabled } : f
          ),
        }))
      )
      toast.success(enabled ? '기능이 활성화되었습니다.' : '기능이 비활성화되었습니다.')
    } catch {
      toast.error('설정 변경에 실패했습니다.')
    } finally {
      setTogglingKey(null)
    }
  }

  function handleConfirm() {
    if (!confirmDialog) return
    applyToggle(confirmDialog.featureKey, false)
    setConfirmDialog(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold">기능 관리</h2>
        <p className="mt-1 text-sm text-gray-500">
          사용할 기능을 선택하세요. 비활성화된 기능은 메뉴에서 숨겨지며, 기존 데이터는 보존됩니다.
        </p>
        <p className="mt-1 text-xs text-gray-400">
          현재 요금제: <span className={`font-semibold ${PLAN_INFO[plan].textColor}`}>{PLAN_INFO[plan].label}</span>
        </p>
      </div>

      <div className="space-y-4">
        {groups.map((group) => (
          <div
            key={group.key}
            className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200"
          >
            {/* Group Header */}
            <div className="border-b border-gray-100 bg-gray-50/50 px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{group.icon}</span>
                <h3 className="text-sm font-semibold text-gray-900">{group.label}</h3>
                <span className="text-xs text-gray-400">
                  {group.features.filter((f) => f.is_enabled && isFeatureInPlan(f.key, plan)).length}/{group.features.filter((f) => isFeatureInPlan(f.key, plan)).length}
                </span>
                {group.key === 'core' && (
                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                    필수
                  </span>
                )}
              </div>
            </div>

            {/* Feature Items */}
            <div className="divide-y divide-gray-100">
              {group.features.map((feature) => {
                const requiredPlan = getRequiredPlan(feature.key)
                const inPlan = isFeatureInPlan(feature.key, plan)
                const needsUpgrade = !inPlan
                const requiredPlanInfo = PLAN_INFO[requiredPlan]
                const isToggleDisabled =
                  feature.is_locked || needsUpgrade || togglingKey === feature.key

                return (
                  <div
                    key={feature.key}
                    className={`flex items-center gap-4 px-5 py-3.5 ${
                      needsUpgrade ? 'bg-gray-50/50' : ''
                    }`}
                  >
                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-sm font-medium ${
                            needsUpgrade ? 'text-gray-400' : 'text-gray-900'
                          }`}
                        >
                          {feature.label}
                        </span>
                        {feature.gemini && (
                          <span className="inline-flex items-center rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                            ⚡ Gemini
                          </span>
                        )}
                        {feature.is_locked && (
                          <span className="text-xs text-gray-400">🔒</span>
                        )}
                        {needsUpgrade && (
                          <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${requiredPlanInfo.bgColor} ${requiredPlanInfo.textColor}`}>
                            {requiredPlanInfo.label}
                          </span>
                        )}
                      </div>
                      <p
                        className={`mt-0.5 text-xs ${
                          needsUpgrade ? 'text-gray-400' : 'text-gray-500'
                        }`}
                      >
                        {feature.description}
                      </p>
                      {needsUpgrade && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-amber-600">
                          <span>🔒</span>
                          <span>{requiredPlanInfo.label} 요금제 이상에서 사용 가능</span>
                        </p>
                      )}
                    </div>

                    {/* Toggle Switch */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={feature.is_enabled && inPlan}
                      aria-label={`${feature.label} ${feature.is_enabled ? '활성' : '비활성'}`}
                      disabled={isToggleDisabled}
                      onClick={() =>
                        handleToggle(feature.key, feature.label, feature.is_enabled)
                      }
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                        feature.is_enabled && inPlan
                          ? 'bg-primary-600'
                          : 'bg-gray-200'
                      } ${isToggleDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                          feature.is_enabled && inPlan ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Upgrade CTA */}
      {PLAN_ORDER.indexOf(plan) < 2 && (
        <div className="rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 p-5 ring-1 ring-purple-200">
          <p className="text-sm font-semibold text-purple-800">더 많은 기능이 필요하신가요?</p>
          <p className="mt-1 text-xs text-purple-600">
            요금제를 업그레이드하면 AI 도구, 데이터 분석, 공동중개 등 다양한 기능을 사용할 수 있습니다.
          </p>
          <a
            href="/admin/settings/billing"
            className="mt-3 inline-block rounded-lg bg-purple-600 px-4 py-2 text-xs font-medium text-white hover:bg-purple-700"
          >
            요금제 업그레이드
          </a>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900">기능 비활성화</h3>
            <p className="mt-2 text-sm text-gray-600">
              <strong>{confirmDialog.featureLabel}</strong>을(를) 비활성화하면 관련 메뉴가
              숨겨집니다. 기존 데이터는 보존됩니다.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                비활성화
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

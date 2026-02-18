import { useState, useEffect } from 'react'
import { fetchNotificationSettings, updateNotificationSetting } from '@/api/settings'
import type { NotificationSetting, NotificationChannel, NotificationType } from '@/api/settings'
import toast from 'react-hot-toast'

const channelLabels: Record<NotificationChannel, string> = {
  push: '푸시',
  email: '이메일',
  alimtalk: '알림톡',
}

export function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSetting[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchNotificationSettings().then((data) => {
      setSettings(data)
      setIsLoading(false)
    })
  }, [])

  const handleToggle = async (type: NotificationType, channel: NotificationChannel) => {
    const setting = settings.find((s) => s.type === type)
    if (!setting) return
    const newValue = !setting.channels[channel]
    await updateNotificationSetting(type, channel, newValue)
    setSettings(settings.map((s) =>
      s.type === type ? { ...s, channels: { ...s.channels, [channel]: newValue } } : s
    ))
    toast.success('알림 설정이 변경되었습니다.')
  }

  if (isLoading) return <div className="flex h-40 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <h2 className="text-sm font-bold">알림 설정</h2>
        <p className="mt-1 text-xs text-gray-400">유형별 알림 수신 채널을 설정합니다.</p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-3 pr-4 text-left text-xs font-medium text-gray-400">알림 유형</th>
                {(Object.keys(channelLabels) as NotificationChannel[]).map((ch) => (
                  <th key={ch} className="pb-3 text-center text-xs font-medium text-gray-400">{channelLabels[ch]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {settings.map((setting) => (
                <tr key={setting.type} className="border-b border-gray-100">
                  <td className="py-3 pr-4 text-sm font-medium">{setting.label}</td>
                  {(Object.keys(channelLabels) as NotificationChannel[]).map((ch) => (
                    <td key={ch} className="py-3 text-center">
                      <button
                        onClick={() => handleToggle(setting.type, ch)}
                        className={`relative inline-block h-6 w-11 rounded-full transition-colors ${setting.channels[ch] ? 'bg-primary-600' : 'bg-gray-300'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${setting.channels[ch] ? 'translate-x-5' : ''}`} />
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg bg-amber-50 p-4">
        <p className="text-xs text-amber-700">
          알림톡은 카카오톡 채널이 연동된 경우에만 발송됩니다. 외부 연동 설정에서 카카오톡 채널을 먼저 연동해주세요.
        </p>
      </div>
    </div>
  )
}

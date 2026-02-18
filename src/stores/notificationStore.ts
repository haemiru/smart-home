import { create } from 'zustand'
import type { Inquiry } from '@/types/database'
import { getUnansweredCount } from '@/api/inquiries'

export type Notification = {
  id: string
  type: 'inquiry' | 'system'
  title: string
  message: string
  link?: string
  isRead: boolean
  created_at: string
}

type NotificationStore = {
  notifications: Notification[]
  unansweredInquiryCount: number
  unreadCount: number
  addNotification: (n: Omit<Notification, 'id' | 'isRead' | 'created_at'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  refreshUnansweredCount: () => Promise<void>
  // Supabase Realtime integration placeholder
  handleNewInquiry: (inquiry: Inquiry) => void
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [
    {
      id: 'notif-1',
      type: 'inquiry',
      title: '새 문의',
      message: '김철수님이 래미안 레이카운티 매물에 대해 문의했습니다.',
      link: '/admin/inquiries/inq-1',
      isRead: false,
      created_at: '2026-02-17T14:30:00Z',
    },
    {
      id: 'notif-2',
      type: 'inquiry',
      title: '새 문의',
      message: '한지연님이 역삼 센트럴 오피스텔 매물에 대해 문의했습니다.',
      link: '/admin/inquiries/inq-6',
      isRead: false,
      created_at: '2026-02-18T08:00:00Z',
    },
    {
      id: 'notif-3',
      type: 'inquiry',
      title: '새 문의',
      message: '이영희님이 시세 문의를 접수했습니다.',
      link: '/admin/inquiries/inq-2',
      isRead: true,
      created_at: '2026-02-17T10:15:00Z',
    },
  ],
  unansweredInquiryCount: 0,
  get unreadCount() {
    return get().notifications.filter((n) => !n.isRead).length
  },

  addNotification: (n) => {
    const notification: Notification = {
      ...n,
      id: `notif-${Date.now()}`,
      isRead: false,
      created_at: new Date().toISOString(),
    }
    set((s) => ({
      notifications: [notification, ...s.notifications],
    }))
  },

  markAsRead: (id) => {
    set((s) => ({
      notifications: s.notifications.map((n) => n.id === id ? { ...n, isRead: true } : n),
    }))
  },

  markAllAsRead: () => {
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
    }))
  },

  refreshUnansweredCount: async () => {
    const count = await getUnansweredCount()
    set({ unansweredInquiryCount: count })
  },

  handleNewInquiry: (inquiry) => {
    get().addNotification({
      type: 'inquiry',
      title: '새 문의',
      message: `${inquiry.name}님이 ${inquiry.inquiry_type === 'property' ? '매물' : inquiry.inquiry_type === 'price' ? '시세' : inquiry.inquiry_type === 'contract' ? '계약' : '기타'} 문의를 접수했습니다.`,
      link: `/admin/inquiries/${inquiry.id}`,
    })
    get().refreshUnansweredCount()
  },
}))

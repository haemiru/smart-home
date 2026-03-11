import { create } from 'zustand'
import type { Inquiry } from '@/types/database'
import { fetchInquiries, getUnansweredCount } from '@/api/inquiries'

export type Notification = {
  id: string
  type: 'inquiry' | 'system'
  title: string
  message: string
  link?: string
  isRead: boolean
  created_at: string
}

const inquiryTypeLabel: Record<string, string> = {
  property: '매물',
  price: '시세',
  contract: '계약',
  other: '기타',
}

function inquiryToNotification(inq: Inquiry): Notification {
  return {
    id: `inq-notif-${inq.id}`,
    type: 'inquiry',
    title: '새 문의',
    message: `${inq.name}님이 ${inquiryTypeLabel[inq.inquiry_type] ?? '기타'} 문의를 접수했습니다.`,
    link: `/admin/inquiries/${inq.id}`,
    isRead: inq.status !== 'new',
    created_at: inq.created_at,
  }
}

type NotificationStore = {
  notifications: Notification[]
  unansweredInquiryCount: number
  unreadCount: number
  initialized: boolean
  addNotification: (n: Omit<Notification, 'id' | 'isRead' | 'created_at'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  refreshUnansweredCount: () => Promise<void>
  loadRecentInquiries: () => Promise<void>
  handleNewInquiry: (inquiry: Inquiry) => void
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unansweredInquiryCount: 0,
  initialized: false,
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
    try {
      const count = await getUnansweredCount()
      set({ unansweredInquiryCount: count })
    } catch {
      // ignore
    }
  },

  loadRecentInquiries: async () => {
    if (get().initialized) return
    try {
      const inquiries = await fetchInquiries({ unansweredOnly: true })
      const notifications = inquiries.slice(0, 20).map(inquiryToNotification)
      const count = await getUnansweredCount()
      set({ notifications, unansweredInquiryCount: count, initialized: true })
    } catch {
      set({ initialized: true })
    }
  },

  handleNewInquiry: (inquiry) => {
    get().addNotification({
      type: 'inquiry',
      title: '새 문의',
      message: `${inquiry.name}님이 ${inquiryTypeLabel[inquiry.inquiry_type] ?? '기타'} 문의를 접수했습니다.`,
      link: `/admin/inquiries/${inquiry.id}`,
    })
    get().refreshUnansweredCount()
  },
}))

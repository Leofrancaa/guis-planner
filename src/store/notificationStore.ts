"use client"

import { create } from "zustand"
import { fetchApi } from "@/lib/api"

export interface AppNotification {
  id: string
  type: string
  title: string
  body: string
  read: boolean
  refId?: string | null
  createdAt: string
}

interface NotificationState {
  notifications: AppNotification[]
  unreadCount: number
  loading: boolean
  fetchNotifications: () => Promise<void>
  fetchUnreadCount: () => Promise<void>
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    set({ loading: true })
    try {
      const data = await fetchApi("/notifications")
      set({ notifications: data, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  fetchUnreadCount: async () => {
    try {
      const data = await fetchApi("/notifications/unread-count")
      set({ unreadCount: data.count })
    } catch {
      // silent
    }
  },

  markRead: async (id: string) => {
    try {
      await fetchApi(`/notifications/${id}/read`, { method: "PUT" })
      set(state => ({
        notifications: state.notifications.map(n =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }))
    } catch {
      // silent
    }
  },

  markAllRead: async () => {
    try {
      await fetchApi("/notifications/read-all", { method: "PUT" })
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0,
      }))
    } catch {
      // silent
    }
  },
}))

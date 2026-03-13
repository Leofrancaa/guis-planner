"use client"

import { create } from "zustand"
import { fetchApi } from "@/lib/api"

export interface ClassGroupMember {
  id: string
  userId: string
  role: "MEMBER" | "LEADER"
  joinedAt: string
  user: { id: string; name: string; username: string }
}

export interface ClassGroup {
  id: string
  name: string
  institutionId: string
  leaderId: string
  leader?: { id: string; name: string; username: string }
  memberCount?: number
  myRole?: "MEMBER" | "LEADER" | null
  createdAt: string
}

interface ClassGroupState {
  classGroups: ClassGroup[]
  currentGroup: ClassGroup | null
  members: ClassGroupMember[]
  loading: boolean
  error: string | null
  fetchClassGroups: () => Promise<void>
  fetchGroup: (id: string) => Promise<void>
  fetchMembers: (id: string) => Promise<void>
  joinClassGroup: (id: string) => Promise<void>
  leaveClassGroup: (id: string) => Promise<void>
  createClassGroup: (name: string, institutionId: string) => Promise<void>
  requestClassGroup: (name: string, institutionId: string) => Promise<void>
  reportMember: (classGroupId: string, reportedUserId: string, reason: string) => Promise<void>
}

export const useClassGroupStore = create<ClassGroupState>((set) => ({
  classGroups: [],
  currentGroup: null,
  members: [],
  loading: false,
  error: null,

  fetchClassGroups: async () => {
    set({ loading: true, error: null })
    try {
      const data = await fetchApi("/class-groups")
      set({ classGroups: data, loading: false })
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : "Erro ao carregar turmas.", loading: false })
    }
  },

  fetchGroup: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const data = await fetchApi(`/class-groups/${id}`)
      set({ currentGroup: data, loading: false })
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : "Erro ao carregar turma.", loading: false })
    }
  },

  fetchMembers: async (id: string) => {
    try {
      const data = await fetchApi(`/class-groups/${id}/members`)
      set({ members: data })
    } catch {
      // silent
    }
  },

  joinClassGroup: async (id: string) => {
    await fetchApi(`/class-groups/${id}/join`, { method: "POST" })
  },

  leaveClassGroup: async (id: string) => {
    await fetchApi(`/class-groups/${id}/leave`, { method: "DELETE" })
  },

  createClassGroup: async (name: string, institutionId: string) => {
    await fetchApi("/class-groups", {
      method: "POST",
      body: JSON.stringify({ name, institutionId }),
    })
  },

  requestClassGroup: async (name: string, institutionId: string) => {
    await fetchApi("/class-groups/request", {
      method: "POST",
      body: JSON.stringify({ name, institutionId }),
    })
  },

  reportMember: async (classGroupId: string, reportedUserId: string, reason: string) => {
    await fetchApi(`/class-groups/${classGroupId}/report`, {
      method: "POST",
      body: JSON.stringify({ reportedUserId, reason }),
    })
  },
}))

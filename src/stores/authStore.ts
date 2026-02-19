import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/api/supabase'
import type { User, AgentProfile } from '@/types/database'
import { useFeatureStore } from '@/stores/featureStore'

interface AuthState {
  session: Session | null
  user: User | null
  agentProfile: AgentProfile | null
  isLoading: boolean
  isInitialized: boolean

  initialize: () => Promise<void>
  setSession: (session: Session | null) => void
  fetchUserProfile: (userId: string) => Promise<void>
  reset: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  agentProfile: null,
  isLoading: true,
  isInitialized: false,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      set({ session })

      if (session?.user) {
        await get().fetchUserProfile(session.user.id)
      }

      // Listen for auth state changes
      supabase.auth.onAuthStateChange(async (_event, session) => {
        set({ session })
        if (session?.user) {
          await get().fetchUserProfile(session.user.id)
        } else {
          set({ user: null, agentProfile: null })
          useFeatureStore.getState().setPlan('free')
        }
      })
    } finally {
      set({ isLoading: false, isInitialized: true })
    }
  },

  setSession: (session) => set({ session }),

  fetchUserProfile: async (userId) => {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('fetchUserProfile failed:', error.message, error.details)
    }

    set({ user })

    if (user?.role === 'agent' || user?.role === 'staff') {
      const { data: agentProfile } = await supabase
        .from('agent_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      set({ agentProfile })

      // Sync subscription plan to feature store
      if (agentProfile?.subscription_plan) {
        useFeatureStore.getState().setPlan(agentProfile.subscription_plan)
      }
    }
  },

  reset: () => set({
    session: null,
    user: null,
    agentProfile: null,
    isLoading: false,
  }),
}))

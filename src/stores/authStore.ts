import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/api/supabase'
import type { User, AgentProfile } from '@/types/database'
import { useFeatureStore } from '@/stores/featureStore'
import { clearCachedIds } from '@/api/helpers'

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
      let agentProfile = null

      if (user.role === 'agent') {
        const { data } = await supabase
          .from('agent_profiles')
          .select('*')
          .eq('user_id', userId)
          .single()
        agentProfile = data
      } else {
        // staff: look up via staff_members → agent_profile_id
        const { data: staffRow } = await supabase
          .from('staff_members')
          .select('agent_profile_id')
          .eq('user_id', userId)
          .single()

        if (staffRow) {
          const { data } = await supabase
            .from('agent_profiles')
            .select('*')
            .eq('id', staffRow.agent_profile_id)
            .single()
          agentProfile = data
        }
      }

      set({ agentProfile })

      // Sync subscription plan to feature store
      if (agentProfile?.subscription_plan) {
        useFeatureStore.getState().setPlan(agentProfile.subscription_plan)
      }
    }
  },

  reset: () => {
    clearCachedIds()
    set({
      session: null,
      user: null,
      agentProfile: null,
      isLoading: false,
    })
  },
}))

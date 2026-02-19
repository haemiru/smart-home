import { create } from 'zustand'
import { fetchFeatureSettings } from '@/api/settings'
import { isFeatureInPlan } from '@/config/planFeatures'
import type { PlanType } from '@/types/database'

interface FeatureState {
  features: Record<string, boolean>
  plan: PlanType
  isLoaded: boolean
  initialize: () => Promise<void>
  setPlan: (plan: PlanType) => void
  isEnabled: (key: string) => boolean
}

// Mapping from sidebar nav keys to feature_key(s)
const NAV_FEATURE_MAP: Record<string, string[]> = {
  dashboard: [], // always visible
  properties: ['properties'],
  inquiries: ['inquiries'],
  customers: ['crm'],
  contracts: ['contracts'],
  'ai-tools': ['ai_description', 'ai_legal_review', 'ai_reply_draft'],
  analytics: ['avm', 'roi_calculator', 'location_report', 'buy_sell_signal'],
  legal: ['registry', 'e_signature'],
  'co-brokerage': ['co_brokerage'],
  inspection: ['inspection'],
  'rental-mgmt': ['rental_mgmt'],
}

export const useFeatureStore = create<FeatureState>((set, get) => ({
  features: {},
  plan: 'free',
  isLoaded: false,

  initialize: async () => {
    try {
      const settings = await fetchFeatureSettings()
      const features: Record<string, boolean> = {}
      for (const s of settings) {
        features[s.feature_key] = s.is_enabled
      }
      set({ features, isLoaded: true })
    } catch {
      // Default: all enabled
      set({ isLoaded: true })
    }
  },

  setPlan: (plan: PlanType) => set({ plan }),

  isEnabled: (key: string) => {
    const { features, plan } = get()
    // Must be in plan AND manually enabled (toggle)
    if (!isFeatureInPlan(key, plan)) return false
    return features[key] !== false
  },
}))

/** Check if a sidebar nav item should be visible */
export function isNavItemVisible(navKey: string, features: Record<string, boolean>, plan: PlanType): boolean {
  const featureKeys = NAV_FEATURE_MAP[navKey]
  if (!featureKeys || featureKeys.length === 0) return true // always visible (e.g., dashboard)
  // Visible if at least one related feature is in the plan AND enabled
  return featureKeys.some((fk) => isFeatureInPlan(fk, plan) && features[fk] !== false)
}

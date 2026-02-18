import { create } from 'zustand'
import { fetchFeatureSettings } from '@/api/settings'

interface FeatureState {
  features: Record<string, boolean>
  isLoaded: boolean
  initialize: () => Promise<void>
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

  isEnabled: (key: string) => {
    const { features } = get()
    // If not loaded or not found, default to enabled
    return features[key] !== false
  },
}))

/** Check if a sidebar nav item should be visible */
export function isNavItemVisible(navKey: string, features: Record<string, boolean>): boolean {
  const featureKeys = NAV_FEATURE_MAP[navKey]
  if (!featureKeys || featureKeys.length === 0) return true // always visible (e.g., dashboard)
  // Visible if at least one related feature is enabled
  return featureKeys.some((fk) => features[fk] !== false)
}

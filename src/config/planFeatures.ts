import type { PlanType } from '@/types/database'

// Features available per plan (cumulative — each plan includes all features from lower plans)
const PLAN_FEATURES: Record<PlanType, string[]> = {
  free: [
    // Core
    'properties', 'contracts', 'crm', 'inquiries', 'contract_tracker', 'basic_valuation',
    // Floating buttons
    'fab_kakao', 'fab_naver', 'fab_phone', 'fab_inquiry',
  ],
  basic: [
    // AI tools
    'ai_description', 'ai_legal_review', 'ai_customer_analysis', 'ai_chatbot', 'ai_reply_draft',
    // Marketing & Analytics
    'avm', 'location_report', 'roi_calculator', 'buy_sell_signal',
    // Customer service
    'scoring', 'sincerity_analysis', 'inspection_booking', 'move_in_guide',
    // Field & Management
    'inspection', 'rental_mgmt',
    // Legal
    'registry',
    // Collaboration
    'co_brokerage',
    // Domain & Messaging
    'custom_domain', 'alimtalk', 'sms',
  ],
  pro: [
    'ai_staging', 'sns_posting', 'curation_alimtalk', 'realtime_chat', 'e_signature',
  ],
}

// Build cumulative feature sets
const PLAN_ORDER: PlanType[] = ['free', 'basic', 'pro']

const cumulativeFeatures: Record<PlanType, Set<string>> = {} as Record<PlanType, Set<string>>
let accumulated: string[] = []
for (const plan of PLAN_ORDER) {
  accumulated = [...accumulated, ...PLAN_FEATURES[plan]]
  cumulativeFeatures[plan] = new Set(accumulated)
}

/** Check if a feature is available in a given plan */
export function isFeatureInPlan(featureKey: string, plan: PlanType): boolean {
  return cumulativeFeatures[plan].has(featureKey)
}

/** Get the minimum plan required for a feature */
export function getRequiredPlan(featureKey: string): PlanType {
  for (const plan of PLAN_ORDER) {
    if (cumulativeFeatures[plan].has(featureKey)) return plan
  }
  return 'pro'
}

/** Maximum number of properties allowed per plan (0 = unlimited) */
export const PLAN_PROPERTY_LIMIT: Record<PlanType, number> = {
  free: 20,
  basic: 0,
  pro: 0,
}

export const PLAN_INFO: Record<PlanType, { label: string; price: number; color: string; bgColor: string; textColor: string }> = {
  free: { label: 'Free', price: 0, color: '#6B7280', bgColor: 'bg-gray-100', textColor: 'text-gray-700' },
  basic: { label: 'Basic', price: 3000, color: '#3B82F6', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
  pro: { label: 'Pro', price: 5000, color: '#8B5CF6', bgColor: 'bg-purple-100', textColor: 'text-purple-700' },
}

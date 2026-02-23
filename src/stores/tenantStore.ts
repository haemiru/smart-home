import { create } from 'zustand'
import type { TenantProfile } from '@/types/database'
import { resolveTenantFromHostname } from '@/utils/tenantResolver'
import { fetchTenantBySlug, fetchTenantByDomain, clearTenantCache } from '@/api/tenant'

export type TenantStatus = 'loading' | 'resolved' | 'not_found' | 'landing'

interface TenantState {
  tenant: TenantProfile | null
  agentId: string | null
  status: TenantStatus
  isLanding: boolean

  initialize: () => Promise<void>
  reset: () => void
}

/** Mock tenant for dev/demo when Supabase is unavailable or no slug set. */
const DEV_MOCK_TENANT: TenantProfile = {
  id: 'dev-agent-001',
  office_name: 'Smart Home Demo',
  representative: '김대표',
  address: '서울특별시 강남구 테헤란로 123',
  phone: '02-1234-5678',
  fax: null,
  logo_url: null,
  description: '개발용 데모 중개사무소입니다.',
  specialties: ['아파트', '오피스텔', '상가'],
  business_hours: null,
  subscription_plan: 'pro',
}

export const useTenantStore = create<TenantState>((set) => ({
  tenant: null,
  agentId: null,
  status: 'loading',
  isLanding: false,

  initialize: async () => {
    const source = resolveTenantFromHostname()

    switch (source.source) {
      case 'none': {
        // Platform root — show landing page
        set({ status: 'landing', isLanding: true, tenant: null, agentId: null })
        return
      }

      case 'slug': {
        const tenant = await fetchTenantBySlug(source.identifier)
        if (tenant) {
          set({ tenant, agentId: tenant.id, status: 'resolved', isLanding: false })
        } else {
          set({ status: 'not_found', isLanding: false, tenant: null, agentId: null })
        }
        return
      }

      case 'custom_domain': {
        const tenant = await fetchTenantByDomain(source.identifier)
        if (tenant) {
          set({ tenant, agentId: tenant.id, status: 'resolved', isLanding: false })
        } else {
          set({ status: 'not_found', isLanding: false, tenant: null, agentId: null })
        }
        return
      }

      case 'dev_default': {
        // Development: try env slug first, then fall back to mock
        const devSlug = import.meta.env.VITE_DEV_TENANT_SLUG as string | undefined
        if (devSlug) {
          const tenant = await fetchTenantBySlug(devSlug)
          if (tenant) {
            set({ tenant, agentId: tenant.id, status: 'resolved', isLanding: false })
            return
          }
        }
        // Fallback: use mock tenant for local development
        set({ tenant: DEV_MOCK_TENANT, agentId: DEV_MOCK_TENANT.id, status: 'resolved', isLanding: false })
        return
      }
    }
  },

  reset: () => {
    clearTenantCache()
    set({ tenant: null, agentId: null, status: 'loading', isLanding: false })
  },
}))

import { supabase } from './supabase'
import type { UserRole, StaffRole } from '@/types/database'

interface SignUpParams {
  email: string
  password: string
  displayName: string
  phone?: string
  role: UserRole
  agentData?: {
    officeName: string
    representative: string
    businessNumber: string
    licenseNumber: string
    address: string
    phone: string
  }
  staffInviteCode?: string
  staffRole?: StaffRole
}

export async function signUpWithEmail({ email, password, displayName, phone, role, agentData, staffInviteCode, staffRole }: SignUpParams) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        phone,
        role,
        ...(agentData ? { agent_data: agentData } : {}),
        ...(staffInviteCode ? { invite_code: staffInviteCode } : {}),
        ...(staffRole ? { staff_role: staffRole } : {}),
      },
    },
  })

  if (error) throw error
  if (!data.user) throw new Error('회원가입에 실패했습니다.')

  // DB trigger (handle_new_user)가 public.users에 프로필을 자동 생성합니다 (SECURITY DEFINER).
  // 이메일 확인이 활성화된 경우 세션이 없어 RLS로 upsert가 실패할 수 있으므로 non-fatal 처리합니다.
  const { error: profileError } = await supabase.from('users').upsert({
    id: data.user.id,
    email,
    role,
    display_name: displayName,
    phone: phone ?? null,
  }, { onConflict: 'id' })

  if (profileError) {
    console.warn('Profile upsert skipped (DB trigger will handle):', profileError.message)
  }

  // Create agent profile if role is agent
  if (role === 'agent' && agentData) {
    const { error: agentError } = await supabase.from('agent_profiles').insert({
      user_id: data.user.id,
      office_name: agentData.officeName,
      representative: agentData.representative,
      business_number: agentData.businessNumber,
      license_number: agentData.licenseNumber,
      address: agentData.address,
      phone: agentData.phone,
      is_verified: false,
      subscription_plan: 'free',
    })

    if (agentError) {
      console.warn('Agent profile creation deferred:', agentError.message)
    }
  }

  // Safety net for staff: try client-side staff_members insert (non-fatal, trigger should handle it)
  if (role === 'staff' && staffInviteCode) {
    const validated = await validateInviteCode(staffInviteCode)

    if (validated) {
      const resolvedStaffRole = staffRole ?? 'assistant'
      const permissions = resolvedStaffRole === 'associate_agent'
        ? {
            property_create: true, property_delete: false,
            contract_create: true, contract_approve: false, e_signature: false,
            customer_view: true, ai_tools: true, co_brokerage: false, settings: false,
          }
        : {
            property_create: true, property_delete: false,
            contract_create: false, contract_approve: false, e_signature: false,
            customer_view: true, ai_tools: false, co_brokerage: false, settings: false,
          }

      const { error: staffError } = await supabase.from('staff_members').insert({
        agent_profile_id: validated.agentProfileId,
        user_id: data.user.id,
        role: resolvedStaffRole,
        permissions,
        is_active: true,
      })

      if (staffError) {
        console.warn('Staff member creation deferred (trigger may have handled):', staffError.message)
      }
    }
  }

  return data
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

export async function getAgentProfile(userId: string) {
  const { data, error } = await supabase
    .from('agent_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) throw error
  return data
}

export async function validateInviteCode(code: string): Promise<{ officeName: string; agentProfileId: string } | null> {
  const { data, error } = await supabase.rpc('validate_invite_code', {
    _code: code.toUpperCase(),
  })

  if (error || !data || data.length === 0) return null

  const row = data[0] as { office_name: string; agent_profile_id: string }
  return { officeName: row.office_name, agentProfileId: row.agent_profile_id }
}

import { supabase } from './supabase'
import type { UserRole } from '@/types/database'

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
}

export async function signUpWithEmail({ email, password, displayName, phone, role, agentData }: SignUpParams) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        phone,
        role,
        ...(agentData ? { agent_data: agentData } : {}),
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

  return data
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
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

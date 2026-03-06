import { supabase } from './supabase'

const BUCKET = 'property-photos'
const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png']

export function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'JPG, PNG 파일만 업로드할 수 있습니다.'
  }
  if (file.size > MAX_SIZE) {
    return '파일 크기는 10MB 이하여야 합니다.'
  }
  return null
}

export async function uploadPropertyPhoto(file: File, agentId: string): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const timestamp = Date.now()
  const random = Math.random().toString(36).slice(2, 8)
  const path = `${agentId}/${timestamp}-${random}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    contentType: file.type,
  })
  if (error) throw new Error(`업로드 실패: ${error.message}`)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

const LOGO_BUCKET = 'property-photos' // reuse bucket, logos stored under {agentId}/logo/
const LOGO_MAX_SIZE = 2 * 1024 * 1024 // 2MB

export async function uploadLogo(file: File, agentId: string): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error('JPG, PNG 파일만 업로드할 수 있습니다.')
  if (file.size > LOGO_MAX_SIZE) throw new Error('파일 크기는 2MB 이하여야 합니다.')

  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  const path = `${agentId}/logo/office-logo.${ext}`

  // Overwrite existing logo
  const { error } = await supabase.storage.from(LOGO_BUCKET).upload(path, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: true,
  })
  if (error) throw new Error(`로고 업로드 실패: ${error.message}`)

  const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path)
  // Append cache-bust to force reload
  return `${data.publicUrl}?t=${Date.now()}`
}

export async function deletePropertyPhoto(url: string): Promise<void> {
  // Extract path from public URL: .../object/public/property-photos/{path}
  const marker = `/object/public/${BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return

  const path = url.slice(idx + marker.length)
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) throw new Error(`삭제 실패: ${error.message}`)
}

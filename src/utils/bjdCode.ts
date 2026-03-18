/** 주소에서 법정동코드를 추출 (카카오 지오코딩 API 활용) */
export async function getBjdCodeFromAddress(address: string): Promise<{
  bjdCode: string    // 10-digit 법정동코드
  lawdCd: string     // 5-digit 시군구코드 (국토부 API용)
  regionName: string // 예: "서울특별시 서초구 서초동"
} | null> {
  try {
    const res = await fetch(`/api/geocode?query=${encodeURIComponent(address)}`)
    const data = await res.json()

    const doc = data.documents?.[0]
    if (!doc) return null

    // 도로명 주소 → address 필드, 지번 주소 → address 필드
    const addr = doc.address || doc.road_address
    if (!addr?.b_code) return null

    const bjdCode = addr.b_code as string // 10-digit
    return {
      bjdCode,
      lawdCd: bjdCode.slice(0, 5),
      regionName: `${addr.region_1depth_name} ${addr.region_2depth_name} ${addr.region_3depth_name}`.trim(),
    }
  } catch {
    return null
  }
}

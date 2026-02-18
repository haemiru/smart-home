import { useState, useEffect } from 'react'
import type { Property } from '@/types/database'
import { fetchProperties } from '@/api/properties'
import { generateContent, saveGenerationLog } from '@/api/gemini'
import { Button } from '@/components/common'
import { transactionTypeLabel, formatPrice, formatArea } from '@/utils/format'
import toast from 'react-hot-toast'

type Platform = 'blog' | 'naver' | 'instagram'
type Tone = 'professional' | 'friendly' | 'emotional'

const platformLabel: Record<Platform, string> = {
  blog: '블로그',
  naver: '네이버부동산',
  instagram: '인스타그램',
}

const toneLabel: Record<Tone, string> = {
  professional: '전문적',
  friendly: '친근한',
  emotional: '감성적',
}

const SYSTEM_PROMPT = `당신은 대한민국 부동산 마케팅 전문가입니다. 공인중개사법 제18조의2 표시·광고 규정을 준수하며, 허위·과장 없이 매력적인 홍보 문구를 작성합니다.

규정 준수 사항:
- 소재지, 면적, 가격, 거래 유형 등 기본 정보를 정확히 포함
- "최고", "최저", "확정", "보장" 등 단정적 표현 금지
- 실제 정보에 기반한 내용만 작성
- 중개대상물의 장점을 사실에 근거하여 매력적으로 표현`

export function AIDescriptionPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showPropertyList, setShowPropertyList] = useState(false)

  // Manual input fields
  const [manualInput, setManualInput] = useState({
    propertyType: '',
    area: '',
    rooms: '',
    floor: '',
    direction: '',
    nearStation: false,
    features: '',
  })

  const [platform, setPlatform] = useState<Platform>('blog')
  const [tone, setTone] = useState<Tone>('professional')
  const [isGenerating, setIsGenerating] = useState(false)
  const [results, setResults] = useState<string[]>([])

  useEffect(() => {
    fetchProperties({}, 'newest', 1, 100).then(({ data }) => setProperties(data))
  }, [])

  const filteredProperties = searchQuery
    ? properties.filter((p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.address.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : properties

  const selectProperty = (p: Property) => {
    setSelectedProperty(p)
    setShowPropertyList(false)
    setSearchQuery('')
    // Auto-fill manual input from property
    setManualInput({
      propertyType: p.category_id || '',
      area: p.exclusive_area_m2 ? `${p.exclusive_area_m2}㎡` : '',
      rooms: p.rooms ? `${p.rooms}` : '',
      floor: p.floor ? `${p.floor}층/${p.total_floors}층` : '',
      direction: p.direction || '',
      nearStation: p.tags?.includes('역세권') || false,
      features: [
        ...(p.options || []),
        ...(p.tags || []),
        p.has_elevator ? '엘리베이터' : '',
        p.pets_allowed ? '반려동물 가능' : '',
      ].filter(Boolean).join(', '),
    })
  }

  const buildPrompt = (): string => {
    const info = selectedProperty
      ? `매물명: ${selectedProperty.title}
주소: ${selectedProperty.address}
거래유형: ${transactionTypeLabel[selectedProperty.transaction_type]}
가격: ${selectedProperty.transaction_type === 'sale'
  ? formatPrice(selectedProperty.sale_price)
  : selectedProperty.transaction_type === 'jeonse'
    ? formatPrice(selectedProperty.deposit)
    : `보증금 ${formatPrice(selectedProperty.deposit)} / 월세 ${formatPrice(selectedProperty.monthly_rent)}`}
면적: ${selectedProperty.exclusive_area_m2 ? formatArea(selectedProperty.exclusive_area_m2) : '-'}
방수: ${selectedProperty.rooms || '-'}
층수: ${selectedProperty.floor ? `${selectedProperty.floor}층/${selectedProperty.total_floors}층` : '-'}
방향: ${selectedProperty.direction || '-'}
옵션: ${selectedProperty.options?.join(', ') || '-'}
태그: ${selectedProperty.tags?.join(', ') || '-'}
기존 설명: ${selectedProperty.description || '없음'}`
      : `매물유형: ${manualInput.propertyType}
면적: ${manualInput.area}
방수: ${manualInput.rooms}
층수: ${manualInput.floor}
방향: ${manualInput.direction}
역세권: ${manualInput.nearStation ? '예' : '아니오'}
특징: ${manualInput.features}`

    return `아래 매물 정보를 기반으로 ${platformLabel[platform]}용 홍보 문구를 3가지 버전으로 작성해주세요.

톤: ${toneLabel[tone]}

${info}

각 버전은 "---" 구분자로 나누어 작성해주세요.
${platform === 'blog' ? '블로그 형식: 제목 + 본문(300-500자). 해시태그 5-10개 포함.' : ''}
${platform === 'naver' ? '네이버부동산 형식: 간결하고 핵심 정보 중심(200-300자). 법적 표기 사항 포함.' : ''}
${platform === 'instagram' ? '인스타그램 형식: 짧고 임팩트 있게(100-200자). 이모지 활용, 해시태그 10-15개.' : ''}`
  }

  const handleGenerate = async () => {
    if (!selectedProperty && !manualInput.propertyType) {
      toast.error('매물을 선택하거나 매물 특징을 입력해주세요.')
      return
    }

    setIsGenerating(true)
    setResults([])

    try {
      const prompt = buildPrompt()
      const text = await generateContent(prompt, SYSTEM_PROMPT)

      // Split by "---" separator
      const versions = text.split('---').map((v) => v.trim()).filter(Boolean)
      setResults(versions.length > 0 ? versions : [text])

      // Save log
      await saveGenerationLog({
        type: 'description',
        input_data: {
          property_id: selectedProperty?.id,
          platform,
          tone,
          manual_input: selectedProperty ? undefined : manualInput,
        },
        output_text: text,
      })

      toast.success('홍보 문구가 생성되었습니다.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'AI 생성 중 오류가 발생했습니다.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('클립보드에 복사되었습니다.')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">AI 매물 설명 생성기</h1>
        <p className="mt-1 text-sm text-gray-500">매물 정보를 입력하면 플랫폼별 맞춤 홍보 문구를 자동으로 생성합니다.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Input */}
        <div className="space-y-5 lg:col-span-2">
          {/* Property Selection */}
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <h2 className="mb-3 text-sm font-bold">매물 선택</h2>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowPropertyList(true) }}
                onFocus={() => setShowPropertyList(true)}
                placeholder="매물명 또는 주소로 검색..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
              {showPropertyList && (
                <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                  {filteredProperties.slice(0, 10).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => selectProperty(p)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-gray-50"
                    >
                      <img
                        src={p.photos?.[0] || 'https://placehold.co/40x30/e2e8f0/94a3b8?text=img'}
                        alt=""
                        className="h-8 w-10 shrink-0 rounded object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{p.title}</p>
                        <p className="truncate text-xs text-gray-400">{p.address}</p>
                      </div>
                    </button>
                  ))}
                  {filteredProperties.length === 0 && (
                    <p className="px-3 py-4 text-center text-xs text-gray-400">검색 결과가 없습니다.</p>
                  )}
                </div>
              )}
            </div>

            {selectedProperty && (
              <div className="mt-3 flex items-center gap-3 rounded-lg bg-primary-50 p-3">
                <img
                  src={selectedProperty.photos?.[0] || 'https://placehold.co/60x45/e2e8f0/94a3b8?text=img'}
                  alt=""
                  className="h-12 w-16 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{selectedProperty.title}</p>
                  <p className="text-xs text-gray-500">{selectedProperty.address}</p>
                  <p className="text-xs font-bold text-primary-700">
                    {transactionTypeLabel[selectedProperty.transaction_type]}{' '}
                    {formatPrice(selectedProperty.transaction_type === 'sale' ? selectedProperty.sale_price : selectedProperty.deposit)}
                  </p>
                </div>
                <button onClick={() => setSelectedProperty(null)} className="text-sm text-gray-400 hover:text-gray-600">✕</button>
              </div>
            )}

            {!selectedProperty && (
              <div className="mt-4 space-y-3">
                <p className="text-xs font-medium text-gray-500">또는 직접 입력</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-gray-400">매물유형</label>
                    <input
                      type="text"
                      value={manualInput.propertyType}
                      onChange={(e) => setManualInput({ ...manualInput, propertyType: e.target.value })}
                      placeholder="예: 아파트, 오피스텔"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-400">면적</label>
                    <input
                      type="text"
                      value={manualInput.area}
                      onChange={(e) => setManualInput({ ...manualInput, area: e.target.value })}
                      placeholder="예: 84㎡"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-400">방수/층수</label>
                    <input
                      type="text"
                      value={manualInput.rooms}
                      onChange={(e) => setManualInput({ ...manualInput, rooms: e.target.value })}
                      placeholder="예: 3룸, 10층/20층"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-400">방향</label>
                    <input
                      type="text"
                      value={manualInput.direction}
                      onChange={(e) => setManualInput({ ...manualInput, direction: e.target.value })}
                      placeholder="예: 남향"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">특징 (올수리, 풀옵션, 역세권 등)</label>
                  <input
                    type="text"
                    value={manualInput.features}
                    onChange={(e) => setManualInput({ ...manualInput, features: e.target.value })}
                    placeholder="쉼표로 구분하여 입력"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold">생성 결과</h2>
              {results.map((text, idx) => (
                <div key={idx} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-md bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700">
                      버전 {idx + 1}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopy(text)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                      >
                        복사
                      </button>
                      {selectedProperty && (
                        <button
                          onClick={() => {
                            toast.success('매물 설명에 적용되었습니다.')
                          }}
                          className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
                        >
                          매물 설명에 적용
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{text}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Settings */}
        <div className="space-y-5">
          {/* Platform Selection */}
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <h2 className="mb-3 text-sm font-bold">타겟 플랫폼</h2>
            <div className="space-y-2">
              {(Object.keys(platformLabel) as Platform[]).map((p) => (
                <label
                  key={p}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg p-3 transition-colors ${
                    platform === p ? 'bg-primary-50 ring-1 ring-primary-200' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="platform"
                    checked={platform === p}
                    onChange={() => setPlatform(p)}
                    className="h-4 w-4 text-primary-600"
                  />
                  <span className="text-sm font-medium">{platformLabel[p]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tone Selection */}
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <h2 className="mb-3 text-sm font-bold">톤 선택</h2>
            <div className="space-y-2">
              {(Object.keys(toneLabel) as Tone[]).map((t) => (
                <label
                  key={t}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg p-3 transition-colors ${
                    tone === t ? 'bg-primary-50 ring-1 ring-primary-200' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="tone"
                    checked={tone === t}
                    onChange={() => setTone(t)}
                    className="h-4 w-4 text-primary-600"
                  />
                  <span className="text-sm font-medium">{toneLabel[t]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button className="w-full" onClick={handleGenerate} isLoading={isGenerating}>
            {isGenerating ? 'AI 생성 중...' : '홍보 문구 생성하기'}
          </Button>

          {/* Info */}
          <div className="rounded-lg bg-blue-50 p-3">
            <p className="text-xs text-blue-700">
              공인중개사법 제18조의2 표시·광고 규정을 준수하여 생성됩니다. 생성된 내용은 반드시 확인 후 사용하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

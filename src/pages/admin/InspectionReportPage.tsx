import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchInspectionById, saveAIComment, checklistTemplate } from '@/api/inspections'
import { generateContent } from '@/api/gemini'
import type { Inspection, CheckItemStatus } from '@/types/database'
import { formatDate, checkItemStatusLabel, checkItemStatusColor, inspectionGradeLabel, inspectionGradeColor } from '@/utils/format'
import toast from 'react-hot-toast'

export function InspectionReportPage() {
  const { id } = useParams<{ id: string }>()
  const [inspection, setInspection] = useState<Inspection | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)

  useEffect(() => {
    if (!id) return
    fetchInspectionById(id).then((data) => {
      setInspection(data)
      setIsLoading(false)
    })
  }, [id])

  const handleGenerateAI = async () => {
    if (!inspection || !id) return
    setIsGeneratingAI(true)
    try {
      const checklistSummary = checklistTemplate.map((cat) => {
        const items = inspection.checklist.filter((i) => i.category === cat.category)
        const details = items.map((i) => `- ${i.label}: ${i.status ? checkItemStatusLabel[i.status] : '미점검'}${i.note ? ` (${i.note})` : ''}`).join('\n')
        return `[${cat.category}]\n${details}`
      }).join('\n\n')

      const prompt = `다음은 부동산 매물 임장 체크리스트 결과입니다.

매물: ${inspection.property_title}
주소: ${inspection.address}
종합 등급: ${inspection.grade} (${inspectionGradeLabel[inspection.grade ?? 'C']})
점검일: ${formatDate(inspection.completed_date)}

${checklistSummary}

중개사 종합 의견: ${inspection.overall_comment ?? '없음'}

위 체크리스트를 분석하여 다음을 포함한 전문적인 소견을 작성해주세요:
1. 전체적인 매물 상태 요약 (2~3문장)
2. 특별히 주의해야 할 사항 (불량/보통 항목 중심)
3. 입주 전 수리/보수 권장 사항
4. 매수/임차 시 참고할 협상 포인트

한국어로 작성하고, 공인중개사 관점에서 실용적으로 작성해주세요.`

      const result = await generateContent(prompt, '부동산 매물 상태 분석 전문가입니다.')
      await saveAIComment(id, result)
      setInspection((prev) => prev ? { ...prev, ai_comment: result } : null)
      toast.success('AI 소견이 생성되었습니다.')
    } catch {
      toast.error('AI 소견 생성에 실패했습니다.')
    } finally {
      setIsGeneratingAI(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    )
  }

  if (!inspection) {
    return <div className="flex h-64 items-center justify-center text-gray-400">임장 정보를 찾을 수 없습니다.</div>
  }

  // Stats
  const rated = inspection.checklist.filter((c) => c.status !== null)
  const goodCount = rated.filter((c) => c.status === 'good').length
  const normalCount = rated.filter((c) => c.status === 'normal').length
  const badCount = rated.filter((c) => c.status === 'bad').length
  const goodPercent = rated.length > 0 ? Math.round((goodCount / rated.length) * 100) : 0
  const normalPercent = rated.length > 0 ? Math.round((normalCount / rated.length) * 100) : 0
  const badPercent = rated.length > 0 ? Math.round((badCount / rated.length) * 100) : 0

  // Category stats
  const categoryStats = checklistTemplate.map((cat) => {
    const items = inspection.checklist.filter((i) => i.category === cat.category)
    const catRated = items.filter((i) => i.status !== null)
    const catGood = catRated.filter((i) => i.status === 'good').length
    const catBad = catRated.filter((i) => i.status === 'bad').length
    return {
      name: cat.category,
      total: items.length,
      rated: catRated.length,
      good: catGood,
      bad: catBad,
      goodPercent: catRated.length > 0 ? Math.round((catGood / catRated.length) * 100) : 0,
    }
  })

  // Items needing attention
  const attentionItems = inspection.checklist.filter((c) => c.status === 'bad' || c.status === 'normal')

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">매물 상태 보고서</h1>
          <p className="mt-1 text-sm text-gray-500">{inspection.property_title}</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200">
            PDF 다운로드
          </button>
          <button className="rounded-lg bg-primary-600 px-3 py-2 text-xs font-medium text-white hover:bg-primary-700">
            고객에게 전송
          </button>
        </div>
      </div>

      {/* Grade Card */}
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">종합 등급</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className={`text-5xl font-black ${inspectionGradeColor[inspection.grade ?? 'C']}`}>
                {inspection.grade ?? '-'}
              </span>
              <span className={`text-lg font-bold ${inspectionGradeColor[inspection.grade ?? 'C']}`}>
                {inspectionGradeLabel[inspection.grade ?? 'C']}
              </span>
            </div>
          </div>
          <div className="text-right text-xs text-gray-400">
            <p>점검일: {formatDate(inspection.completed_date)}</p>
            <p>주소: {inspection.address}</p>
          </div>
        </div>

        {/* Overall stats */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-green-50 p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{goodCount}</p>
            <p className="text-xs text-green-600">양호 ({goodPercent}%)</p>
          </div>
          <div className="rounded-lg bg-yellow-50 p-3 text-center">
            <p className="text-2xl font-bold text-yellow-600">{normalCount}</p>
            <p className="text-xs text-yellow-600">보통 ({normalPercent}%)</p>
          </div>
          <div className="rounded-lg bg-red-50 p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{badCount}</p>
            <p className="text-xs text-red-600">불량 ({badPercent}%)</p>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <h2 className="mb-4 text-sm font-bold">카테고리별 점검 결과</h2>
        <div className="space-y-3">
          {categoryStats.map((cat) => (
            <div key={cat.name}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium">{cat.name}</span>
                <span className="text-gray-400">{cat.good}/{cat.rated} 양호</span>
              </div>
              <div className="flex h-4 overflow-hidden rounded-full bg-gray-100">
                {cat.rated > 0 && (
                  <>
                    <div
                      className="h-full bg-green-400"
                      style={{ width: `${(cat.good / cat.total) * 100}%` }}
                    />
                    <div
                      className="h-full bg-yellow-400"
                      style={{ width: `${((cat.rated - cat.good - cat.bad) / cat.total) * 100}%` }}
                    />
                    <div
                      className="h-full bg-red-400"
                      style={{ width: `${(cat.bad / cat.total) * 100}%` }}
                    />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attention Items */}
      {attentionItems.length > 0 && (
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <h2 className="mb-4 text-sm font-bold text-orange-600">주의/불량 항목</h2>
          <div className="space-y-2">
            {attentionItems.map((item) => (
              <div key={item.id} className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
                <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${checkItemStatusColor[item.status as CheckItemStatus]}`}>
                  {checkItemStatusLabel[item.status as string]}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.category}</p>
                  {item.note && <p className="mt-1 text-xs text-gray-600">{item.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overall Comment */}
      {inspection.overall_comment && (
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <h2 className="mb-2 text-sm font-bold">중개사 종합 의견</h2>
          <p className="whitespace-pre-wrap text-sm text-gray-700">{inspection.overall_comment}</p>
        </div>
      )}

      {/* AI Comment */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold">AI 종합 소견</h2>
          <button
            onClick={handleGenerateAI}
            disabled={isGeneratingAI}
            className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {isGeneratingAI ? 'AI 분석 중...' : inspection.ai_comment ? 'AI 소견 재생성' : 'AI 소견 생성'}
          </button>
        </div>
        {inspection.ai_comment ? (
          <div className="whitespace-pre-wrap rounded-lg bg-purple-50 p-4 text-sm text-gray-700">
            {inspection.ai_comment}
          </div>
        ) : (
          <p className="text-sm text-gray-400">AI 소견을 생성하면 체크리스트 데이터를 기반으로 전문적인 분석이 제공됩니다.</p>
        )}
      </div>

      {/* Back Link */}
      <div className="pb-6">
        <Link to="/admin/inspection" className="text-sm text-primary-600 hover:underline">
          임장 목록으로 돌아가기
        </Link>
      </div>
    </div>
  )
}

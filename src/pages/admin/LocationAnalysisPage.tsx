import { useState } from 'react'
import { analyzeLocation } from '@/utils/marketMockData'
import type { LocationAnalysis } from '@/utils/marketMockData'
import { Button } from '@/components/common'
import toast from 'react-hot-toast'

const gradeColor: Record<string, string> = {
  'A+': 'text-green-600 bg-green-100',
  'A': 'text-green-600 bg-green-100',
  'B+': 'text-blue-600 bg-blue-100',
  'B': 'text-blue-600 bg-blue-100',
  'C+': 'text-yellow-600 bg-yellow-100',
  'C': 'text-yellow-600 bg-yellow-100',
  'D': 'text-orange-600 bg-orange-100',
  'F': 'text-red-600 bg-red-100',
}

const scoreBarColor = (score: number): string => {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-blue-500'
  if (score >= 40) return 'bg-yellow-500'
  return 'bg-red-500'
}

const categoryIcon: Record<string, string> = {
  transport: '🚇',
  school: '🏫',
  amenity: '🏪',
  foot_traffic: '🚶',
  development: '🏗️',
  safety: '🔒',
}

export function LocationAnalysisPage() {
  const [address, setAddress] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<LocationAnalysis | null>(null)

  const presetAddresses = [
    '서울 강남구 대치동 123',
    '서울 서초구 반포동 456',
    '서울 송파구 잠실동 789',
    '서울 마포구 아현동 101',
    '서울 강동구 둔촌동 202',
  ]

  const handleAnalyze = async () => {
    if (!address.trim()) {
      toast.error('주소를 입력해주세요.')
      return
    }
    setIsAnalyzing(true)
    // Simulate API delay
    await new Promise((r) => setTimeout(r, 800))
    const analysis = analyzeLocation(address)
    setResult(analysis)
    setIsAnalyzing(false)
  }

  const handlePDFDownload = () => {
    toast.success('PDF 다운로드 기능은 추후 구현 예정입니다.')
  }

  const handleShareLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/report/location?address=${encodeURIComponent(address)}`)
    toast.success('공유 링크가 복사되었습니다.')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">상권 및 입지 분석</h1>
        <p className="mt-1 text-sm text-gray-500">주소를 입력하면 교통, 학군, 편의시설, 유동인구 등 입지 요소를 종합 분석합니다.</p>
      </div>

      {/* Address Input */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <div className="flex gap-3">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder="분석할 주소를 입력하세요 (예: 서울 강남구 대치동 123)"
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
          <Button onClick={handleAnalyze} isLoading={isAnalyzing}>
            분석 실행
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs text-gray-400">빠른 선택:</span>
          {presetAddresses.map((addr) => (
            <button
              key={addr}
              onClick={() => { setAddress(addr); setResult(null) }}
              className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 hover:bg-gray-200"
            >
              {addr}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Total Score Card */}
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs text-gray-400">분석 주소</p>
                <p className="mt-1 text-sm font-semibold">{result.address}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-400">종합 점수</p>
                  <p className="text-4xl font-bold text-primary-700">{result.totalScore}</p>
                </div>
                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold ${gradeColor[result.grade] ?? 'text-gray-600 bg-gray-100'}`}>
                  {result.grade}
                </div>
              </div>
            </div>

            {/* Total Score Bar */}
            <div className="mt-4">
              <div className="h-4 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full transition-all ${scoreBarColor(result.totalScore)}`}
                  style={{ width: `${result.totalScore}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                <span>0</span>
                <span>20</span>
                <span>40</span>
                <span>60</span>
                <span>80</span>
                <span>100</span>
              </div>
            </div>
          </div>

          {/* Category Scores */}
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <h2 className="mb-5 text-sm font-bold">항목별 분석</h2>
            <div className="space-y-5">
              {result.scores.map((s) => (
                <div key={s.category}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{categoryIcon[s.category] ?? '📋'}</span>
                      <span className="text-sm font-semibold">{s.label}</span>
                    </div>
                    <span className={`text-sm font-bold ${s.score >= 80 ? 'text-green-600' : s.score >= 60 ? 'text-blue-600' : s.score >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {s.score}점
                    </span>
                  </div>
                  <div className="mb-1 h-3 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full transition-all ${scoreBarColor(s.score)}`}
                      style={{ width: `${s.score}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">{s.details}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Score Grid */}
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {result.scores.map((s) => (
              <div key={s.category} className="rounded-xl bg-white p-4 text-center shadow-sm ring-1 ring-gray-200">
                <span className="text-2xl">{categoryIcon[s.category]}</span>
                <p className="mt-1 text-xs font-medium text-gray-500">{s.label}</p>
                <p className={`mt-1 text-2xl font-bold ${s.score >= 80 ? 'text-green-600' : s.score >= 60 ? 'text-blue-600' : s.score >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {s.score}
                </p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handlePDFDownload} variant="outline">
              PDF 다운로드
            </Button>
            <Button onClick={handleShareLink} variant="outline">
              고객 공유 링크 생성
            </Button>
          </div>

          {/* Disclaimer */}
          <div className="rounded-lg bg-amber-50 p-3">
            <p className="text-xs text-amber-700">
              본 분석 결과는 목업 데이터 기반이며, 실제 투자 판단의 근거로 사용할 수 없습니다.
              정확한 입지 분석은 현장 확인과 전문가 자문을 권장합니다.
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!result && !isAnalyzing && (
        <div className="flex h-64 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
          <div className="text-center">
            <p className="text-3xl">📍</p>
            <p className="mt-2 text-sm text-gray-500">주소를 입력하고 [분석 실행] 버튼을 클릭하세요.</p>
            <p className="text-xs text-gray-400">교통, 학군, 편의시설, 유동인구, 개발호재, 치안 6개 항목을 분석합니다.</p>
          </div>
        </div>
      )}
    </div>
  )
}

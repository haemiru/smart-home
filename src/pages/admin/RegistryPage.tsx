import { useState } from 'react'
import { lookupRegistry } from '@/api/legal'
import type { RegistryResult } from '@/api/legal'
import { formatPrice } from '@/utils/format'
import toast from 'react-hot-toast'

const presetAddresses = [
  '서울 강남구 대치동 890-5 래미안 대치팰리스',
  '서울 서초구 반포동 123-4 힐스테이트 클래시안',
  '서울 강남구 역삼동 123-4 역삼타워',
  '서울 서초구 반포동 45-2 반포 자이 아파트',
]

const riskBg: Record<string, string> = {
  safe: '',
  caution: 'bg-orange-50',
  danger: 'bg-red-50',
}

const riskText: Record<string, string> = {
  safe: 'text-gray-700',
  caution: 'text-orange-700 font-semibold',
  danger: 'text-red-700 font-bold',
}

const riskBadge: Record<string, string> = {
  safe: 'bg-green-100 text-green-700',
  caution: 'bg-orange-100 text-orange-700',
  danger: 'bg-red-100 text-red-700',
}

const riskLabel: Record<string, string> = {
  safe: '안전',
  caution: '주의',
  danger: '위험',
}

export function RegistryPage() {
  const [address, setAddress] = useState('')
  const [result, setResult] = useState<RegistryResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleLookup = async () => {
    if (!address.trim()) {
      toast.error('주소를 입력해주세요.')
      return
    }
    setIsLoading(true)
    try {
      const data = await lookupRegistry(address)
      setResult(data)
    } catch {
      toast.error('조회에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">등기부등본 확인</h1>
        <p className="mt-1 text-sm text-gray-500">매물 주소를 입력하면 등기부등본의 갑구(소유권)·을구(제한물권)를 조회합니다.</p>
      </div>

      {/* Search */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <div className="flex gap-3">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
            placeholder="매물 주소 입력..."
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
          <button
            onClick={handleLookup}
            disabled={isLoading}
            className="shrink-0 rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {isLoading ? '조회 중...' : '조회'}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {presetAddresses.map((addr) => (
            <button
              key={addr}
              onClick={() => { setAddress(addr); setResult(null) }}
              className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 hover:bg-gray-200"
            >
              {addr.split(' ').slice(-1)[0]}
            </button>
          ))}
        </div>
      </div>

      {result && (
        <>
          {/* Property Summary */}
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-bold">부동산 정보</h2>
                <div className="mt-2 space-y-1 text-sm">
                  <p><span className="text-gray-400">주소:</span> {result.address}</p>
                  <p><span className="text-gray-400">유형:</span> {result.propertyType}</p>
                  <p><span className="text-gray-400">면적:</span> {result.area}</p>
                  <p><span className="text-gray-400">소유자:</span> {result.owner}</p>
                  <p><span className="text-gray-400">취득일:</span> {result.ownershipDate}</p>
                </div>
              </div>
              <div className={`rounded-xl p-4 text-center ${result.summary.riskLevel === 'danger' ? 'bg-red-50' : result.summary.riskLevel === 'caution' ? 'bg-orange-50' : 'bg-green-50'}`}>
                <p className="text-xs text-gray-400">종합 위험도</p>
                <p className={`mt-1 text-2xl font-bold ${result.summary.riskLevel === 'danger' ? 'text-red-600' : result.summary.riskLevel === 'caution' ? 'text-orange-600' : 'text-green-600'}`}>
                  {riskLabel[result.summary.riskLevel]}
                </p>
              </div>
            </div>
          </div>

          {/* Risk Alerts */}
          {(result.summary.hasSeizure || result.summary.hasProvisionalDisposition) && (
            <div className="rounded-xl bg-red-50 p-4 ring-1 ring-red-200">
              <h3 className="text-sm font-bold text-red-700">위험 요소 감지</h3>
              <ul className="mt-2 space-y-1 text-sm text-red-600">
                {result.summary.hasSeizure && <li>가압류/가처분이 설정되어 있습니다.</li>}
                {result.summary.hasProvisionalDisposition && <li>가처분 결정이 등기되어 있습니다.</li>}
              </ul>
            </div>
          )}

          {/* 갑구 (소유권) */}
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <h2 className="mb-4 text-sm font-bold">갑구 (소유권 관련)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs text-gray-400">
                    <th className="pb-2 pr-3">순위</th>
                    <th className="pb-2 pr-3">등기목적</th>
                    <th className="pb-2 pr-3">접수일</th>
                    <th className="pb-2 pr-3">권리자</th>
                    <th className="pb-2">위험</th>
                  </tr>
                </thead>
                <tbody>
                  {result.gap.entries.map((entry) => (
                    <tr key={entry.order} className={`border-b border-gray-100 ${riskBg[entry.riskLevel]}`}>
                      <td className="py-2.5 pr-3">{entry.order}</td>
                      <td className={`py-2.5 pr-3 font-medium ${riskText[entry.riskLevel]}`}>{entry.purpose}</td>
                      <td className="py-2.5 pr-3 text-xs text-gray-500">{entry.receivedDate}</td>
                      <td className="py-2.5 pr-3 text-xs">{entry.holder}</td>
                      <td className="py-2.5">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${riskBadge[entry.riskLevel]}`}>
                          {riskLabel[entry.riskLevel]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 을구 (제한물권) */}
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <h2 className="mb-4 text-sm font-bold">을구 (제한물권 관련)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs text-gray-400">
                    <th className="pb-2 pr-3">순위</th>
                    <th className="pb-2 pr-3">등기목적</th>
                    <th className="pb-2 pr-3">접수일</th>
                    <th className="pb-2 pr-3">권리자</th>
                    <th className="pb-2 pr-3">금액</th>
                    <th className="pb-2">위험</th>
                  </tr>
                </thead>
                <tbody>
                  {result.eul.entries.map((entry) => (
                    <tr key={entry.order} className={`border-b border-gray-100 ${riskBg[entry.riskLevel]}`}>
                      <td className="py-2.5 pr-3">{entry.order}</td>
                      <td className={`py-2.5 pr-3 font-medium ${riskText[entry.riskLevel]}`}>{entry.purpose}</td>
                      <td className="py-2.5 pr-3 text-xs text-gray-500">{entry.receivedDate}</td>
                      <td className="py-2.5 pr-3 text-xs">{entry.holder}</td>
                      <td className="py-2.5 pr-3 text-xs">{entry.amount ?? '-'}</td>
                      <td className="py-2.5">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${riskBadge[entry.riskLevel]}`}>
                          {riskLabel[entry.riskLevel]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <h2 className="mb-3 text-sm font-bold">요약 분석</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-400">근저당 총액</p>
                <p className="mt-1 text-sm font-bold">{formatPrice(result.summary.totalMortgage)}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-400">가압류/가처분</p>
                <p className={`mt-1 text-sm font-bold ${result.summary.hasSeizure ? 'text-red-600' : 'text-green-600'}`}>
                  {result.summary.hasSeizure ? '있음' : '없음'}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-400">종합 위험도</p>
                <p className={`mt-1 text-sm font-bold ${result.summary.riskLevel === 'danger' ? 'text-red-600' : result.summary.riskLevel === 'caution' ? 'text-orange-600' : 'text-green-600'}`}>
                  {riskLabel[result.summary.riskLevel]}
                </p>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="rounded-lg bg-amber-50 p-4">
            <p className="text-xs text-amber-700">
              본 조회 결과는 목업 데이터입니다. 실제 등기부등본은 대한민국 법원 인터넷등기소(iros.go.kr)에서 확인하시기 바랍니다.
              추후 API 연동 시 실시간 데이터로 대체됩니다.
            </p>
          </div>
        </>
      )}
    </div>
  )
}

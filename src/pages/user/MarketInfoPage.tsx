import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Area, ComposedChart, Legend } from 'recharts'
import { complexList, getComplexPriceTrend, getComplexPyeongComparison, getFairValueRange, getRegionSignals, getRegionalPriceSummary } from '@/utils/marketMockData'
import type { SignalColor } from '@/utils/marketMockData'
import { formatPrice } from '@/utils/format'

const signalEmoji: Record<SignalColor, string> = { green: '🟢', yellow: '🟡', red: '🔴', gray: '⚪' }
const signalLabel: Record<SignalColor, string> = { green: '매수적기', yellow: '관망', red: '매도적기', gray: '데이터부족' }

type Period = 6 | 12 | 36

export function MarketInfoPage() {
  const [selectedComplex, setSelectedComplex] = useState(complexList[0])
  const [period, setPeriod] = useState<Period>(12)
  const [searchQuery, setSearchQuery] = useState('')

  const trendData = getComplexPriceTrend(selectedComplex.id, period)
  const pyeongData = getComplexPyeongComparison(selectedComplex.id)
  const fairValueData = getFairValueRange(selectedComplex.id)
  const signals = getRegionSignals().slice(0, 8) // Top 8 for user view
  const priceSummary = getRegionalPriceSummary()

  const filteredComplexes = searchQuery
    ? complexList.filter((c) => c.name.includes(searchQuery) || c.region.includes(searchQuery) || c.dong.includes(searchQuery))
    : complexList

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">시세 정보</h1>
        <p className="mt-1 text-sm text-gray-500">지역별·단지별 실거래가 및 매매 동향을 확인하세요.</p>
      </div>

      {/* Complex Search */}
      <div className="mb-6 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="단지명, 지역 검색..."
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {filteredComplexes.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedComplex(c)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedComplex.id === c.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Complex Info */}
      <div className="mb-6 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 p-5 text-white">
        <h2 className="text-lg font-bold">{selectedComplex.name}</h2>
        <p className="mt-0.5 text-sm text-primary-200">
          {selectedComplex.region} {selectedComplex.dong} · {selectedComplex.builtYear}년 준공 · {selectedComplex.totalUnits.toLocaleString()}세대
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedComplex.pyeongs.map((py) => (
            <span key={py} className="rounded-full bg-white/20 px-3 py-1 text-xs">{py}평</span>
          ))}
        </div>
      </div>

      {/* Period Selector + Price Trend */}
      <div className="mb-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold">실거래가 추이</h3>
          <div className="flex gap-1">
            {([6, 12, 36] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  period === p ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {p === 6 ? '6개월' : p === 12 ? '1년' : '3년'}
              </button>
            ))}
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 10000).toFixed(0)}억`} domain={['dataMin - 3000', 'dataMax + 3000']} />
              <Tooltip formatter={(value) => formatPrice(value as number)} labelFormatter={(l) => `${l}`} />
              <Line type="monotone" dataKey="avgPrice" stroke="#2563eb" strokeWidth={2} dot={false} name="평균가" />
              <Line type="monotone" dataKey="maxPrice" stroke="#ef4444" strokeWidth={1} strokeDasharray="4 4" dot={false} name="최고가" />
              <Line type="monotone" dataKey="minPrice" stroke="#22c55e" strokeWidth={1} strokeDasharray="4 4" dot={false} name="최저가" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pyeong Comparison */}
      <div className="mb-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <h3 className="mb-4 text-sm font-bold">평형별 시세 비교</h3>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pyeongData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="pyeong" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}평`} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 10000).toFixed(0)}억`} />
              <Tooltip formatter={(value) => formatPrice(value as number)} />
              <Bar dataKey="avgPrice" fill="#3b82f6" radius={[4, 4, 0, 0]} name="평균 거래가" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {pyeongData.map((d) => (
            <div key={d.pyeong} className="rounded-lg bg-gray-50 p-3 text-center">
              <p className="text-xs text-gray-400">{d.pyeong}평</p>
              <p className="text-sm font-bold text-primary-700">{formatPrice(d.avgPrice)}</p>
              <p className="text-[10px] text-gray-400">평당 {formatPrice(d.perPyeong)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Fair Value Band */}
      <div className="mb-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <h3 className="mb-4 text-sm font-bold">적정 시세 범위</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={fairValueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 10000).toFixed(0)}억`} domain={['dataMin - 3000', 'dataMax + 3000']} />
              <Tooltip formatter={(value) => formatPrice(value as number)} />
              <Legend />
              <Area type="monotone" dataKey="upperBound" stroke="none" fill="#dbeafe" name="상한" />
              <Area type="monotone" dataKey="lowerBound" stroke="none" fill="#ffffff" name="하한" />
              <Line type="monotone" dataKey="median" stroke="#93c5fd" strokeWidth={1} strokeDasharray="5 5" dot={false} name="중간값" />
              <Line type="monotone" dataKey="actual" stroke="#2563eb" strokeWidth={2.5} dot={false} name="실거래가" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-gray-400">적정 시세 범위는 최근 거래가의 ±5% 기반으로 산정됩니다.</p>
      </div>

      {/* Buy/Sell Signals Section */}
      <div className="mb-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold">매수/매도 적기 신호등</h3>
          <Link to="/market-info" className="text-xs text-primary-600 hover:underline">더보기</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {signals.map((s) => (
            <div key={s.region} className="rounded-lg border border-gray-200 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{s.region}</span>
                <span className="text-lg">{signalEmoji[s.signal]}</span>
              </div>
              <p className={`mt-1 text-xs font-medium ${
                s.signal === 'green' ? 'text-green-600' : s.signal === 'red' ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {signalLabel[s.signal]}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[10px] text-gray-400">
          본 지표는 AI 분석 참고자료이며, 투자 결정의 근거로 사용할 수 없습니다.
        </p>
      </div>

      {/* Regional Price Table */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <h3 className="mb-4 text-sm font-bold">지역별 평당가</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs text-gray-400">
                <th className="pb-2 pr-4">지역</th>
                <th className="pb-2 pr-4 text-right">평당가</th>
                <th className="pb-2 pr-4 text-right">전월대비</th>
                <th className="pb-2 text-right">거래건수</th>
              </tr>
            </thead>
            <tbody>
              {priceSummary.map((r) => (
                <tr key={r.region} className="border-b border-gray-100">
                  <td className="py-2 pr-4 font-medium">{r.region}</td>
                  <td className="py-2 pr-4 text-right">{formatPrice(r.avgPrice)}</td>
                  <td className={`py-2 pr-4 text-right font-medium ${r.changeRate > 0 ? 'text-red-600' : r.changeRate < 0 ? 'text-blue-600' : 'text-gray-500'}`}>
                    {r.changeRate > 0 ? '+' : ''}{r.changeRate}%
                  </td>
                  <td className="py-2 text-right text-gray-500">{r.txCount}건</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

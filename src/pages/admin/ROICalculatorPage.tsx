import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts'
import { formatPrice } from '@/utils/format'

type ROIInput = {
  purchasePrice: number   // 매입가 (만원)
  loanRatio: number       // 대출비율 (%)
  interestRate: number    // 대출이자율 (%)
  deposit: number         // 보증금 (만원)
  monthlyRent: number     // 월세 (만원)
  maintenanceFee: number  // 관리비 (만원/월)
  acquisitionTax: number  // 취득세율 (%)
  propertyTax: number     // 재산세 (만원/년)
  incomeTaxRate: number   // 종합소득세율 (%)
  vacancyRate: number     // 공실률 (%)
  holdingPeriod: number   // 보유기간 (년)
}

type ROIResult = {
  // Core metrics
  selfCapital: number          // 자기자본
  loanAmount: number           // 대출금
  annualRentalIncome: number   // 연간 임대수입
  annualInterest: number       // 연간 이자비용
  annualTaxes: number          // 연간 세금
  annualMaintenance: number    // 연간 관리비
  annualNetIncome: number      // 연간 순수익
  monthlyCashflow: number      // 월 캐시플로우
  roi: number                  // 투자수익률 (%)
  capRate: number              // Cap Rate (%)
  breakEvenYears: number       // 손익분기점 (년)
  // Leverage comparison
  roiWithoutLoan: number       // 대출 없이 ROI
  leverageEffect: number       // 레버리지 효과 (배)
  // Cumulative data
  cumulativeData: { year: number; withLoan: number; withoutLoan: number }[]
}

const defaultInput: ROIInput = {
  purchasePrice: 50000,
  loanRatio: 40,
  interestRate: 4.5,
  deposit: 5000,
  monthlyRent: 100,
  maintenanceFee: 15,
  acquisitionTax: 1.1,
  propertyTax: 50,
  incomeTaxRate: 15.4,
  vacancyRate: 5,
  holdingPeriod: 10,
}

function calculateROI(input: ROIInput): ROIResult {
  const loanAmount = Math.round(input.purchasePrice * input.loanRatio / 100)
  const acquisitionCost = Math.round(input.purchasePrice * input.acquisitionTax / 100)
  const selfCapital = input.purchasePrice - loanAmount - input.deposit + acquisitionCost

  const annualRentalIncome = Math.round(input.monthlyRent * 12 * (1 - input.vacancyRate / 100))
  const annualInterest = Math.round(loanAmount * input.interestRate / 100)
  const annualMaintenance = input.maintenanceFee * 12
  const annualGrossIncome = annualRentalIncome - annualInterest - annualMaintenance - input.propertyTax
  const annualIncomeTax = Math.round(Math.max(0, annualGrossIncome) * input.incomeTaxRate / 100)
  const annualNetIncome = annualGrossIncome - annualIncomeTax

  const monthlyCashflow = Math.round(annualNetIncome / 12)
  const roi = selfCapital > 0 ? Math.round((annualNetIncome / selfCapital) * 10000) / 100 : 0
  const capRate = input.purchasePrice > 0
    ? Math.round((annualRentalIncome / input.purchasePrice) * 10000) / 100
    : 0

  // Without loan
  const selfCapitalNoLoan = input.purchasePrice - input.deposit + acquisitionCost
  const annualNetNoLoan = annualRentalIncome - annualMaintenance - input.propertyTax
  const annualTaxNoLoan = Math.round(Math.max(0, annualNetNoLoan) * input.incomeTaxRate / 100)
  const netNoLoan = annualNetNoLoan - annualTaxNoLoan
  const roiWithoutLoan = selfCapitalNoLoan > 0 ? Math.round((netNoLoan / selfCapitalNoLoan) * 10000) / 100 : 0
  const leverageEffect = roiWithoutLoan > 0 ? Math.round((roi / roiWithoutLoan) * 100) / 100 : 0

  // Break-even
  const totalInitialCost = selfCapital
  const breakEvenYears = annualNetIncome > 0
    ? Math.round((totalInitialCost / annualNetIncome) * 10) / 10
    : Infinity

  // Cumulative data
  const cumulativeData = []
  let cumWithLoan = -totalInitialCost
  let cumWithoutLoan = -selfCapitalNoLoan
  cumulativeData.push({ year: 0, withLoan: cumWithLoan, withoutLoan: cumWithoutLoan })
  for (let y = 1; y <= Math.min(input.holdingPeriod, 30); y++) {
    cumWithLoan += annualNetIncome
    cumWithoutLoan += netNoLoan
    cumulativeData.push({
      year: y,
      withLoan: Math.round(cumWithLoan),
      withoutLoan: Math.round(cumWithoutLoan),
    })
  }

  return {
    selfCapital,
    loanAmount,
    annualRentalIncome,
    annualInterest,
    annualTaxes: annualIncomeTax + input.propertyTax,
    annualMaintenance,
    annualNetIncome,
    monthlyCashflow,
    roi,
    capRate,
    breakEvenYears,
    roiWithoutLoan,
    leverageEffect,
    cumulativeData,
  }
}

export function ROICalculatorPage() {
  const [input, setInput] = useState<ROIInput>(defaultInput)

  const result = useMemo(() => calculateROI(input), [input])

  const update = (key: keyof ROIInput, value: string) => {
    const num = parseFloat(value)
    if (!isNaN(num)) setInput((prev) => ({ ...prev, [key]: num }))
  }

  // Leverage comparison bar data
  const leverageData = [
    { label: '대출 활용', roi: result.roi, fill: '#3b82f6' },
    { label: '자기자본', roi: result.roiWithoutLoan, fill: '#94a3b8' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">투자 수익률 계산기</h1>
        <p className="mt-1 text-sm text-gray-500">매입가, 대출, 임대수익을 입력하면 ROI, Cap Rate, 손익분기점을 실시간 계산합니다.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Input Form */}
        <div className="space-y-5 lg:col-span-1">
          {/* Purchase */}
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <h2 className="mb-3 text-sm font-bold">매입 정보</h2>
            <div className="space-y-3">
              <Field label="매입가 (만원)" value={input.purchasePrice} onChange={(v) => update('purchasePrice', v)} />
              <Field label="대출비율 (%)" value={input.loanRatio} onChange={(v) => update('loanRatio', v)} max={90} />
              <Field label="대출이자율 (%)" value={input.interestRate} onChange={(v) => update('interestRate', v)} step={0.1} />
              <Field label="취득세율 (%)" value={input.acquisitionTax} onChange={(v) => update('acquisitionTax', v)} step={0.1} />
            </div>
          </div>

          {/* Income */}
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <h2 className="mb-3 text-sm font-bold">임대 수익</h2>
            <div className="space-y-3">
              <Field label="보증금 (만원)" value={input.deposit} onChange={(v) => update('deposit', v)} />
              <Field label="월세 (만원)" value={input.monthlyRent} onChange={(v) => update('monthlyRent', v)} />
              <Field label="관리비 (만원/월)" value={input.maintenanceFee} onChange={(v) => update('maintenanceFee', v)} />
              <Field label="공실률 (%)" value={input.vacancyRate} onChange={(v) => update('vacancyRate', v)} />
            </div>
          </div>

          {/* Tax */}
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <h2 className="mb-3 text-sm font-bold">세금 / 기간</h2>
            <div className="space-y-3">
              <Field label="재산세 (만원/년)" value={input.propertyTax} onChange={(v) => update('propertyTax', v)} />
              <Field label="종합소득세율 (%)" value={input.incomeTaxRate} onChange={(v) => update('incomeTaxRate', v)} step={0.1} />
              <Field label="보유기간 (년)" value={input.holdingPeriod} onChange={(v) => update('holdingPeriod', v)} max={30} />
            </div>
          </div>
        </div>

        {/* Right: Results */}
        <div className="space-y-5 lg:col-span-2">
          {/* Key Metrics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="투자수익률 (ROI)" value={`${result.roi}%`} color={result.roi > 0 ? 'text-green-600' : 'text-red-600'} />
            <MetricCard label="Cap Rate" value={`${result.capRate}%`} color="text-primary-700" />
            <MetricCard label="월 캐시플로우" value={formatPrice(result.monthlyCashflow)} color={result.monthlyCashflow > 0 ? 'text-green-600' : 'text-red-600'} />
            <MetricCard label="손익분기점" value={result.breakEvenYears === Infinity ? '-' : `${result.breakEvenYears}년`} color="text-gray-800" />
          </div>

          {/* Detailed Breakdown */}
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <h2 className="mb-4 text-sm font-bold">수익/비용 분석</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Row label="자기자본" value={formatPrice(result.selfCapital)} />
                <Row label="대출금" value={formatPrice(result.loanAmount)} />
                <Row label="연간 임대수입" value={formatPrice(result.annualRentalIncome)} color="text-green-600" />
              </div>
              <div className="space-y-2">
                <Row label="연간 이자비용" value={`-${formatPrice(result.annualInterest)}`} color="text-red-500" />
                <Row label="연간 세금" value={`-${formatPrice(result.annualTaxes)}`} color="text-red-500" />
                <Row label="연간 관리비" value={`-${formatPrice(result.annualMaintenance)}`} color="text-red-500" />
              </div>
            </div>
            <div className="mt-4 border-t border-gray-200 pt-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">연간 순수익</span>
                <span className={`text-lg font-bold ${result.annualNetIncome > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPrice(result.annualNetIncome)}
                </span>
              </div>
            </div>
          </div>

          {/* Leverage Comparison */}
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <h2 className="mb-4 text-sm font-bold">레버리지 효과 비교</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leverageData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="%" />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Bar dataKey="roi" name="ROI" radius={[4, 4, 0, 0]}>
                      {leverageData.map((entry, index) => (
                        <rect key={index} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col justify-center space-y-3">
                <div className="rounded-lg bg-blue-50 p-3">
                  <p className="text-xs text-gray-500">대출 활용 시 ROI</p>
                  <p className="text-xl font-bold text-blue-700">{result.roi}%</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">자기자본 전액 시 ROI</p>
                  <p className="text-xl font-bold text-gray-600">{result.roiWithoutLoan}%</p>
                </div>
                <div className="rounded-lg bg-green-50 p-3">
                  <p className="text-xs text-gray-500">레버리지 효과</p>
                  <p className="text-xl font-bold text-green-700">{result.leverageEffect}배</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cumulative Profit Chart */}
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <h2 className="mb-4 text-sm font-bold">보유기간별 누적수익</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.cumulativeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} unit="년" />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 10000).toFixed(0)}억`} />
                  <Tooltip formatter={(value) => formatPrice(value as number)} labelFormatter={(l) => `${l}년차`} />
                  <Legend />
                  <Line type="monotone" dataKey="withLoan" stroke="#3b82f6" strokeWidth={2} dot={false} name="대출 활용" />
                  <Line type="monotone" dataKey="withoutLoan" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} name="자기자본" />
                  {/* Zero line reference */}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-[10px] text-gray-400">
              누적수익 = 초기투자금(-) + 연간순수익 합산. 양도차익, 감가상각 미포함.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, max, step }: { label: string; value: number; onChange: (v: string) => void; max?: number; step?: number }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-gray-400">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        max={max}
        step={step ?? 1}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
      />
    </div>
  )
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={`font-medium ${color ?? 'text-gray-800'}`}>{value}</span>
    </div>
  )
}

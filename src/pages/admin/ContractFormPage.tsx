import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Property, ContractTemplateType, TransactionType } from '@/types/database'
import { fetchAdminProperties } from '@/api/properties'
import { createContract, recommendTemplate } from '@/api/contracts'
import { Button } from '@/components/common'
import { formatPropertyPrice, formatArea, transactionTypeLabel, contractTemplateLabel, formatNumber, parseCommaNumber, formatPrice } from '@/utils/format'
import { systemCategories } from '@/utils/propertyMockData'
import toast from 'react-hot-toast'

type Step = 1 | 2 | 3 | 4
const stepLabels = ['매물 선택', '양식 선택', '계약 정보 입력', '미리보기']

const allTemplates: ContractTemplateType[] = [
  'apartment_sale', 'apartment_lease', 'officetel_sale', 'officetel_lease',
  'commercial_sale', 'commercial_lease', 'building_sale', 'land_sale',
  'factory_sale', 'factory_lease', 'knowledge_center_sale', 'knowledge_center_lease',
]

export function ContractFormPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Step 1: Property selection
  const [properties, setProperties] = useState<Property[]>([])
  const [propSearch, setPropSearch] = useState('')
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)

  // Step 2: Template selection
  const [templateType, setTemplateType] = useState<ContractTemplateType>('apartment_sale')
  const [txType, setTxType] = useState<TransactionType>('sale')

  // Step 3: Contract info
  const [sellerInfo, setSellerInfo] = useState({ name: '', phone: '', idNumber: '', address: '' })
  const [buyerInfo, setBuyerInfo] = useState({ name: '', phone: '', idNumber: '', address: '' })
  const [priceInfo, setPriceInfo] = useState({
    salePrice: '', deposit: '', monthlyRent: '',
    downPayment: '', downPaymentDate: '',
    midPayment: '', midPaymentDate: '',
    finalPayment: '', finalPaymentDate: '',
  })
  const [specialTerms, setSpecialTerms] = useState('')

  // Load properties
  useEffect(() => {
    let cancelled = false
    fetchAdminProperties({ search: propSearch || undefined }).then((data) => {
      if (!cancelled) setProperties(data)
    })
    return () => { cancelled = true }
  }, [propSearch])

  // Auto-recommend template when property is selected
  const handleSelectProperty = (p: Property) => {
    setSelectedProperty(p)
    const rec = recommendTemplate(p.category_id, p.transaction_type)
    setTemplateType(rec)
    setTxType(p.transaction_type)

    // Auto-fill price info
    setPriceInfo((prev) => ({
      ...prev,
      salePrice: p.sale_price ? String(p.sale_price) : '',
      deposit: p.deposit ? String(p.deposit) : '',
      monthlyRent: p.monthly_rent ? String(p.monthly_rent) : '',
    }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    const contract = await createContract({
      property_id: selectedProperty?.id ?? null,
      transaction_type: txType,
      template_type: templateType,
      seller_info: sellerInfo,
      buyer_info: buyerInfo,
      agent_info: { officeName: '스마트부동산', representative: '홍길동', licenseNumber: '12345-2024-00001', address: '서울 강남구 역삼동', phone: '02-1234-5678' },
      price_info: {
        salePrice: parseCommaNumber(priceInfo.salePrice),
        deposit: parseCommaNumber(priceInfo.deposit),
        monthlyRent: parseCommaNumber(priceInfo.monthlyRent),
        downPayment: parseCommaNumber(priceInfo.downPayment),
        downPaymentDate: priceInfo.downPaymentDate,
        midPayment: parseCommaNumber(priceInfo.midPayment),
        midPaymentDate: priceInfo.midPaymentDate,
        finalPayment: parseCommaNumber(priceInfo.finalPayment),
        finalPaymentDate: priceInfo.finalPaymentDate,
      },
      special_terms: specialTerms,
    })
    setIsSubmitting(false)
    toast.success(`계약서가 생성되었습니다. (${contract.contract_number})`)
    navigate(`/admin/contracts/${contract.id}/tracker`)
  }

  const canNext = () => {
    if (step === 1) return selectedProperty !== null
    if (step === 2) return true
    if (step === 3) return sellerInfo.name && buyerInfo.name
    return true
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">계약서 작성</h1>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {([1, 2, 3, 4] as Step[]).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <button
              onClick={() => { if (s < step) setStep(s) }}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                s === step ? 'bg-primary-600 text-white' : s < step ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-400'
              }`}
            >
              {s < step ? '\u2713' : s}
            </button>
            <span className={`hidden text-sm sm:inline ${s === step ? 'font-semibold text-gray-800' : 'text-gray-400'}`}>
              {stepLabels[s - 1]}
            </span>
            {s < 4 && <div className={`h-px w-8 ${s < step ? 'bg-primary-300' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {step === 1 && (
        <Step1PropertySelect
          properties={properties}
          search={propSearch}
          onSearchChange={setPropSearch}
          selected={selectedProperty}
          onSelect={handleSelectProperty}
        />
      )}
      {step === 2 && (
        <Step2TemplateSelect
          templateType={templateType}
          onTemplateChange={setTemplateType}
          txType={txType}
          onTxTypeChange={setTxType}
          property={selectedProperty}
        />
      )}
      {step === 3 && (
        <Step3ContractInfo
          txType={txType}
          sellerInfo={sellerInfo}
          onSellerChange={setSellerInfo}
          buyerInfo={buyerInfo}
          onBuyerChange={setBuyerInfo}
          priceInfo={priceInfo}
          onPriceChange={setPriceInfo}
          specialTerms={specialTerms}
          onSpecialTermsChange={setSpecialTerms}
          property={selectedProperty}
        />
      )}
      {step === 4 && (
        <Step4Preview
          property={selectedProperty}
          templateType={templateType}
          txType={txType}
          sellerInfo={sellerInfo}
          buyerInfo={buyerInfo}
          priceInfo={priceInfo}
          specialTerms={specialTerms}
        />
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-4">
        <Button variant="outline" onClick={() => { if (step > 1) setStep((step - 1) as Step); else navigate('/admin/contracts') }}>
          {step === 1 ? '취소' : '이전'}
        </Button>
        {step < 4 ? (
          <Button onClick={() => setStep((step + 1) as Step)} disabled={!canNext()}>다음</Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { window.print() }}>인쇄</Button>
            <Button variant="secondary" onClick={() => toast('전자서명 요청 기능은 추후 구현 예정입니다.')}>전자서명 요청</Button>
            <Button onClick={handleSubmit} isLoading={isSubmitting}>계약서 저장</Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// Step 1: Property Selection
// ============================================================
function Step1PropertySelect({ properties, search, onSearchChange, selected, onSelect }: {
  properties: Property[]; search: string; onSearchChange: (v: string) => void; selected: Property | null; onSelect: (p: Property) => void
}) {
  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text" value={search} onChange={(e) => onSearchChange(e.target.value)}
          placeholder="매물명, 주소 검색" className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map((p) => {
          const cat = systemCategories.find((c) => c.id === p.category_id)
          const isSelected = selected?.id === p.id
          return (
            <button
              key={p.id} onClick={() => onSelect(p)}
              className={`rounded-xl border-2 p-4 text-left transition-all ${isSelected ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500/20' : 'border-gray-200 bg-white hover:border-gray-300'}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs">{cat?.icon}</span>
                <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${p.transaction_type === 'sale' ? 'bg-blue-100 text-blue-700' : p.transaction_type === 'jeonse' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                  {transactionTypeLabel[p.transaction_type]}
                </span>
              </div>
              <p className="mt-1.5 text-sm font-semibold text-gray-800">{p.title}</p>
              <p className="text-xs text-gray-500">{p.address}</p>
              <p className="mt-1 text-sm font-bold text-primary-700">{formatPropertyPrice(p.transaction_type, p.sale_price, p.deposit, p.monthly_rent)}</p>
            </button>
          )
        })}
      </div>

      {selected && (
        <div className="rounded-xl bg-primary-50 p-4 ring-1 ring-primary-200">
          <p className="text-sm font-semibold text-primary-800">선택된 매물: {selected.title}</p>
          <p className="text-xs text-primary-600">{selected.address} · {formatPropertyPrice(selected.transaction_type, selected.sale_price, selected.deposit, selected.monthly_rent)}</p>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Step 2: Template Selection
// ============================================================
function Step2TemplateSelect({ templateType, onTemplateChange, txType, onTxTypeChange, property }: {
  templateType: ContractTemplateType; onTemplateChange: (v: ContractTemplateType) => void
  txType: TransactionType; onTxTypeChange: (v: TransactionType) => void
  property: Property | null
}) {
  const recommended = property ? recommendTemplate(property.category_id, property.transaction_type) : null

  return (
    <div className="space-y-6">
      {/* Transaction Type */}
      <div>
        <label className="mb-2 block text-sm font-semibold">거래 유형</label>
        <div className="flex gap-2">
          {(['sale', 'jeonse', 'monthly'] as TransactionType[]).map((t) => (
            <button key={t} onClick={() => onTxTypeChange(t)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${txType === t ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'}`}>
              {transactionTypeLabel[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Template Grid */}
      <div>
        <label className="mb-2 block text-sm font-semibold">계약서 양식</label>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {allTemplates.map((t) => (
            <button key={t} onClick={() => onTemplateChange(t)}
              className={`rounded-xl border-2 p-4 text-left transition-all ${templateType === t ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
              <p className="text-sm font-semibold text-gray-800">{contractTemplateLabel[t]}</p>
              {t === recommended && (
                <span className="mt-1 inline-block rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-bold text-primary-700">추천</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Confirmation doc type */}
      <div className="rounded-xl bg-gray-50 p-4">
        <p className="text-sm font-semibold text-gray-600">확인설명서 유형</p>
        <p className="mt-1 text-sm text-gray-500">
          {templateType.includes('land') ? '토지용' : templateType.includes('commercial') || templateType.includes('factory') || templateType.includes('knowledge') ? '비주거용' : '주거용'} 확인설명서가 자동 선택됩니다.
        </p>
      </div>
    </div>
  )
}

// ============================================================
// Step 3: Contract Info Input
// ============================================================
function Step3ContractInfo({ txType, sellerInfo, onSellerChange, buyerInfo, onBuyerChange, priceInfo, onPriceChange, specialTerms, onSpecialTermsChange, property }: {
  txType: TransactionType
  sellerInfo: { name: string; phone: string; idNumber: string; address: string }
  onSellerChange: (v: typeof sellerInfo) => void
  buyerInfo: typeof sellerInfo
  onBuyerChange: (v: typeof sellerInfo) => void
  priceInfo: { salePrice: string; deposit: string; monthlyRent: string; downPayment: string; downPaymentDate: string; midPayment: string; midPaymentDate: string; finalPayment: string; finalPaymentDate: string }
  onPriceChange: (v: typeof priceInfo) => void
  specialTerms: string
  onSpecialTermsChange: (v: string) => void
  property: Property | null
}) {
  const isSale = txType === 'sale'
  const isMonthly = txType === 'monthly'

  return (
    <div className="space-y-6">
      {/* Auto-filled property info */}
      {property && (
        <div className="rounded-xl bg-green-50 p-4 ring-1 ring-green-200">
          <p className="mb-2 text-xs font-bold text-green-700">매물 데이터에서 자동 입력됨</p>
          <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div><span className="text-gray-500">소재지: </span><span className="font-medium">{property.address}</span></div>
            <div><span className="text-gray-500">전용면적: </span><span className="font-medium">{formatArea(property.exclusive_area_m2)}</span></div>
            <div><span className="text-gray-500">공급면적: </span><span className="font-medium">{formatArea(property.supply_area_m2)}</span></div>
            {property.floor && <div><span className="text-gray-500">층수: </span><span className="font-medium">{property.floor}/{property.total_floors}층</span></div>}
            {property.direction && <div><span className="text-gray-500">방향: </span><span className="font-medium">{property.direction}</span></div>}
            {property.built_year && <div><span className="text-gray-500">건축연도: </span><span className="font-medium">{property.built_year}년</span></div>}
          </div>
        </div>
      )}

      {/* Seller/Buyer Info - highlighted as manual */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PersonInfoCard
          title={isSale ? '매도인 (임대인)' : '임대인'}
          info={sellerInfo} onChange={onSellerChange}
        />
        <PersonInfoCard
          title={isSale ? '매수인 (임차인)' : '임차인'}
          info={buyerInfo} onChange={onBuyerChange}
        />
      </div>

      {/* Price Info */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-2 ring-yellow-200">
        <p className="mb-1 text-sm font-semibold">거래 금액</p>
        <p className="mb-4 text-[10px] font-medium text-yellow-600">수동 입력 필요</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isSale && (
            <PriceField label="매매가 (만원)" value={priceInfo.salePrice} onChange={(v) => onPriceChange({ ...priceInfo, salePrice: v })} />
          )}
          {!isSale && (
            <PriceField label="보증금 (만원)" value={priceInfo.deposit} onChange={(v) => onPriceChange({ ...priceInfo, deposit: v })} />
          )}
          {isMonthly && (
            <PriceField label="월세 (만원)" value={priceInfo.monthlyRent} onChange={(v) => onPriceChange({ ...priceInfo, monthlyRent: v })} />
          )}
        </div>

        <hr className="my-4 border-gray-100" />
        <p className="mb-3 text-sm font-semibold">납부 일정</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <PriceField label="계약금 (만원)" value={priceInfo.downPayment} onChange={(v) => onPriceChange({ ...priceInfo, downPayment: v })} />
          <DateField label="계약금 지급일" value={priceInfo.downPaymentDate} onChange={(v) => onPriceChange({ ...priceInfo, downPaymentDate: v })} />
          {isSale && (
            <>
              <PriceField label="중도금 (만원)" value={priceInfo.midPayment} onChange={(v) => onPriceChange({ ...priceInfo, midPayment: v })} />
              <DateField label="중도금 지급일" value={priceInfo.midPaymentDate} onChange={(v) => onPriceChange({ ...priceInfo, midPaymentDate: v })} />
            </>
          )}
          <PriceField label="잔금 (만원)" value={priceInfo.finalPayment} onChange={(v) => onPriceChange({ ...priceInfo, finalPayment: v })} />
          <DateField label="잔금 지급일" value={priceInfo.finalPaymentDate} onChange={(v) => onPriceChange({ ...priceInfo, finalPaymentDate: v })} />
        </div>
      </div>

      {/* Agent info auto-loaded */}
      <div className="rounded-xl bg-green-50 p-4 ring-1 ring-green-200">
        <p className="mb-2 text-xs font-bold text-green-700">중개사 정보 (자동 로드)</p>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <div><span className="text-gray-500">사무소: </span><span className="font-medium">스마트부동산</span></div>
          <div><span className="text-gray-500">대표: </span><span className="font-medium">홍길동</span></div>
          <div><span className="text-gray-500">등록번호: </span><span className="font-medium">12345-2024-00001</span></div>
          <div><span className="text-gray-500">연락처: </span><span className="font-medium">02-1234-5678</span></div>
        </div>
      </div>

      {/* Special Terms */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-2 ring-yellow-200">
        <p className="mb-1 text-sm font-semibold">특약사항</p>
        <p className="mb-3 text-[10px] font-medium text-yellow-600">수동 입력 필요</p>
        <textarea value={specialTerms} onChange={(e) => onSpecialTermsChange(e.target.value)} rows={5}
          placeholder="특약사항을 입력하세요..." className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
      </div>
    </div>
  )
}

function PersonInfoCard({ title, info, onChange }: {
  title: string; info: { name: string; phone: string; idNumber: string; address: string }
  onChange: (v: typeof info) => void
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-2 ring-yellow-200">
      <p className="mb-1 text-sm font-semibold">{title}</p>
      <p className="mb-3 text-[10px] font-medium text-yellow-600">수동 입력 필요</p>
      <div className="space-y-3">
        <Field label="성명" value={info.name} onChange={(v) => onChange({ ...info, name: v })} required />
        <Field label="연락처" value={info.phone} onChange={(v) => onChange({ ...info, phone: v })} placeholder="010-0000-0000" />
        <Field label="주민등록번호" value={info.idNumber} onChange={(v) => onChange({ ...info, idNumber: v })} placeholder="******-*******" />
        <Field label="주소" value={info.address} onChange={(v) => onChange({ ...info, address: v })} />
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, required }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-500">{label}{required && ' *'}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20" required={required} />
    </div>
  )
}

function PriceField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-500">{label}</label>
      <input type="text" value={formatNumber(value)} onChange={(e) => { const n = parseCommaNumber(e.target.value); onChange(n != null ? String(n) : '') }}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-right focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
    </div>
  )
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-500">{label}</label>
      <input type="date" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
    </div>
  )
}

// ============================================================
// Step 4: Preview
// ============================================================
function Step4Preview({ property, templateType, txType, sellerInfo, buyerInfo, priceInfo, specialTerms }: {
  property: Property | null; templateType: ContractTemplateType; txType: TransactionType
  sellerInfo: { name: string; phone: string; idNumber: string; address: string }
  buyerInfo: typeof sellerInfo
  priceInfo: { salePrice: string; deposit: string; monthlyRent: string; downPayment: string; downPaymentDate: string; midPayment: string; midPaymentDate: string; finalPayment: string; finalPaymentDate: string }
  specialTerms: string
}) {
  const isSale = txType === 'sale'
  const isMonthly = txType === 'monthly'

  return (
    <div className="space-y-6">
      {/* Contract Preview */}
      <div className="mx-auto max-w-3xl rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-200 print:shadow-none print:ring-0">
        <h2 className="mb-6 text-center text-xl font-bold">부동산 {isSale ? '매매' : '임대차'} 계약서</h2>
        <p className="mb-4 text-center text-sm text-gray-500">({contractTemplateLabel[templateType]})</p>

        {/* Property Info */}
        <section className="mb-6">
          <h3 className="mb-3 border-b-2 border-gray-800 pb-1 text-sm font-bold">제1조 (부동산의 표시)</h3>
          <table className="w-full text-sm">
            <tbody>
              <Row label="소재지" value={property?.address ?? '-'} />
              <Row label="구조/용도" value={`${systemCategories.find((c) => c.id === property?.category_id)?.name ?? '-'}`} />
              <Row label="전용면적" value={formatArea(property?.exclusive_area_m2)} />
              <Row label="공급면적" value={formatArea(property?.supply_area_m2)} />
              {property?.floor && <Row label="해당층/총층" value={`${property.floor}층 / ${property.total_floors}층`} />}
              {property?.direction && <Row label="방향" value={property.direction} />}
              {property?.built_year && <Row label="건축연도" value={`${property.built_year}년`} />}
            </tbody>
          </table>
        </section>

        {/* Price Info */}
        <section className="mb-6">
          <h3 className="mb-3 border-b-2 border-gray-800 pb-1 text-sm font-bold">제2조 ({isSale ? '매매대금' : '임대차보증금'})</h3>
          <table className="w-full text-sm">
            <tbody>
              {isSale && <Row label="매매대금" value={`${formatPrice(parseCommaNumber(priceInfo.salePrice))}원`} bold />}
              {!isSale && <Row label="보증금" value={`${formatPrice(parseCommaNumber(priceInfo.deposit))}원`} bold />}
              {isMonthly && <Row label="월세" value={`${formatPrice(parseCommaNumber(priceInfo.monthlyRent))}원`} bold />}
              <Row label="계약금" value={`${formatPrice(parseCommaNumber(priceInfo.downPayment))}원 (${priceInfo.downPaymentDate || '-'})`} />
              {isSale && priceInfo.midPayment && <Row label="중도금" value={`${formatPrice(parseCommaNumber(priceInfo.midPayment))}원 (${priceInfo.midPaymentDate || '-'})`} />}
              <Row label="잔금" value={`${formatPrice(parseCommaNumber(priceInfo.finalPayment))}원 (${priceInfo.finalPaymentDate || '-'})`} />
            </tbody>
          </table>
        </section>

        {/* Special Terms */}
        {specialTerms && (
          <section className="mb-6">
            <h3 className="mb-3 border-b-2 border-gray-800 pb-1 text-sm font-bold">특약사항</h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{specialTerms}</p>
          </section>
        )}

        {/* Parties */}
        <section className="mb-6">
          <h3 className="mb-3 border-b-2 border-gray-800 pb-1 text-sm font-bold">당사자</h3>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-bold text-gray-500">{isSale ? '매도인 (임대인)' : '임대인'}</p>
              <table className="w-full text-sm">
                <tbody>
                  <Row label="성명" value={sellerInfo.name} />
                  <Row label="연락처" value={sellerInfo.phone || '-'} />
                  <Row label="주소" value={sellerInfo.address || '-'} />
                </tbody>
              </table>
              <div className="mt-4 border-b border-dashed border-gray-400 pb-8 text-center text-xs text-gray-400">서명/날인</div>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold text-gray-500">{isSale ? '매수인 (임차인)' : '임차인'}</p>
              <table className="w-full text-sm">
                <tbody>
                  <Row label="성명" value={buyerInfo.name} />
                  <Row label="연락처" value={buyerInfo.phone || '-'} />
                  <Row label="주소" value={buyerInfo.address || '-'} />
                </tbody>
              </table>
              <div className="mt-4 border-b border-dashed border-gray-400 pb-8 text-center text-xs text-gray-400">서명/날인</div>
            </div>
          </div>
        </section>

        {/* Agent Info */}
        <section>
          <h3 className="mb-3 border-b-2 border-gray-800 pb-1 text-sm font-bold">개업공인중개사</h3>
          <table className="w-full text-sm">
            <tbody>
              <Row label="사무소명" value="스마트부동산" />
              <Row label="대표" value="홍길동" />
              <Row label="등록번호" value="12345-2024-00001" />
              <Row label="소재지" value="서울 강남구 역삼동" />
              <Row label="연락처" value="02-1234-5678" />
            </tbody>
          </table>
          <div className="mt-4 border-b border-dashed border-gray-400 pb-8 text-center text-xs text-gray-400">서명/날인</div>
        </section>
      </div>

      <div className="text-center text-sm text-gray-500">
        PDF 다운로드는 계약서 저장 후 가능합니다.
      </div>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <tr className="border-b border-gray-100">
      <td className="w-28 py-2 text-xs text-gray-500">{label}</td>
      <td className={`py-2 text-sm ${bold ? 'font-bold text-primary-700' : ''}`}>{value}</td>
    </tr>
  )
}

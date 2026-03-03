import { useState, useEffect, useMemo, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { TransactionType, PropertyStatus, PropertyCategory } from '@/types/database'
import { fetchPropertyById, createProperty, updateProperty, fetchCategories } from '@/api/properties'
import { fetchSearchSettings } from '@/api/settings'
import { getTagBasedConditions, type TagConditionInfo } from '@/utils/conditionResolver'
import { Button, Input } from '@/components/common'
import { formatNumber, parseCommaNumber, sqmToPyeong } from '@/utils/format'
import toast from 'react-hot-toast'

const tabs = [
  { id: 'basic', label: '기본정보' },
  { id: 'location', label: '위치' },
  { id: 'price', label: '가격' },
  { id: 'structure', label: '면적/구조' },
  { id: 'detail', label: '상세' },
  { id: 'media', label: '미디어' },
  { id: 'description', label: '설명' },
  { id: 'co-brokerage', label: '공동중개' },
  { id: 'memo', label: '내부메모' },
] as const

type TabId = (typeof tabs)[number]['id']

const directionOptions = ['동향', '서향', '남향', '북향', '남동향', '남서향', '북동향', '북서향']
const optionChoices = ['에어컨', '냉장고', '세탁기', '가스레인지', '인덕션', '전자레인지', '옷장', '신발장', '침대', '책상', 'TV', '인터넷', 'CCTV', '현관보안', '비디오폰']

type FormData = {
  category_id: string
  title: string
  transaction_type: TransactionType
  status: PropertyStatus
  address: string
  address_detail: string
  dong: string
  ho: string
  sale_price: string
  deposit: string
  monthly_rent: string
  maintenance_fee: string
  supply_area_m2: string
  exclusive_area_m2: string
  rooms: string
  bathrooms: string
  total_floors: string
  floor: string
  direction: string
  move_in_date: string
  parking_per_unit: string
  has_elevator: boolean
  pets_allowed: boolean
  options: string[]
  description: string
  is_urgent: boolean
  is_co_brokerage: boolean
  co_brokerage_fee_ratio: string
  internal_memo: string
  built_year: string
  tags: string
  predefinedTags: string[]
  photos: string[]
}

const emptyForm: FormData = {
  category_id: '', title: '', transaction_type: 'sale', status: 'draft',
  address: '', address_detail: '', dong: '', ho: '',
  sale_price: '', deposit: '', monthly_rent: '', maintenance_fee: '',
  supply_area_m2: '', exclusive_area_m2: '', rooms: '', bathrooms: '',
  total_floors: '', floor: '', direction: '', move_in_date: '',
  parking_per_unit: '', has_elevator: false, pets_allowed: false,
  options: [], description: '', is_urgent: false, is_co_brokerage: false,
  co_brokerage_fee_ratio: '', internal_memo: '', built_year: '', tags: '', predefinedTags: [], photos: [],
}

export function PropertyFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id
  const [activeTab, setActiveTab] = useState<TabId>('basic')
  const [form, setForm] = useState<FormData>(emptyForm)
  const [categories, setCategories] = useState<PropertyCategory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [tagConditions] = useState<TagConditionInfo[]>(getTagBasedConditions())
  const [customTagLabels, setCustomTagLabels] = useState<string[]>([])

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => setCategories([]))
    // Load custom quick search cards to get custom tag labels
    fetchSearchSettings()
      .then((s) => {
        const customs = s.quick_cards
          .filter((c) => c.is_custom && c.is_enabled)
          .map((c) => c.label)
        setCustomTagLabels(customs)
      })
      .catch(() => {})
    if (id) {
      fetchPropertyById(id).then((p) => {
        if (!p) { navigate('/admin/properties'); return }
        // Separate predefined tags from free-text tags
        const existingTags = p.tags || []
        const builtInTags = getTagBasedConditions().map((t) => t.tag)
        const predefined = existingTags.filter((t) => builtInTags.includes(t))
        const freeText = existingTags.filter((t) => !builtInTags.includes(t))
        setForm({
          category_id: p.category_id || '',
          title: p.title,
          transaction_type: p.transaction_type,
          status: p.status,
          address: p.address,
          address_detail: p.address_detail || '',
          dong: p.dong || '',
          ho: p.ho || '',
          sale_price: p.sale_price ? String(p.sale_price) : '',
          deposit: p.deposit ? String(p.deposit) : '',
          monthly_rent: p.monthly_rent ? String(p.monthly_rent) : '',
          maintenance_fee: p.maintenance_fee ? String(p.maintenance_fee) : '',
          supply_area_m2: p.supply_area_m2 ? String(p.supply_area_m2) : '',
          exclusive_area_m2: p.exclusive_area_m2 ? String(p.exclusive_area_m2) : '',
          rooms: p.rooms != null ? String(p.rooms) : '',
          bathrooms: p.bathrooms != null ? String(p.bathrooms) : '',
          total_floors: p.total_floors != null ? String(p.total_floors) : '',
          floor: p.floor != null ? String(p.floor) : '',
          direction: p.direction || '',
          move_in_date: p.move_in_date || '',
          parking_per_unit: p.parking_per_unit != null ? String(p.parking_per_unit) : '',
          has_elevator: p.has_elevator,
          pets_allowed: p.pets_allowed,
          options: p.options || [],
          description: p.description || '',
          is_urgent: p.is_urgent,
          is_co_brokerage: p.is_co_brokerage,
          co_brokerage_fee_ratio: p.co_brokerage_fee_ratio != null ? String(p.co_brokerage_fee_ratio) : '',
          internal_memo: p.internal_memo || '',
          built_year: p.built_year != null ? String(p.built_year) : '',
          tags: freeText.join(', '),
          predefinedTags: predefined,
          photos: p.photos || [],
        })
      })
    }
  }, [id, navigate])

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.address) { toast.error('제목과 주소는 필수입니다.'); return }
    setIsLoading(true)
    try {
      const payload = {
        agent_id: 'agent-1',
        category_id: form.category_id || null,
        title: form.title,
        transaction_type: form.transaction_type,
        status: form.status,
        address: form.address,
        address_detail: form.address_detail || null,
        dong: form.dong || null,
        ho: form.ho || null,
        latitude: null, longitude: null,
        sale_price: parseCommaNumber(form.sale_price),
        deposit: parseCommaNumber(form.deposit),
        monthly_rent: parseCommaNumber(form.monthly_rent),
        maintenance_fee: form.maintenance_fee ? parseInt(form.maintenance_fee) : null,
        supply_area_m2: form.supply_area_m2 ? parseFloat(form.supply_area_m2) : null,
        exclusive_area_m2: form.exclusive_area_m2 ? parseFloat(form.exclusive_area_m2) : null,
        rooms: form.rooms ? parseInt(form.rooms) : null,
        bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
        total_floors: form.total_floors ? parseInt(form.total_floors) : null,
        floor: form.floor ? parseInt(form.floor) : null,
        direction: form.direction || null,
        move_in_date: form.move_in_date || null,
        parking_per_unit: form.parking_per_unit ? parseFloat(form.parking_per_unit) : null,
        has_elevator: form.has_elevator,
        pets_allowed: form.pets_allowed,
        options: form.options.length > 0 ? form.options : null,
        description: form.description || null,
        is_urgent: form.is_urgent,
        is_co_brokerage: form.is_co_brokerage,
        co_brokerage_fee_ratio: form.co_brokerage_fee_ratio ? parseFloat(form.co_brokerage_fee_ratio) : null,
        internal_memo: form.internal_memo || null,
        built_year: form.built_year ? parseInt(form.built_year) : null,
        tags: (() => {
          const freeText = form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : []
          const merged = [...form.predefinedTags, ...freeText]
          return merged.length > 0 ? merged : null
        })(),
        photos: form.photos.length > 0 ? form.photos : null,
      }
      if (isEdit) {
        await updateProperty(id!, payload)
        toast.success('매물이 수정되었습니다.')
      } else {
        await createProperty(payload as Parameters<typeof createProperty>[0])
        toast.success('매물이 등록되었습니다.')
      }
      navigate('/admin/properties')
    } catch {
      toast.error('저장에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleOption = (opt: string) => {
    set('options', form.options.includes(opt) ? form.options.filter((o) => o !== opt) : [...form.options, opt])
  }

  const handleTogglePredefinedTag = (tag: string) => {
    set('predefinedTags', form.predefinedTags.includes(tag) ? form.predefinedTags.filter((t) => t !== tag) : [...form.predefinedTags, tag])
  }

  // Filter tag conditions by selected category
  const selectedCategoryName = useMemo(() => {
    const cat = categories.find((c) => c.id === form.category_id)
    return cat?.name ?? ''
  }, [categories, form.category_id])

  const visibleTagConditions = useMemo(() => {
    const builtInFiltered = selectedCategoryName
      ? tagConditions.filter((t) => !t.categories || t.categories.includes(selectedCategoryName))
      : tagConditions
    return builtInFiltered
  }, [tagConditions, selectedCategoryName])

  const visibleCustomTags = useMemo(() => {
    // Custom tags are always shown (they don't have category restrictions)
    return customTagLabels
  }, [customTagLabels])

  const supplyPyeong = form.supply_area_m2 ? sqmToPyeong(parseFloat(form.supply_area_m2)) : null
  const exclusivePyeong = form.exclusive_area_m2 ? sqmToPyeong(parseFloat(form.exclusive_area_m2)) : null

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{isEdit ? '매물 수정' : '매물 등록'}</h1>
        <Button variant="outline" size="sm" onClick={() => navigate('/admin/properties')}>목록</Button>
      </div>

      {/* Tabs */}
      <div className="scrollbar-hide flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        {/* Basic Info */}
        {activeTab === 'basic' && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">매물유형 *</label>
                <select value={form.category_id} onChange={(e) => set('category_id', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <option value="">선택하세요</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">거래유형 *</label>
                <div className="flex gap-2">
                  {(['sale', 'jeonse', 'monthly'] as const).map((t) => (
                    <button key={t} type="button" onClick={() => set('transaction_type', t)}
                      className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${form.transaction_type === t ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      {{ sale: '매매', jeonse: '전세', monthly: '월세' }[t]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <Input id="title" label="제목 *" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="예: 래미안 레이카운티 59㎡" required />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">상태</label>
                <select value={form.status} onChange={(e) => set('status', e.target.value as PropertyStatus)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <option value="draft">등록중</option>
                  <option value="active">광고중</option>
                  <option value="hold">보류</option>
                </select>
              </div>
              <div className="flex items-end gap-4 pb-1">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_urgent} onChange={(e) => set('is_urgent', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary-600" /> 급매 표시</label>
              </div>
            </div>
          </div>
        )}

        {/* Location */}
        {activeTab === 'location' && (
          <div className="space-y-4">
            <Input id="address" label="주소 *" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="예: 서울 서초구 반포동 123" required />
            <Input id="address_detail" label="상세주소" value={form.address_detail} onChange={(e) => set('address_detail', e.target.value)} placeholder="동, 호수 등" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="dong" label="동" value={form.dong} onChange={(e) => set('dong', e.target.value)} />
              <Input id="ho" label="호" value={form.ho} onChange={(e) => set('ho', e.target.value)} />
            </div>
            <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
              지도 영역 (카카오맵 API 연동 예정)
            </div>
          </div>
        )}

        {/* Price */}
        {activeTab === 'price' && (
          <div className="space-y-4">
            {(form.transaction_type === 'sale' || form.transaction_type === 'jeonse' || form.transaction_type === 'monthly') && form.transaction_type === 'sale' && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">매매가 (만원)</label>
                <input type="text" value={formatNumber(form.sale_price)} onChange={(e) => set('sale_price', e.target.value.replace(/,/g, ''))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="예: 95,000" />
                {form.sale_price && <p className="mt-1 text-xs text-gray-400">{formatNumber(form.sale_price)}만원</p>}
              </div>
            )}
            {(form.transaction_type === 'jeonse' || form.transaction_type === 'monthly') && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{form.transaction_type === 'jeonse' ? '전세금' : '보증금'} (만원)</label>
                <input type="text" value={formatNumber(form.deposit)} onChange={(e) => set('deposit', e.target.value.replace(/,/g, ''))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="예: 30,000" />
              </div>
            )}
            {form.transaction_type === 'monthly' && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">월세 (만원)</label>
                <input type="text" value={formatNumber(form.monthly_rent)} onChange={(e) => set('monthly_rent', e.target.value.replace(/,/g, ''))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="예: 80" />
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">관리비 (만원)</label>
              <input type="text" value={formatNumber(form.maintenance_fee)} onChange={(e) => set('maintenance_fee', e.target.value.replace(/,/g, ''))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="예: 15" />
            </div>
          </div>
        )}

        {/* Structure */}
        {activeTab === 'structure' && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">공급면적 (㎡)</label>
                <input type="number" step="0.01" value={form.supply_area_m2} onChange={(e) => set('supply_area_m2', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                {supplyPyeong && <p className="mt-1 text-xs text-gray-400">≈ {supplyPyeong}평</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">전용면적 (㎡)</label>
                <input type="number" step="0.01" value={form.exclusive_area_m2} onChange={(e) => set('exclusive_area_m2', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                {exclusivePyeong && <p className="mt-1 text-xs text-gray-400">≈ {exclusivePyeong}평</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Input id="rooms" label="방" type="number" value={form.rooms} onChange={(e) => set('rooms', e.target.value)} />
              <Input id="bathrooms" label="욕실" type="number" value={form.bathrooms} onChange={(e) => set('bathrooms', e.target.value)} />
              <Input id="floor" label="해당층" type="number" value={form.floor} onChange={(e) => set('floor', e.target.value)} />
              <Input id="total_floors" label="총층수" type="number" value={form.total_floors} onChange={(e) => set('total_floors', e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">방향</label>
                <select value={form.direction} onChange={(e) => set('direction', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <option value="">선택</option>
                  {directionOptions.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <Input id="built_year" label="준공연도" type="number" value={form.built_year} onChange={(e) => set('built_year', e.target.value)} placeholder="예: 2020" />
            </div>
          </div>
        )}

        {/* Detail */}
        {activeTab === 'detail' && (
          <div className="space-y-4">
            <Input id="move_in_date" label="입주가능일" type="date" value={form.move_in_date} onChange={(e) => set('move_in_date', e.target.value)} />
            <Input id="parking" label="주차 (대/세대)" type="number" step="0.1" value={form.parking_per_unit} onChange={(e) => set('parking_per_unit', e.target.value)} />
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.has_elevator} onChange={(e) => set('has_elevator', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary-600" /> 엘리베이터</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.pets_allowed} onChange={(e) => set('pets_allowed', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary-600" /> 반려동물 허용</label>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">옵션</label>
              <div className="flex flex-wrap gap-2">
                {optionChoices.map((opt) => (
                  <button key={opt} type="button" onClick={() => handleToggleOption(opt)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${form.options.includes(opt) ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            {(visibleTagConditions.length > 0 || visibleCustomTags.length > 0) && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">빠른 검색 태그</label>
                <p className="mb-2 text-xs text-gray-400">선택한 태그가 홈페이지 원클릭 검색에 연동됩니다</p>
                <div className="flex flex-wrap gap-2">
                  {visibleTagConditions.map((tc) => (
                    <button
                      key={tc.conditionKey}
                      type="button"
                      onClick={() => handleTogglePredefinedTag(tc.tag)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        form.predefinedTags.includes(tc.tag)
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {tc.tag}
                    </button>
                  ))}
                  {visibleCustomTags.map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => handleTogglePredefinedTag(label)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        form.predefinedTags.includes(label)
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <Input id="tags" label="커스텀 태그 (쉼표 구분)" value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="예: 신축, 올수리, 풀옵션" />
          </div>
        )}

        {/* Media */}
        {activeTab === 'media' && (
          <div className="space-y-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">사진</label>
            <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
              <p className="text-sm text-gray-500">사진을 드래그하여 업로드하세요</p>
              <p className="mt-1 text-xs text-gray-400">JPG, PNG (최대 10MB, 최대 20장)</p>
              <p className="mt-3 text-xs text-gray-400">Supabase Storage 연동 예정</p>
            </div>
            {form.photos.length > 0 && (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {form.photos.map((url, i) => (
                  <div key={i} className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <span className="absolute left-1 top-1 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white">{i + 1}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Description */}
        {activeTab === 'description' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">매물 설명</label>
              <button type="button" className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50">
                🤖 AI 자동 생성
              </button>
            </div>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={8}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="매물의 장점, 특징, 주변 환경 등을 자유롭게 작성하세요" />
          </div>
        )}

        {/* Co-brokerage */}
        {activeTab === 'co-brokerage' && (
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_co_brokerage} onChange={(e) => set('is_co_brokerage', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary-600" />
              <span className="font-medium">공동중개 허용</span>
            </label>
            {form.is_co_brokerage && (
              <Input id="co_ratio" label="공동중개 수수료 비율 (%)" type="number" step="0.1" value={form.co_brokerage_fee_ratio} onChange={(e) => set('co_brokerage_fee_ratio', e.target.value)} placeholder="예: 50" />
            )}
          </div>
        )}

        {/* Internal Memo */}
        {activeTab === 'memo' && (
          <div className="space-y-4">
            <label className="text-sm font-medium text-gray-700">내부 메모 (고객에게 비공개)</label>
            <textarea value={form.internal_memo} onChange={(e) => set('internal_memo', e.target.value)} rows={6}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="매물 관련 내부 메모를 작성하세요 (집주인 연락처, 키 보관 장소 등)" />
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/properties')}>취소</Button>
          <Button type="submit" isLoading={isLoading}>{isEdit ? '수정 완료' : '매물 등록'}</Button>
        </div>
      </form>
    </div>
  )
}

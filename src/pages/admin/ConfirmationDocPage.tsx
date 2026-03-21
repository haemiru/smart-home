import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { fetchContractById, updateContract, finalizeConfirmation } from '@/api/contracts'
import { fetchPropertyById } from '@/api/properties'
import { getConfirmationFormType, confirmationForms } from '@/utils/confirmationFormConfig'
import { ConfirmationFormRenderer } from '@/features/contracts/components/ConfirmationFormRenderer'
import { Button } from '@/components/common'
import { contractTemplateLabel, transactionTypeLabel, formatPropertyPrice } from '@/utils/format'
import type { Contract, Property } from '@/types/database'
import toast from 'react-hot-toast'

export function ConfirmationDocPage() {
  const { id } = useParams()
  const [contract, setContract] = useState<Contract | null>(null)
  const [property, setProperty] = useState<Property | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isPdfLoading, setIsPdfLoading] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)
  const navigate = useNavigate()
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    fetchContractById(id).then(async (c) => {
      if (cancelled || !c) return
      setContract(c)
      if (c.confirmation_doc && typeof c.confirmation_doc === 'object') {
        setFormData(c.confirmation_doc as Record<string, string>)
      }
      if (c.property_id) {
        const p = await fetchPropertyById(c.property_id).catch(() => null)
        if (!cancelled && p) {
          setProperty(p)
          // 매물 정보로 자동 채움 (기존 입력값이 없는 필드만)
          setFormData((prev) => {
            const auto: Record<string, string> = {}
            if (!prev.address && p.address) auto.address = p.address
            if (!prev.exclusive_area && p.exclusive_area_m2) auto.exclusive_area = String(p.exclusive_area_m2)
            if (!prev.building_area && p.supply_area_m2) auto.building_area = String(p.supply_area_m2)
            if (!prev.direction && p.direction) auto.direction = p.direction
            if (!prev.built_year && p.built_year) auto.built_year = String(p.built_year)
            if (!prev.floor_info && p.floor) auto.floor_info = `${p.floor}층 / ${p.total_floors ?? '-'}층`
            if (!prev.rooms && p.rooms) auto.rooms = String(p.rooms)
            if (!prev.bathrooms && p.bathrooms) auto.bathrooms = String(p.bathrooms)
            return Object.keys(auto).length > 0 ? { ...prev, ...auto } : prev
          })
        }
      }
    })
      .catch(() => {})
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [id])

  if (isLoading) return <div className="flex h-64 items-center justify-center text-gray-400">불러오는 중...</div>
  if (!contract) return <div className="text-center text-gray-400">계약을 찾을 수 없습니다.</div>

  const formType = getConfirmationFormType(contract.template_type)
  const formDef = confirmationForms[formType]

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateContract(contract.id, { confirmation_doc: formData })
      toast.success('확인설명서가 저장되었습니다.')
    } catch {
      toast.error('저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleFinalize = async () => {
    setIsFinalizing(true)
    try {
      await updateContract(contract.id, { confirmation_doc: formData })
      await finalizeConfirmation(contract.id)
      toast.success('확인설명서 작성이 완료되었습니다. 계약 진행 단계로 이동합니다.')
      navigate(`/admin/contracts/${contract.id}/tracker`)
    } catch {
      toast.error('완료 처리에 실패했습니다.')
    } finally {
      setIsFinalizing(false)
    }
  }

  const handleDownloadPdf = async () => {
    if (!printRef.current) return
    setIsPdfLoading(true)
    try {
      const html2canvas = (await import('html2canvas-pro')).default
      const { jsPDF } = await import('jspdf')
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfW = pdf.internal.pageSize.getWidth()
      const pdfH = pdf.internal.pageSize.getHeight()
      const margin = 10
      const contentW = pdfW - margin * 2
      const imgH = (canvas.height * contentW) / canvas.width
      let y = margin
      let page = 0
      while (y < imgH + margin) {
        if (page > 0) pdf.addPage()
        pdf.addImage(imgData, 'PNG', margin, margin - y + (page === 0 ? 0 : margin), contentW, imgH)
        y += pdfH - margin * 2
        page++
      }
      pdf.save(`확인설명서_${contract.contract_number}.pdf`)
      toast.success('PDF가 다운로드되었습니다.')
    } catch {
      toast.error('PDF 생성에 실패했습니다.')
    } finally {
      setIsPdfLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link to="/admin/contracts" className="hover:text-gray-600">계약 관리</Link>
        <span>/</span>
        <Link to={`/admin/contracts/${contract.id}/tracker`} className="hover:text-gray-600">{contract.contract_number}</Link>
        <span>/</span>
        <span className="text-gray-600">확인설명서</span>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">중개대상물 확인·설명서</h1>
          <p className="mt-1 text-sm text-gray-500">{formDef.label}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/admin/contracts/${contract.id}/edit`}>
            <Button variant="outline">📄 계약서 보기/수정</Button>
          </Link>
          <Button variant="outline" onClick={() => window.print()}>인쇄</Button>
          <Button
            variant="outline"
            onClick={handleDownloadPdf}
            disabled={isPdfLoading}
          >
            {isPdfLoading ? 'PDF 생성 중...' : 'PDF 다운로드'}
          </Button>
          <Button variant="outline" onClick={handleSave} isLoading={isSaving}>임시저장</Button>
          {contract.status === 'confirmation_writing' && (
            <Button onClick={handleFinalize} isLoading={isFinalizing}>확인설명서 완료</Button>
          )}
        </div>
      </div>

      {/* Contract Summary */}
      <div className="rounded-xl bg-primary-50 p-4 ring-1 ring-primary-200">
        <div className="grid gap-2 text-sm sm:grid-cols-3">
          <div><span className="text-gray-500">계약번호: </span><span className="font-medium">{contract.contract_number}</span></div>
          <div><span className="text-gray-500">양식: </span><span className="font-medium">{contractTemplateLabel[contract.template_type]}</span></div>
          <div><span className="text-gray-500">거래유형: </span><span className="font-medium">{transactionTypeLabel[contract.transaction_type]}</span></div>
          {property && (
            <>
              <div><span className="text-gray-500">매물: </span><span className="font-medium">{property.title}</span></div>
              <div className="sm:col-span-2"><span className="text-gray-500">가격: </span><span className="font-medium text-primary-700">{formatPropertyPrice(property.transaction_type, property.sale_price, property.deposit, property.monthly_rent)}</span></div>
            </>
          )}
        </div>
      </div>

      {/* Form */}
      <div ref={printRef}>
        <ConfirmationFormRenderer
          sections={formDef.sections}
          formData={formData}
          onChange={handleChange}
        />
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-4">
        <Link to={`/admin/contracts/${contract.id}/tracker`}>
          <Button variant="outline">진행현황으로 돌아가기</Button>
        </Link>
        <Button onClick={handleSave} isLoading={isSaving}>저장</Button>
      </div>
    </div>
  )
}

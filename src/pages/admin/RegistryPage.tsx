import { useState, useRef } from 'react'
import { uploadRegistryPdf, validatePdfFile, deleteStorageFile } from '@/api/storage'
import { getAgentProfileId } from '@/api/helpers'
import toast from 'react-hot-toast'

type RegistryDoc = {
  url: string
  fileName: string
  address: string
  uploadedAt: string
}

const LS_KEY = 'registry-docs'

function loadDocs(): RegistryDoc[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]')
  } catch {
    return []
  }
}

function saveDocs(docs: RegistryDoc[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(docs))
}

export function RegistryPage() {
  const [docs, setDocs] = useState<RegistryDoc[]>(loadDocs)
  const [address, setAddress] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (files: File[]) => {
    const file = files[0]
    if (!file) return

    const err = validatePdfFile(file)
    if (err) { toast.error(err); return }
    if (!address.trim()) { toast.error('매물 주소를 먼저 입력해주세요.'); return }

    setIsUploading(true)
    try {
      const agentId = await getAgentProfileId()
      const { url, fileName } = await uploadRegistryPdf(file, agentId)
      const newDoc: RegistryDoc = {
        url,
        fileName,
        address: address.trim(),
        uploadedAt: new Date().toISOString(),
      }
      const updated = [newDoc, ...docs]
      setDocs(updated)
      saveDocs(updated)
      setAddress('')
      toast.success('등기부등본이 업로드되었습니다.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '업로드에 실패했습니다.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (doc: RegistryDoc) => {
    if (!confirm(`"${doc.fileName}" 파일을 삭제하시겠습니까?`)) return
    try {
      await deleteStorageFile(doc.url)
    } catch { /* 스토리지 삭제 실패해도 목록에서 제거 */ }
    const updated = docs.filter((d) => d.url !== doc.url)
    setDocs(updated)
    saveDocs(updated)
    toast.success('삭제되었습니다.')
  }

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true) }
  const handleDragLeave = () => setDragOver(false)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type === 'application/pdf')
    if (files.length === 0) { toast.error('PDF 파일만 업로드할 수 있습니다.'); return }
    handleUpload(files)
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">등기부등본 관리</h1>
        <p className="mt-1 text-sm text-gray-500">
          인터넷등기소(iros.go.kr)에서 발급받은 등기부등본 PDF를 업로드하여 관리합니다.
        </p>
      </div>

      {/* Upload Section */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <h2 className="mb-4 text-sm font-bold">등기부등본 업로드</h2>

        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-gray-500">매물 주소 *</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="등기부등본에 해당하는 매물 주소 입력..."
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            dragOver ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <svg className="mx-auto h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="mt-2 text-sm text-gray-500">클릭 또는 드래그하여 PDF 업로드</p>
          <p className="mt-1 text-xs text-gray-400">PDF 파일만 가능 · 최대 20MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            hidden
            onChange={(e) => handleUpload(Array.from(e.target.files || []))}
          />
        </div>

        {isUploading && (
          <div className="mt-3 flex items-center gap-2 text-sm text-primary-600">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            업로드 중...
          </div>
        )}
      </div>

      {/* Document List */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <h2 className="mb-4 text-sm font-bold">업로드된 등기부등본 ({docs.length}건)</h2>

        {docs.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">업로드된 등기부등본이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {docs.map((doc) => (
              <div
                key={doc.url}
                className="flex items-center justify-between rounded-lg border border-gray-100 p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-800">{doc.fileName}</p>
                    <p className="truncate text-xs text-gray-500">{doc.address}</p>
                    <p className="text-xs text-gray-400">{formatDate(doc.uploadedAt)}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                  >
                    열람
                  </a>
                  <button
                    onClick={() => handleDelete(doc)}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Guide */}
      <div className="rounded-lg bg-blue-50 p-4">
        <h3 className="text-xs font-bold text-blue-700">등기부등본 발급 안내</h3>
        <ol className="mt-2 space-y-1 text-xs text-blue-600">
          <li>1. 대한민국 법원 인터넷등기소(iros.go.kr) 접속</li>
          <li>2. 열람/발급 → 부동산 → 소재지번으로 검색</li>
          <li>3. 등기부등본(말소사항 포함) 발급 (700원)</li>
          <li>4. 발급된 PDF 파일을 위에 업로드</li>
        </ol>
      </div>
    </div>
  )
}

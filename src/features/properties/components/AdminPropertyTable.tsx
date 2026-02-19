import { Link } from 'react-router-dom'
import type { Property } from '@/types/database'
import { formatPropertyPrice, formatArea, propertyStatusLabel, propertyStatusColor, transactionTypeLabel, formatDate } from '@/utils/format'
import { useCategories } from '@/hooks/useCategories'

interface AdminPropertyTableProps {
  properties: Property[]
  selectedIds: Set<string>
  onSelect: (id: string) => void
  onSelectAll: () => void
}

export function AdminPropertyTable({ properties, selectedIds, onSelect, onSelectAll }: AdminPropertyTableProps) {
  const { findCategory } = useCategories()
  const allSelected = properties.length > 0 && properties.every((p) => selectedIds.has(p.id))

  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
      <table className="w-full min-w-[900px] text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500">
            <th className="px-4 py-3">
              <input type="checkbox" checked={allSelected} onChange={onSelectAll} className="h-4 w-4 rounded border-gray-300 text-primary-600" />
            </th>
            <th className="px-4 py-3">매물</th>
            <th className="px-4 py-3">유형/거래</th>
            <th className="px-4 py-3">가격</th>
            <th className="px-4 py-3">면적</th>
            <th className="px-4 py-3">상태</th>
            <th className="px-4 py-3 text-center">조회/문의/찜</th>
            <th className="px-4 py-3">등록일</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {properties.map((p) => {
            const cat = findCategory(p.category_id)
            return (
              <tr key={p.id} className={`transition-colors hover:bg-gray-50 ${selectedIds.has(p.id) ? 'bg-primary-50/50' : ''}`}>
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => onSelect(p.id)} className="h-4 w-4 rounded border-gray-300 text-primary-600" />
                </td>
                <td className="max-w-[250px] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={p.photos?.[0] || 'https://placehold.co/80x60/e2e8f0/94a3b8?text=N'} alt="" className="h-10 w-14 shrink-0 rounded object-cover" />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900">{p.title}</p>
                      <p className="truncate text-xs text-gray-400">{p.address}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs">
                  <span>{cat?.name}</span>
                  <br />
                  <span className="text-gray-400">{transactionTypeLabel[p.transaction_type]}</span>
                </td>
                <td className="px-4 py-3 font-medium">
                  {formatPropertyPrice(p.transaction_type, p.sale_price, p.deposit, p.monthly_rent)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                  {formatArea(p.exclusive_area_m2)}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${propertyStatusColor[p.status]}`}>
                    {propertyStatusLabel[p.status]}
                  </span>
                  {p.is_urgent && <span className="ml-1 text-xs text-red-500">🔥</span>}
                </td>
                <td className="px-4 py-3 text-center text-xs text-gray-400">
                  {p.view_count} / {p.inquiry_count} / {p.favorite_count}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">{formatDate(p.created_at)}</td>
                <td className="px-4 py-3">
                  <Link to={`/admin/properties/${p.id}`} className="rounded px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50">
                    수정
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {properties.length === 0 && (
        <div className="py-16 text-center text-sm text-gray-400">매물이 없습니다.</div>
      )}
    </div>
  )
}

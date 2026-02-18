import { useState } from 'react'
import { Modal } from './Modal'

interface AreaCalculatorModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AreaCalculatorModal({ isOpen, onClose }: AreaCalculatorModalProps) {
  const [sqm, setSqm] = useState('')
  const [pyeong, setPyeong] = useState('')

  const handleSqmChange = (value: string) => {
    setSqm(value)
    const num = parseFloat(value)
    setPyeong(isNaN(num) ? '' : (num / 3.3058).toFixed(2))
  }

  const handlePyeongChange = (value: string) => {
    setPyeong(value)
    const num = parseFloat(value)
    setSqm(isNaN(num) ? '' : (num * 3.3058).toFixed(2))
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="면적 계산기" size="sm">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            제곱미터 (㎡)
          </label>
          <input
            type="number"
            value={sqm}
            onChange={(e) => handleSqmChange(e.target.value)}
            placeholder="㎡ 입력"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex items-center justify-center">
          <div className="rounded-full bg-gray-100 p-2">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            평
          </label>
          <input
            type="number"
            value={pyeong}
            onChange={(e) => handlePyeongChange(e.target.value)}
            placeholder="평 입력"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <p className="text-center text-xs text-gray-400">1평 = 3.3058㎡</p>
      </div>
    </Modal>
  )
}

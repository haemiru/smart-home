import { Link } from 'react-router-dom'
import { Button } from '@/components/common'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <h1 className="text-6xl font-bold text-gray-200">404</h1>
      <p className="mt-4 text-lg text-gray-600">페이지를 찾을 수 없습니다.</p>
      <Link to="/" className="mt-6">
        <Button>홈으로 돌아가기</Button>
      </Link>
    </div>
  )
}

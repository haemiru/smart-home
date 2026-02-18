import { Link } from 'react-router-dom'

export function UserFooter() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Top Links */}
        <div className="flex flex-wrap items-center gap-4 border-b border-gray-200 pb-6 text-sm">
          <Link to="/terms" className="font-medium text-gray-600 hover:text-gray-900">
            이용약관
          </Link>
          <Link to="/privacy" className="font-bold text-gray-900 hover:text-primary-600">
            개인정보처리방침
          </Link>
          <Link to="/support" className="font-medium text-gray-600 hover:text-gray-900">
            고객센터
          </Link>
          <Link to="/about" className="font-medium text-gray-600 hover:text-gray-900">
            회사소개
          </Link>
        </div>

        {/* Company Info */}
        <div className="pt-6 text-xs leading-relaxed text-gray-400">
          <p className="font-medium text-gray-500">Smart Home — 공인중개사 올인원 업무 플랫폼</p>
          <p className="mt-2">
            Smart Home은 통신판매중개자로서 중개사무소가 등록한 매물정보 및 거래에 대한 책임은 각 중개사무소에 있습니다.
          </p>
          <p className="mt-4">&copy; {new Date().getFullYear()} Smart Home. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default function TenantNotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="text-6xl">🏢</div>
      <h1 className="mt-6 text-2xl font-bold text-gray-900">
        중개사무소를 찾을 수 없습니다
      </h1>
      <p className="mt-3 max-w-md text-base text-gray-500">
        이 주소에 등록된 중개사무소가 없습니다.
        주소를 다시 확인하시거나, 아래 링크를 통해 Smart Home 메인 페이지로 이동하세요.
      </p>
      <a
        href="https://smarthome.co.kr"
        className="mt-8 rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
      >
        Smart Home 메인으로
      </a>
    </div>
  )
}

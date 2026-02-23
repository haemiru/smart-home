import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      {/* Header */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Smart Home" className="h-9 w-9 rounded-lg object-contain" />
          <span className="text-xl font-bold text-primary-700">Smart Home</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/auth/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            로그인
          </Link>
          <Link
            to="/auth/signup"
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            무료 시작하기
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center lg:py-28">
        <h1 className="text-3xl font-extrabold leading-tight text-gray-900 sm:text-4xl lg:text-5xl">
          공인중개사를 위한
          <br />
          <span className="text-primary-600">올인원 업무 플랫폼</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-gray-600 sm:text-lg">
          매물 관리, 계약, CRM, AI 도구, 통계, 법률, 공동중개까지 &#8212;
          하나의 플랫폼에서 모두 해결하세요.
          나만의 서브도메인으로 전문 홈페이지도 바로 운영할 수 있습니다.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/auth/signup"
            className="rounded-xl bg-primary-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg transition-colors hover:bg-primary-700"
          >
            무료로 시작하기
          </Link>
          <a
            href="#features"
            className="rounded-xl border border-gray-300 px-8 py-3.5 text-base font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            기능 살펴보기
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="mb-12 text-center text-2xl font-bold text-gray-900 sm:text-3xl">
          Smart Home이 제공하는 기능
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: '🏠', title: '매물 관리', desc: '매물 등록부터 상태 관리, 사진, 설명까지 한 곳에서' },
            { icon: '📝', title: '계약 관리', desc: '12종 계약서 양식, 자동 매핑, 진행 트래커' },
            { icon: '👥', title: 'CRM', desc: '고객 파이프라인, 스코어링, 활동 추적' },
            { icon: '🤖', title: 'AI 도구', desc: 'AI 매물설명, 법률검토, 고객분석, 챗봇' },
            { icon: '📊', title: '시세/분석', desc: '시세 조회, ROI 계산기, 매수매도 신호등' },
            { icon: '🌐', title: '나만의 홈페이지', desc: '서브도메인으로 전문 중개사 홈페이지 운영' },
          ].map((f) => (
            <div key={f.title} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
              <span className="text-3xl">{f.icon}</span>
              <h3 className="mt-3 text-base font-semibold text-gray-900">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 py-8 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} Smart Home. All rights reserved.
      </footer>
    </div>
  )
}

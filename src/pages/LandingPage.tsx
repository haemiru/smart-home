import { Link } from 'react-router-dom'

const features = [
  { icon: '🏠', title: '매물 관리', desc: '카테고리별 맞춤 등록 폼, 사진/태그 관리, 상태 추적까지 한 곳에서 관리' },
  { icon: '📝', title: '계약 관리', desc: '12종 계약서 양식 자동 추천, 계약 진행 트래커, 확인설명서 연동' },
  { icon: '👥', title: '고객 관리 (CRM)', desc: '파이프라인 칸반보드, AI 진성 분석, 자동 스코어링, 활동 타임라인' },
  { icon: '🤖', title: 'AI 업무 도우미', desc: 'AI 매물설명 생성, 법률검토, 고객분석, 문의 자동응답, 입주 가이드' },
  { icon: '📊', title: '시세/분석 도구', desc: '국토부 실거래가 연동, ROI 계산기, 입지분석, 매수매도 신호등' },
  { icon: '🌐', title: '나만의 홈페이지', desc: '서브도메인으로 전문 중개사 홈페이지 즉시 운영, 브랜딩 커스텀' },
  { icon: '📩', title: '문의/상담 관리', desc: '실시간 문의 접수, AI 답변 초안, 알림톡/이메일 멀티채널 응답' },
  { icon: '🔍', title: '임장/현장점검', desc: '모바일 최적화 체크리스트, 사진 기록, AI 리포트 자동 생성' },
  { icon: '🏢', title: '임대 관리', desc: '수납 현황, 수선 요청 관리, 임대인 공유 링크, 만기 알림' },
]

const plans = [
  { name: 'Free', price: '무료', desc: '시작하는 중개사', features: ['매물 10건', '계약 관리', 'CRM', '문의 관리'] },
  { name: 'Basic', price: '월 29,000원', desc: '성장하는 중개사', features: ['매물 무제한', 'AI 도구 전체', '시세/분석', '임장 관리', '공동중개', '알림톡/SMS'], highlight: true },
  { name: 'Pro', price: '월 59,000원', desc: '전문 중개사', features: ['Basic 전체', 'AI 홈스테이징', 'SNS 자동 포스팅', '전자서명', '실시간 채팅', '커스텀 도메인'] },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="중개프로" className="h-9 w-9 rounded-lg object-contain" />
            <span className="text-xl font-bold text-primary-700">중개프로</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="#features" className="hidden text-sm font-medium text-gray-600 hover:text-primary-600 sm:inline">기능</a>
            <a href="#pricing" className="hidden text-sm font-medium text-gray-600 hover:text-primary-600 sm:inline">요금제</a>
            <Link to="/auth/login" className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">로그인</Link>
            <Link to="/auth/signup" className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">무료로 시작하기</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 py-24 lg:py-32">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-white" />
          <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-white" />
        </div>
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <h1 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">
            공인중개사를 위한
            <br />
            올인원 업무 플랫폼
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-primary-100 sm:text-lg">
            매물 관리, 계약, CRM, AI 도구, 국토부 실거래가, 임장점검까지 &#8212;
            <br className="hidden sm:inline" />
            하나의 플랫폼에서 모두 해결하세요.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/auth/signup" className="rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-primary-700 shadow-lg transition-all hover:bg-gray-50 hover:shadow-xl">
              무료로 시작하기
            </Link>
            <a href="#features" className="rounded-xl border border-white/30 px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10">
              기능 살펴보기
            </a>
          </div>
          <p className="mt-4 text-sm text-primary-200">신용카드 없이 무료로 시작 · 언제든 업그레이드</p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-gray-100 bg-gray-50 py-12">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 px-6 text-center sm:grid-cols-4">
          {[
            { value: '12종', label: '계약서 양식' },
            { value: '11개', label: '국토부 실거래가 API' },
            { value: '9개', label: '부동산 카테고리' },
            { value: 'AI', label: 'Gemini 3 Pro 탑재' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-bold text-primary-700 sm:text-3xl">{s.value}</p>
              <p className="mt-1 text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="mb-4 text-center text-2xl font-bold text-gray-900 sm:text-3xl">
          중개 업무에 필요한 모든 것
        </h2>
        <p className="mb-12 text-center text-gray-500">하나의 플랫폼으로 업무 효율을 극대화하세요</p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-gray-100 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-lg">
              <span className="text-3xl">{f.icon}</span>
              <h3 className="mt-3 text-base font-semibold text-gray-900">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="mb-12 text-center text-2xl font-bold text-gray-900 sm:text-3xl">시작이 간편합니다</h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              { step: '1', title: '무료 가입', desc: '이메일 또는 구글 계정으로 30초 만에 가입' },
              { step: '2', title: '사무소 설정', desc: '사무소 정보 입력하면 나만의 홈페이지 자동 생성' },
              { step: '3', title: '업무 시작', desc: '매물 등록하고 고객에게 홈페이지 주소 공유' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-lg font-bold text-white">{s.step}</div>
                <h3 className="mt-4 text-base font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="mb-4 text-center text-2xl font-bold text-gray-900 sm:text-3xl">합리적인 요금제</h2>
        <p className="mb-12 text-center text-gray-500">무료로 시작하고, 필요할 때 업그레이드하세요</p>
        <div className="grid gap-6 sm:grid-cols-3">
          {plans.map((p) => (
            <div key={p.name} className={`rounded-2xl border-2 p-6 ${p.highlight ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500/20' : 'border-gray-200 bg-white'}`}>
              {p.highlight && <span className="mb-2 inline-block rounded-full bg-primary-600 px-3 py-0.5 text-xs font-bold text-white">인기</span>}
              <h3 className="text-lg font-bold text-gray-900">{p.name}</h3>
              <p className="mt-1 text-2xl font-extrabold text-primary-700">{p.price}</p>
              <p className="mt-1 text-sm text-gray-500">{p.desc}</p>
              <ul className="mt-4 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="h-4 w-4 shrink-0 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/auth/signup" className={`mt-6 block rounded-lg py-2.5 text-center text-sm font-semibold transition-colors ${p.highlight ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                {p.name === 'Free' ? '무료로 시작' : '시작하기'}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-700 py-16 text-center">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">지금 바로 시작하세요</h2>
        <p className="mt-3 text-primary-200">가입 후 1분이면 나만의 중개사 홈페이지가 완성됩니다</p>
        <Link to="/auth/signup" className="mt-8 inline-block rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-primary-700 shadow-lg transition-all hover:bg-gray-50">
          무료로 시작하기
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="중개프로" className="h-6 w-6 rounded object-contain" />
              <span className="text-sm font-bold text-gray-700">중개프로</span>
            </div>
            <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} 중개프로. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

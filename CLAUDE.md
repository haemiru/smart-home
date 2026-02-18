# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Smart Home** — 공인중개사 올인원 업무 플랫폼. 매물 관리, 계약, CRM, 문의, AI 도구, 통계, 법률/서식, 공동중개, 현장점검, 임대 관리 등을 하나의 웹앱에서 제공.

## Commands

```bash
npm run dev      # Vite dev server (port 5173)
npm run build    # TypeScript check + production build → dist/
npm run lint     # ESLint
npm run preview  # Preview production build
```

## Tech Stack

- **React 19** + TypeScript + Vite 7
- **Tailwind CSS v4** (`@tailwindcss/vite` plugin, no config file — customization in `src/styles/index.css` via `@theme` and `@utility`)
- **Zustand** for state management (stores in `src/stores/`)
- **React Router v6** — `createBrowserRouter` in `src/router.tsx`
- **Supabase** (PostgreSQL, Auth, Storage, Realtime) — client in `src/api/supabase.ts`
- **react-hot-toast** for notifications
- Deployment: Vercel (`vercel.json`) or Netlify (`public/_redirects`)

## Architecture

### Dual Portal System

Two independent portals with separate layouts:

1. **User Portal** (`/`) — public browsing portal
   - `UserLayout`: `UserGNB` (desktop menu + mobile hamburger) → content → `UserFooter` → `UserMobileNav` (mobile bottom tabs) → `FloatingFAB`
   - Homepage: Hero search → Category tabs → 2-column (sidebar filters + property grid) → Quick search → AI recommendations → Carousel → Hot issues → Links

2. **Admin Portal** (`/admin/*`) — agent/staff only (ProtectedRoute + RBAC)
   - `AdminLayout`: `AdminHeader` (search + notifications + profile dropdown) → `AdminSidebar` (desktop) / `AdminMobileNav` (mobile bottom tabs) → content
   - Sidebar items driven by `agent_feature_settings` (feature ON/OFF per agent)

### Admin Dashboard

- **Dashboard** (`/admin/dashboard`) — 7-section overview:
  1. Summary cards (4-grid): new inquiries, active contracts, properties, customers — clickable → respective pages
  2. Monthly performance: registrations, contracts closed, total transaction amount + BarChart trend
  3. Unanswered inquiries (top 5) with status icons and relative time
  4. Today's schedule: today/tomorrow inspection appointments
  5. Property stats (top 5): horizontal bar chart — views, inquiries, favorites
  6. Activity feed: 10-item timeline with icons and links
  7. Todo list: auto-generated items (unanswered inquiries, upcoming payments, repair requests) with checkbox
- Mock API in `src/api/dashboard.ts` — aggregated dashboard data

### Routing

- `src/router.tsx` — central route definition with **React.lazy + Suspense** code splitting for all pages
- User portal routes are **public** (no auth required for browsing)
- Admin portal routes require `agent` or `staff` role
- Auth pages: `/auth/login`, `/auth/signup`, `/auth/callback`

### Auth Flow

- Supabase Auth: email/password (with email verification) + Google OAuth
- Signup is multi-step: role selection → account info → agent office info (if agent)
- Agent accounts require admin verification (`is_verified`) before full feature access
- Auth state managed in `src/stores/authStore.ts` — initializes on app mount, listens for auth changes via `onAuthStateChange`

### Homepage State

- `src/stores/homeFilterStore.ts` — Zustand store for category selection, deal type / price / area / room / floor filters, search query
- Filter data and mock property data in `src/utils/mockData.ts` — data-driven rendering to support future admin config
- `src/components/home/` — section components: `HeroSection`, `CategoryTabs`, `PropertyFilters` (sidebar + chips), `PropertyCard`, `PropertyGrid`, `QuickSearchGrid`, `AIRecommendations`, `UrgentCarousel`, `HotIssuesSection`, `RelatedLinksSection`

### Feature Modules

Each feature lives in `src/features/{name}/` with its own `components/`, `hooks/`, `utils/` subdirectories:

`auth`, `properties`, `contracts`, `crm`, `inquiries`, `ai-tools`, `analytics`, `legal`, `co-brokerage`, `inspection`, `rental-mgmt`, `settings`

### Inquiry System

- User portal: FloatingFAB + PropertyDetailPage inquiry modals → `createInquiry()` → shows inquiry number (INQ-YYYYMMDD-NNN)
- User portal: `/my/inquiries` — inquiry history with expandable reply view
- Admin portal: `/admin/inquiries` — table with status/type filters, unanswered count badge
- Admin portal: `/admin/inquiries/:id` — detail with reply form, AI draft placeholder, channel selection (email/alimtalk/SMS)
- Notification store (`src/stores/notificationStore.ts`) — Zustand store for real-time notifications, integrated with AdminHeader bell + AdminSidebar badge

### CRM (Customer Management)

- `/admin/customers` — dual view: pipeline (kanban board) + list (table)
- `/admin/customers/:id` — tabs: profile, activity timeline, matching properties (placeholder), consultation records (placeholder), memo
- Customer scoring: view +5, favorite +10, inquiry +20, appointment +30, contract_view +40, 7-day inactivity -15
- Pipeline stages: lead → interest → consulting → contracting → completed
- Inquiry → CRM auto-linkage via mock API

### Contract System

- `/admin/contracts` — list with status tabs (작성중/서명대기/서명완료/계약완료)
- `/admin/contracts/new` — 4-step wizard: property selection → template selection → auto-mapping + manual input → preview with print
- `/admin/contracts/:id/tracker` — vertical timeline with checkable steps, D-Day display, due dates, notes, required documents
- `/my/contracts` — user-facing read-only contract list + timeline tracker with progress bar
- 12 contract templates covering apartment/officetel/commercial/building/land/factory/knowledge center (sale + lease)
- Auto-generated process steps: sale (6 steps) vs lease (8 steps)
- Template recommendation based on property category
- Required documents per step

### AI Features (Gemini 3 Pro)

- **Common**: `src/api/gemini.ts` — `generateContent(prompt, systemPrompt?)` with retry logic, error handling
- **AI Description Generator** (`/admin/ai-tools/description`) — property selection or manual input, platform (blog/naver/instagram) + tone (professional/friendly/emotional), generates 3 versions
- **AI Legal Review** — button on `/admin/contracts/:id/tracker`, reviews contract against 7 laws (공인중개사법, 민법, 주택임대차보호법, etc.), categorizes as 적합/주의/위반
- **AI Draft Reply** — button on `/admin/inquiries/:id`, generates inquiry reply draft with property context
- **AI Chatbot** — user portal floating widget (via FloatingFAB), FAQ auto-response, after-hours inquiry submission
- **AI Customer Analysis** — "진성 분석" tab on `/admin/customers/:id`, analyzes activity data, provides sincerity score, conversion probability, recommended actions
- **Move-in Guide** — admin generates via contract tracker for lease contracts, user views at `/my/move-in-guide/:contractId`
- Generation logs saved to `ai_generation_logs` table
- API key: `VITE_GEMINI_API_KEY` env var

### Data Analytics (Recharts)

- **Market Info** (`/market-info` user, `/admin/analytics/valuation` admin) — complex price trend line chart (6mo/1yr/3yr), pyeong comparison bar chart, fair value band chart (ComposedChart with Area+Line), regional price summary table
- **ROI Calculator** (`/admin/analytics/roi`) — real-time calculation: ROI, Cap Rate, monthly cashflow, break-even point. Inputs: purchase price, loan ratio, interest rate, deposit, monthly rent, taxes, vacancy rate, holding period. Leverage comparison bar chart, cumulative profit line chart
- **Location Analysis** (`/admin/analytics/location`) — address input → 6 category score bars (transport/school/amenity/foot_traffic/development/safety), grade A+~F, PDF download, share link
- **Buy/Sell Signal** (`/admin/analytics/signal`) — traffic light system (🟢매수적기/🟡관망/🔴매도적기), 5 weighted indicators (txVolume 25%, priceChange 25%, supplyChange 20%, interestRate 15%, unsold 15%), weighted average → threshold-based color, Seoul 12 districts + Gyeonggi 8 cities mock data
- Mock data in `src/utils/marketMockData.ts` — complexes, price trends, pyeong comparisons, fair value ranges, location profiles, signal seeds, regional summaries

### Field Inspection (임장 관리)

- **Inspection List** (`/admin/inspection`) — scheduled/in-progress/completed tabs, new inspection modal (property selection or manual input)
- **Checklist** (`/admin/inspection/:id/checklist`) — mobile-optimized UI with large touch targets, 7 categories (구조/외관, 내부 상태, 수도/배관, 전기/가스, 창호/방범, 옵션/가전, 주차/환경), 23 check items
  - Each item: 양호/보통/불량 status + note + photo placeholder
  - Progress bar, offline detection (navigator.onLine), auto-save
- **Report** (`/admin/inspection/:id/report`) — auto-generated on completion, grade A~F based on good/normal/bad ratios, category breakdown bar chart, attention items list, AI analysis via Gemini
- Mock API in `src/api/inspections.ts` — checklist template, grade calculation, CRUD

### Rental Management (임대 관리)

- **Dashboard** (`/admin/rental-mgmt`) — summary cards (properties, collection rate, expiring, repairs), property table with payment/repair status icons
- **Detail** (`/admin/rental-mgmt/:id`) — tenant/contract info, payment history table + bar chart (Recharts), repair request tickets with status management
- **Landlord Share** (`/admin/rental-mgmt/share/:token`) — read-only public page via token-based share link (30-day expiry), shows payment history, repairs, contract info
- DB tables: `rental_properties`, `rental_payments`, `repair_requests`, `rental_share_links`
- Mock API in `src/api/rental.ts` — 5 properties, auto-generated payment history, repair requests, share link system

### Legal/Administrative (법률 행정)

- **Registry Check** (`/admin/legal/registry`) — address input → mock 등기부등본 lookup, 갑구(소유권)/을구(제한물권) tables, risk highlighting (가압류=danger, 근저당=caution), summary analysis
- **E-Signature** — placeholder on contract tracker (`전자서명 요청` button), signature status display (미서명/서명중/완료), future 카카오/네이버 API integration
- Mock API in `src/api/legal.ts` — registry lookup, signature request/status

### Co-Brokerage (공동중개)

- **Shared Property Pool** (`/admin/co-brokerage`) — card-style list of properties shared by other agents, search, stats (매매/임대), request modal with message
- **Request Management** (`/admin/co-brokerage/requests`) — tabs for received/sent requests, approve with commission ratio slider, reject with confirmation
- Information disclosure levels: basic (위치/면적/가격) → approved (상세사진/내부정보) → contracted (집주인연락처)
- DB tables: `shared_properties`, `co_brokerage_requests` (status: pending/approved/rejected)
- Mock API in `src/api/co-brokerage.ts` — 5 shared properties, 4 requests, CRUD

### Admin Settings (환경설정)

- **Settings Layout** (`/admin/settings`) — left sub-menu (desktop) / horizontal scroll tabs (mobile) + right content `<Outlet />`
- **Office Info** (`/admin/settings/office`) — form: 사무소명, 대표자, 사업자번호, 면허번호, 주소, 연락처, 팩스, 영업시간 (day-by-day), 로고 upload, 소개글, 전문 분야 (multi-select), 보증보험 정보
- **Staff** (`/admin/settings/staff`) — list table, invite modal, role assignment (lead_agent/associate_agent/assistant), permission toggle matrix (9 permissions), activate/deactivate/delete
- **Features** (`/admin/settings/features`) — 8 category groups, each feature: name + description + toggle. Locked features (🔒), Pro features, Gemini features (⚡). Disable confirmation dialog
- **Categories** (`/admin/settings/categories`) — system categories grouped by type (주거/상업/산업/토지/건물), ON/OFF toggle, reorder (UP/DOWN), custom category add modal (name/emoji/color)
- **Search** (`/admin/settings/search`) — filter group ON/OFF + order, quick search cards ON/OFF + order, result settings (sort/page size/view mode)
- **Units** (`/admin/settings/units`) — area (㎡/평), price (만원/억원), distance (m/km), date/time formats
- **Floating** (`/admin/settings/floating`) — button ON/OFF + order + URL/phone config, FAB color picker, preview
- **Notifications** (`/admin/settings/notifications`) — matrix: 7 notification types × 3 channels (push/email/alimtalk)
- **Integrations** (`/admin/settings/integrations`) — 8 external services grouped by category, connect/disconnect with URL input
- **Billing** (`/admin/settings/billing`) — current plan display, plan comparison (Free/Basic/Pro/Enterprise), payment history table
- **Security** (`/admin/settings/security`) — password change, 2FA toggle, login records table, active sessions with terminate
- Mock API in `src/api/settings.ts` — comprehensive mock data for all settings sections

### Database

- SQL migrations in `supabase/migrations/`
- Tables: `users`, `agent_profiles`, `staff_members`, `agent_feature_settings`, `properties`, `property_categories`, `property_favorites`, `inquiries`, `inquiry_replies`, `customers`, `customer_activities`, `contracts`, `contract_process`, `ai_generation_logs`, `move_in_guides`, `inspections`, `rental_properties`, `rental_payments`, `repair_requests`, `rental_share_links`, `shared_properties`, `co_brokerage_requests`
- All tables have Row Level Security (RLS) policies
- TypeScript types in `src/types/database.ts` — must use `type` aliases (not `interface`) for Row types to satisfy Supabase's `GenericSchema` constraint

### Feature Settings Integration

- `src/stores/featureStore.ts` — Zustand store that loads `agent_feature_settings` on app init
- `isNavItemVisible()` maps sidebar nav keys to feature keys; hides nav items when all related features are OFF
- AdminSidebar filters nav items based on feature store state
- Initialized in `App.tsx` alongside auth store

### Mock API Pattern

All API modules (`src/api/`) use in-memory mock data for development. Each exports async functions that simulate Supabase calls. Replace with actual Supabase client calls when backend is connected.

### Performance

- **Code splitting**: all pages use `React.lazy()` + `Suspense` with shared `PageLoader` fallback. Main bundle ~531KB (gzip ~158KB), pages split into ~60 chunks
- Bundle chunks: vendor (react/react-dom), recharts (BarChart/LineChart), and individual page modules

### Path Aliases

`@/*` maps to `src/*` (configured in both `tsconfig.app.json` and `vite.config.ts`)

### Custom CSS Utilities

Defined in `src/styles/index.css` via `@utility`:
- `scrollbar-hide` — hides scrollbars on horizontal scroll containers
- `animate-in`, `fade-in`, `slide-in-from-bottom-2` — entry animations for FAB

## UI Language

Korean (한국어). All user-facing text uses Korean strings.

## Environment Variables

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GEMINI_API_KEY=your-gemini-api-key
```

Copy `.env.example` to `.env` and fill in values.

## Responsive Design

Mobile-first. Breakpoints: mobile (<640px), tablet (640–1024px), desktop (>1024px).
- User portal: desktop GNB collapses to hamburger on mobile, bottom tab nav (홈/검색/찜/상담/MY)
- Admin portal: desktop sidebar collapses to hamburger/overlay on mobile, bottom tab nav (대시보드/매물/고객/더보기)
- Homepage 2-column layout: sidebar filters on desktop → horizontal scroll chips on mobile
- Property grid: 4 cols desktop → 2 cols mobile

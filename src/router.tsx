import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { AuthLayout } from '@/layouts/AuthLayout'
import { UserLayout } from '@/layouts/UserLayout'
import { AdminLayout } from '@/layouts/AdminLayout'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'
import { PlanGate } from '@/components/common/PlanGate'
import { NotFoundPage } from '@/pages/NotFoundPage'

// ─── Lazy-loaded pages ────────────────────────────────

// Auth
const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })))
const SignupPage = lazy(() => import('@/pages/auth/SignupPage').then((m) => ({ default: m.SignupPage })))
const CallbackPage = lazy(() => import('@/pages/auth/CallbackPage').then((m) => ({ default: m.CallbackPage })))

// User
const HomePage = lazy(() => import('@/pages/user/HomePage').then((m) => ({ default: m.HomePage })))
const SearchPage = lazy(() => import('@/pages/user/SearchPage').then((m) => ({ default: m.SearchPage })))
const PropertyDetailPage = lazy(() => import('@/pages/user/PropertyDetailPage').then((m) => ({ default: m.PropertyDetailPage })))
const MyInquiriesPage = lazy(() => import('@/pages/user/MyInquiriesPage').then((m) => ({ default: m.MyInquiriesPage })))
const MyContractsPage = lazy(() => import('@/pages/user/MyContractsPage').then((m) => ({ default: m.MyContractsPage })))
const MyContractDetailPage = lazy(() => import('@/pages/user/MyContractsPage').then((m) => ({ default: m.MyContractDetailPage })))
const MoveInGuidePage = lazy(() => import('@/pages/user/MoveInGuidePage').then((m) => ({ default: m.MoveInGuidePage })))
const MarketInfoPage = lazy(() => import('@/pages/user/MarketInfoPage').then((m) => ({ default: m.MarketInfoPage })))

// Admin
const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const PropertiesPage = lazy(() => import('@/pages/admin/PropertiesPage').then((m) => ({ default: m.PropertiesPage })))
const PropertyFormPage = lazy(() => import('@/pages/admin/PropertyFormPage').then((m) => ({ default: m.PropertyFormPage })))
const InquiriesPage = lazy(() => import('@/pages/admin/InquiriesPage').then((m) => ({ default: m.InquiriesPage })))
const InquiryDetailPage = lazy(() => import('@/pages/admin/InquiryDetailPage').then((m) => ({ default: m.InquiryDetailPage })))
const CustomersPage = lazy(() => import('@/pages/admin/CustomersPage').then((m) => ({ default: m.CustomersPage })))
const CustomerDetailPage = lazy(() => import('@/pages/admin/CustomerDetailPage').then((m) => ({ default: m.CustomerDetailPage })))
const ContractsPage = lazy(() => import('@/pages/admin/ContractsPage').then((m) => ({ default: m.ContractsPage })))
const ContractFormPage = lazy(() => import('@/pages/admin/ContractFormPage').then((m) => ({ default: m.ContractFormPage })))
const ContractTrackerPage = lazy(() => import('@/pages/admin/ContractTrackerPage').then((m) => ({ default: m.ContractTrackerPage })))
const AIDescriptionPage = lazy(() => import('@/pages/admin/AIDescriptionPage').then((m) => ({ default: m.AIDescriptionPage })))
const ValuationPage = lazy(() => import('@/pages/admin/ValuationPage').then((m) => ({ default: m.ValuationPage })))
const ROICalculatorPage = lazy(() => import('@/pages/admin/ROICalculatorPage').then((m) => ({ default: m.ROICalculatorPage })))
const LocationAnalysisPage = lazy(() => import('@/pages/admin/LocationAnalysisPage').then((m) => ({ default: m.LocationAnalysisPage })))
const SignalPage = lazy(() => import('@/pages/admin/SignalPage').then((m) => ({ default: m.SignalPage })))
const InspectionListPage = lazy(() => import('@/pages/admin/InspectionListPage').then((m) => ({ default: m.InspectionListPage })))
const InspectionChecklistPage = lazy(() => import('@/pages/admin/InspectionChecklistPage').then((m) => ({ default: m.InspectionChecklistPage })))
const InspectionReportPage = lazy(() => import('@/pages/admin/InspectionReportPage').then((m) => ({ default: m.InspectionReportPage })))
const RentalManagementPage = lazy(() => import('@/pages/admin/RentalManagementPage').then((m) => ({ default: m.RentalManagementPage })))
const RentalDetailPage = lazy(() => import('@/pages/admin/RentalDetailPage').then((m) => ({ default: m.RentalDetailPage })))
const RentalSharePage = lazy(() => import('@/pages/admin/RentalSharePage').then((m) => ({ default: m.RentalSharePage })))
const RegistryPage = lazy(() => import('@/pages/admin/RegistryPage').then((m) => ({ default: m.RegistryPage })))
const CoBrokeragePoolPage = lazy(() => import('@/pages/admin/CoBrokeragePoolPage').then((m) => ({ default: m.CoBrokeragePoolPage })))
const CoBrokerageRequestsPage = lazy(() => import('@/pages/admin/CoBrokerageRequestsPage').then((m) => ({ default: m.CoBrokerageRequestsPage })))

// Settings
const SettingsLayout = lazy(() => import('@/pages/admin/settings/SettingsLayout').then((m) => ({ default: m.SettingsLayout })))
const OfficeSettingsPage = lazy(() => import('@/pages/admin/settings/OfficeSettingsPage').then((m) => ({ default: m.OfficeSettingsPage })))
const StaffSettingsPage = lazy(() => import('@/pages/admin/settings/StaffSettingsPage').then((m) => ({ default: m.StaffSettingsPage })))
const FeatureSettingsPage = lazy(() => import('@/pages/admin/settings/FeatureSettingsPage').then((m) => ({ default: m.FeatureSettingsPage })))
const CategorySettingsPage = lazy(() => import('@/pages/admin/settings/CategorySettingsPage').then((m) => ({ default: m.CategorySettingsPage })))
const SearchSettingsPage = lazy(() => import('@/pages/admin/settings/SearchSettingsPage').then((m) => ({ default: m.SearchSettingsPage })))
const UnitSettingsPage = lazy(() => import('@/pages/admin/settings/UnitSettingsPage').then((m) => ({ default: m.UnitSettingsPage })))
const FloatingSettingsPage = lazy(() => import('@/pages/admin/settings/FloatingSettingsPage').then((m) => ({ default: m.FloatingSettingsPage })))
const NotificationSettingsPage = lazy(() => import('@/pages/admin/settings/NotificationSettingsPage').then((m) => ({ default: m.NotificationSettingsPage })))
const IntegrationSettingsPage = lazy(() => import('@/pages/admin/settings/IntegrationSettingsPage').then((m) => ({ default: m.IntegrationSettingsPage })))
const BillingSettingsPage = lazy(() => import('@/pages/admin/settings/BillingSettingsPage').then((m) => ({ default: m.BillingSettingsPage })))
const SecuritySettingsPage = lazy(() => import('@/pages/admin/settings/SecuritySettingsPage').then((m) => ({ default: m.SecuritySettingsPage })))

// ─── Suspense wrapper ─────────────────────────────────

function PageLoader() {
  return (
    <div className="flex h-40 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
    </div>
  )
}

function S({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

// ─── Router ───────────────────────────────────────────

export const router = createBrowserRouter([
  // Auth routes (public)
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <S><LoginPage /></S> },
      { path: 'signup', element: <S><SignupPage /></S> },
    ],
  },
  { path: '/auth/callback', element: <S><CallbackPage /></S> },

  // User portal (public)
  {
    path: '/',
    element: <UserLayout />,
    children: [
      { index: true, element: <S><HomePage /></S> },
      { path: 'search', element: <S><SearchPage /></S> },
      { path: 'properties/:id', element: <S><PropertyDetailPage /></S> },
      { path: 'my/inquiries', element: <S><MyInquiriesPage /></S> },
      { path: 'my/contracts', element: <S><MyContractsPage /></S> },
      { path: 'my/contracts/:id', element: <S><MyContractDetailPage /></S> },
      { path: 'my/move-in-guide/:contractId', element: <S><MoveInGuidePage /></S> },
      { path: 'market-info', element: <S><MarketInfoPage /></S> },
    ],
  },

  // Admin portal (agent, staff only)
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={['agent', 'staff']}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: 'dashboard', element: <S><DashboardPage /></S> },
      { path: 'properties', element: <S><PropertiesPage /></S> },
      { path: 'properties/new', element: <S><PropertyFormPage /></S> },
      { path: 'properties/:id', element: <S><PropertyFormPage /></S> },
      { path: 'inquiries', element: <S><InquiriesPage /></S> },
      { path: 'inquiries/:id', element: <S><InquiryDetailPage /></S> },
      { path: 'customers', element: <S><CustomersPage /></S> },
      { path: 'customers/:id', element: <S><CustomerDetailPage /></S> },
      { path: 'contracts', element: <S><ContractsPage /></S> },
      { path: 'contracts/new', element: <S><ContractFormPage /></S> },
      { path: 'contracts/:id/tracker', element: <S><ContractTrackerPage /></S> },
      { path: 'ai-tools', element: <PlanGate navKey="ai-tools"><S><AIDescriptionPage /></S></PlanGate> },
      { path: 'ai-tools/description', element: <PlanGate navKey="ai-tools"><S><AIDescriptionPage /></S></PlanGate> },
      { path: 'analytics', element: <PlanGate navKey="analytics"><S><ValuationPage /></S></PlanGate> },
      { path: 'analytics/valuation', element: <PlanGate navKey="analytics"><S><ValuationPage /></S></PlanGate> },
      { path: 'analytics/roi', element: <PlanGate navKey="analytics"><S><ROICalculatorPage /></S></PlanGate> },
      { path: 'analytics/location', element: <PlanGate navKey="analytics"><S><LocationAnalysisPage /></S></PlanGate> },
      { path: 'analytics/signal', element: <PlanGate navKey="analytics"><S><SignalPage /></S></PlanGate> },
      { path: 'inspection', element: <PlanGate navKey="inspection"><S><InspectionListPage /></S></PlanGate> },
      { path: 'inspection/:id/checklist', element: <PlanGate navKey="inspection"><S><InspectionChecklistPage /></S></PlanGate> },
      { path: 'inspection/:id/report', element: <PlanGate navKey="inspection"><S><InspectionReportPage /></S></PlanGate> },
      { path: 'rental-mgmt', element: <PlanGate navKey="rental-mgmt"><S><RentalManagementPage /></S></PlanGate> },
      { path: 'rental-mgmt/:id', element: <PlanGate navKey="rental-mgmt"><S><RentalDetailPage /></S></PlanGate> },
      { path: 'rental-mgmt/share/:token', element: <S><RentalSharePage /></S> },
      { path: 'legal', element: <PlanGate navKey="legal"><S><RegistryPage /></S></PlanGate> },
      { path: 'legal/registry', element: <PlanGate navKey="legal"><S><RegistryPage /></S></PlanGate> },
      { path: 'co-brokerage', element: <PlanGate navKey="co-brokerage"><S><CoBrokeragePoolPage /></S></PlanGate> },
      { path: 'co-brokerage/pool', element: <PlanGate navKey="co-brokerage"><S><CoBrokeragePoolPage /></S></PlanGate> },
      { path: 'co-brokerage/requests', element: <PlanGate navKey="co-brokerage"><S><CoBrokerageRequestsPage /></S></PlanGate> },
      {
        path: 'settings',
        element: <S><SettingsLayout /></S>,
        children: [
          { path: 'office', element: <S><OfficeSettingsPage /></S> },
          { path: 'staff', element: <S><StaffSettingsPage /></S> },
          { path: 'features', element: <S><FeatureSettingsPage /></S> },
          { path: 'categories', element: <S><CategorySettingsPage /></S> },
          { path: 'search', element: <S><SearchSettingsPage /></S> },
          { path: 'units', element: <S><UnitSettingsPage /></S> },
          { path: 'floating', element: <S><FloatingSettingsPage /></S> },
          { path: 'notifications', element: <S><NotificationSettingsPage /></S> },
          { path: 'integrations', element: <S><IntegrationSettingsPage /></S> },
          { path: 'billing', element: <S><BillingSettingsPage /></S> },
          { path: 'security', element: <S><SecuritySettingsPage /></S> },
        ],
      },
    ],
  },

  // 404
  { path: '*', element: <NotFoundPage /> },
])

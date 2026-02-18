import { createBrowserRouter } from 'react-router-dom'
import { AuthLayout } from '@/layouts/AuthLayout'
import { UserLayout } from '@/layouts/UserLayout'
import { AdminLayout } from '@/layouts/AdminLayout'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'
import { LoginPage } from '@/pages/auth/LoginPage'
import { SignupPage } from '@/pages/auth/SignupPage'
import { CallbackPage } from '@/pages/auth/CallbackPage'
import { HomePage } from '@/pages/user/HomePage'
import { SearchPage } from '@/pages/user/SearchPage'
import { PropertyDetailPage } from '@/pages/user/PropertyDetailPage'
import { MyInquiriesPage } from '@/pages/user/MyInquiriesPage'
import { MyContractsPage, MyContractDetailPage } from '@/pages/user/MyContractsPage'
import { MoveInGuidePage } from '@/pages/user/MoveInGuidePage'
import { DashboardPage } from '@/pages/admin/DashboardPage'
import { PropertiesPage } from '@/pages/admin/PropertiesPage'
import { PropertyFormPage } from '@/pages/admin/PropertyFormPage'
import { InquiriesPage } from '@/pages/admin/InquiriesPage'
import { InquiryDetailPage } from '@/pages/admin/InquiryDetailPage'
import { CustomersPage } from '@/pages/admin/CustomersPage'
import { CustomerDetailPage } from '@/pages/admin/CustomerDetailPage'
import { ContractsPage } from '@/pages/admin/ContractsPage'
import { ContractFormPage } from '@/pages/admin/ContractFormPage'
import { ContractTrackerPage } from '@/pages/admin/ContractTrackerPage'
import { AIDescriptionPage } from '@/pages/admin/AIDescriptionPage'
import { ValuationPage } from '@/pages/admin/ValuationPage'
import { ROICalculatorPage } from '@/pages/admin/ROICalculatorPage'
import { LocationAnalysisPage } from '@/pages/admin/LocationAnalysisPage'
import { SignalPage } from '@/pages/admin/SignalPage'
import { MarketInfoPage } from '@/pages/user/MarketInfoPage'
import { InspectionListPage } from '@/pages/admin/InspectionListPage'
import { InspectionChecklistPage } from '@/pages/admin/InspectionChecklistPage'
import { InspectionReportPage } from '@/pages/admin/InspectionReportPage'
import { RentalManagementPage } from '@/pages/admin/RentalManagementPage'
import { RentalDetailPage } from '@/pages/admin/RentalDetailPage'
import { RentalSharePage } from '@/pages/admin/RentalSharePage'
import { RegistryPage } from '@/pages/admin/RegistryPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export const router = createBrowserRouter([
  // Auth routes (public)
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
    ],
  },
  { path: '/auth/callback', element: <CallbackPage /> },

  // User portal (public)
  {
    path: '/',
    element: <UserLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'properties/:id', element: <PropertyDetailPage /> },
      { path: 'my/inquiries', element: <MyInquiriesPage /> },
      { path: 'my/contracts', element: <MyContractsPage /> },
      { path: 'my/contracts/:id', element: <MyContractDetailPage /> },
      { path: 'my/move-in-guide/:contractId', element: <MoveInGuidePage /> },
      { path: 'market-info', element: <MarketInfoPage /> },
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
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'properties', element: <PropertiesPage /> },
      { path: 'properties/new', element: <PropertyFormPage /> },
      { path: 'properties/:id', element: <PropertyFormPage /> },
      { path: 'inquiries', element: <InquiriesPage /> },
      { path: 'inquiries/:id', element: <InquiryDetailPage /> },
      { path: 'customers', element: <CustomersPage /> },
      { path: 'customers/:id', element: <CustomerDetailPage /> },
      { path: 'contracts', element: <ContractsPage /> },
      { path: 'contracts/new', element: <ContractFormPage /> },
      { path: 'contracts/:id/tracker', element: <ContractTrackerPage /> },
      { path: 'ai-tools', element: <AIDescriptionPage /> },
      { path: 'ai-tools/description', element: <AIDescriptionPage /> },
      { path: 'analytics', element: <ValuationPage /> },
      { path: 'analytics/valuation', element: <ValuationPage /> },
      { path: 'analytics/roi', element: <ROICalculatorPage /> },
      { path: 'analytics/location', element: <LocationAnalysisPage /> },
      { path: 'analytics/signal', element: <SignalPage /> },
      { path: 'inspection', element: <InspectionListPage /> },
      { path: 'inspection/:id/checklist', element: <InspectionChecklistPage /> },
      { path: 'inspection/:id/report', element: <InspectionReportPage /> },
      { path: 'rental-mgmt', element: <RentalManagementPage /> },
      { path: 'rental-mgmt/:id', element: <RentalDetailPage /> },
      { path: 'rental-mgmt/share/:token', element: <RentalSharePage /> },
      { path: 'legal', element: <RegistryPage /> },
      { path: 'legal/registry', element: <RegistryPage /> },
    ],
  },

  // 404
  { path: '*', element: <NotFoundPage /> },
])

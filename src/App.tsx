import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { VerifyOtp } from './pages/VerifyOtp';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { BranchManagement } from './pages/BranchManagement';
import { BranchDetail } from './pages/branches/BranchDetail';
import { Customers } from './pages/Customers';
import { CustomerDetail } from './pages/customers/CustomerDetail';
import { GroupDetail } from './pages/customers/GroupDetail';
import { CustomerPrintPage } from './pages/customers/CustomerPrintPage';
import { StaffOnboarding } from './pages/onboarding/StaffOnboarding';
import { CustomerOnboarding } from './pages/onboarding/CustomerOnboarding';
import { GroupLoans } from './pages/loan-manager/GroupLoans';
import { LoanApplications } from './pages/loan-manager/LoanApplications';
import { LoanDisbursement } from './pages/loan-manager/LoanDisbursement';
import { LoanRepayment } from './pages/loan-manager/LoanRepayment';
import { LoanReports } from './pages/loan-manager/LoanReports';
import { LoanApprovals } from './pages/loan-manager/LoanApprovals';
import { LoanDetail } from './pages/loan-manager/LoanDetail';
import { HrManager } from './pages/HrManager';
import { StaffDetail } from './pages/staff/StaffDetail';
import { FinCon } from './pages/FinCon';
import { Settings } from './pages/Settings';
import { RootAdminLogin } from './pages/root-admin/RootAdminLogin';
import { RootAdminHome } from './pages/root-admin/RootAdminHome';
import { RootAdminLayout } from './pages/root-admin/RootAdminLayout';
import { RootAdminOrganisations } from './pages/root-admin/RootAdminOrganisations';
import { RootAdminSettings } from './pages/root-admin/RootAdminSettings';
import { Toaster } from 'react-hot-toast';

function RoleHomeRedirect() {
  const { user } = useAuth();

  if (user?.role === 'marketer') {
    return <Navigate to="/marketer/dashboard" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

function MarketerOnlyRoutes() {
  const { user } = useAuth();

  if (user?.role !== 'marketer') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

function NonMarketerRoutes() {
  const { user } = useAuth();

  if (user?.role === 'marketer') {
    return <Navigate to="/marketer/dashboard" replace />;
  }

  return <Outlet />;
}

export function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '8px',
            background: '#1F2937',
            color: '#fff',
            fontSize: '13px',
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/customers/:id/print" element={<CustomerPrintPage />} />

          <Route path="/root-admin/login" element={<RootAdminLogin />} />
          <Route path="/root-admin" element={<RootAdminLayout />}>
            <Route index element={<Navigate to="/root-admin/dashboard" replace />} />
            <Route path="dashboard" element={<RootAdminHome />} />
            <Route path="organisations" element={<RootAdminOrganisations />} />
            <Route path="settings" element={<RootAdminSettings />} />
          </Route>

          <Route path="/" element={<Layout />}>
            <Route index element={<RoleHomeRedirect />} />

            <Route element={<NonMarketerRoutes />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="branches" element={<BranchManagement />} />
              <Route path="branches/:id" element={<BranchDetail />} />
              <Route path="customers" element={<Customers />} />
              <Route path="customers/:id" element={<CustomerDetail />} />
              <Route path="customers/groups/:groupId" element={<GroupDetail />} />

              <Route path="onboarding">
                <Route path="staff" element={<StaffOnboarding />} />
                <Route path="customer" element={<CustomerOnboarding />} />
              </Route>

              <Route path="loan-manager">
                <Route path="approvals" element={<LoanApprovals />} />
                <Route path="group-loans" element={<GroupLoans />} />
                <Route path="applications" element={<LoanApplications />} />
                <Route path="disbursement" element={<LoanDisbursement />} />
                <Route path="repayment" element={<LoanRepayment />} />
                <Route path="reports" element={<LoanReports />} />
                <Route path="loans/:id" element={<LoanDetail />} />
              </Route>

              <Route path="staff-management" element={<HrManager />} />
              <Route path="staff-management/:id" element={<StaffDetail />} />
              <Route path="fincon" element={<FinCon />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            <Route path="marketer" element={<MarketerOnlyRoutes />}>
              <Route index element={<Navigate to="/marketer/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="customers" element={<Customers />} />
              <Route path="customers/:id" element={<CustomerDetail />} />
              <Route path="customers/groups/:groupId" element={<GroupDetail />} />
              <Route path="onboarding/customer" element={<CustomerOnboarding />} />

              <Route path="loan-manager">
                <Route path="group-loans" element={<GroupLoans />} />
                <Route path="applications" element={<LoanApplications />} />
                <Route path="disbursement" element={<LoanDisbursement />} />
                <Route path="repayment" element={<LoanRepayment />} />
                <Route path="reports" element={<LoanReports />} />
                <Route path="loans/:id" element={<LoanDetail />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>);

}
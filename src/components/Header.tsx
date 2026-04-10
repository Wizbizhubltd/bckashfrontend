import React from 'react';
import { useLocation } from 'react-router-dom';
import { MenuIcon, SearchIcon, BellIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ProfileAvatar } from './ProfileAvatar';
import { useAppDispatch } from '../store/hooks';
import { setMobileSidebarOpen } from '../store/slices/uiSlice';
export function Header() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { user } = useAuth();
  // Determine page title based on route
  const getPageTitle = () => {
    const path = location.pathname;
    const normalizedPath = path.startsWith('/marketer/') ? path.replace('/marketer', '') : path;
    if (normalizedPath === '/dashboard') return 'Dashboard';
    if (normalizedPath === '/branches') return 'Branch Management';
    if (normalizedPath.startsWith('/customers/') && normalizedPath !== '/customers')
    return 'Customer Profile';
    if (normalizedPath === '/customers') return 'Customers Directory';
    if (normalizedPath === '/onboarding/staff') return 'Staff Onboarding';
    if (normalizedPath === '/onboarding/customer') return 'Customer Onboarding';
    if (normalizedPath.includes('/loan-manager/loans/')) return 'Loan Details';
    if (normalizedPath.includes('/loan-manager/group-loans')) return 'Group Loans';
    if (normalizedPath.includes('/loan-manager/applications')) return 'Loan Applications';
    if (normalizedPath.includes('/loan-manager/disbursement')) return 'Loan Disbursement';
    if (normalizedPath.includes('/loan-manager/repayment')) return 'Loan Repayment';
    if (normalizedPath.includes('/loan-manager/reports')) return 'Loan Reports';
    if (normalizedPath.includes('/loan-manager/approvals')) return 'Loan Approvals';
    if (normalizedPath.startsWith('/staff-management/') && normalizedPath !== '/staff-management')
    return 'Staff Profile';
    if (normalizedPath.includes('/staff-management')) return 'Staff Management';
    if (normalizedPath.includes('/fincon')) return 'Financial Control (FinCon)';
    if (normalizedPath.includes('/settings')) return 'Organisation Settings';
    return 'BCKash Portal';
  };
  const getRoleBadge = () => {
    if (!user) return null;
    switch (user.role) {
      case 'super_admin':
        return (
          <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-bold">
            Super Admin
          </span>);

      case 'manager':
        return (
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">
            Manager
          </span>);

      case 'authorizer':
        return (
          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-bold">
            Authorizer
          </span>);

      case 'marketer':
        return (
          <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-bold">
            Marketer
          </span>);

      default:
        return null;
    }
  };
  return (
    <header className="bg-white h-20 px-4 lg:px-8 flex items-center justify-between shadow-sm z-30 sticky top-0">
      <div className="flex items-center">
        <button
          className="lg:hidden mr-4 text-gray-600 hover:text-primary"
          onClick={() => dispatch(setMobileSidebarOpen(true))}>
          
          <MenuIcon size={24} />
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-xl lg:text-2xl font-heading font-bold text-primary">
            {getPageTitle()}
          </h1>
          <div className="hidden md:block">{getRoleBadge()}</div>
        </div>
      </div>

      <div className="flex items-center space-x-4 lg:space-x-6">
        {/* Search Bar - Hidden on small mobile */}
        <div className="hidden md:flex items-center bg-gray-100 rounded-full px-4 py-2 w-64 lg:w-80 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <SearchIcon size={18} className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search groups, clients, loans..."
            className="bg-transparent border-none focus:outline-none text-sm font-body w-full text-gray-700" />
          
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-gray-500 hover:text-primary transition-colors rounded-full hover:bg-gray-100">
          <BellIcon size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full border-2 border-white"></span>
        </button>

        {/* Mobile Avatar (Desktop avatar is in sidebar) */}
        <div className="lg:hidden">
          <ProfileAvatar
            src={user?.avatar}
            name={user?.name}
            alt="User Avatar"
            className="w-8 h-8 rounded-full border border-gray-200"
            iconSize={14}
          />
          
        </div>
      </div>
    </header>);

}
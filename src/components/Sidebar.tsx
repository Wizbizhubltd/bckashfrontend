import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboardIcon,
  BanknoteIcon,
  UsersIcon,
  BarChart3Icon,
  ChevronDownIcon,
  XIcon,
  LogOutIcon,
  BuildingIcon,
  UserCogIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  SettingsIcon } from
'lucide-react';
import { Logo } from './Logo';
import { ProfileAvatar } from './ProfileAvatar';
import { useAuth } from '../context/AuthContext';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setMobileSidebarOpen } from '../store/slices/uiSlice';
export function Sidebar() {
  const dispatch = useAppDispatch();
  const mobileOpen = useAppSelector((state) => state.ui.mobileSidebarOpen);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isMarketer = user?.role === 'marketer';
  const routePrefix = isMarketer ? '/marketer' : '';
  const isLoanManagerActive = location.pathname.includes(`${routePrefix}/loan-manager`) || location.pathname.includes('/loan-manager');
  const [loanManagerExpanded, setLoanManagerExpanded] =
  useState(isLoanManagerActive);
  useEffect(() => {
    if (isLoanManagerActive) setLoanManagerExpanded(true);
  }, [isLoanManagerActive]);
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const navLinkClasses = ({ isActive }: {isActive: boolean;}) =>
  `flex items-center px-4 py-3 my-1 rounded-lg transition-colors duration-200 ${isActive ? 'bg-white/10 text-white font-heading font-bold border-l-4 border-accent' : 'text-gray-300 hover:bg-white/5 hover:text-white font-body border-l-4 border-transparent'}`;
  const subNavLinkClasses = ({ isActive }: {isActive: boolean;}) =>
  `flex items-center pl-11 pr-4 py-2 my-1 rounded-lg transition-colors duration-200 text-sm ${isActive ? 'text-accent font-heading font-bold' : 'text-gray-400 hover:bg-white/5 hover:text-white font-body'}`;
  const isSuperAdmin = user?.role === 'super_admin';
  const isManager = user?.role === 'manager';
  const isAuthorizer = user?.role === 'authorizer';
  const sidebarContent =
  <div className="flex flex-col h-full bg-primary text-white w-64 shadow-xl">
      {/* Logo Area */}
      <div className="flex items-center justify-between h-20 px-6 border-b border-white/10">
        <Logo width={140} height={46} />
        <button
        className="lg:hidden text-gray-300 hover:text-white"
        onClick={() => dispatch(setMobileSidebarOpen(false))}>
        
          <XIcon size={24} />
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <NavLink to={`${routePrefix}/dashboard`} className={navLinkClasses}>
          <LayoutDashboardIcon size={20} className="mr-3" />
          <span>Dashboard</span>
        </NavLink>

        {isSuperAdmin &&
      <NavLink to={`${routePrefix}/branches`} className={navLinkClasses}>
            <BuildingIcon size={20} className="mr-3" />
            <span>Branch Management</span>
          </NavLink>
      }

        <NavLink to={`${routePrefix}/customers`} className={navLinkClasses}>
          <UsersIcon size={20} className="mr-3" />
          <span>Customers</span>
        </NavLink>

        {isSuperAdmin &&
      <NavLink to="/onboarding/staff" className={navLinkClasses}>
            <UserPlusIcon size={20} className="mr-3" />
            <span>Staff Onboarding</span>
          </NavLink>
      }

        {isMarketer &&
      <NavLink to="/marketer/onboarding/customer" className={navLinkClasses}>
            <UserPlusIcon size={20} className="mr-3" />
            <span>Customer Onboarding</span>
          </NavLink>
      }

        {/* Expandable Loan Manager */}
        <div>
          <button
          onClick={() => setLoanManagerExpanded(!loanManagerExpanded)}
          className={`w-full flex items-center justify-between px-4 py-3 my-1 rounded-lg transition-colors duration-200 ${isLoanManagerActive ? 'bg-white/5 text-white font-heading font-bold border-l-4 border-accent' : 'text-gray-300 hover:bg-white/5 hover:text-white font-body border-l-4 border-transparent'}`}>
          
            <div className="flex items-center">
              <BanknoteIcon size={20} className="mr-3" />
              <span>Loan Manager</span>
            </div>
            <motion.div
            animate={{
              rotate: loanManagerExpanded ? 180 : 0
            }}
            transition={{
              duration: 0.2
            }}>
            
              <ChevronDownIcon size={16} />
            </motion.div>
          </button>

          <AnimatePresence>
            {loanManagerExpanded &&
          <motion.div
            initial={{
              height: 0,
              opacity: 0
            }}
            animate={{
              height: 'auto',
              opacity: 1
            }}
            exit={{
              height: 0,
              opacity: 0
            }}
            className="overflow-hidden">
            
                {(isSuperAdmin || isAuthorizer) &&
            <NavLink
              to={`${routePrefix}/loan-manager/approvals`}
              className={subNavLinkClasses}>
              
                    <div className="flex items-center">
                      <ShieldCheckIcon size={14} className="mr-2" />
                      Loan Approvals
                    </div>
                  </NavLink>
            }
                <NavLink
              to={`${routePrefix}/loan-manager/group-loans`}
              className={subNavLinkClasses}>
              
                  Group Loans
                </NavLink>
                <NavLink
              to={`${routePrefix}/loan-manager/applications`}
              className={subNavLinkClasses}>
              
                  Loan Applications
                </NavLink>
                <NavLink
              to={`${routePrefix}/loan-manager/disbursement`}
              className={subNavLinkClasses}>
              
                  Loan Disbursement
                </NavLink>
                <NavLink
              to={`${routePrefix}/loan-manager/repayment`}
              className={subNavLinkClasses}>
              
                  Loan Repayment
                </NavLink>
                <NavLink
              to={`${routePrefix}/loan-manager/reports`}
              className={subNavLinkClasses}>
              
                  Loan Reports
                </NavLink>
              </motion.div>
          }
          </AnimatePresence>
        </div>

        {(isSuperAdmin || isManager) &&
      <NavLink to={`${routePrefix}/staff-management`} className={navLinkClasses}>
            <UserCogIcon size={20} className="mr-3" />
            <span>Staff Management</span>
          </NavLink>
      }

        {isSuperAdmin &&
      <NavLink to={`${routePrefix}/fincon`} className={navLinkClasses}>
            <BarChart3Icon size={20} className="mr-3" />
            <span>FinCon</span>
          </NavLink>
      }

        {isSuperAdmin &&
      <NavLink to={`${routePrefix}/settings`} className={navLinkClasses}>
            <SettingsIcon size={20} className="mr-3" />
            <span>Settings</span>
          </NavLink>
      }
      </div>

      {/* User Profile Section */}
      <div className="p-4 border-t border-white/10">
        <div
        onClick={handleLogout}
        className="group flex items-center px-2 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
        
          <ProfileAvatar
          src={user?.avatar}
          name={user?.name}
          alt="User Avatar"
          className="w-10 h-10 rounded-full border-2 border-white/20"
          iconSize={18} />
        
          <div className="ml-3 flex-1 overflow-hidden">
            <p className="text-sm font-heading font-bold text-white truncate">
              {user?.name}
            </p>
            <p className="text-xs font-body text-gray-400 truncate">
              {user?.branch}
            </p>
          </div>
          <span className="w-8 h-8 rounded-full bg-white/10 text-gray-300 flex items-center justify-center group-hover:bg-white/15 group-hover:text-accent transition-colors">
            <LogOutIcon size={16} />
          </span>
        </div>
      </div>
    </div>;

  return (
    <>
      <AnimatePresence>
        {mobileOpen &&
        <motion.div
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          exit={{
            opacity: 0
          }}
          onClick={() => dispatch(setMobileSidebarOpen(false))}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" />

        }
      </AnimatePresence>

      <motion.div
        className={`fixed inset-y-0 left-0 z-50 transform lg:translate-x-0 lg:static lg:flex-shrink-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:transition-none`}>
        
        {sidebarContent}
      </motion.div>
    </>);

}
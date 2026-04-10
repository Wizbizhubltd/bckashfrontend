import React, { useEffect, useState} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BuildingIcon,
  BanknoteIcon,
  AlertTriangleIcon,
  GitBranchIcon,
  ShieldCheckIcon,
  BellIcon,
  SaveIcon,
  PencilIcon,
  InfoIcon,
  SettingsIcon,
  UsersIcon,
  PackageIcon,
  ReceiptIcon,
  XIcon } from
'lucide-react';
import { api } from '../app/api';
import { useAuth } from '../context/AuthContext';
import { DepartmentsRoles } from './settings/DepartmentsRoles';
import { LoanProductsCrud } from './settings/LoanProductsCrud';
import { FeeConfiguration } from './settings/FeeConfiguration';
// ─── Shared Helpers ─────────────────────────────────────────────
function Toggle({
  enabled,
  onToggle



}: {enabled: boolean;onToggle: () => void;}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 ${enabled ? 'bg-primary' : 'bg-gray-300'}`}>
      
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
      
    </button>);

}
function InputField({
  label,
  value,
  onChange,
  type = 'text',
  prefix,
  suffix







}: {label: string;value: string | number;onChange: (val: string) => void;type?: string;prefix?: string;suffix?: string;}) {
  return (
    <div>
      <label className="block text-sm font-body font-medium text-gray-600 mb-1.5">
        {label}
      </label>
      <div className="relative">
        {prefix &&
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-body">
            {prefix}
          </span>
        }
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-body text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-12' : ''}`} />
        
        {suffix &&
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-body">
            {suffix}
          </span>
        }
      </div>
    </div>);

}
// ─── Tab Definitions ────────────────────────────────────────────
type TabKey =
'organisation' |
'departments' |
'loan-products' |
'fees' |
'loan-rules' |
'branch-rules' |
'kyc' |
'notifications';
const settingsTabs: {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
}[] = [
{
  key: 'organisation',
  label: 'Organisation',
  icon: <BuildingIcon size={18} />
},
{
  key: 'departments',
  label: 'Departments & Roles',
  icon: <UsersIcon size={18} />
},
{
  key: 'loan-products',
  label: 'Loan Products',
  icon: <PackageIcon size={18} />
},
{
  key: 'fees',
  label: 'Fee Configuration',
  icon: <ReceiptIcon size={18} />
},
{
  key: 'loan-rules',
  label: 'Loan Rules',
  icon: <BanknoteIcon size={18} />
},
{
  key: 'branch-rules',
  label: 'Branch Rules',
  icon: <GitBranchIcon size={18} />
},
{
  key: 'kyc',
  label: 'KYC & Verification',
  icon: <ShieldCheckIcon size={18} />
},
{
  key: 'notifications',
  label: 'Notifications',
  icon: <BellIcon size={18} />
}];

type OrganizationProfile = {
  bankName: string;
  address: string;
  rcNumber: string;
  cbnLicense: string;
  contactEmail: string;
  contactPhone: string;
};

type SettingsActivity = {
  id: string;
  action: string;
  entityType: string;
  actorName: string;
  createdAt: string;
};

function extractSettingsActivity(response: unknown): SettingsActivity | null {
  if (!response || typeof response !== 'object') {
    return null;
  }

  const source = response as { data?: unknown; payload?: unknown };
  const container =
    source.data && typeof source.data === 'object'
      ? source.data
      : source.payload && typeof source.payload === 'object'
      ? source.payload
      : null;

  if (!container || typeof container !== 'object') {
    return null;
  }

  const row = container as Record<string, unknown>;
  const id = row.id ?? row._id;
  const action = row.action;
  const actorName = row.actorName;
  const createdAt = row.createdAt;

  if (
    (typeof id !== 'string' && typeof id !== 'number') ||
    typeof action !== 'string' ||
    typeof actorName !== 'string' ||
    typeof createdAt !== 'string'
  ) {
    return null;
  }

  return {
    id: String(id),
    action,
    entityType: typeof row.entityType === 'string' ? row.entityType : 'settings',
    actorName,
    createdAt,
  };
}

function formatActivityAction(action: string): string {
  const readable = action
    .replace(/[._-]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

  if (!readable) {
    return 'updated settings';
  }

  return readable.charAt(0).toUpperCase() + readable.slice(1);
}

function formatActivityDate(isoDate: string): string {
  const parsedDate = new Date(isoDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return isoDate;
  }

  return parsedDate.toLocaleString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function extractOrganizationProfilePayload(response: unknown): Partial<OrganizationProfile> {
  if (!response || typeof response !== 'object') {
    return {};
  }

  const source = response as { data?: unknown; payload?: unknown };
  const container =
    source.data && typeof source.data === 'object'
      ? source.data
      : source.payload && typeof source.payload === 'object'
      ? source.payload
      : source;

  if (!container || typeof container !== 'object') {
    return {};
  }

  const row = container as Record<string, unknown>;
  return {
    bankName: typeof row.bankName === 'string' ? row.bankName : typeof row.name === 'string' ? row.name : undefined,
    address: typeof row.address === 'string' ? row.address : undefined,
    rcNumber:
      typeof row.rcNumber === 'string'
        ? row.rcNumber
        : typeof row.companyRegistrationNumber === 'string'
        ? row.companyRegistrationNumber
        : undefined,
    cbnLicense: typeof row.cbnLicense === 'string' ? row.cbnLicense : undefined,
    contactEmail:
      typeof row.contactEmail === 'string'
        ? row.contactEmail
        : typeof row.email === 'string'
        ? row.email
        : undefined,
    contactPhone:
      typeof row.contactPhone === 'string'
        ? row.contactPhone
        : typeof row.phone === 'string'
        ? row.phone
        : undefined,
  };
}

// ─── Main Component ─────────────────────────────────────────────
export function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('organisation');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [isSavingOrgProfile, setIsSavingOrgProfile] = useState(false);
  const [orgProfileBanner, setOrgProfileBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [latestSettingsActivity, setLatestSettingsActivity] = useState<SettingsActivity | null>(null);
  const [isLoadingSettingsActivity, setIsLoadingSettingsActivity] = useState(false);
  const organizationIdFromUser =
    typeof user?.organizationId === 'string' && user.organizationId.trim().length > 0
      ? user.organizationId.trim()
      : null;
  // Organisation Profile
  const [orgProfile, setOrgProfile] = useState({
    bankName: 'BCKash Microfinance Bank',
    address: '15 Broad Street, Lagos Island, Lagos, Nigeria',
    rcNumber: 'RC-1847293',
    cbnLicense: 'MFB/2019/0234',
    contactEmail: 'info@bckashmfb.com.ng',
    contactPhone: '+234 801 234 5678'
  });
  // Loan Configuration
  const [loanConfig, setLoanConfig] = useState({
    interestRate: '24',
    maxLoanAmount: '5000000',
    minLoanAmount: '50000',
    maxTenure: '24',
    gracePeriod: '7',
    maxGroupSize: '15',
    minGroupSize: '5'
  });
  // Repayment & Penalties
  const [repayment, setRepayment] = useState({
    penaltyRate: '2.5',
    penaltyGracePeriod: '3',
    maxPenaltyCap: '25',
    autoPenalty: true,
    repaymentFrequency: 'Monthly'
  });
  // Branch Rules
  const [branchRules, setBranchRules] = useState({
    maxActiveBranches: '20',
    defaultFundLimit: '50000000',
    requireManagerApproval: true,
    autoDisbursementLimit: '500000'
  });
  // KYC & Verification
  const [kyc, setKyc] = useState({
    bvnRequired: true,
    biometricRequired: true,
    requiredDocs: {
      nin: true,
      utilityBill: true,
      passportPhoto: true,
      bankStatement: false
    },
    minimumAge: '18'
  });
  // Notification Settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: true,
    loanApprovalAlerts: true,
    repaymentReminderDays: '3'
  });
  useEffect(() => {
    let isMounted = true;

    const loadOrganizationProfile = async () => {
      try {
        const response = await api.get('/admin/organization-profile');
        const profile = extractOrganizationProfilePayload(response);
        if (!isMounted) {
          return;
        }

        setOrgProfile((current) => ({
          bankName: profile.bankName ?? current.bankName,
          address: profile.address ?? current.address,
          rcNumber: profile.rcNumber ?? current.rcNumber,
          cbnLicense: profile.cbnLicense ?? current.cbnLicense,
          contactEmail: profile.contactEmail ?? current.contactEmail,
          contactPhone: profile.contactPhone ?? current.contactPhone,
        }));
      } catch {
        if (isMounted) {
          setOrgProfileBanner({
            type: 'error',
            message: 'Unable to load organization profile from backend.',
          });
        }
      }
    };

    void loadOrganizationProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadLatestSettingsActivity = async () => {
      try {
        setIsLoadingSettingsActivity(true);
        const response = await api.get('/admin/settings/activity/latest');
        const activity = extractSettingsActivity(response);

        if (!isMounted) {
          return;
        }

        setLatestSettingsActivity(activity);
      } catch {
        if (isMounted) {
          setLatestSettingsActivity(null);
        }
      } finally {
        if (isMounted) {
          setIsLoadingSettingsActivity(false);
        }
      }
    };

    void loadLatestSettingsActivity();

    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  useEffect(() => {
    if (!orgProfileBanner || orgProfileBanner.type !== 'success') {
      return;
    }

    const timeoutId = setTimeout(() => {
      setOrgProfileBanner((current) => (current?.type === 'success' ? null : current));
    }, 3500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [orgProfileBanner]);

  const handleSaveOrganisationProfile = async () => {
    if (!organizationIdFromUser) {
      setOrgProfileBanner({
        type: 'error',
        message: 'Organization ID is missing from your session. Please sign in again.',
      });
      return;
    }

    if (
      !orgProfile.bankName.trim() ||
      !orgProfile.address.trim() ||
      !orgProfile.rcNumber.trim()
    ) {
      setOrgProfileBanner({
        type: 'error',
        message: 'Bank name, address and RC number are required.',
      });
      return;
    }

    try {
      setIsSavingOrgProfile(true);
      setOrgProfileBanner(null);

      const response = await api.patch('/admin/organization-profile', {
        bankName: orgProfile.bankName.trim(),
        address: orgProfile.address.trim(),
        rcNumber: orgProfile.rcNumber.trim(),
        cbnLicense: orgProfile.cbnLicense.trim(),
        contactEmail: orgProfile.contactEmail.trim() || undefined,
        contactPhone: orgProfile.contactPhone.trim() || undefined,
      });

      const profile = extractOrganizationProfilePayload(response);
      setOrgProfile((current) => ({
        bankName: profile.bankName ?? current.bankName,
        address: profile.address ?? current.address,
        rcNumber: profile.rcNumber ?? current.rcNumber,
        cbnLicense: profile.cbnLicense ?? current.cbnLicense,
        contactEmail: profile.contactEmail ?? current.contactEmail,
        contactPhone: profile.contactPhone ?? current.contactPhone,
      }));

      setEditingProfile(false);
      setOrgProfileBanner({
        type: 'success',
        message: 'Organization profile updated successfully.',
      });

      try {
        const activityResponse = await api.get('/admin/settings/activity/latest');
        setLatestSettingsActivity(extractSettingsActivity(activityResponse));
      } catch {}
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : 'Failed to update organization profile';
      setOrgProfileBanner({
        type: 'error',
        message,
      });
    } finally {
      setIsSavingOrgProfile(false);
    }
  };
  function handleTabChange(key: TabKey) {
    setActiveTab(key);
    setMobileNavOpen(false);
  }
  // ─── Tab Content Renderers ──────────────────────────────────
  function renderOrganisation() {
    return (
      <div className="space-y-6">
        {orgProfileBanner &&
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${orgProfileBanner.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          
            {orgProfileBanner.message}
          </div>
        }
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <BuildingIcon size={20} className="text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-heading font-bold text-gray-900">
                Organisation Profile
              </h3>
              <p className="text-sm font-body text-gray-500 mt-0.5">
                Basic information about BCKash Microfinance Bank
              </p>
            </div>
            <button
              onClick={() => setEditingProfile(!editingProfile)}
              className="flex items-center gap-1.5 text-sm font-body text-primary hover:text-primary/80 transition-colors">
              
              <PencilIcon size={14} />
              {editingProfile ? 'Cancel' : 'Edit'}
            </button>
          </div>
          <div className="px-6 py-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {editingProfile ?
              <>
                  <InputField
                  label="Bank Name"
                  value={orgProfile.bankName}
                  onChange={(v) =>
                  setOrgProfile({
                    ...orgProfile,
                    bankName: v
                  })
                  } />
                
                  <InputField
                  label="RC Number"
                  value={orgProfile.rcNumber}
                  onChange={(v) =>
                  setOrgProfile({
                    ...orgProfile,
                    rcNumber: v
                  })
                  } />
                
                  <InputField
                  label="CBN License Number"
                  value={orgProfile.cbnLicense}
                  onChange={(v) =>
                  setOrgProfile({
                    ...orgProfile,
                    cbnLicense: v
                  })
                  } />
                
                  <InputField
                  label="Contact Email"
                  value={orgProfile.contactEmail}
                  onChange={(v) =>
                  setOrgProfile({
                    ...orgProfile,
                    contactEmail: v
                  })
                  } />
                
                  <InputField
                  label="Contact Phone"
                  value={orgProfile.contactPhone}
                  onChange={(v) =>
                  setOrgProfile({
                    ...orgProfile,
                    contactPhone: v
                  })
                  } />
                
                  <div className="md:col-span-2">
                    <InputField
                    label="Address"
                    value={orgProfile.address}
                    onChange={(v) =>
                    setOrgProfile({
                      ...orgProfile,
                      address: v
                    })
                    } />
                  
                  </div>
                </> :

              <>
                  {[
                {
                  label: 'Bank Name',
                  value: orgProfile.bankName
                },
                {
                  label: 'RC Number',
                  value: orgProfile.rcNumber
                },
                {
                  label: 'CBN License',
                  value: orgProfile.cbnLicense
                },
                {
                  label: 'Contact Email',
                  value: orgProfile.contactEmail
                },
                {
                  label: 'Contact Phone',
                  value: orgProfile.contactPhone
                }].
                map((item) =>
                <div key={item.label}>
                      <p className="text-xs text-gray-400 font-body mb-0.5">
                        {item.label}
                      </p>
                      <p className="text-sm font-body font-medium text-gray-800">
                        {item.value}
                      </p>
                    </div>
                )}
                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-400 font-body mb-0.5">
                      Address
                    </p>
                    <p className="text-sm font-body font-medium text-gray-800">
                      {orgProfile.address}
                    </p>
                  </div>
                </>
              }
            </div>
            {editingProfile &&
            <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                
                <button
                onClick={() => setEditingProfile(false)}
                disabled={isSavingOrgProfile}
                className="px-4 py-2 rounded-lg text-sm font-heading font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                
                  Cancel
                </button>
                <button
                onClick={() => void handleSaveOrganisationProfile()}
                disabled={isSavingOrgProfile}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-heading font-bold text-white bg-accent hover:bg-accent/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                
                  {isSavingOrgProfile ?
                'Saving...' :
                <>
                      <SaveIcon size={16} />
                      Save Changes
                    </>
                }
                </button>
              </div>
            }
          </div>
        </div>
      </div>);

  }
  function renderLoanRules() {
    return (
      <div className="space-y-6">
        {/* Loan Configuration */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <BanknoteIcon size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-heading font-bold text-gray-900">
                Loan Configuration
              </h3>
              <p className="text-sm font-body text-gray-500 mt-0.5">
                Set interest rates, loan limits, and group size rules
              </p>
            </div>
          </div>
          <div className="px-6 py-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <InputField
                label="Interest Rate (per annum)"
                value={loanConfig.interestRate}
                onChange={(v) =>
                setLoanConfig({
                  ...loanConfig,
                  interestRate: v
                })
                }
                type="number"
                suffix="%" />
              
              <InputField
                label="Max Loan Amount"
                value={loanConfig.maxLoanAmount}
                onChange={(v) =>
                setLoanConfig({
                  ...loanConfig,
                  maxLoanAmount: v
                })
                }
                type="number"
                prefix="₦" />
              
              <InputField
                label="Min Loan Amount"
                value={loanConfig.minLoanAmount}
                onChange={(v) =>
                setLoanConfig({
                  ...loanConfig,
                  minLoanAmount: v
                })
                }
                type="number"
                prefix="₦" />
              
              <InputField
                label="Max Loan Tenure"
                value={loanConfig.maxTenure}
                onChange={(v) =>
                setLoanConfig({
                  ...loanConfig,
                  maxTenure: v
                })
                }
                type="number"
                suffix="months" />
              
              <InputField
                label="Grace Period"
                value={loanConfig.gracePeriod}
                onChange={(v) =>
                setLoanConfig({
                  ...loanConfig,
                  gracePeriod: v
                })
                }
                type="number"
                suffix="days" />
              
              <InputField
                label="Max Group Size"
                value={loanConfig.maxGroupSize}
                onChange={(v) =>
                setLoanConfig({
                  ...loanConfig,
                  maxGroupSize: v
                })
                }
                type="number" />
              
              <InputField
                label="Min Group Size"
                value={loanConfig.minGroupSize}
                onChange={(v) =>
                setLoanConfig({
                  ...loanConfig,
                  minGroupSize: v
                })
                }
                type="number" />
              
            </div>
          </div>
        </div>

        {/* Repayment & Penalties */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangleIcon size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-heading font-bold text-gray-900">
                Repayment & Penalties
              </h3>
              <p className="text-sm font-body text-gray-500 mt-0.5">
                Configure late payment penalties and repayment schedules
              </p>
            </div>
          </div>
          <div className="px-6 py-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <InputField
                label="Late Payment Penalty Rate"
                value={repayment.penaltyRate}
                onChange={(v) =>
                setRepayment({
                  ...repayment,
                  penaltyRate: v
                })
                }
                type="number"
                suffix="%" />
              
              <InputField
                label="Penalty Grace Period"
                value={repayment.penaltyGracePeriod}
                onChange={(v) =>
                setRepayment({
                  ...repayment,
                  penaltyGracePeriod: v
                })
                }
                type="number"
                suffix="days" />
              
              <InputField
                label="Max Penalty Cap"
                value={repayment.maxPenaltyCap}
                onChange={(v) =>
                setRepayment({
                  ...repayment,
                  maxPenaltyCap: v
                })
                }
                type="number"
                suffix="%" />
              
            </div>
            <div className="space-y-4 border-t border-gray-100 pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-body font-medium text-gray-800">
                    Auto-Penalty
                  </p>
                  <p className="text-xs text-gray-400 font-body">
                    Automatically apply penalties after grace period
                  </p>
                </div>
                <Toggle
                  enabled={repayment.autoPenalty}
                  onToggle={() =>
                  setRepayment({
                    ...repayment,
                    autoPenalty: !repayment.autoPenalty
                  })
                  } />
                
              </div>
              <div>
                <label className="block text-sm font-body font-medium text-gray-600 mb-2">
                  Repayment Frequency
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Weekly', 'Bi-weekly', 'Monthly'].map((freq) =>
                  <button
                    key={freq}
                    onClick={() =>
                    setRepayment({
                      ...repayment,
                      repaymentFrequency: freq
                    })
                    }
                    className={`px-4 py-2 rounded-lg text-sm font-body border transition-colors ${repayment.repaymentFrequency === freq ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary/40'}`}>
                    
                      {freq}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>);

  }
  function renderBranchRules() {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <GitBranchIcon size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-heading font-bold text-gray-900">
              Branch Rules
            </h3>
            <p className="text-sm font-body text-gray-500 mt-0.5">
              Set limits and approval rules for branch operations
            </p>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <InputField
              label="Max Active Branches"
              value={branchRules.maxActiveBranches}
              onChange={(v) =>
              setBranchRules({
                ...branchRules,
                maxActiveBranches: v
              })
              }
              type="number" />
            
            <InputField
              label="Default Branch Fund Limit"
              value={branchRules.defaultFundLimit}
              onChange={(v) =>
              setBranchRules({
                ...branchRules,
                defaultFundLimit: v
              })
              }
              type="number"
              prefix="₦" />
            
            <InputField
              label="Auto-Disbursement Limit"
              value={branchRules.autoDisbursementLimit}
              onChange={(v) =>
              setBranchRules({
                ...branchRules,
                autoDisbursementLimit: v
              })
              }
              type="number"
              prefix="₦" />
            
          </div>
          <div className="border-t border-gray-100 pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-body font-medium text-gray-800">
                  Require Branch Manager Approval
                </p>
                <p className="text-xs text-gray-400 font-body">
                  All disbursements above auto-limit require manager sign-off
                </p>
              </div>
              <Toggle
                enabled={branchRules.requireManagerApproval}
                onToggle={() =>
                setBranchRules({
                  ...branchRules,
                  requireManagerApproval: !branchRules.requireManagerApproval
                })
                } />
              
            </div>
          </div>
        </div>
      </div>);

  }
  function renderKyc() {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <ShieldCheckIcon size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-heading font-bold text-gray-900">
              KYC & Verification
            </h3>
            <p className="text-sm font-body text-gray-500 mt-0.5">
              Manage identity verification and document requirements
            </p>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-body font-medium text-gray-800">
                  BVN Verification Required
                </p>
                <p className="text-xs text-gray-400 font-body">
                  Customers must verify their Bank Verification Number
                </p>
              </div>
              <Toggle
                enabled={kyc.bvnRequired}
                onToggle={() =>
                setKyc({
                  ...kyc,
                  bvnRequired: !kyc.bvnRequired
                })
                } />
              
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-body font-medium text-gray-800">
                  Biometric Capture Required
                </p>
                <p className="text-xs text-gray-400 font-body">
                  Fingerprint capture during customer onboarding
                </p>
              </div>
              <Toggle
                enabled={kyc.biometricRequired}
                onToggle={() =>
                setKyc({
                  ...kyc,
                  biometricRequired: !kyc.biometricRequired
                })
                } />
              
            </div>
          </div>
          <div className="border-t border-gray-100 pt-5">
            <label className="block text-sm font-body font-medium text-gray-600 mb-3">
              Required Documents
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
              {
                key: 'nin' as const,
                label: 'National Identification Number (NIN)'
              },
              {
                key: 'utilityBill' as const,
                label: 'Utility Bill'
              },
              {
                key: 'passportPhoto' as const,
                label: 'Passport Photograph'
              },
              {
                key: 'bankStatement' as const,
                label: 'Bank Statement (6 months)'
              }].
              map((doc) =>
              <label
                key={doc.key}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-primary/20 transition-colors cursor-pointer">
                
                  <input
                  type="checkbox"
                  checked={kyc.requiredDocs[doc.key]}
                  onChange={() =>
                  setKyc({
                    ...kyc,
                    requiredDocs: {
                      ...kyc.requiredDocs,
                      [doc.key]: !kyc.requiredDocs[doc.key]
                    }
                  })
                  }
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30" />
                
                  <span className="text-sm font-body text-gray-700">
                    {doc.label}
                  </span>
                </label>
              )}
            </div>
            <div className="mt-4 w-48">
              <InputField
                label="Minimum Age Requirement"
                value={kyc.minimumAge}
                onChange={(v) =>
                setKyc({
                  ...kyc,
                  minimumAge: v
                })
                }
                type="number"
                suffix="years" />
              
            </div>
          </div>
        </div>
      </div>);

  }
  function renderNotifications() {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <BellIcon size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-heading font-bold text-gray-900">
              Notification Settings
            </h3>
            <p className="text-sm font-body text-gray-500 mt-0.5">
              Configure alerts and communication preferences
            </p>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="space-y-4 mb-6">
            {[
            {
              key: 'emailNotifications' as const,
              label: 'Email Notifications',
              desc: 'Send email alerts for key events'
            },
            {
              key: 'smsNotifications' as const,
              label: 'SMS Notifications',
              desc: 'Send SMS alerts to customers and staff'
            },
            {
              key: 'loanApprovalAlerts' as const,
              label: 'Loan Approval Alerts',
              desc: 'Notify authorizers when loans are pending approval'
            }].
            map((item) =>
            <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-body font-medium text-gray-800">
                    {item.label}
                  </p>
                  <p className="text-xs text-gray-400 font-body">{item.desc}</p>
                </div>
                <Toggle
                enabled={notifications[item.key]}
                onToggle={() =>
                setNotifications({
                  ...notifications,
                  [item.key]: !notifications[item.key]
                })
                } />
              
              </div>
            )}
          </div>
          <div className="border-t border-gray-100 pt-5 w-64">
            <InputField
              label="Repayment Reminder"
              value={notifications.repaymentReminderDays}
              onChange={(v) =>
              setNotifications({
                ...notifications,
                repaymentReminderDays: v
              })
              }
              type="number"
              suffix="days before due" />
            
          </div>
        </div>
      </div>);

  }
  const tabContent: Record<TabKey, React.ReactNode> = {
    organisation: renderOrganisation(),
    departments: <DepartmentsRoles />,
    'loan-products': <LoanProductsCrud />,
    fees: <FeeConfiguration />,
    'loan-rules': renderLoanRules(),
    'branch-rules': renderBranchRules(),
    kyc: renderKyc(),
    notifications: renderNotifications()
  };
  return (
    <div className="min-h-screen bg-gray-50 font-body">
      {/* Page Header */}
      <div className="px-4 lg:px-8 pt-4 lg:pt-8 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-heading font-bold text-gray-900">
              Organisation Settings
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Configure rules and policies for BCKash MFB
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-8 pb-8">
        <div className="flex gap-6">
          {/* Desktop Sidebar Nav */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <nav className="sticky top-4 space-y-1">
              {settingsTabs.map((tab) =>
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-colors text-left ${activeTab === tab.key ? 'bg-primary/10 text-primary font-bold' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'}`}>
                
                  <span
                  className={
                  activeTab === tab.key ? 'text-primary' : 'text-gray-400'
                  }>
                  
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              )}
            </nav>
          </aside>

          {/* Mobile Tab Selector */}
          <div className="lg:hidden fixed bottom-4 right-4 z-30">
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="w-12 h-12 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors">
              
              {mobileNavOpen ? <XIcon size={20} /> : <SettingsIcon size={20} />}
            </button>
          </div>

          <AnimatePresence>
            {mobileNavOpen &&
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
              className="lg:hidden fixed inset-0 z-20 bg-black/40"
              onClick={() => setMobileNavOpen(false)}>
              
                <motion.div
                initial={{
                  y: '100%'
                }}
                animate={{
                  y: 0
                }}
                exit={{
                  y: '100%'
                }}
                transition={{
                  type: 'spring',
                  damping: 25,
                  stiffness: 300
                }}
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 pb-20 max-h-[60vh] overflow-y-auto">
                
                  <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
                  <p className="text-xs font-heading font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">
                    Settings Sections
                  </p>
                  <nav className="space-y-1">
                    {settingsTabs.map((tab) =>
                  <button
                    key={tab.key}
                    onClick={() => handleTabChange(tab.key)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-body transition-colors text-left ${activeTab === tab.key ? 'bg-primary/10 text-primary font-bold' : 'text-gray-600 hover:bg-gray-100'}`}>
                    
                        <span
                      className={
                      activeTab === tab.key ?
                      'text-primary' :
                      'text-gray-400'
                      }>
                      
                          {tab.icon}
                        </span>
                        {tab.label}
                      </button>
                  )}
                  </nav>
                </motion.div>
              </motion.div>
            }
          </AnimatePresence>

          {/* Content Area */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{
                  opacity: 0,
                  y: 8
                }}
                animate={{
                  opacity: 1,
                  y: 0
                }}
                exit={{
                  opacity: 0,
                  y: -8
                }}
                transition={{
                  duration: 0.2
                }}>
                
                {tabContent[activeTab]}
              </motion.div>
            </AnimatePresence>

            {/* Footer Note */}
            <div className="flex items-center gap-2 text-xs text-gray-400 font-body pt-6 pb-2">
              <InfoIcon size={14} />
              <span>
                {isLoadingSettingsActivity
                  ? 'Last updated: loading recent activity...'
                  : latestSettingsActivity
                  ? `Last updated: ${formatActivityDate(latestSettingsActivity.createdAt)} by ${latestSettingsActivity.actorName} — ${formatActivityAction(latestSettingsActivity.action)}`
                  : 'Last updated: no settings activity has been recorded yet.'}
              </span>
            </div>
          </main>
        </div>
      </div>
    </div>);

}
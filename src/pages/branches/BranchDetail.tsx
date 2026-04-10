import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftIcon,
  BuildingIcon,
  MapPinIcon,
  UserIcon,
  PhoneIcon,
  MailIcon,
  CalendarIcon,
  WalletIcon,
  UsersIcon,
  BanknoteIcon,
  TrendingUpIcon,
  LandmarkIcon,
  PlusIcon,
  PencilIcon,
  CheckCircleIcon,
  StarIcon,
  ClockIcon,
  HashIcon,
  FileTextIcon } from
'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { api } from '../../app/api';
import {
  BranchData,
  BankAccount,
  FundingRecord,
  EditBranchModal,
  FundBranchModal,
  AddBankAccountModal } from
'./BranchModals';
import { initialBranches } from '../BranchManagement';
import { useAppSelector } from '../../store/hooks';

function formatFund(amount: number): string {
  return `₦${amount.toLocaleString()}`;
}

function mapBranchDetailsFromApi(raw: unknown, managerDisplayName: string): BranchData | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const source = raw as Record<string, unknown>;
  const id = typeof source.id === 'string' ? source.id : typeof source._id === 'string' ? source._id : '';
  const name = typeof source.name === 'string' ? source.name : '';
  const city = typeof source.city === 'string' ? source.city : '';
  const state = typeof source.state === 'string' ? source.state : '';
  const address = typeof source.address === 'string' ? source.address : '';

  if (!id || !name) {
    return null;
  }

  const fundingHistory = Array.isArray(source.fundingHistory)
    ? source.fundingHistory.map((item) => {
        const funding = item as Record<string, unknown>;
        const amount = typeof funding.amount === 'number' ? funding.amount : 0;
        const dateValue = typeof funding.date === 'string' ? funding.date : new Date().toISOString();
        return {
          id: typeof funding.id === 'string' ? funding.id : typeof funding._id === 'string' ? funding._id : `FH-${Date.now()}`,
          amount: formatFund(amount),
          date: new Date(dateValue).toISOString().split('T')[0],
          reference: typeof funding.reference === 'string' ? funding.reference : '-',
          allocatedBy: typeof funding.allocatedBy === 'string' ? funding.allocatedBy : 'System',
          note: typeof funding.note === 'string' ? funding.note : '',
        };
      })
    : [];

  const bankAccounts = Array.isArray(source.bankAccounts)
    ? source.bankAccounts.map((item) => {
        const account = item as Record<string, unknown>;
        const dateValue = typeof account.dateAdded === 'string' ? account.dateAdded : new Date().toISOString();
        return {
          id: typeof account.id === 'string' ? account.id : typeof account._id === 'string' ? account._id : `BA-${Date.now()}`,
          bankName: typeof account.bankName === 'string' ? account.bankName : '-',
          accountNumber: typeof account.accountNumber === 'string' ? account.accountNumber : '-',
          accountName: typeof account.accountName === 'string' ? account.accountName : '-',
          isCurrent: Boolean(account.isCurrent),
          dateAdded: new Date(dateValue).toISOString().split('T')[0],
        };
      })
    : [];

  const walletBalance = typeof source.walletBalance === 'number' ? source.walletBalance : 0;

  return {
    id,
    name,
    code: typeof source.code === 'string' ? source.code : undefined,
    state,
    city,
    address,
    managerId: typeof source.managerId === 'string' ? source.managerId : undefined,
    organizationId: typeof source.organizationId === 'string' ? source.organizationId : undefined,
    location: city && state ? `${city}, ${state}` : '—',
    manager: managerDisplayName,
    staff: 0,
    fund: formatFund(walletBalance),
    activeLoans: 0,
    status: source.isActive ? 'Active' : 'Inactive',
    phone: typeof source.phone === 'string' ? source.phone : '',
    email: typeof source.email === 'string' ? source.email : '',
    dateCreated: typeof source.createdAt === 'string' ? source.createdAt.split('T')[0] : '',
    totalDisbursed: '₦0',
    repaymentRate: '-',
    bankAccounts,
    fundingHistory,
  };
}

function mapLookupBranchToBranchData(
  raw: {
    id: string;
    name: string;
    code?: string;
    address?: string;
    city?: string;
    state?: string;
    phone?: string;
    email?: string;
    managerId?: string;
    organizationId?: string;
    isActive?: boolean;
  },
  managerDisplayName: string,
): BranchData {
  return {
    id: raw.id,
    name: raw.name,
    code: raw.code,
    state: raw.state,
    city: raw.city,
    address: raw.address,
    managerId: raw.managerId,
    organizationId: raw.organizationId,
    location: raw.city && raw.state ? `${raw.city}, ${raw.state}` : '—',
    manager: managerDisplayName,
    staff: 0,
    fund: '₦0',
    activeLoans: 0,
    status: raw.isActive ? 'Active' : 'Inactive',
    phone: raw.phone ?? '',
    email: raw.email ?? '',
    dateCreated: '',
    totalDisbursed: '₦0',
    repaymentRate: '-',
    bankAccounts: [],
    fundingHistory: [],
  };
}
type TabKey = 'overview' | 'bank-accounts' | 'funding-history';
const tabs: {
  key: TabKey;
  label: string;
}[] = [
{
  key: 'overview',
  label: 'Overview'
},
{
  key: 'bank-accounts',
  label: 'Bank Accounts'
},
{
  key: 'funding-history',
  label: 'Funding History'
}];

function InfoItem({
  icon,
  label,
  value




}: {icon: React.ReactNode;label: string;value: string;}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-gray-400">{icon}</div>
      <div>
        <p className="text-xs font-body text-gray-400">{label}</p>
        <p className="text-sm font-body font-medium text-gray-800">
          {value || '—'}
        </p>
      </div>
    </div>);

}
function MetricCard({
  label,
  value,
  icon,
  color





}: {label: string;value: string;icon: React.ReactNode;color: string;}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
      <div>
        <p className="text-xs font-body text-gray-400">{label}</p>
        <p className="text-xl font-heading font-bold text-gray-900">{value}</p>
      </div>
    </div>);

}
export function BranchDetail() {
  const { id } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const lookupBranches = useAppSelector((state) => state.lookups.branches);
  const branchManagers = useAppSelector((state) => state.lookups.branchManagers);
  const [branch, setBranch] = useState<BranchData | null>(() => {
    return initialBranches.find((b) => b.id === id) || null;
  });
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  // Modal states
  const [editOpen, setEditOpen] = useState(false);
  const [fundOpen, setFundOpen] = useState(false);
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [statusModal, setStatusModal] = useState<
    'activate' | 'deactivate' | null>(
    null);
  // Toast
  const [toast, setToast] = useState<{
    message: string;
    visible: boolean;
  }>({
    message: '',
    visible: false
  });
  function showToast(message: string) {
    setToast({
      message,
      visible: true
    });
    setTimeout(
      () =>
      setToast((t) => ({
        ...t,
        visible: false
      })),
      3000
    );
  }

  useEffect(() => {
    if (!id) {
      setBranch(null);
      return;
    }

    const fromInitial = initialBranches.find((item) => item.id === id) || null;
    const fromLookup = lookupBranches.find((item) => item.id === id) || null;

    const loadFromApi = async () => {
      try {
        const response = await api.get(`/admin/branches/${id}`);
        const envelope = response as { data?: unknown; payload?: unknown; item?: unknown };
        const raw = envelope.data ?? envelope.payload ?? envelope.item;
        const manager =
          (fromLookup?.managerId && branchManagers.find((item) => item.id === fromLookup.managerId)?.fullName) ||
          (typeof fromLookup?.managerId === 'string' ? fromLookup.managerId : 'Unassigned');
        const mapped = mapBranchDetailsFromApi(raw, manager ?? 'Unassigned');
        if (mapped) {
          setBranch(mapped);
          return;
        }
      } catch {
        // fallback below
      }

      if (fromLookup) {
        const manager =
          (typeof fromLookup.managerId === 'string' &&
            branchManagers.find((item) => item.id === fromLookup.managerId)?.fullName) ||
          (typeof fromLookup.managerId === 'string' && fromLookup.managerId) ||
          'Unassigned';
        setBranch(mapLookupBranchToBranchData(fromLookup, manager));
        return;
      }

      setBranch(fromInitial);
    };

    void loadFromApi();
  }, [branchManagers, id, lookupBranches]);

  if (!branch) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <BuildingIcon size={48} className="text-gray-300 mb-4" />
        <h3 className="text-lg font-heading font-bold text-gray-600">
          Branch Not Found
        </h3>
        <p className="text-sm font-body text-gray-400 mt-1">
          The branch you're looking for doesn't exist.
        </p>
        <button
          onClick={() => navigate('/branches')}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-heading font-bold hover:bg-primary/90 transition-colors">
          
          Back to Branches
        </button>
      </div>);

  }
  function parseFund(fund: string): number {
    return parseInt(fund.replace(/[₦,]/g, ''), 10) || 0;
  }
  function formatFund(amount: number): string {
    return `₦${amount.toLocaleString()}`;
  }
  async function handleEdit(branchId: string, data: Partial<BranchData>) {
    try {
      const response = await api.patch(`/admin/branches/${branchId}`, data);
      const envelope = response as { data?: unknown; payload?: unknown; item?: unknown };
      const raw = envelope.data ?? envelope.payload ?? envelope.item;
      const manager =
        (typeof data.managerId === 'string' && branchManagers.find((item) => item.id === data.managerId)?.fullName) ||
        (typeof data.managerId === 'string' ? data.managerId : branch?.manager ?? 'Unassigned');
      const mapped = mapBranchDetailsFromApi(raw, manager);
      if (mapped) {
        setBranch(mapped);
      }
      showToast('Branch details updated successfully');
      return;
    } catch {
      setBranch((prev) =>
        prev
          ? {
              ...prev,
              ...data,
            }
          : prev,
      );
      showToast('Branch updated locally (API unavailable)');
    }
  }
  async function handleFund(branchId: string, amount: number, note: string) {
    try {
      const response = await api.post(`/admin/branches/${branchId}/funding`, {
        amount,
        note,
      });
      const envelope = response as { data?: unknown; payload?: unknown; item?: unknown };
      const raw = envelope.data ?? envelope.payload ?? envelope.item;
      const mapped = mapBranchDetailsFromApi(raw, branch?.manager ?? 'Unassigned');
      if (mapped) {
        setBranch(mapped);
      }
      showToast(`₦${amount.toLocaleString()} allocated successfully`);
      return;
    } catch {
      // local fallback below
    }

    setBranch((prev) => {
      if (!prev) return prev;
      const current = parseFund(prev.fund);
      const newRecord: FundingRecord = {
        id: `FH-${Date.now()}`,
        amount: formatFund(amount),
        date: new Date().toISOString().split('T')[0],
        reference: `FND-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999)).padStart(3, '0')}`,
        allocatedBy: 'Adebayo Johnson',
        note: note || 'Fund allocation'
      };
      return {
        ...prev,
        fund: formatFund(current + amount),
        fundingHistory: [newRecord, ...prev.fundingHistory]
      };
    });
    showToast(`₦${amount.toLocaleString()} allocated locally`);
  }
  async function handleAddBankAccount(data: Omit<BankAccount, 'id' | 'dateAdded'>) {
    if (!branch) {
      return;
    }

    try {
      const response = await api.post(`/admin/branches/${branch.id}/bank-accounts`, data);
      const envelope = response as { data?: unknown; payload?: unknown; item?: unknown };
      const raw = envelope.data ?? envelope.payload ?? envelope.item;
      const mapped = mapBranchDetailsFromApi(raw, branch.manager);
      if (mapped) {
        setBranch(mapped);
      }
      showToast('Bank account added successfully');
      return;
    } catch {
      // local fallback below
    }

    setBranch((prev) => {
      if (!prev) return prev;
      const newAccount: BankAccount = {
        ...data,
        id: `BA-${Date.now()}`,
        dateAdded: new Date().toISOString().split('T')[0]
      };
      let updatedAccounts = [...prev.bankAccounts];
      if (data.isCurrent) {
        updatedAccounts = updatedAccounts.map((a) => ({
          ...a,
          isCurrent: false
        }));
      }
      updatedAccounts.push(newAccount);
      return {
        ...prev,
        bankAccounts: updatedAccounts
      };
    });
    showToast('Bank account added locally');
  }
  function handleSetCurrent(accountId: string) {
    setBranch((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        bankAccounts: prev.bankAccounts.map((a) => ({
          ...a,
          isCurrent: a.id === accountId
        }))
      };
    });
    showToast('Primary bank account updated');
  }
  async function handleStatusChange() {
    const newStatus = statusModal === 'activate' ? 'Active' : 'Inactive';
    try {
      if (!branch) {
        return;
      }
      if (newStatus === 'Active') {
        await api.patch(`/admin/branches/${branch.id}/reactivate`);
      } else {
        await api.patch(`/admin/branches/${branch.id}/deactivate`);
      }
      setBranch((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
            }
          : prev,
      );
      showToast(`Branch ${newStatus === 'Active' ? 'activated' : 'deactivated'} successfully`);
    } catch {
      setBranch((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
            }
          : prev,
      );
      showToast(`Branch ${newStatus === 'Active' ? 'activated' : 'deactivated'} locally`);
    }
    setStatusModal(null);
  }
  const currentAccount = branch.bankAccounts.find((a) => a.isCurrent);
  return (
    <div className="space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {toast.visible &&
        <motion.div
          initial={{
            opacity: 0,
            y: -20,
            x: '-50%'
          }}
          animate={{
            opacity: 1,
            y: 0,
            x: '-50%'
          }}
          exit={{
            opacity: 0,
            y: -20,
            x: '-50%'
          }}
          className="fixed top-4 left-1/2 z-[60] bg-primary text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm font-body">
          
            <CheckCircleIcon size={16} />
            {toast.message}
          </motion.div>
        }
      </AnimatePresence>

      {/* Modals */}
      <EditBranchModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        branch={branch}
        onSubmit={handleEdit} />
      
      <FundBranchModal
        isOpen={fundOpen}
        onClose={() => setFundOpen(false)}
        branch={branch}
        onSubmit={handleFund} />
      
      <AddBankAccountModal
        isOpen={addAccountOpen}
        onClose={() => setAddAccountOpen(false)}
        branchName={branch.name}
        onSubmit={handleAddBankAccount} />
      
      <ConfirmationModal
      description=''
        isOpen={statusModal !== null}
        onClose={() => setStatusModal(null)}
        onConfirm={handleStatusChange}
        title={
        statusModal === 'activate' ? 'Activate Branch' : 'Deactivate Branch'
        }
        confirmLabel={statusModal === 'activate' ? 'Activate' : 'Deactivate'}
        />
      

      {/* Header */}
      <div className="flex flex-col gap-4">
        <button
          onClick={() => navigate('/branches')}
          className="flex items-center gap-1.5 text-sm font-body text-gray-500 hover:text-primary transition-colors w-fit">
          
          <ArrowLeftIcon size={16} />
          Back to Branches
        </button>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <BuildingIcon size={28} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-heading font-bold text-gray-900">
                  {branch.name}
                </h1>
                <StatusBadge status={branch.status as any} />
              </div>
              <p className="text-sm font-body text-gray-500 mt-0.5">
                {branch.id} · {branch.location}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm font-heading font-bold text-gray-600 hover:bg-gray-50 transition-colors">
              
              <PencilIcon size={14} />
              Edit
            </button>
            <button
              onClick={() => setFundOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-heading font-bold hover:bg-primary/90 transition-colors">
              
              <WalletIcon size={14} />
              Fund Branch
            </button>
            {branch.status === 'Active' ?
            <button
              onClick={() => setStatusModal('deactivate')}
              className="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-heading font-bold hover:bg-red-50 transition-colors">
              
                Deactivate
              </button> :

            <button
              onClick={() => setStatusModal('activate')}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-heading font-bold hover:bg-green-700 transition-colors">
              
                Activate
              </button>
            }
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6" aria-label="Branch detail tabs">
          {tabs.map((tab) =>
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 text-sm font-heading font-bold transition-colors relative ${activeTab === tab.key ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}>
            
              {tab.label}
              {tab.key === 'bank-accounts' &&
            branch.bankAccounts.length > 0 &&
            <span className="ml-1.5 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                    {branch.bankAccounts.length}
                  </span>
            }
              {tab.key === 'funding-history' &&
            branch.fundingHistory.length > 0 &&
            <span className="ml-1.5 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                    {branch.fundingHistory.length}
                  </span>
            }
              {activeTab === tab.key &&
            <motion.div
              layoutId="branch-tab-indicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />

            }
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' &&
        <motion.div
          key="overview"
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
          }}
          className="space-y-6">
          
            {/* Performance Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
              label="Fund Balance"
              value={branch.fund}
              icon={<WalletIcon size={22} className="text-indigo-600" />}
              color="bg-indigo-50" />
            
              <MetricCard
              label="Active Loans"
              value={String(branch.activeLoans)}
              icon={<BanknoteIcon size={22} className="text-green-600" />}
              color="bg-green-50" />
            
              <MetricCard
              label="Total Disbursed"
              value={branch.totalDisbursed}
              icon={<TrendingUpIcon size={22} className="text-blue-600" />}
              color="bg-blue-50" />
            
              <MetricCard
              label="Repayment Rate"
              value={branch.repaymentRate}
              icon={
              <CheckCircleIcon size={22} className="text-emerald-600" />
              }
              color="bg-emerald-50" />
            
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Branch Information */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-base font-heading font-bold text-gray-900 mb-5">
                  Branch Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <InfoItem
                  icon={<BuildingIcon size={16} />}
                  label="Branch Name"
                  value={branch.name} />
                
                  <InfoItem
                  icon={<MapPinIcon size={16} />}
                  label="Location"
                  value={branch.location} />
                
                  <InfoItem
                  icon={<UserIcon size={16} />}
                  label="Branch Manager"
                  value={branch.manager} />
                
                  <InfoItem
                  icon={<UsersIcon size={16} />}
                  label="Staff Count"
                  value={String(branch.staff)} />
                
                  <InfoItem
                  icon={<PhoneIcon size={16} />}
                  label="Phone"
                  value={branch.phone} />
                
                  <InfoItem
                  icon={<MailIcon size={16} />}
                  label="Email"
                  value={branch.email} />
                
                  <InfoItem
                  icon={<CalendarIcon size={16} />}
                  label="Date Created"
                  value={branch.dateCreated} />
                
                  <InfoItem
                  icon={<HashIcon size={16} />}
                  label="Branch ID"
                  value={branch.id} />
                
                </div>
              </div>

              {/* Current Bank Account */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-base font-heading font-bold text-gray-900">
                    Current Bank Account
                  </h3>
                  <LandmarkIcon size={18} className="text-gray-400" />
                </div>
                {currentAccount ?
              <div className="space-y-4">
                    <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                      <p className="text-xs font-body text-gray-400 mb-1">
                        Bank
                      </p>
                      <p className="text-sm font-heading font-bold text-gray-900">
                        {currentAccount.bankName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-body text-gray-400 mb-1">
                        Account Number
                      </p>
                      <p className="text-lg font-heading font-bold text-primary tracking-wider">
                        {currentAccount.accountNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-body text-gray-400 mb-1">
                        Account Name
                      </p>
                      <p className="text-sm font-body font-medium text-gray-800">
                        {currentAccount.accountName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-body text-gray-400 mb-1">
                        Added On
                      </p>
                      <p className="text-sm font-body text-gray-600">
                        {currentAccount.dateAdded}
                      </p>
                    </div>
                  </div> :

              <div className="text-center py-8">
                    <LandmarkIcon
                  size={32}
                  className="text-gray-200 mx-auto mb-3" />
                
                    <p className="text-sm font-body text-gray-400">
                      No bank account configured
                    </p>
                    <button
                  onClick={() => setAddAccountOpen(true)}
                  className="mt-3 text-sm font-heading font-bold text-primary hover:text-accent transition-colors">
                  
                      + Add Bank Account
                    </button>
                  </div>
              }
              </div>
            </div>

            {/* Recent Funding */}
            {branch.fundingHistory.length > 0 &&
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-heading font-bold text-gray-900">
                    Recent Funding
                  </h3>
                  <button
                onClick={() => setActiveTab('funding-history')}
                className="text-sm font-heading font-bold text-primary hover:text-accent transition-colors">
                
                    View All
                  </button>
                </div>
                <div className="space-y-3">
                  {branch.fundingHistory.slice(0, 3).map((record) =>
              <div
                key={record.id}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                          <WalletIcon size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-body font-medium text-gray-800">
                            {record.amount}
                          </p>
                          <p className="text-xs font-body text-gray-400">
                            {record.note}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-body text-gray-500">
                          {record.date}
                        </p>
                        <p className="text-xs font-body text-gray-400">
                          {record.reference}
                        </p>
                      </div>
                    </div>
              )}
                </div>
              </div>
          }
          </motion.div>
        }

        {activeTab === 'bank-accounts' &&
        <motion.div
          key="bank-accounts"
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
          }}
          className="space-y-4">
          
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-heading font-bold text-gray-900">
                  Bank Accounts
                </h3>
                <p className="text-sm font-body text-gray-500 mt-0.5">
                  {branch.bankAccounts.length} account
                  {branch.bankAccounts.length !== 1 ? 's' : ''} on file
                </p>
              </div>
              <button
              onClick={() => setAddAccountOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-accent text-white rounded-lg text-sm font-heading font-bold hover:bg-[#e64a19] transition-colors">
              
                <PlusIcon size={14} />
                Add Account
              </button>
            </div>

            {branch.bankAccounts.length === 0 ?
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
                <LandmarkIcon
              size={48}
              className="text-gray-200 mx-auto mb-4" />
            
                <h4 className="text-base font-heading font-bold text-gray-600">
                  No Bank Accounts
                </h4>
                <p className="text-sm font-body text-gray-400 mt-1">
                  Add a bank account to start receiving funds.
                </p>
                <button
              onClick={() => setAddAccountOpen(true)}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-heading font-bold hover:bg-primary/90 transition-colors">
              
                  Add First Account
                </button>
              </div> :

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {branch.bankAccounts.map((account) =>
            <div
              key={account.id}
              className={`bg-white rounded-xl border shadow-sm p-5 relative ${account.isCurrent ? 'border-primary/30 ring-1 ring-primary/10' : 'border-gray-100'}`}>
              
                    {account.isCurrent &&
              <div className="absolute top-4 right-4 flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                        <StarIcon size={12} className="fill-primary" />
                        <span className="text-xs font-heading font-bold">
                          Current
                        </span>
                      </div>
              }

                    <div className="flex items-center gap-3 mb-4">
                      <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${account.isCurrent ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'}`}>
                  
                        <LandmarkIcon size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-heading font-bold text-gray-900">
                          {account.bankName}
                        </p>
                        <p className="text-xs font-body text-gray-400">
                          Added {account.dateAdded}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2.5 mb-4">
                      <div>
                        <p className="text-xs font-body text-gray-400">
                          Account Number
                        </p>
                        <p className="text-base font-heading font-bold text-gray-800 tracking-wider">
                          {account.accountNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-body text-gray-400">
                          Account Name
                        </p>
                        <p className="text-sm font-body font-medium text-gray-700">
                          {account.accountName}
                        </p>
                      </div>
                    </div>

                    {!account.isCurrent &&
              <button
                onClick={() => handleSetCurrent(account.id)}
                className="w-full py-2 border border-primary/20 text-primary rounded-lg text-sm font-heading font-bold hover:bg-primary/5 transition-colors">
                
                        Set as Current
                      </button>
              }
                  </div>
            )}
              </div>
          }
          </motion.div>
        }

        {activeTab === 'funding-history' &&
        <motion.div
          key="funding-history"
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
          }}
          className="space-y-4">
          
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-heading font-bold text-gray-900">
                  Funding History
                </h3>
                <p className="text-sm font-body text-gray-500 mt-0.5">
                  {branch.fundingHistory.length} allocation
                  {branch.fundingHistory.length !== 1 ? 's' : ''} recorded
                </p>
              </div>
              <button
              onClick={() => setFundOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-heading font-bold hover:bg-primary/90 transition-colors">
              
                <WalletIcon size={14} />
                Allocate Funds
              </button>
            </div>

            {branch.fundingHistory.length === 0 ?
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
                <WalletIcon size={48} className="text-gray-200 mx-auto mb-4" />
                <h4 className="text-base font-heading font-bold text-gray-600">
                  No Funding Records
                </h4>
                <p className="text-sm font-body text-gray-400 mt-1">
                  No funds have been allocated to this branch yet.
                </p>
                <button
              onClick={() => setFundOpen(true)}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-heading font-bold hover:bg-primary/90 transition-colors">
              
                  Allocate First Fund
                </button>
              </div> :

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider font-heading">
                        <th className="px-6 py-4 font-medium">Date</th>
                        <th className="px-6 py-4 font-medium">Amount</th>
                        <th className="px-6 py-4 font-medium">Reference</th>
                        <th className="px-6 py-4 font-medium">Allocated By</th>
                        <th className="px-6 py-4 font-medium">Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {branch.fundingHistory.map((record, index) =>
                  <tr
                    key={record.id}
                    className="hover:bg-gray-50/50 transition-colors">
                    
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <ClockIcon size={14} className="text-gray-400" />
                              <span className="font-body text-gray-700">
                                {record.date}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-heading font-bold text-green-700">
                              {record.amount}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {record.reference}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-body text-gray-700">
                            {record.allocatedBy}
                          </td>
                          <td className="px-6 py-4 font-body text-gray-500 max-w-[200px] truncate">
                            {record.note}
                          </td>
                        </tr>
                  )}
                    </tbody>
                  </table>
                </div>

                {/* Summary footer */}
                <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex items-center justify-between">
                  <p className="text-sm font-body text-gray-500">
                    Total Allocations:{' '}
                    <span className="font-heading font-bold text-gray-800">
                      {branch.fundingHistory.length}
                    </span>
                  </p>
                  <p className="text-sm font-body text-gray-500">
                    Current Balance:{' '}
                    <span className="font-heading font-bold text-primary">
                      {branch.fund}
                    </span>
                  </p>
                </div>
              </div>
          }
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}
import React, { useState, Component } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFormik } from 'formik';
import {
  DollarSignIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletIcon,
  ActivityIcon,
  SearchIcon,
  FilterIcon,
  DownloadIcon,
  PlusIcon,
  CheckCircleIcon,
  XIcon,
  BanknoteIcon,
  ReceiptIcon,
  FileTextIcon,
  BarChart3Icon,
  ScaleIcon,
  ArrowRightLeftIcon,
  BuildingIcon,
  ClockIcon,
  CheckIcon,
  XCircleIcon,
  LinkIcon } from
'lucide-react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell } from
'recharts';
import { StatusBadge } from '../components/StatusBadge';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  closeExpenseModal as closeExpenseModalAction,
  openExpenseModal,
  setActiveTab,
  setPeriod,
  setReportPeriod,
  setTxBranch,
  setTxSearch,
  setTxType,
  setTxVisible } from
'../store/slices/finConUiSlice';
import { expenseSchema } from '../validators/nonAuthSchemas';
// ─── Types ──────────────────────────────────────────────────────
type FinTab =
'overview' |
'transactions' |
'revenue' |
'expenses' |
'reports' |
'reconciliation';
type Period = 'MTD' | 'QTD' | 'YTD';
interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'Credit' | 'Debit';
  branch: string;
  date: string;
  status: string;
  category: string;
}
interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  branch: string;
  date: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  approvedBy: string;
}
interface ReconItem {
  id: string;
  date: string;
  description: string;
  bankAmount: number;
  systemAmount: number;
  difference: number;
  status: 'Matched' | 'Unmatched' | 'Pending';
}
// ─── Mock Data ──────────────────────────────────────────────────
const kpiByPeriod: Record<
  Period,
  {
    revenue: number;
    expenses: number;
    netIncome: number;
    cashBalance: number;
    portfolio: number;
    feeIncome: number;
  }> =
{
  MTD: {
    revenue: 2400000,
    expenses: 450000,
    netIncome: 1950000,
    cashBalance: 12800000,
    portfolio: 45600000,
    feeIncome: 380000
  },
  QTD: {
    revenue: 7200000,
    expenses: 1350000,
    netIncome: 5850000,
    cashBalance: 12800000,
    portfolio: 45600000,
    feeIncome: 1140000
  },
  YTD: {
    revenue: 14800000,
    expenses: 2900000,
    netIncome: 11900000,
    cashBalance: 12800000,
    portfolio: 45600000,
    feeIncome: 2280000
  }
};
const revExpTrend = [
{
  month: 'Jan',
  revenue: 2100000,
  expenses: 380000
},
{
  month: 'Feb',
  revenue: 2300000,
  expenses: 420000
},
{
  month: 'Mar',
  revenue: 2500000,
  expenses: 460000
},
{
  month: 'Apr',
  revenue: 2600000,
  expenses: 510000
},
{
  month: 'May',
  revenue: 2400000,
  expenses: 430000
},
{
  month: 'Jun',
  revenue: 2800000,
  expenses: 490000
}];

const incomeBreakdown = [
{
  source: 'Interest Income',
  amount: 1680000
},
{
  source: 'Processing Fees',
  amount: 180000
},
{
  source: 'Penalty Fees',
  amount: 95000
},
{
  source: 'Insurance Levies',
  amount: 62000
},
{
  source: 'Registration Fees',
  amount: 43000
}];

const allTransactions: Transaction[] = [
{
  id: 'TRX-901',
  description: 'Loan Disbursement (GL-1042)',
  amount: -450000,
  type: 'Debit',
  branch: 'Surulere',
  date: '2026-06-12',
  status: 'Completed',
  category: 'Loan Disbursement'
},
{
  id: 'TRX-902',
  description: 'Repayment Collection (GL-1021)',
  amount: 85000,
  type: 'Credit',
  branch: 'Mushin',
  date: '2026-06-12',
  status: 'Completed',
  category: 'Repayment Collection'
},
{
  id: 'TRX-903',
  description: 'Office Supplies — Ikeja Branch',
  amount: -12500,
  type: 'Debit',
  branch: 'Ikeja',
  date: '2026-06-11',
  status: 'Completed',
  category: 'Office Expense'
},
{
  id: 'TRX-904',
  description: 'Repayment Collection (GL-1038)',
  amount: 120000,
  type: 'Credit',
  branch: 'Surulere',
  date: '2026-06-10',
  status: 'Completed',
  category: 'Repayment Collection'
},
{
  id: 'TRX-905',
  description: 'Processing Fee — GL-1044',
  amount: 6000,
  type: 'Credit',
  branch: 'Alaba',
  date: '2026-06-10',
  status: 'Completed',
  category: 'Fee Income'
},
{
  id: 'TRX-906',
  description: 'Staff Salary — June 2026',
  amount: -185000,
  type: 'Debit',
  branch: 'Head Office',
  date: '2026-06-09',
  status: 'Completed',
  category: 'Salary Payment'
},
{
  id: 'TRX-907',
  description: 'Loan Disbursement (GL-1043)',
  amount: -200000,
  type: 'Debit',
  branch: 'Alaba',
  date: '2026-06-09',
  status: 'Completed',
  category: 'Loan Disbursement'
},
{
  id: 'TRX-908',
  description: 'Repayment Collection (GL-1042)',
  amount: 45000,
  type: 'Credit',
  branch: 'Surulere',
  date: '2026-06-08',
  status: 'Completed',
  category: 'Repayment Collection'
},
{
  id: 'TRX-909',
  description: 'Electricity Bill — Mushin Branch',
  amount: -18000,
  type: 'Debit',
  branch: 'Mushin',
  date: '2026-06-08',
  status: 'Completed',
  category: 'Utility Payment'
},
{
  id: 'TRX-910',
  description: 'Insurance Premium Collection',
  amount: 32000,
  type: 'Credit',
  branch: 'Ikeja',
  date: '2026-06-07',
  status: 'Completed',
  category: 'Insurance Premium'
},
{
  id: 'TRX-911',
  description: 'Fund Transfer to Alaba Branch',
  amount: -500000,
  type: 'Debit',
  branch: 'Head Office',
  date: '2026-06-07',
  status: 'Completed',
  category: 'Fund Transfer'
},
{
  id: 'TRX-912',
  description: 'Penalty Fee — GL-1035',
  amount: 15000,
  type: 'Credit',
  branch: 'Mushin',
  date: '2026-06-06',
  status: 'Completed',
  category: 'Fee Income'
},
{
  id: 'TRX-913',
  description: 'Repayment Collection (GL-1040)',
  amount: 95000,
  type: 'Credit',
  branch: 'Ikeja',
  date: '2026-06-06',
  status: 'Completed',
  category: 'Repayment Collection'
},
{
  id: 'TRX-914',
  description: 'Transport & Logistics',
  amount: -8500,
  type: 'Debit',
  branch: 'Surulere',
  date: '2026-06-05',
  status: 'Completed',
  category: 'Office Expense'
},
{
  id: 'TRX-915',
  description: 'Registration Fee — 3 new customers',
  amount: 15000,
  type: 'Credit',
  branch: 'Alaba',
  date: '2026-06-05',
  status: 'Completed',
  category: 'Fee Income'
},
{
  id: 'TRX-916',
  description: 'Loan Disbursement (GL-1044)',
  amount: -300000,
  type: 'Debit',
  branch: 'Alaba',
  date: '2026-06-04',
  status: 'Pending',
  category: 'Loan Disbursement'
},
{
  id: 'TRX-917',
  description: 'Repayment Collection (GL-1036)',
  amount: 68000,
  type: 'Credit',
  branch: 'Mushin',
  date: '2026-06-04',
  status: 'Completed',
  category: 'Repayment Collection'
},
{
  id: 'TRX-918',
  description: 'Internet Service — All Branches',
  amount: -45000,
  type: 'Debit',
  branch: 'Head Office',
  date: '2026-06-03',
  status: 'Completed',
  category: 'Utility Payment'
},
{
  id: 'TRX-919',
  description: 'Marketing Flyers Printing',
  amount: -22000,
  type: 'Debit',
  branch: 'Ikeja',
  date: '2026-06-02',
  status: 'Completed',
  category: 'Office Expense'
},
{
  id: 'TRX-920',
  description: 'Repayment Collection (GL-1039)',
  amount: 110000,
  type: 'Credit',
  branch: 'Surulere',
  date: '2026-06-01',
  status: 'Completed',
  category: 'Repayment Collection'
}];

const allExpenses: Expense[] = [
{
  id: 'EXP-001',
  category: 'Salaries & Wages',
  description: 'Staff salary — June 2026',
  amount: 185000,
  branch: 'Head Office',
  date: '2026-06-09',
  status: 'Approved',
  approvedBy: 'Adebayo Johnson'
},
{
  id: 'EXP-002',
  category: 'Office & Supplies',
  description: 'Office supplies — Ikeja',
  amount: 12500,
  branch: 'Ikeja',
  date: '2026-06-11',
  status: 'Approved',
  approvedBy: 'Adebayo Johnson'
},
{
  id: 'EXP-003',
  category: 'Utilities',
  description: 'Electricity bill — Mushin',
  amount: 18000,
  branch: 'Mushin',
  date: '2026-06-08',
  status: 'Approved',
  approvedBy: 'Fatima Abubakar'
},
{
  id: 'EXP-004',
  category: 'Utilities',
  description: 'Internet service — All branches',
  amount: 45000,
  branch: 'Head Office',
  date: '2026-06-03',
  status: 'Approved',
  approvedBy: 'Adebayo Johnson'
},
{
  id: 'EXP-005',
  category: 'Transport & Logistics',
  description: 'Field officer transport',
  amount: 8500,
  branch: 'Surulere',
  date: '2026-06-05',
  status: 'Approved',
  approvedBy: 'Emeka Nnamdi'
},
{
  id: 'EXP-006',
  category: 'Marketing',
  description: 'Marketing flyers printing',
  amount: 22000,
  branch: 'Ikeja',
  date: '2026-06-02',
  status: 'Approved',
  approvedBy: 'Adebayo Johnson'
},
{
  id: 'EXP-007',
  category: 'Office & Supplies',
  description: 'Printer cartridges — Mushin',
  amount: 9500,
  branch: 'Mushin',
  date: '2026-06-01',
  status: 'Approved',
  approvedBy: 'Fatima Abubakar'
},
{
  id: 'EXP-008',
  category: 'Salaries & Wages',
  description: 'Overtime pay — May',
  amount: 35000,
  branch: 'Head Office',
  date: '2026-05-31',
  status: 'Approved',
  approvedBy: 'Adebayo Johnson'
},
{
  id: 'EXP-009',
  category: 'Transport & Logistics',
  description: 'Vehicle fuel — Alaba',
  amount: 15000,
  branch: 'Alaba',
  date: '2026-06-10',
  status: 'Pending',
  approvedBy: ''
},
{
  id: 'EXP-010',
  category: 'Office & Supplies',
  description: 'New desk chairs — Surulere',
  amount: 48000,
  branch: 'Surulere',
  date: '2026-06-11',
  status: 'Pending',
  approvedBy: ''
},
{
  id: 'EXP-011',
  category: 'Marketing',
  description: 'Social media ads — June',
  amount: 30000,
  branch: 'Head Office',
  date: '2026-06-12',
  status: 'Pending',
  approvedBy: ''
},
{
  id: 'EXP-012',
  category: 'Other',
  description: 'Security guard service',
  amount: 25000,
  branch: 'Mushin',
  date: '2026-05-28',
  status: 'Rejected',
  approvedBy: 'Adebayo Johnson'
}];

const reconItems: ReconItem[] = [
{
  id: 'REC-001',
  date: '2026-06-12',
  description: 'Repayment — GL-1021',
  bankAmount: 85000,
  systemAmount: 85000,
  difference: 0,
  status: 'Matched'
},
{
  id: 'REC-002',
  date: '2026-06-12',
  description: 'Disbursement — GL-1042',
  bankAmount: 450000,
  systemAmount: 450000,
  difference: 0,
  status: 'Matched'
},
{
  id: 'REC-003',
  date: '2026-06-11',
  description: 'Office supplies — Ikeja',
  bankAmount: 12500,
  systemAmount: 12500,
  difference: 0,
  status: 'Matched'
},
{
  id: 'REC-004',
  date: '2026-06-10',
  description: 'Repayment — GL-1038',
  bankAmount: 120000,
  systemAmount: 120000,
  difference: 0,
  status: 'Matched'
},
{
  id: 'REC-005',
  date: '2026-06-09',
  description: 'Salary payment',
  bankAmount: 185000,
  systemAmount: 185000,
  difference: 0,
  status: 'Matched'
},
{
  id: 'REC-006',
  date: '2026-06-08',
  description: 'Repayment — GL-1042',
  bankAmount: 45000,
  systemAmount: 45000,
  difference: 0,
  status: 'Matched'
},
{
  id: 'REC-007',
  date: '2026-06-07',
  description: 'Insurance collection',
  bankAmount: 32500,
  systemAmount: 32000,
  difference: 500,
  status: 'Unmatched'
},
{
  id: 'REC-008',
  date: '2026-06-06',
  description: 'Penalty fee — GL-1035',
  bankAmount: 15000,
  systemAmount: 15000,
  difference: 0,
  status: 'Matched'
},
{
  id: 'REC-009',
  date: '2026-06-05',
  description: 'Registration fees',
  bankAmount: 14500,
  systemAmount: 15000,
  difference: -500,
  status: 'Unmatched'
},
{
  id: 'REC-010',
  date: '2026-06-04',
  description: 'Disbursement — GL-1044',
  bankAmount: 300000,
  systemAmount: 300000,
  difference: 0,
  status: 'Pending'
}];

const branchRevenue = [
{
  branch: 'Mushin',
  interest: 580000,
  fees: 95000,
  total: 675000,
  pct: '28.1'
},
{
  branch: 'Ikeja',
  interest: 480000,
  fees: 82000,
  total: 562000,
  pct: '23.4'
},
{
  branch: 'Surulere',
  interest: 420000,
  fees: 68000,
  total: 488000,
  pct: '20.3'
},
{
  branch: 'Alaba',
  interest: 380000,
  fees: 72000,
  total: 452000,
  pct: '18.8'
},
{
  branch: 'Head Office',
  interest: 160000,
  fees: 63000,
  total: 223000,
  pct: '9.3'
}];

const expenseCategories = [
{
  category: 'Salaries & Wages',
  amount: 220000,
  color: '#1A5745'
},
{
  category: 'Office & Supplies',
  amount: 70000,
  color: '#2563eb'
},
{
  category: 'Utilities',
  amount: 63000,
  color: '#7c3aed'
},
{
  category: 'Transport & Logistics',
  amount: 23500,
  color: '#f59e0b'
},
{
  category: 'Marketing',
  amount: 52000,
  color: '#ff5722'
},
{
  category: 'Other',
  amount: 25000,
  color: '#6b7280'
}];

// ─── Helpers ────────────────────────────────────────────────────
function fmt(n: number): string {
  if (Math.abs(n) >= 1000000) return `₦${(n / 1000000).toFixed(1)}M`;
  if (Math.abs(n) >= 1000) return `₦${(n / 1000).toFixed(0)}K`;
  return `₦${n.toLocaleString()}`;
}
function fmtFull(n: number): string {
  return `₦${Math.abs(n).toLocaleString()}`;
}
function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}
const inputClass =
'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all';
const selectClass = `${inputClass} bg-white`;
const finTabs: {
  key: FinTab;
  label: string;
  icon: React.ReactNode;
}[] = [
{
  key: 'overview',
  label: 'Overview',
  icon: <BarChart3Icon size={16} />
},
{
  key: 'transactions',
  label: 'Transactions',
  icon: <ArrowRightLeftIcon size={16} />
},
{
  key: 'revenue',
  label: 'Revenue',
  icon: <TrendingUpIcon size={16} />
},
{
  key: 'expenses',
  label: 'Expenses',
  icon: <ReceiptIcon size={16} />
},
{
  key: 'reports',
  label: 'Reports',
  icon: <FileTextIcon size={16} />
},
{
  key: 'reconciliation',
  label: 'Reconciliation',
  icon: <ScaleIcon size={16} />
}];

const branches = ['All', 'Ikeja', 'Surulere', 'Mushin', 'Alaba', 'Head Office'];
const expCats = [
'Salaries & Wages',
'Office & Supplies',
'Utilities',
'Transport & Logistics',
'Marketing',
'Other'];

// ─── Component ──────────────────────────────────────────────────
export function FinCon() {
  const dispatch = useAppDispatch();
  const {
    activeTab,
    period,
    txSearch,
    txType,
    txBranch,
    txVisible,
    expModal,
    reportPeriod
  } = useAppSelector((state) => state.finConUi);

  // Expenses
  const [expenses, setExpenses] = useState<Expense[]>(allExpenses);
  const expenseFormik = useFormik({
    initialValues: {
      category: 'Office & Supplies',
      description: '',
      amount: '',
      branch: 'Ikeja',
      date: ''
    },
    validationSchema: expenseSchema,
    validateOnMount: true,
    onSubmit: (values) => {
      const newExp: Expense = {
        id: `EXP-${String(expenses.length + 1).padStart(3, '0')}`,
        category: values.category,
        description: values.description.trim(),
        amount: parseInt(values.amount, 10),
        branch: values.branch,
        date: values.date || new Date().toISOString().split('T')[0],
        status: 'Pending',
        approvedBy: ''
      };
      setExpenses((prev) => [newExp, ...prev]);
      expenseFormik.resetForm();
      dispatch(closeExpenseModalAction());
      showToast('Expense submitted for approval');
    }
  });
  // Reconciliation
  const [reconData, setReconData] = useState<ReconItem[]>(reconItems);

  // Toast
  const [toast, setToast] = useState({
    message: '',
    visible: false
  });
  function showToast(msg: string) {
    setToast({
      message: msg,
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
  const kpi = kpiByPeriod[period];
  // Filtered transactions
  const filteredTx = allTransactions.filter((tx) => {
    if (txType !== 'All' && tx.type !== txType) return false;
    if (txBranch !== 'All' && tx.branch !== txBranch) return false;
    if (
    txSearch &&
    !tx.description.toLowerCase().includes(txSearch.toLowerCase()) &&
    !tx.id.toLowerCase().includes(txSearch.toLowerCase()))

    return false;
    return true;
  });
  const totalCredits = filteredTx.
  filter((t) => t.type === 'Credit').
  reduce((s, t) => s + t.amount, 0);
  const totalDebits = filteredTx.
  filter((t) => t.type === 'Debit').
  reduce((s, t) => s + Math.abs(t.amount), 0);
  function closeExpenseModal() {
    expenseFormik.resetForm();
    dispatch(closeExpenseModalAction());
  }
  function approveExpense(id: string) {
    setExpenses((prev) =>
    prev.map((ex) =>
    ex.id === id ?
    {
      ...ex,
      status: 'Approved' as const,
      approvedBy: 'Adebayo Johnson'
    } :
    ex
    )
    );
    showToast('Expense approved');
  }
  function rejectExpense(id: string) {
    setExpenses((prev) =>
    prev.map((ex) =>
    ex.id === id ?
    {
      ...ex,
      status: 'Rejected' as const,
      approvedBy: 'Adebayo Johnson'
    } :
    ex
    )
    );
    showToast('Expense rejected');
  }
  function markMatched(id: string) {
    setReconData((prev) =>
    prev.map((r) =>
    r.id === id ?
    {
      ...r,
      status: 'Matched' as const,
      difference: 0
    } :
    r
    )
    );
    showToast('Item marked as matched');
  }
  // ─── Render Helpers ─────────────────────────────────────────
  function KpiCard({
    label,
    value,
    icon,
    color





  }: {label: string;value: string;icon: React.ReactNode;color: string;}) {
    return (
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center">
        <div className={`p-3 rounded-lg mr-4 ${color}`}>{icon}</div>
        <div>
          <p className="text-gray-500 text-sm font-medium">{label}</p>
          <h3 className="text-2xl font-heading font-bold text-primary">
            {value}
          </h3>
        </div>
      </div>);

  }
  function PeriodSelector({
    value,
    onChange



  }: {value: string;onChange: (v: Period) => void;}) {
    return (
      <div className="flex gap-1.5">
        {(['MTD', 'QTD', 'YTD'] as Period[]).map((p) =>
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold transition-colors ${value === p ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          
            {p}
          </button>
        )}
      </div>);

  }
  // ─── TAB: Overview ──────────────────────────────────────────
  function renderOverview() {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-heading font-bold text-gray-900">
            Financial Summary
          </h3>
          <PeriodSelector
            value={period}
            onChange={(nextPeriod) => dispatch(setPeriod(nextPeriod))} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <KpiCard
            label="Total Revenue"
            value={fmt(kpi.revenue)}
            icon={<DollarSignIcon size={22} />}
            color="bg-green-50 text-green-600" />
          
          <KpiCard
            label="Total Expenses"
            value={fmt(kpi.expenses)}
            icon={<TrendingDownIcon size={22} />}
            color="bg-red-50 text-red-600" />
          
          <KpiCard
            label="Net Income"
            value={fmt(kpi.netIncome)}
            icon={<ActivityIcon size={22} />}
            color="bg-blue-50 text-blue-600" />
          
          <KpiCard
            label="Cash Balance"
            value={fmt(kpi.cashBalance)}
            icon={<WalletIcon size={22} />}
            color="bg-indigo-50 text-indigo-600" />
          
          <KpiCard
            label="Loan Portfolio"
            value={fmt(kpi.portfolio)}
            icon={<BanknoteIcon size={22} />}
            color="bg-amber-50 text-amber-600" />
          
          <KpiCard
            label="Fee Income"
            value={fmt(kpi.feeIncome)}
            icon={<ReceiptIcon size={22} />}
            color="bg-purple-50 text-purple-600" />
          
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue vs Expenses Trend */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h4 className="text-sm font-heading font-bold text-gray-900 mb-4">
              Revenue vs Expenses (6 Months)
            </h4>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={revExpTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{
                    fontSize: 12
                  }} />
                
                <YAxis
                  tick={{
                    fontSize: 12
                  }}
                  tickFormatter={(v) => `₦${(v / 1000000).toFixed(1)}M`} />
                
                <Tooltip formatter={(v: number) => fmtFull(v)} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#1A5745"
                  fill="#1A5745"
                  fillOpacity={0.15}
                  strokeWidth={2}
                  name="Revenue" />
                
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.1}
                  strokeWidth={2}
                  name="Expenses" />
                
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Income Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h4 className="text-sm font-heading font-bold text-gray-900 mb-4">
              Income by Source (MTD)
            </h4>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={incomeBreakdown}
                layout="vertical"
                margin={{
                  left: 10
                }}>
                
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  type="number"
                  tick={{
                    fontSize: 11
                  }}
                  tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}K`} />
                
                <YAxis
                  type="category"
                  dataKey="source"
                  tick={{
                    fontSize: 11
                  }}
                  width={110} />
                
                <Tooltip formatter={(v: number) => fmtFull(v)} />
                <Bar
                  dataKey="amount"
                  fill="#1A5745"
                  radius={[0, 4, 4, 0]}
                  barSize={20} />
                
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h4 className="text-sm font-heading font-bold text-gray-900">
              Recent Transactions
            </h4>
            <button
              onClick={() => dispatch(setActiveTab('transactions'))}
              className="text-sm font-heading font-bold text-primary hover:text-accent transition-colors">
              
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider font-heading">
                  <th className="px-6 py-3 font-medium">ID</th>
                  <th className="px-6 py-3 font-medium">Description</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {allTransactions.slice(0, 5).map((tx) =>
                <tr
                  key={tx.id}
                  className="hover:bg-gray-50/50 transition-colors">
                  
                    <td className="px-6 py-3 font-heading font-medium text-primary">
                      {tx.id}
                    </td>
                    <td className="px-6 py-3 text-gray-700">
                      {tx.description}
                    </td>
                    <td
                    className={`px-6 py-3 font-medium ${tx.type === 'Credit' ? 'text-green-600' : 'text-red-600'}`}>
                    
                      {tx.type === 'Credit' ? '+' : '-'}{' '}
                      {fmtFull(Math.abs(tx.amount))}
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      {fmtDate(tx.date)}
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={tx.status as any} />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>);

  }
  // ─── TAB: Transactions ──────────────────────────────────────
  function renderTransactions() {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-2 flex-1">
            <div className="relative flex-1 max-w-xs">
              <SearchIcon
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              
              <input
                type="text"
                value={txSearch}
                onChange={(e) => dispatch(setTxSearch(e.target.value))}
                placeholder="Search transactions..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              
            </div>
            <select
              value={txType}
              onChange={(e) => dispatch(setTxType(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
              
              <option value="All">All Types</option>
              <option value="Credit">Credit</option>
              <option value="Debit">Debit</option>
            </select>
            <select
              value={txBranch}
              onChange={(e) => dispatch(setTxBranch(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
              
              {branches.map((b) =>
              <option key={b} value={b}>
                  {b === 'All' ? 'All Branches' : b}
                </option>
              )}
            </select>
          </div>
          <button
            onClick={() => showToast('Transaction report exported')}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm font-heading font-bold text-gray-600 hover:bg-gray-50 transition-colors">
            
            <DownloadIcon size={14} /> Export
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider font-heading">
                  <th className="px-6 py-3 font-medium">ID</th>
                  <th className="px-6 py-3 font-medium">Description</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium">Branch</th>
                  <th className="px-6 py-3 font-medium">Category</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredTx.slice(0, txVisible).map((tx) =>
                <tr
                  key={tx.id}
                  className="hover:bg-gray-50/50 transition-colors">
                  
                    <td className="px-6 py-3 font-heading font-medium text-primary">
                      {tx.id}
                    </td>
                    <td className="px-6 py-3 text-gray-700 max-w-[200px] truncate">
                      {tx.description}
                    </td>
                    <td
                    className={`px-6 py-3 font-heading font-bold ${tx.type === 'Credit' ? 'text-green-600' : 'text-red-600'}`}>
                    
                      {tx.type === 'Credit' ? '+' : '-'}{' '}
                      {fmtFull(Math.abs(tx.amount))}
                    </td>
                    <td className="px-6 py-3">
                      <span
                      className={`px-2 py-0.5 rounded-full text-xs font-heading font-medium border ${tx.type === 'Credit' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                      
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-600">{tx.branch}</td>
                    <td className="px-6 py-3">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {tx.category}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      {fmtDate(tx.date)}
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={tx.status as any} />
                    </td>
                  </tr>
                )}
                {filteredTx.length === 0 &&
                <tr>
                    <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-gray-400 text-sm">
                    
                      No transactions match your filters.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t border-gray-100 px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex gap-4 text-sm font-body">
              <span className="text-gray-500">
                Credits:{' '}
                <strong className="text-green-600">
                  {fmtFull(totalCredits)}
                </strong>
              </span>
              <span className="text-gray-500">
                Debits:{' '}
                <strong className="text-red-600">{fmtFull(totalDebits)}</strong>
              </span>
              <span className="text-gray-500">
                Net:{' '}
                <strong
                  className={
                  totalCredits - totalDebits >= 0 ?
                  'text-green-600' :
                  'text-red-600'
                  }>
                  
                  {fmtFull(totalCredits - totalDebits)}
                </strong>
              </span>
            </div>
            {txVisible < filteredTx.length &&
            <button
              onClick={() => dispatch(setTxVisible(txVisible + 10))}
              className="text-sm font-heading font-bold text-primary hover:text-accent transition-colors">
              
                Load More ({filteredTx.length - txVisible} remaining)
              </button>
            }
          </div>
        </div>
      </div>);

  }
  // ─── TAB: Revenue ───────────────────────────────────────────
  function renderRevenue() {
    const totalRev = incomeBreakdown.reduce((s, i) => s + i.amount, 0);
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-heading font-bold text-gray-900">
            Revenue Breakdown
          </h3>
          <PeriodSelector
            value={period}
            onChange={(nextPeriod) => dispatch(setPeriod(nextPeriod))} />
        </div>

        {/* Revenue Source Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {incomeBreakdown.map((item) =>
          <div
            key={item.source}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            
              <p className="text-xs font-body text-gray-500 truncate">
                {item.source}
              </p>
              <p className="text-lg font-heading font-bold text-gray-900 mt-1">
                {fmtFull(item.amount)}
              </p>
              <p className="text-xs font-body text-primary mt-0.5">
                {(item.amount / totalRev * 100).toFixed(1)}% of total
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue by Source Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h4 className="text-sm font-heading font-bold text-gray-900 mb-4">
              Revenue by Source
            </h4>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={incomeBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="source"
                  tick={{
                    fontSize: 10
                  }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={60} />
                
                <YAxis
                  tick={{
                    fontSize: 11
                  }}
                  tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}K`} />
                
                <Tooltip formatter={(v: number) => fmtFull(v)} />
                <Bar
                  dataKey="amount"
                  fill="#1A5745"
                  radius={[4, 4, 0, 0]}
                  barSize={36} />
                
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Revenue Trend */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h4 className="text-sm font-heading font-bold text-gray-900 mb-4">
              Monthly Revenue Trend
            </h4>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revExpTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{
                    fontSize: 12
                  }} />
                
                <YAxis
                  tick={{
                    fontSize: 11
                  }}
                  tickFormatter={(v) => `₦${(v / 1000000).toFixed(1)}M`} />
                
                <Tooltip formatter={(v: number) => fmtFull(v)} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#1A5745"
                  fill="#1A5745"
                  fillOpacity={0.15}
                  strokeWidth={2}
                  name="Revenue" />
                
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Branch Revenue Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h4 className="text-sm font-heading font-bold text-gray-900">
              Branch Revenue Comparison
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider font-heading">
                  <th className="px-6 py-3 font-medium">Branch</th>
                  <th className="px-6 py-3 font-medium">Interest Income</th>
                  <th className="px-6 py-3 font-medium">Fee Income</th>
                  <th className="px-6 py-3 font-medium">Total Revenue</th>
                  <th className="px-6 py-3 font-medium">% of Portfolio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {branchRevenue.map((br) =>
                <tr
                  key={br.branch}
                  className="hover:bg-gray-50/50 transition-colors">
                  
                    <td className="px-6 py-3 font-heading font-medium text-gray-900">
                      {br.branch}
                    </td>
                    <td className="px-6 py-3 text-gray-700">
                      {fmtFull(br.interest)}
                    </td>
                    <td className="px-6 py-3 text-gray-700">
                      {fmtFull(br.fees)}
                    </td>
                    <td className="px-6 py-3 font-heading font-bold text-primary">
                      {fmtFull(br.total)}
                    </td>
                    <td className="px-6 py-3 text-gray-600">{br.pct}%</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t border-gray-200">
                  <td className="px-6 py-3 font-heading font-bold text-gray-900">
                    Total
                  </td>
                  <td className="px-6 py-3 font-bold text-gray-800">
                    {fmtFull(branchRevenue.reduce((s, b) => s + b.interest, 0))}
                  </td>
                  <td className="px-6 py-3 font-bold text-gray-800">
                    {fmtFull(branchRevenue.reduce((s, b) => s + b.fees, 0))}
                  </td>
                  <td className="px-6 py-3 font-heading font-bold text-primary">
                    {fmtFull(branchRevenue.reduce((s, b) => s + b.total, 0))}
                  </td>
                  <td className="px-6 py-3 font-bold text-gray-800">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>);

  }
  // ─── TAB: Expenses ──────────────────────────────────────────
  function renderExpenses() {
    const totalExp = expenseCategories.reduce((s, c) => s + c.amount, 0);
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-heading font-bold text-gray-900">
            Expense Management
          </h3>
          <button
            onClick={() => dispatch(openExpenseModal())}
            className="flex items-center gap-1.5 px-4 py-2 bg-accent text-white rounded-lg text-sm font-heading font-bold hover:bg-[#e64a19] transition-colors">
            
            <PlusIcon size={14} /> Add Expense
          </button>
        </div>

        {/* Expense Category Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {expenseCategories.map((cat) =>
          <div
            key={cat.category}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
            
              <div
              className="w-3 h-10 rounded-full"
              style={{
                backgroundColor: cat.color
              }} />
            
              <div>
                <p className="text-xs font-body text-gray-500">
                  {cat.category}
                </p>
                <p className="text-lg font-heading font-bold text-gray-900">
                  {fmtFull(cat.amount)}
                </p>
                <p className="text-xs font-body text-gray-400">
                  {(cat.amount / totalExp * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Expense Breakdown Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h4 className="text-sm font-heading font-bold text-gray-900 mb-4">
            Expense Breakdown
          </h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={expenseCategories}
              layout="vertical"
              margin={{
                left: 10
              }}>
              
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                type="number"
                tick={{
                  fontSize: 11
                }}
                tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}K`} />
              
              <YAxis
                type="category"
                dataKey="category"
                tick={{
                  fontSize: 11
                }}
                width={130} />
              
              <Tooltip formatter={(v: number) => fmtFull(v)} />
              <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={18}>
                {expenseCategories.map((entry, i) =>
                <Cell key={i} fill={entry.color} />
                )}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider font-heading">
                  <th className="px-6 py-3 font-medium">ID</th>
                  <th className="px-6 py-3 font-medium">Category</th>
                  <th className="px-6 py-3 font-medium">Description</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Branch</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {expenses.map((ex) =>
                <tr
                  key={ex.id}
                  className="hover:bg-gray-50/50 transition-colors">
                  
                    <td className="px-6 py-3 font-heading font-medium text-primary">
                      {ex.id}
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {ex.category}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-700 max-w-[180px] truncate">
                      {ex.description}
                    </td>
                    <td className="px-6 py-3 font-heading font-bold text-red-600">
                      {fmtFull(ex.amount)}
                    </td>
                    <td className="px-6 py-3 text-gray-600">{ex.branch}</td>
                    <td className="px-6 py-3 text-gray-500">
                      {fmtDate(ex.date)}
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={ex.status as any} />
                    </td>
                    <td className="px-6 py-3 text-right">
                      {ex.status === 'Pending' &&
                    <div className="flex gap-1 justify-end">
                          <button
                        onClick={() => approveExpense(ex.id)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="Approve">
                        
                            <CheckIcon size={14} />
                          </button>
                          <button
                        onClick={() => rejectExpense(ex.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Reject">
                        
                            <XCircleIcon size={14} />
                          </button>
                        </div>
                    }
                      {ex.status !== 'Pending' && ex.approvedBy &&
                    <span className="text-xs text-gray-400">
                          {ex.approvedBy}
                        </span>
                    }
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>);

  }
  // ─── TAB: Reports ───────────────────────────────────────────
  function renderReports() {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-heading font-bold text-gray-900">
            Financial Reports
          </h3>
          <div className="flex gap-1.5">
            {['Monthly', 'Quarterly', 'Annual'].map((p) =>
            <button
              key={p}
              onClick={() => dispatch(setReportPeriod(p))}
              className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold transition-colors ${reportPeriod === p ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              
                {p}
              </button>
            )}
          </div>
        </div>

        {/* P&L Statement */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                <TrendingUpIcon size={16} />
              </div>
              <h4 className="text-sm font-heading font-bold text-gray-900">
                Profit & Loss Statement
              </h4>
            </div>
            <button
              onClick={() => showToast('P&L report generated')}
              className="text-xs font-heading font-bold text-primary hover:text-accent transition-colors">
              
              Generate Report
            </button>
          </div>
          <div className="px-6 py-4">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-gray-100">
                  <td
                    className="py-2 font-heading font-bold text-gray-800"
                    colSpan={2}>
                    
                    Revenue
                  </td>
                </tr>
                {[
                {
                  l: 'Interest Income',
                  v: 1680000
                },
                {
                  l: 'Processing Fees',
                  v: 180000
                },
                {
                  l: 'Penalty Fees',
                  v: 95000
                },
                {
                  l: 'Insurance Levies',
                  v: 62000
                },
                {
                  l: 'Registration Fees',
                  v: 43000
                }].
                map((r) =>
                <tr key={r.l} className="border-b border-gray-50">
                    <td className="py-1.5 pl-4 text-gray-600">{r.l}</td>
                    <td className="py-1.5 text-right text-gray-800">
                      {fmtFull(r.v)}
                    </td>
                  </tr>
                )}
                <tr className="border-b border-gray-200 bg-green-50/50">
                  <td className="py-2 pl-4 font-heading font-bold text-green-700">
                    Total Revenue
                  </td>
                  <td className="py-2 text-right font-heading font-bold text-green-700">
                    {fmtFull(2060000)}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td
                    className="py-2 font-heading font-bold text-gray-800 pt-4"
                    colSpan={2}>
                    
                    Expenses
                  </td>
                </tr>
                {expenseCategories.map((c) =>
                <tr key={c.category} className="border-b border-gray-50">
                    <td className="py-1.5 pl-4 text-gray-600">{c.category}</td>
                    <td className="py-1.5 text-right text-red-600">
                      {fmtFull(c.amount)}
                    </td>
                  </tr>
                )}
                <tr className="border-b border-gray-200 bg-red-50/50">
                  <td className="py-2 pl-4 font-heading font-bold text-red-700">
                    Total Expenses
                  </td>
                  <td className="py-2 text-right font-heading font-bold text-red-700">
                    {fmtFull(453500)}
                  </td>
                </tr>
                <tr className="bg-primary/5">
                  <td className="py-3 font-heading font-bold text-primary text-base">
                    Net Income
                  </td>
                  <td className="py-3 text-right font-heading font-bold text-primary text-base">
                    {fmtFull(1606500)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Balance Sheet */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <ScaleIcon size={16} />
              </div>
              <h4 className="text-sm font-heading font-bold text-gray-900">
                Balance Sheet Summary
              </h4>
            </div>
            <button
              onClick={() => showToast('Balance sheet generated')}
              className="text-xs font-heading font-bold text-primary hover:text-accent transition-colors">
              
              Generate Report
            </button>
          </div>
          <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h5 className="text-xs font-heading font-bold text-gray-500 uppercase tracking-wider mb-3">
                Assets
              </h5>
              {[
              {
                l: 'Cash & Bank',
                v: 12800000
              },
              {
                l: 'Outstanding Loans',
                v: 45600000
              },
              {
                l: 'Fixed Assets',
                v: 3200000
              }].
              map((a) =>
              <div
                key={a.l}
                className="flex justify-between py-1.5 border-b border-gray-50">
                
                  <span className="text-sm text-gray-600">{a.l}</span>
                  <span className="text-sm font-medium text-gray-800">
                    {fmt(a.v)}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-2 mt-1">
                <span className="text-sm font-heading font-bold text-gray-900">
                  Total Assets
                </span>
                <span className="text-sm font-heading font-bold text-primary">
                  {fmt(61600000)}
                </span>
              </div>
            </div>
            <div>
              <h5 className="text-xs font-heading font-bold text-gray-500 uppercase tracking-wider mb-3">
                Liabilities
              </h5>
              {[
              {
                l: 'Customer Deposits',
                v: 8500000
              },
              {
                l: 'Accounts Payable',
                v: 1200000
              },
              {
                l: 'Other Liabilities',
                v: 400000
              }].
              map((a) =>
              <div
                key={a.l}
                className="flex justify-between py-1.5 border-b border-gray-50">
                
                  <span className="text-sm text-gray-600">{a.l}</span>
                  <span className="text-sm font-medium text-gray-800">
                    {fmt(a.v)}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-2 mt-1">
                <span className="text-sm font-heading font-bold text-gray-900">
                  Total Liabilities
                </span>
                <span className="text-sm font-heading font-bold text-red-600">
                  {fmt(10100000)}
                </span>
              </div>
            </div>
            <div>
              <h5 className="text-xs font-heading font-bold text-gray-500 uppercase tracking-wider mb-3">
                Equity
              </h5>
              {[
              {
                l: 'Share Capital',
                v: 40000000
              },
              {
                l: 'Retained Earnings',
                v: 11500000
              }].
              map((a) =>
              <div
                key={a.l}
                className="flex justify-between py-1.5 border-b border-gray-50">
                
                  <span className="text-sm text-gray-600">{a.l}</span>
                  <span className="text-sm font-medium text-gray-800">
                    {fmt(a.v)}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-2 mt-1">
                <span className="text-sm font-heading font-bold text-gray-900">
                  Total Equity
                </span>
                <span className="text-sm font-heading font-bold text-primary">
                  {fmt(51500000)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Branch Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <BuildingIcon size={16} />
              </div>
              <h4 className="text-sm font-heading font-bold text-gray-900">
                Branch Performance
              </h4>
            </div>
            <button
              onClick={() => showToast('Branch performance report generated')}
              className="text-xs font-heading font-bold text-primary hover:text-accent transition-colors">
              
              Generate Report
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider font-heading">
                  <th className="px-6 py-3 font-medium">Branch</th>
                  <th className="px-6 py-3 font-medium">Revenue</th>
                  <th className="px-6 py-3 font-medium">Expenses</th>
                  <th className="px-6 py-3 font-medium">Net</th>
                  <th className="px-6 py-3 font-medium">Loan Portfolio</th>
                  <th className="px-6 py-3 font-medium">Repayment Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                {
                  b: 'Mushin',
                  rev: 675000,
                  exp: 112000,
                  net: 563000,
                  port: '₦18.2M',
                  rate: '95.4%'
                },
                {
                  b: 'Ikeja',
                  rev: 562000,
                  exp: 98000,
                  net: 464000,
                  port: '₦12.5M',
                  rate: '97.2%'
                },
                {
                  b: 'Surulere',
                  rev: 488000,
                  exp: 85000,
                  net: 403000,
                  port: '₦8.4M',
                  rate: '96.8%'
                },
                {
                  b: 'Alaba',
                  rev: 452000,
                  exp: 78000,
                  net: 374000,
                  port: '₦6.5M',
                  rate: '98.1%'
                }].
                map((r) =>
                <tr
                  key={r.b}
                  className="hover:bg-gray-50/50 transition-colors">
                  
                    <td className="px-6 py-3 font-heading font-medium text-gray-900">
                      {r.b}
                    </td>
                    <td className="px-6 py-3 text-green-600">
                      {fmtFull(r.rev)}
                    </td>
                    <td className="px-6 py-3 text-red-600">{fmtFull(r.exp)}</td>
                    <td className="px-6 py-3 font-heading font-bold text-primary">
                      {fmtFull(r.net)}
                    </td>
                    <td className="px-6 py-3 text-gray-700">{r.port}</td>
                    <td className="px-6 py-3 text-gray-700">{r.rate}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>);

  }
  // ─── TAB: Reconciliation ────────────────────────────────────
  function renderReconciliation() {
    const matched = reconData.filter((r) => r.status === 'Matched');
    const unmatched = reconData.filter((r) => r.status === 'Unmatched');
    const pending = reconData.filter((r) => r.status === 'Pending');
    const matchedTotal = matched.reduce((s, r) => s + r.bankAmount, 0);
    const unmatchedTotal = unmatched.reduce(
      (s, r) => s + Math.abs(r.difference),
      0
    );
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-heading font-bold text-gray-900">
              Bank Reconciliation
            </h3>
            <p className="text-xs font-body text-gray-400 mt-0.5">
              Last reconciled: 12 Jun 2026
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                <CheckCircleIcon size={16} />
              </div>
              <p className="text-sm font-body text-gray-500">Matched Items</p>
            </div>
            <p className="text-2xl font-heading font-bold text-green-700">
              {matched.length}
            </p>
            <p className="text-xs font-body text-gray-400 mt-0.5">
              Total: {fmtFull(matchedTotal)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                <XCircleIcon size={16} />
              </div>
              <p className="text-sm font-body text-gray-500">Unmatched Items</p>
            </div>
            <p className="text-2xl font-heading font-bold text-red-600">
              {unmatched.length}
            </p>
            <p className="text-xs font-body text-gray-400 mt-0.5">
              Variance: {fmtFull(unmatchedTotal)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center text-yellow-600">
                <ClockIcon size={16} />
              </div>
              <p className="text-sm font-body text-gray-500">Pending Review</p>
            </div>
            <p className="text-2xl font-heading font-bold text-yellow-600">
              {pending.length}
            </p>
            <p className="text-xs font-body text-gray-400 mt-0.5">
              Awaiting confirmation
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider font-heading">
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Description</th>
                  <th className="px-6 py-3 font-medium">Bank Amount</th>
                  <th className="px-6 py-3 font-medium">System Amount</th>
                  <th className="px-6 py-3 font-medium">Difference</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {reconData.map((item) =>
                <tr
                  key={item.id}
                  className="hover:bg-gray-50/50 transition-colors">
                  
                    <td className="px-6 py-3 text-gray-600">
                      {fmtDate(item.date)}
                    </td>
                    <td className="px-6 py-3 text-gray-700">
                      {item.description}
                    </td>
                    <td className="px-6 py-3 font-medium text-gray-800">
                      {fmtFull(item.bankAmount)}
                    </td>
                    <td className="px-6 py-3 font-medium text-gray-800">
                      {fmtFull(item.systemAmount)}
                    </td>
                    <td
                    className={`px-6 py-3 font-heading font-bold ${item.difference === 0 ? 'text-green-600' : 'text-red-600'}`}>
                    
                      {item.difference === 0 ?
                    '—' :
                    (item.difference > 0 ? '+' : '') +
                    fmtFull(item.difference)}
                    </td>
                    <td className="px-6 py-3">
                      <span
                      className={`px-2 py-0.5 rounded-full text-xs font-heading font-medium border ${item.status === 'Matched' ? 'bg-green-100 text-green-700 border-green-200' : item.status === 'Unmatched' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                      
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      {(item.status === 'Unmatched' ||
                    item.status === 'Pending') &&
                    <button
                      onClick={() => markMatched(item.id)}
                      className="text-xs font-heading font-bold text-primary hover:text-accent transition-colors flex items-center gap-1 ml-auto">
                      
                          <LinkIcon size={12} /> Match
                        </button>
                    }
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>);

  }
  // ─── Main Render ────────────────────────────────────────────
  const tabContent: Record<FinTab, React.ReactNode> = {
    overview: renderOverview(),
    transactions: renderTransactions(),
    revenue: renderRevenue(),
    expenses: renderExpenses(),
    reports: renderReports(),
    reconciliation: renderReconciliation()
  };
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

      {/* Add Expense Modal */}
      <AnimatePresence>
        {expModal &&
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4">
          
            <div
            className="absolute inset-0 bg-black/40"
            onClick={closeExpenseModal} />
          
            <motion.div
            initial={{
              opacity: 0,
              scale: 0.95,
              y: 10
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
              y: 10
            }}
            transition={{
              duration: 0.2
            }}
            className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            
              <button
              onClick={closeExpenseModal}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
              
                <XIcon size={18} />
              </button>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                  <ReceiptIcon size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-heading font-bold text-gray-900">
                    Add Expense
                  </h3>
                  <p className="text-xs font-body text-gray-500">
                    Submit a new expense for approval
                  </p>
                </div>
              </div>
              <form onSubmit={expenseFormik.handleSubmit} className="space-y-4" noValidate>
                <div>
                  <label className="block text-xs font-body font-medium text-gray-600 mb-1.5">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                  id="category"
                  name="category"
                  value={expenseFormik.values.category}
                  onChange={expenseFormik.handleChange}
                  onBlur={expenseFormik.handleBlur}
                  className={selectClass}>
                  
                    {expCats.map((c) =>
                  <option key={c} value={c}>
                        {c}
                      </option>
                  )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-body font-medium text-gray-600 mb-1.5">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <input
                  id="description"
                  name="description"
                  type="text"
                  value={expenseFormik.values.description}
                  onChange={expenseFormik.handleChange}
                  onBlur={expenseFormik.handleBlur}
                  placeholder="e.g. Office supplies"
                  className={inputClass}
                  required />

                  {expenseFormik.touched.description && expenseFormik.errors.description &&
                  <p className="text-xs text-red-600 mt-1">{expenseFormik.errors.description}</p>
                  }
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-body font-medium text-gray-600 mb-1.5">
                      Amount <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                        ₦
                      </span>
                      <input
                      id="amount"
                      name="amount"
                      type="number"
                      value={expenseFormik.values.amount}
                      onChange={expenseFormik.handleChange}
                      onBlur={expenseFormik.handleBlur}
                      placeholder="0"
                      className={`${inputClass} pl-8`}
                      required />
                    
                    </div>
                  </div>

                  {expenseFormik.touched.amount && expenseFormik.errors.amount &&
                  <p className="text-xs text-red-600 mt-1">{expenseFormik.errors.amount}</p>
                  }
                  <div>
                    <label className="block text-xs font-body font-medium text-gray-600 mb-1.5">
                      Branch
                    </label>
                    <select
                    id="branch"
                    name="branch"
                    value={expenseFormik.values.branch}
                    onChange={expenseFormik.handleChange}
                    onBlur={expenseFormik.handleBlur}
                    className={selectClass}>
                    
                      {branches.
                    filter((b) => b !== 'All').
                    map((b) =>
                    <option key={b} value={b}>
                            {b}
                          </option>
                    )}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-body font-medium text-gray-600 mb-1.5">
                    Date
                  </label>
                  <input
                  id="date"
                  name="date"
                  type="date"
                  value={expenseFormik.values.date}
                  onChange={expenseFormik.handleChange}
                  onBlur={expenseFormik.handleBlur}
                  className={inputClass} />
                
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                  type="button"
                  onClick={closeExpenseModal}
                  className="px-4 py-2 text-sm font-heading font-bold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  
                    Cancel
                  </button>
                  <button
                  type="submit"
                  disabled={!expenseFormik.isValid}
                  className="px-4 py-2 text-sm font-heading font-bold bg-accent text-white rounded-lg hover:bg-[#e64a19] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  
                    Submit Expense
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        }
      </AnimatePresence>

      {/* Header */}
      <div>
        <h2 className="text-2xl font-heading font-bold text-primary">
          Financial Control (FinCon)
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Monitor revenue, expenses, and financial health
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="flex gap-1 min-w-max" aria-label="FinCon tabs">
          {finTabs.map((tab) =>
          <button
            key={tab.key}
            onClick={() => dispatch(setActiveTab(tab.key))}
            className={`flex items-center gap-1.5 px-4 pb-3 pt-1 text-sm font-heading font-bold transition-colors relative whitespace-nowrap ${activeTab === tab.key ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}>
            
              {tab.icon}
              {tab.label}
              {activeTab === tab.key &&
            <motion.div
              layoutId="fincon-tab-indicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />

            }
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
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
    </div>);

}
import React, { useEffect, useMemo, useState, Fragment } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftIcon,
  FileTextIcon,
  UsersIcon,
  GitBranchIcon,
  CalendarIcon,
  ClockIcon,
  BanknoteIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
  SendIcon,
  ShieldCheckIcon,
  CornerDownLeftIcon,
  FlagIcon,
  ArchiveIcon,
  CreditCardIcon,
  GavelIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FingerprintIcon
} from
  'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../app/api';
import { DisbursementFingerprintModal } from './DisbursementFingerprintModal';
import { LoanActionModals } from './LoanActionModals';
type LoanStatus =
  'Pending Review' |
  'Approved' |
  'Active' |
  'Disbursed' |
  'Overdue' |
  'Completed' |
  'Rejected';
type BadgeStatus =
  'Active' |
  'Pending' |
  'Pending Approval' |
  'Pending Review' |
  'Completed' |
  'Approved' |
  'Rejected' |
  'Overdue' |
  'Disbursed' |
  'Verified' |
  'Captured' |
  'On Leave' |
  'Suspended' |
  'Inactive' |
  'New';
type StageStatus = 'Approved' | 'Pending' | 'Rejected' | 'Skipped';
interface ApprovalStage {
  stage: string;
  role: string;
  status: StageStatus;
  reviewer: string;
  date: string;
  comments: string;
}
interface BorrowerPayment {
  name: string;
  id: string;
  amountDue: string;
  amountPaid: string;
  balance: string;
  status: 'Paid' | 'Pending' | 'Overdue';
}
interface RepaymentRow {
  number: number;
  dueDate: string;
  principal: string;
  interest: string;
  totalDue: string;
  amountPaid: string;
  balance: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  penalty?: string;
  borrowerPayments: BorrowerPayment[];
}
interface Borrower {
  name: string;
  id: string;
  share: string;
  bvn: string;
  biometric: string;
}
interface LoanData {
  id: string;
  backendId?: string;
  status: LoanStatus;
  loanProductType?: string;
  group: {
    name: string;
    id: string;
    leader: string;
    members: number;
    status: string;
  };
  branch: string;
  amount: string;
  amountApproved: string;
  interestRate: string;
  tenure: string;
  repaymentFrequency: string;
  gracePeriod: string;
  processingFee?: string;
  monthlyRepayment: string;
  outstanding: string;
  purpose: string;
  initiationRemarks?: string;
  dateApplied: string;
  dateApproved: string;
  dateDisbursed: string;
  firstPaymentDate: string;
  maturityDate: string;
  totalInterest: string;
  totalRepayable: string;
  borrowers: Borrower[];
  approvalWorkflow: ApprovalStage[];
  repaymentSchedule: RepaymentRow[];
  disbursement: {
    id: string;
    date: string;
    method: string;
    bank: string;
    account: string;
    amount: string;
    disbursedBy: string;
    reference: string;
  } | null;
  activity: {
    action: string;
    date: string;
    by: string;
  }[];
}

interface SelectedLoanSummary {
  id: string;
  loanCode: string;
  principalAmount: number;
  interestRate: number;
  tenorWeeks: number;
  processingFee: number;
  status: string;
  loanProductType?: string;
  repaymentFrequency?: string;
  gracePeriod?: string;
  firstPaymentDate?: string;
  maturityDate?: string;
  purpose?: string;
  remarks?: string;
  initiationDate?: string;
  disbursedDate?: string;
  createdAt?: string;
  dueDate?: string;
}

function extractInitiationRemarks(rawLoan: Record<string, unknown>): string {
  const directRemarks =
    typeof rawLoan.initiationRemarks === 'string' ? rawLoan.initiationRemarks.trim() : '';
  if (directRemarks.length > 0) {
    return directRemarks;
  }

  const approvalTrail = rawLoan.approvalTrail;
  if (!Array.isArray(approvalTrail)) {
    return '-';
  }

  const initiationEntry = approvalTrail.find((entry) => {
    if (!entry || typeof entry !== 'object') {
      return false;
    }

    const item = entry as Record<string, unknown>;
    return item.stage === 'Initiation' && item.action === 'Submitted' && typeof item.remarks === 'string';
  }) as Record<string, unknown> | undefined;

  const remarks = typeof initiationEntry?.remarks === 'string' ? initiationEntry.remarks.trim() : '';
  return remarks || '-';
}

function extractLoanProductType(rawLoan: Record<string, unknown>, initiationRemarks: string): string {
  const directLabel =
    (typeof rawLoan.loanProductType === 'string' && rawLoan.loanProductType.trim()) ||
    (typeof rawLoan.loanProductName === 'string' && rawLoan.loanProductName.trim()) ||
    (typeof rawLoan.productType === 'string' && rawLoan.productType.trim()) ||
    '';

  if (directLabel) {
    return directLabel;
  }

  const match = initiationRemarks.match(/loan\s*product\s*:\s*([^,]+)/i);
  if (match && typeof match[1] === 'string' && match[1].trim().length > 0) {
    return match[1].trim();
  }

  return '-';
}

interface LoanDetailLocationState {
  selectedLoan?: SelectedLoanSummary;
  customerBackendId?: string | null;
  customerName?: string;
}

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

function toCurrency(value: unknown): string {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return '₦0';
  }

  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(numeric);
}

function toUiDate(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return '-';
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString().slice(0, 10);
}

function toLoanStatus(value: unknown): LoanStatus {
  if (typeof value !== 'string') {
    return 'Pending Review';
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'pending review' || normalized === 'pending' || normalized === 'submitted') {
    return 'Pending Review';
  }
  if (normalized === 'approved') {
    return 'Approved';
  }
  if (normalized === 'disbursed') {
    return 'Disbursed';
  }
  if (normalized === 'active' || normalized === 'active repayment') {
    return 'Active';
  }
  if (normalized === 'completed' || normalized === 'paid' || normalized === 'closed') {
    return 'Completed';
  }
  if (normalized === 'overdue' || normalized === 'defaulted') {
    return 'Overdue';
  }
  if (normalized === 'rejected') {
    return 'Rejected';
  }

  return 'Pending Review';
}

function mapSelectedLoanToLoanData(selected: SelectedLoanSummary): LoanData {
  const computedTotalInterest = (selected.principalAmount * selected.interestRate) / 100;
  const computedTotalRepayable = selected.principalAmount + computedTotalInterest;

  return {
    id: selected.loanCode || selected.id,
    backendId: selected.id,
    status: toLoanStatus(selected.status),
    loanProductType: selected.loanProductType ?? '-',
    group: {
      name: '-',
      id: '-',
      leader: '-',
      members: 0,
      status: '-',
    },
    branch: '-',
    amount: toCurrency(selected.principalAmount),
    amountApproved: toCurrency(selected.principalAmount),
    interestRate: `${selected.interestRate}%`,
    tenure: `${selected.tenorWeeks} weeks`,
    repaymentFrequency: selected.repaymentFrequency ?? '-',
    gracePeriod: selected.gracePeriod ?? '-',
    processingFee: toCurrency(selected.processingFee),
    monthlyRepayment: '-',
    outstanding: '-',
    purpose: selected.purpose ?? '-',
    initiationRemarks: selected.remarks ?? '-',
    dateApplied: toUiDate(selected.initiationDate ?? selected.createdAt),
    dateApproved: '-',
    dateDisbursed: toUiDate(selected.disbursedDate),
    firstPaymentDate: toUiDate(selected.firstPaymentDate),
    maturityDate: toUiDate(selected.maturityDate ?? selected.dueDate),
    totalInterest: toCurrency(computedTotalInterest),
    totalRepayable: toCurrency(computedTotalRepayable),
    borrowers: [],
    approvalWorkflow: [],
    repaymentSchedule: [],
    disbursement: null,
    activity: [],
  };
}

function mapBackendLoanToLoanData(rawLoan: Record<string, unknown>): LoanData {
  const rawGroup =
    rawLoan.group && typeof rawLoan.group === 'object'
      ? (rawLoan.group as Record<string, unknown>)
      : rawLoan.groupId && typeof rawLoan.groupId === 'object'
        ? (rawLoan.groupId as Record<string, unknown>)
        : undefined;
  const rawBranch =
    rawLoan.branch && typeof rawLoan.branch === 'object' ? (rawLoan.branch as Record<string, unknown>) : undefined;
  const rawLoanBranch =
    rawLoan.branchId && typeof rawLoan.branchId === 'object' ? (rawLoan.branchId as Record<string, unknown>) : undefined;
  const rawGroupBranch =
    rawGroup?.branch && typeof rawGroup.branch === 'object'
      ? (rawGroup.branch as Record<string, unknown>)
      : rawGroup?.branchId && typeof rawGroup.branchId === 'object'
        ? (rawGroup.branchId as Record<string, unknown>)
        : undefined;
  const rawGroupLeader =
    rawGroup?.leader && typeof rawGroup.leader === 'object'
      ? (rawGroup.leader as Record<string, unknown>)
      : rawGroup?.marketer && typeof rawGroup.marketer === 'object'
        ? (rawGroup.marketer as Record<string, unknown>)
        : rawGroup?.marketerId && typeof rawGroup.marketerId === 'object'
          ? (rawGroup.marketerId as Record<string, unknown>)
          : undefined;
  const rawDisbursement = rawLoan.disbursement as Record<string, unknown> | undefined;
  const initiationRemarks = extractInitiationRemarks(rawLoan);
  const loanProductType = extractLoanProductType(rawLoan, initiationRemarks);
  const principalAmount = Number(rawLoan.amount ?? rawLoan.principalAmount);
  const interestRate = Number(rawLoan.interestRate);
  const storedTotalInterest = Number(rawLoan.totalInterest);
  const computedTotalInterest =
    Number.isFinite(principalAmount) && Number.isFinite(interestRate)
      ? (principalAmount * interestRate) / 100
      : 0;
  const normalizedTotalInterest = Number.isFinite(storedTotalInterest) ? storedTotalInterest : computedTotalInterest;
  const storedTotalRepayable = Number(rawLoan.totalRepayable);
  const normalizedTotalRepayable =
    Number.isFinite(storedTotalRepayable)
      ? storedTotalRepayable
      : (Number.isFinite(principalAmount) ? principalAmount : 0) + normalizedTotalInterest;

  const groupName =
    (typeof rawGroup?.name === 'string' && rawGroup.name.trim()) ||
    (typeof rawGroup?.groupName === 'string' && rawGroup.groupName.trim()) ||
    (typeof rawLoan.groupName === 'string' && rawLoan.groupName.trim()) ||
    '-';
  const groupId = String(rawGroup?.id ?? rawGroup?._id ?? rawLoan.groupId ?? rawLoan.groupCode ?? '-');
  const groupLeader =
    (typeof rawGroup?.leader === 'string' && rawGroup.leader.trim()) ||
    (typeof rawLoan.groupLeader === 'string' && rawLoan.groupLeader.trim()) ||
    (typeof rawGroupLeader?.name === 'string' && rawGroupLeader.name.trim()) ||
    [rawGroupLeader?.firstName, rawGroupLeader?.lastName]
      .filter((segment): segment is string => typeof segment === 'string' && segment.trim().length > 0)
      .join(' ') ||
    '-';
  const groupMembers =
    typeof rawGroup?.members === 'number'
      ? rawGroup.members
      : typeof rawLoan.groupMembers === 'number'
        ? rawLoan.groupMembers
      : Array.isArray(rawGroup?.members)
        ? rawGroup.members.length
        : Array.isArray(rawLoan.borrowers)
          ? rawLoan.borrowers.length
          : 0;
  const groupStatus =
    (typeof rawGroup?.status === 'string' && rawGroup.status.trim()) ||
    (typeof rawLoan.groupStatus === 'string' && rawLoan.groupStatus.trim()) ||
    (typeof rawGroup?.isActive === 'boolean' ? (rawGroup.isActive ? 'Active' : 'Inactive') : '') ||
    '-';
  const branchName =
    (typeof rawLoan.branch === 'string' && rawLoan.branch.trim()) ||
    (typeof rawLoan.branchName === 'string' && rawLoan.branchName.trim()) ||
    (typeof rawBranch?.name === 'string' && rawBranch.name.trim()) ||
    (typeof rawGroupBranch?.name === 'string' && rawGroupBranch.name.trim()) ||
    (typeof rawLoanBranch?.name === 'string' && rawLoanBranch.name.trim()) ||
    '-';

  return {
    id: String(rawLoan.loanCode ?? rawLoan.id ?? rawLoan._id ?? '-'),
    backendId: String(rawLoan.id ?? rawLoan._id ?? ''),
    status: toLoanStatus(rawLoan.status),
    loanProductType,
    group: {
      name: groupName,
      id: groupId,
      leader: groupLeader,
      members: groupMembers,
      status: groupStatus,
    },
    branch: branchName,
    amount: toCurrency(rawLoan.amount ?? rawLoan.principalAmount),
    amountApproved: toCurrency(rawLoan.amountApproved ?? rawLoan.principalAmount),
    interestRate: typeof rawLoan.interestRate === 'string' ? rawLoan.interestRate : `${Number(rawLoan.interestRate ?? 0)}%`,
    tenure: String(rawLoan.tenure ?? `${Number(rawLoan.tenorWeeks ?? 0)} weeks`),
    repaymentFrequency: String(rawLoan.repaymentFrequency ?? '-'),
    gracePeriod: String(rawLoan.gracePeriod ?? `${Number(rawLoan.gracePeriodDays ?? 0)} days`),
    processingFee: toCurrency(rawLoan.processingFee),
    monthlyRepayment: toCurrency(rawLoan.monthlyRepayment),
    outstanding: toCurrency(rawLoan.outstanding),
    purpose: String(rawLoan.purpose ?? '-'),
    initiationRemarks,
    dateApplied: toUiDate(rawLoan.dateApplied ?? rawLoan.initiationDate ?? rawLoan.createdAt),
    dateApproved: toUiDate(rawLoan.dateApproved),
    dateDisbursed: toUiDate(rawLoan.dateDisbursed ?? rawLoan.disbursedDate),
    firstPaymentDate: toUiDate(rawLoan.firstPaymentDate),
    maturityDate: toUiDate(rawLoan.maturityDate ?? rawLoan.dueDate),
    totalInterest: toCurrency(normalizedTotalInterest),
    totalRepayable: toCurrency(normalizedTotalRepayable),
    borrowers: Array.isArray(rawLoan.borrowers) ? (rawLoan.borrowers as Borrower[]) : [],
    approvalWorkflow: Array.isArray(rawLoan.approvalWorkflow) ? (rawLoan.approvalWorkflow as ApprovalStage[]) : [],
    repaymentSchedule: Array.isArray(rawLoan.repaymentSchedule) ? (rawLoan.repaymentSchedule as RepaymentRow[]) : [],
    disbursement:
      rawDisbursement && typeof rawDisbursement === 'object'
        ? {
          id: String(rawDisbursement.id ?? '-'),
          date: toUiDate(rawDisbursement.date),
          method: String(rawDisbursement.method ?? '-'),
          bank: String(rawDisbursement.bank ?? '-'),
          account: String(rawDisbursement.account ?? '-'),
          amount: toCurrency(rawDisbursement.amount),
          disbursedBy: String(rawDisbursement.disbursedBy ?? '-'),
          reference: String(rawDisbursement.reference ?? '-'),
        }
        : null,
    activity: Array.isArray(rawLoan.activity)
      ? (rawLoan.activity as Array<Record<string, unknown>>).map((entry) => ({
        action: String(entry.action ?? '-'),
        date: toUiDate(entry.date),
        by: String(entry.by ?? '-'),
      }))
      : [],
  };
}
const mockLoans: Record<string, LoanData> = {
  'LN-0023': {
    id: 'LN-0023',
    status: 'Active',
    group: {
      name: 'Iya Oloja Market Women',
      id: 'GRP-001',
      leader: 'Alhaja Aminat',
      members: 15,
      status: 'Active'
    },
    branch: 'Surulere Branch',
    amount: '₦450,000',
    amountApproved: '₦450,000',
    interestRate: '24%',
    tenure: '6 months',
    repaymentFrequency: 'Monthly',
    gracePeriod: '7 days',
    monthlyRepayment: '₦84,000',
    outstanding: '₦252,000',
    purpose: 'Working capital for market trading',
    dateApplied: '2024-12-20',
    dateApproved: '2025-01-05',
    dateDisbursed: '2025-01-15',
    firstPaymentDate: '2025-02-15',
    maturityDate: '2025-07-15',
    totalInterest: '₦54,000',
    totalRepayable: '₦504,000',
    borrowers: [
      {
        name: 'Folake Adeyemi',
        id: 'CUS-001',
        share: '₦30,000',
        bvn: 'Verified',
        biometric: 'Captured'
      },
      {
        name: 'Alhaja Aminat',
        id: 'CUS-004',
        share: '₦40,000',
        bvn: 'Verified',
        biometric: 'Captured'
      },
      {
        name: 'Blessing Nwosu',
        id: 'CUS-003',
        share: '₦30,000',
        bvn: 'Verified',
        biometric: 'Captured'
      }],

    approvalWorkflow: [
      {
        stage: 'Branch Review',
        role: 'Manager',
        status: 'Approved',
        reviewer: 'Emeka Nnamdi',
        date: '2024-12-22',
        comments: 'Group has good repayment history. Recommended.'
      },
      {
        stage: 'Authorization',
        role: 'Authorizer',
        status: 'Approved',
        reviewer: 'Chukwuma Okonkwo',
        date: '2024-12-28',
        comments: 'All KYC verified. Approved.'
      },
      {
        stage: 'Final Approval',
        role: 'Super Admin',
        status: 'Approved',
        reviewer: 'Adebayo Johnson',
        date: '2025-01-05',
        comments: 'Approved for disbursement.'
      }],

    repaymentSchedule: [
      {
        number: 1,
        dueDate: '2025-02-15',
        principal: '₦66,000',
        interest: '₦9,000',
        totalDue: '₦84,000',
        amountPaid: '₦84,000',
        balance: '₦0',
        status: 'Paid',
        borrowerPayments: [
          {
            name: 'Folake Adeyemi',
            id: 'CUS-001',
            amountDue: '₦25,200',
            amountPaid: '₦25,200',
            balance: '₦0',
            status: 'Paid'
          },
          {
            name: 'Alhaja Aminat',
            id: 'CUS-004',
            amountDue: '₦33,600',
            amountPaid: '₦33,600',
            balance: '₦0',
            status: 'Paid'
          },
          {
            name: 'Blessing Nwosu',
            id: 'CUS-003',
            amountDue: '₦25,200',
            amountPaid: '₦25,200',
            balance: '₦0',
            status: 'Paid'
          }]

      },
      {
        number: 2,
        dueDate: '2025-03-15',
        principal: '₦67,320',
        interest: '₦7,680',
        totalDue: '₦84,000',
        amountPaid: '₦84,000',
        balance: '₦0',
        status: 'Paid',
        borrowerPayments: [
          {
            name: 'Folake Adeyemi',
            id: 'CUS-001',
            amountDue: '₦25,200',
            amountPaid: '₦25,200',
            balance: '₦0',
            status: 'Paid'
          },
          {
            name: 'Alhaja Aminat',
            id: 'CUS-004',
            amountDue: '₦33,600',
            amountPaid: '₦33,600',
            balance: '₦0',
            status: 'Paid'
          },
          {
            name: 'Blessing Nwosu',
            id: 'CUS-003',
            amountDue: '₦25,200',
            amountPaid: '₦25,200',
            balance: '₦0',
            status: 'Paid'
          }]

      },
      {
        number: 3,
        dueDate: '2025-04-15',
        principal: '₦68,666',
        interest: '₦6,334',
        totalDue: '₦84,000',
        amountPaid: '₦84,000',
        balance: '₦0',
        status: 'Paid',
        borrowerPayments: [
          {
            name: 'Folake Adeyemi',
            id: 'CUS-001',
            amountDue: '₦25,200',
            amountPaid: '₦25,200',
            balance: '₦0',
            status: 'Paid'
          },
          {
            name: 'Alhaja Aminat',
            id: 'CUS-004',
            amountDue: '₦33,600',
            amountPaid: '₦33,600',
            balance: '₦0',
            status: 'Paid'
          },
          {
            name: 'Blessing Nwosu',
            id: 'CUS-003',
            amountDue: '₦25,200',
            amountPaid: '₦25,200',
            balance: '₦0',
            status: 'Paid'
          }]

      },
      {
        number: 4,
        dueDate: '2025-05-15',
        principal: '₦70,040',
        interest: '₦4,960',
        totalDue: '₦84,000',
        amountPaid: '₦0',
        balance: '₦84,000',
        status: 'Pending',
        borrowerPayments: [
          {
            name: 'Folake Adeyemi',
            id: 'CUS-001',
            amountDue: '₦25,200',
            amountPaid: '₦0',
            balance: '₦25,200',
            status: 'Pending'
          },
          {
            name: 'Alhaja Aminat',
            id: 'CUS-004',
            amountDue: '₦33,600',
            amountPaid: '₦0',
            balance: '₦33,600',
            status: 'Pending'
          },
          {
            name: 'Blessing Nwosu',
            id: 'CUS-003',
            amountDue: '₦25,200',
            amountPaid: '₦0',
            balance: '₦25,200',
            status: 'Pending'
          }]

      },
      {
        number: 5,
        dueDate: '2025-06-15',
        principal: '₦71,441',
        interest: '₦3,559',
        totalDue: '₦84,000',
        amountPaid: '₦0',
        balance: '₦84,000',
        status: 'Pending',
        borrowerPayments: [
          {
            name: 'Folake Adeyemi',
            id: 'CUS-001',
            amountDue: '₦25,200',
            amountPaid: '₦0',
            balance: '₦25,200',
            status: 'Pending'
          },
          {
            name: 'Alhaja Aminat',
            id: 'CUS-004',
            amountDue: '₦33,600',
            amountPaid: '₦0',
            balance: '₦33,600',
            status: 'Pending'
          },
          {
            name: 'Blessing Nwosu',
            id: 'CUS-003',
            amountDue: '₦25,200',
            amountPaid: '₦0',
            balance: '₦25,200',
            status: 'Pending'
          }]

      },
      {
        number: 6,
        dueDate: '2025-07-15',
        principal: '₦72,533',
        interest: '₦2,467',
        totalDue: '₦84,000',
        amountPaid: '₦0',
        balance: '₦84,000',
        status: 'Pending',
        borrowerPayments: [
          {
            name: 'Folake Adeyemi',
            id: 'CUS-001',
            amountDue: '₦25,200',
            amountPaid: '₦0',
            balance: '₦25,200',
            status: 'Pending'
          },
          {
            name: 'Alhaja Aminat',
            id: 'CUS-004',
            amountDue: '₦33,600',
            amountPaid: '₦0',
            balance: '₦33,600',
            status: 'Pending'
          },
          {
            name: 'Blessing Nwosu',
            id: 'CUS-003',
            amountDue: '₦25,200',
            amountPaid: '₦0',
            balance: '₦25,200',
            status: 'Pending'
          }]

      }],

    disbursement: {
      id: 'DIS-1042',
      date: '2025-01-15',
      method: 'Bank Transfer',
      bank: 'First Bank',
      account: '****4521',
      amount: '₦450,000',
      disbursedBy: 'Adebayo Johnson',
      reference: 'FBN-TRF-20250115-0042'
    },
    activity: [
      {
        action: 'Repayment of ₦84,000 received — Payment #3',
        date: '2025-04-15',
        by: 'System'
      },
      {
        action: 'Repayment of ₦84,000 received — Payment #2',
        date: '2025-03-15',
        by: 'System'
      },
      {
        action: 'Repayment of ₦84,000 received — Payment #1',
        date: '2025-02-15',
        by: 'System'
      },
      {
        action: 'Disbursed ₦450,000 via Bank Transfer to First Bank ****4521',
        date: '2025-01-15',
        by: 'Adebayo Johnson'
      },
      {
        action: 'Final approval granted',
        date: '2025-01-05',
        by: 'Adebayo Johnson'
      },
      {
        action: 'Authorization approved',
        date: '2024-12-28',
        by: 'Chukwuma Okonkwo'
      },
      {
        action: 'Branch review completed — Recommended',
        date: '2024-12-22',
        by: 'Emeka Nnamdi'
      },
      {
        action: 'Application submitted via mobile app',
        date: '2024-12-20',
        by: 'Marketer Adebayo'
      }]

  },
  'APP-2026-089': {
    id: 'APP-2026-089',
    status: 'Pending Review',
    group: {
      name: 'Alaba Traders Union',
      id: 'GRP-002',
      leader: 'Chinedu Eze',
      members: 10,
      status: 'Active'
    },
    branch: 'Alaba Branch',
    amount: '₦200,000',
    amountApproved: '-',
    interestRate: '24%',
    tenure: '3 months',
    repaymentFrequency: 'Monthly',
    gracePeriod: '7 days',
    monthlyRepayment: '₦70,667',
    outstanding: '₦200,000',
    purpose: 'Bulk purchase of electronics for resale',
    dateApplied: '2026-06-14',
    dateApproved: '-',
    dateDisbursed: '-',
    firstPaymentDate: '-',
    maturityDate: '-',
    totalInterest: '₦12,000',
    totalRepayable: '₦212,000',
    borrowers: [
      {
        name: 'Emeka Obi',
        id: 'CUS-002',
        share: '₦20,000',
        bvn: 'Pending',
        biometric: 'Pending'
      },
      {
        name: 'Chinedu Eze',
        id: 'CUS-005',
        share: '₦25,000',
        bvn: 'Verified',
        biometric: 'Captured'
      }],

    approvalWorkflow: [
      {
        stage: 'Branch Review',
        role: 'Manager',
        status: 'Approved',
        reviewer: 'Fatima Abubakar',
        date: '2026-06-15',
        comments: 'New group, first loan. Proceed with caution.'
      },
      {
        stage: 'Authorization',
        role: 'Authorizer',
        status: 'Pending',
        reviewer: '-',
        date: '-',
        comments: ''
      },
      {
        stage: 'Final Approval',
        role: 'Super Admin',
        status: 'Skipped',
        reviewer: '-',
        date: '-',
        comments: ''
      }],

    repaymentSchedule: [],
    disbursement: null,
    activity: [
      {
        action: 'Branch review completed — Recommended with caution',
        date: '2026-06-15',
        by: 'Fatima Abubakar'
      },
      {
        action: 'Application submitted via mobile app',
        date: '2026-06-14',
        by: 'Marketer Bola'
      }]

  },
  'APP-2026-090': {
    id: 'APP-2026-090',
    status: 'Pending Review',
    group: {
      name: 'Oshodi Market Vendors',
      id: 'GRP-005',
      leader: 'Iya Basira',
      members: 8,
      status: 'Active'
    },
    branch: 'Ikeja Branch',
    amount: '₦300,000',
    amountApproved: '-',
    interestRate: '24%',
    tenure: '6 months',
    repaymentFrequency: 'Monthly',
    gracePeriod: '7 days',
    monthlyRepayment: '₦56,000',
    outstanding: '₦300,000',
    purpose: 'Market stall renovation and stock purchase',
    dateApplied: '2026-06-15',
    dateApproved: '-',
    dateDisbursed: '-',
    firstPaymentDate: '-',
    maturityDate: '-',
    totalInterest: '₦36,000',
    totalRepayable: '₦336,000',
    borrowers: [
      {
        name: 'Iya Basira',
        id: 'CUS-006',
        share: '₦50,000',
        bvn: 'Verified',
        biometric: 'Captured'
      },
      {
        name: 'Amina Yusuf',
        id: 'CUS-007',
        share: '₦30,000',
        bvn: 'Verified',
        biometric: 'Captured'
      }],

    approvalWorkflow: [
      {
        stage: 'Branch Review',
        role: 'Manager',
        status: 'Approved',
        reviewer: 'Fatima Abubakar',
        date: '2026-06-16',
        comments: 'Existing group with good track record.'
      },
      {
        stage: 'Authorization',
        role: 'Authorizer',
        status: 'Approved',
        reviewer: 'Chukwuma Okonkwo',
        date: '2026-06-17',
        comments: 'KYC complete. Approved.'
      },
      {
        stage: 'Final Approval',
        role: 'Super Admin',
        status: 'Pending',
        reviewer: '-',
        date: '-',
        comments: ''
      }],

    repaymentSchedule: [],
    disbursement: null,
    activity: [
      {
        action: 'Authorization approved',
        date: '2026-06-17',
        by: 'Chukwuma Okonkwo'
      },
      {
        action: 'Branch review completed — Recommended',
        date: '2026-06-16',
        by: 'Fatima Abubakar'
      },
      {
        action: 'Application submitted via mobile app',
        date: '2026-06-15',
        by: 'Marketer Segun'
      }]

  },
  'LN-0028': {
    id: 'LN-0028',
    status: 'Overdue',
    group: {
      name: 'Surulere Youth Coop',
      id: 'GRP-003',
      leader: 'Oluwaseun Ade',
      members: 25,
      status: 'Active'
    },
    branch: 'Surulere Branch',
    amount: '₦1,200,000',
    amountApproved: '₦1,200,000',
    interestRate: '24%',
    tenure: '12 months',
    repaymentFrequency: 'Monthly',
    gracePeriod: '7 days',
    monthlyRepayment: '₦112,000',
    outstanding: '₦896,000',
    purpose: 'Youth cooperative business expansion',
    dateApplied: '2024-11-10',
    dateApproved: '2024-12-01',
    dateDisbursed: '2024-12-15',
    firstPaymentDate: '2025-01-15',
    maturityDate: '2025-12-15',
    totalInterest: '₦144,000',
    totalRepayable: '₦1,344,000',
    borrowers: [
      {
        name: 'Oluwaseun Ade',
        id: 'CUS-008',
        share: '₦60,000',
        bvn: 'Verified',
        biometric: 'Captured'
      },
      {
        name: 'Blessing Nwosu',
        id: 'CUS-003',
        share: '₦48,000',
        bvn: 'Verified',
        biometric: 'Captured'
      },
      {
        name: 'Tunde Bakare',
        id: 'CUS-009',
        share: '₦52,000',
        bvn: 'Verified',
        biometric: 'Captured'
      }],

    approvalWorkflow: [
      {
        stage: 'Branch Review',
        role: 'Manager',
        status: 'Approved',
        reviewer: 'Emeka Nnamdi',
        date: '2024-11-15',
        comments: 'Large group, strong leadership.'
      },
      {
        stage: 'Authorization',
        role: 'Authorizer',
        status: 'Approved',
        reviewer: 'Chukwuma Okonkwo',
        date: '2024-11-22',
        comments: 'Approved.'
      },
      {
        stage: 'Final Approval',
        role: 'Super Admin',
        status: 'Approved',
        reviewer: 'Adebayo Johnson',
        date: '2024-12-01',
        comments: 'Approved for disbursement.'
      }],

    repaymentSchedule: [
      {
        number: 1,
        dueDate: '2025-01-15',
        principal: '₦88,000',
        interest: '₦24,000',
        totalDue: '₦112,000',
        amountPaid: '₦112,000',
        balance: '₦0',
        status: 'Paid',
        borrowerPayments: [
          {
            name: 'Oluwaseun Ade',
            id: 'CUS-008',
            amountDue: '₦44,800',
            amountPaid: '₦44,800',
            balance: '₦0',
            status: 'Paid'
          },
          {
            name: 'Blessing Nwosu',
            id: 'CUS-003',
            amountDue: '₦35,840',
            amountPaid: '₦35,840',
            balance: '₦0',
            status: 'Paid'
          },
          {
            name: 'Tunde Bakare',
            id: 'CUS-009',
            amountDue: '₦31,360',
            amountPaid: '₦31,360',
            balance: '₦0',
            status: 'Paid'
          }]

      },
      {
        number: 2,
        dueDate: '2025-02-15',
        principal: '₦89,760',
        interest: '₦22,240',
        totalDue: '₦112,000',
        amountPaid: '₦112,000',
        balance: '₦0',
        status: 'Paid',
        borrowerPayments: [
          {
            name: 'Oluwaseun Ade',
            id: 'CUS-008',
            amountDue: '₦44,800',
            amountPaid: '₦44,800',
            balance: '₦0',
            status: 'Paid'
          },
          {
            name: 'Blessing Nwosu',
            id: 'CUS-003',
            amountDue: '₦35,840',
            amountPaid: '₦35,840',
            balance: '₦0',
            status: 'Paid'
          },
          {
            name: 'Tunde Bakare',
            id: 'CUS-009',
            amountDue: '₦31,360',
            amountPaid: '₦31,360',
            balance: '₦0',
            status: 'Paid'
          }]

      },
      {
        number: 3,
        dueDate: '2025-03-15',
        principal: '₦91,555',
        interest: '₦20,445',
        totalDue: '₦112,000',
        amountPaid: '₦112,000',
        balance: '₦0',
        status: 'Paid',
        borrowerPayments: [
          {
            name: 'Oluwaseun Ade',
            id: 'CUS-008',
            amountDue: '₦44,800',
            amountPaid: '₦44,800',
            balance: '₦0',
            status: 'Paid'
          },
          {
            name: 'Blessing Nwosu',
            id: 'CUS-003',
            amountDue: '₦35,840',
            amountPaid: '₦35,840',
            balance: '₦0',
            status: 'Paid'
          },
          {
            name: 'Tunde Bakare',
            id: 'CUS-009',
            amountDue: '₦31,360',
            amountPaid: '₦31,360',
            balance: '₦0',
            status: 'Paid'
          }]

      },
      {
        number: 4,
        dueDate: '2025-04-15',
        principal: '₦93,386',
        interest: '₦18,614',
        totalDue: '₦112,000',
        amountPaid: '₦0',
        balance: '₦112,000',
        status: 'Overdue',
        penalty: '₦2,800',
        borrowerPayments: [
          {
            name: 'Oluwaseun Ade',
            id: 'CUS-008',
            amountDue: '₦44,800',
            amountPaid: '₦0',
            balance: '₦44,800',
            status: 'Overdue'
          },
          {
            name: 'Blessing Nwosu',
            id: 'CUS-003',
            amountDue: '₦35,840',
            amountPaid: '₦0',
            balance: '₦35,840',
            status: 'Overdue'
          },
          {
            name: 'Tunde Bakare',
            id: 'CUS-009',
            amountDue: '₦31,360',
            amountPaid: '₦0',
            balance: '₦31,360',
            status: 'Overdue'
          }]

      },
      {
        number: 5,
        dueDate: '2025-05-15',
        principal: '₦95,254',
        interest: '₦16,746',
        totalDue: '₦112,000',
        amountPaid: '₦0',
        balance: '₦112,000',
        status: 'Overdue',
        penalty: '₦2,800',
        borrowerPayments: [
          {
            name: 'Oluwaseun Ade',
            id: 'CUS-008',
            amountDue: '₦44,800',
            amountPaid: '₦0',
            balance: '₦44,800',
            status: 'Overdue'
          },
          {
            name: 'Blessing Nwosu',
            id: 'CUS-003',
            amountDue: '₦35,840',
            amountPaid: '₦15,000',
            balance: '₦20,840',
            status: 'Overdue'
          },
          {
            name: 'Tunde Bakare',
            id: 'CUS-009',
            amountDue: '₦31,360',
            amountPaid: '₦0',
            balance: '₦31,360',
            status: 'Overdue'
          }]

      },
      {
        number: 6,
        dueDate: '2025-06-15',
        principal: '₦97,159',
        interest: '₦14,841',
        totalDue: '₦112,000',
        amountPaid: '₦0',
        balance: '₦112,000',
        status: 'Pending',
        borrowerPayments: [
          {
            name: 'Oluwaseun Ade',
            id: 'CUS-008',
            amountDue: '₦44,800',
            amountPaid: '₦0',
            balance: '₦44,800',
            status: 'Pending'
          },
          {
            name: 'Blessing Nwosu',
            id: 'CUS-003',
            amountDue: '₦35,840',
            amountPaid: '₦0',
            balance: '₦35,840',
            status: 'Pending'
          },
          {
            name: 'Tunde Bakare',
            id: 'CUS-009',
            amountDue: '₦31,360',
            amountPaid: '₦0',
            balance: '₦31,360',
            status: 'Pending'
          }]

      }],

    disbursement: {
      id: 'DIS-1039',
      date: '2024-12-15',
      method: 'Bank Transfer',
      bank: 'GTBank',
      account: '****7832',
      amount: '₦1,200,000',
      disbursedBy: 'Adebayo Johnson',
      reference: 'GTB-TRF-20241215-1039'
    },
    activity: [
      {
        action: 'Late payment penalty of ₦2,800 applied — Payment #5',
        date: '2025-05-22',
        by: 'System'
      },
      {
        action: 'Late payment penalty of ₦2,800 applied — Payment #4',
        date: '2025-04-22',
        by: 'System'
      },
      {
        action: 'Repayment of ₦112,000 received — Payment #3',
        date: '2025-03-15',
        by: 'System'
      },
      {
        action: 'Repayment of ₦112,000 received — Payment #2',
        date: '2025-02-15',
        by: 'System'
      },
      {
        action: 'Repayment of ₦112,000 received — Payment #1',
        date: '2025-01-15',
        by: 'System'
      },
      {
        action: 'Disbursed ₦1,200,000 via Bank Transfer to GTBank ****7832',
        date: '2024-12-15',
        by: 'Adebayo Johnson'
      },
      {
        action: 'Final approval granted',
        date: '2024-12-01',
        by: 'Adebayo Johnson'
      },
      {
        action: 'Application submitted via mobile app',
        date: '2024-11-10',
        by: 'Marketer Segun'
      }]

  },
  'LN-0011': {
    id: 'LN-0011',
    status: 'Completed',
    group: {
      name: 'Mushin Artisans Group',
      id: 'GRP-004',
      leader: 'Baba Tunde',
      members: 12,
      status: 'Active'
    },
    branch: 'Mushin Branch',
    amount: '₦850,000',
    amountApproved: '₦850,000',
    interestRate: '24%',
    tenure: '6 months',
    repaymentFrequency: 'Monthly',
    gracePeriod: '7 days',
    monthlyRepayment: '₦159,167',
    outstanding: '₦0',
    purpose: 'Artisan tools and workshop equipment',
    dateApplied: '2024-06-01',
    dateApproved: '2024-06-15',
    dateDisbursed: '2024-06-20',
    firstPaymentDate: '2024-07-20',
    maturityDate: '2024-12-20',
    totalInterest: '₦102,000',
    totalRepayable: '₦952,000',
    borrowers: [
      {
        name: 'Baba Tunde',
        id: 'CUS-010',
        share: '₦85,000',
        bvn: 'Verified',
        biometric: 'Captured'
      },
      {
        name: 'Musa Garba',
        id: 'CUS-011',
        share: '₦70,000',
        bvn: 'Verified',
        biometric: 'Captured'
      }],

    approvalWorkflow: [
      {
        stage: 'Branch Review',
        role: 'Manager',
        status: 'Approved',
        reviewer: 'Emeka Nnamdi',
        date: '2024-06-05',
        comments: 'Experienced group.'
      },
      {
        stage: 'Authorization',
        role: 'Authorizer',
        status: 'Approved',
        reviewer: 'Chukwuma Okonkwo',
        date: '2024-06-10',
        comments: 'Approved.'
      },
      {
        stage: 'Final Approval',
        role: 'Super Admin',
        status: 'Approved',
        reviewer: 'Adebayo Johnson',
        date: '2024-06-15',
        comments: 'Approved.'
      }],

    repaymentSchedule: [
      {
        number: 1,
        dueDate: '2024-07-20',
        principal: '₦125,167',
        interest: '₦17,000',
        totalDue: '₦159,167',
        amountPaid: '₦159,167',
        balance: '₦0',
        status: 'Paid',
        borrowerPayments: [
          {
            name: 'Baba Tunde',
            id: 'CUS-010',
            amountDue: '₦87,417',
            amountPaid: '₦87,417',
            balance: '₦0',
            status: 'Paid'
          },
          {
            name: 'Musa Garba',
            id: 'CUS-011',
            amountDue: '₦71,750',
            amountPaid: '₦71,750',
            balance: '₦0',
            status: 'Paid'
          }]

      },
      {
        number: 2,
        dueDate: '2024-08-20',
        principal: '₦127,670',
        interest: '₦14,497',
        totalDue: '₦159,167',
        amountPaid: '₦159,167',
        balance: '₦0',
        status: 'Paid',
        borrowerPayments: [
          {
            name: 'Baba Tunde',
            id: 'CUS-010',
            amountDue: '₦87,417',
            amountPaid: '₦87,417',
            balance: '₦0',
            status: 'Paid'
          },
          {
            name: 'Musa Garba',
            id: 'CUS-011',
            amountDue: '₦71,750',
            amountPaid: '₦71,750',
            balance: '₦0',
            status: 'Paid'
          }]

      },
      {
        number: 3,
        dueDate: '2024-09-20',
        principal: '₦130,224',
        interest: '₦11,943',
        totalDue: '₦159,167',
        amountPaid: '₦159,167',
        balance: '₦0',
        status: 'Paid',
        borrowerPayments: [
          {
            name: 'Baba Tunde',
            id: 'CUS-010',
            amountDue: '₦87,417',
            amountPaid: '₦87,417',
            balance: '₦0',
            status: 'Paid'
          },
          {
            name: 'Musa Garba',
            id: 'CUS-011',
            amountDue: '₦71,750',
            amountPaid: '₦71,750',
            balance: '₦0',
            status: 'Paid'
          }]

      },
      {
        number: 4,
        dueDate: '2024-10-20',
        principal: '₦132,828',
        interest: '₦9,339',
        totalDue: '₦159,167',
        amountPaid: '₦159,167',
        balance: '₦0',
        status: 'Paid',
        borrowerPayments: [
          {
            name: 'Baba Tunde',
            id: 'CUS-010',
            amountDue: '₦87,417',
            amountPaid: '₦87,417',
            balance: '₦0',
            status: 'Paid'
          },
          {
            name: 'Musa Garba',
            id: 'CUS-011',
            amountDue: '₦71,750',
            amountPaid: '₦71,750',
            balance: '₦0',
            status: 'Paid'
          }]

      },
      {
        number: 5,
        dueDate: '2024-11-20',
        principal: '₦135,485',
        interest: '₦6,682',
        totalDue: '₦159,167',
        amountPaid: '₦159,167',
        balance: '₦0',
        status: 'Paid',
        borrowerPayments: [
          {
            name: 'Baba Tunde',
            id: 'CUS-010',
            amountDue: '₦87,417',
            amountPaid: '₦87,417',
            balance: '₦0',
            status: 'Paid'
          },
          {
            name: 'Musa Garba',
            id: 'CUS-011',
            amountDue: '₦71,750',
            amountPaid: '₦71,750',
            balance: '₦0',
            status: 'Paid'
          }]

      },
      {
        number: 6,
        dueDate: '2024-12-20',
        principal: '₦138,626',
        interest: '₦3,541',
        totalDue: '₦159,167',
        amountPaid: '₦159,167',
        balance: '₦0',
        status: 'Paid',
        borrowerPayments: [
          {
            name: 'Baba Tunde',
            id: 'CUS-010',
            amountDue: '₦87,417',
            amountPaid: '₦87,417',
            balance: '₦0',
            status: 'Paid'
          },
          {
            name: 'Musa Garba',
            id: 'CUS-011',
            amountDue: '₦71,750',
            amountPaid: '₦71,750',
            balance: '₦0',
            status: 'Paid'
          }]

      }],

    disbursement: {
      id: 'DIS-1035',
      date: '2024-06-20',
      method: 'Mobile Money',
      bank: 'OPay',
      account: '****9901',
      amount: '₦850,000',
      disbursedBy: 'Adebayo Johnson',
      reference: 'OPY-TRF-20240620-1035'
    },
    activity: [
      {
        action: 'Loan closed — all payments completed',
        date: '2024-12-20',
        by: 'System'
      },
      {
        action: 'Final repayment of ₦159,167 received — Payment #6',
        date: '2024-12-20',
        by: 'System'
      },
      {
        action: 'Disbursed ₦850,000 via Mobile Money',
        date: '2024-06-20',
        by: 'Adebayo Johnson'
      },
      {
        action: 'Application submitted via mobile app',
        date: '2024-06-01',
        by: 'Marketer Aisha'
      }]

  }
};
const tabs = [
  {
    key: 'overview',
    label: 'Loan Overview',
    icon: FileTextIcon
  },
  {
    key: 'borrowers',
    label: 'Borrowers & Group',
    icon: UsersIcon
  },
  {
    key: 'approval',
    label: 'Approval Workflow',
    icon: GitBranchIcon
  },
  {
    key: 'repayment',
    label: 'Repayment Schedule',
    icon: CalendarIcon
  },
  {
    key: 'disbursement',
    label: 'Disbursement',
    icon: CreditCardIcon
  },
  {
    key: 'activity',
    label: 'Activity Log',
    icon: ClockIcon
  }];

function MetricCard({
  label,
  value,
  highlight




}: { label: string; value: string; highlight?: boolean; }) {
  return (
    <div className="text-center">
      <p className="text-xs text-gray-400 font-body mb-1">{label}</p>
      <p
        className={`text-lg font-heading font-bold ${highlight ? 'text-accent' : 'text-gray-900'}`}>

        {value}
      </p>
    </div>);

}
function RepaymentScheduleTab({
  schedule,
  navigate



}: { schedule: RepaymentRow[]; navigate: (path: string) => void; }) {
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const toggleRow = (num: number) => {
    setExpandedRows((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num]
    );
  };
  if (schedule.length === 0) {
    return (
      <motion.div
        initial={{
          opacity: 0
        }}
        animate={{
          opacity: 1
        }}>

        <div className="text-center py-12">
          <CalendarIcon size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-400 font-body">
            No repayment schedule yet. Loan has not been disbursed.
          </p>
        </div>
      </motion.div>);

  }
  return (
    <motion.div
      initial={{
        opacity: 0
      }}
      animate={{
        opacity: 1
      }}>

      <div className="mb-4 flex items-center gap-2 text-xs text-gray-400 font-body">
        <UsersIcon size={14} />
        <span>
          Click any payment row to see individual borrower contributions
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider font-heading">
              <th className="px-4 py-3 font-medium w-8"></th>
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Due Date</th>
              <th className="px-4 py-3 font-medium">Principal</th>
              <th className="px-4 py-3 font-medium">Interest</th>
              <th className="px-4 py-3 font-medium">Total Due</th>
              <th className="px-4 py-3 font-medium">Paid</th>
              <th className="px-4 py-3 font-medium">Balance</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm font-body">
            {schedule.map((row) => {
              const isExpanded = expandedRows.includes(row.number);
              return (
                <Fragment key={row.number}>
                  {/* Group Total Row */}
                  <tr
                    onClick={() => toggleRow(row.number)}
                    className={`transition-colors cursor-pointer border-b border-gray-50 ${row.status === 'Overdue' ? 'bg-red-50/50 hover:bg-red-50/70' : 'hover:bg-gray-50'}`}>

                    <td className="px-4 py-3 text-gray-400">
                      {isExpanded ?
                        <ChevronDownIcon size={16} className="text-primary" /> :

                        <ChevronRightIcon size={16} />
                      }
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-medium">
                      {row.number}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{row.dueDate}</td>
                    <td className="px-4 py-3 text-gray-700">{row.principal}</td>
                    <td className="px-4 py-3 text-gray-600">{row.interest}</td>
                    <td className="px-4 py-3 font-bold text-gray-800">
                      {row.totalDue}
                    </td>
                    <td className="px-4 py-3 text-green-600 font-bold">
                      {row.amountPaid}
                    </td>
                    <td
                      className={`px-4 py-3 font-bold ${row.status === 'Overdue' ? 'text-red-600' : 'text-gray-700'}`}>

                      {row.balance}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <StatusBadge
                          status={
                            row.status === 'Paid' ?
                              'Completed' :
                              row.status as BadgeStatus
                          } />

                        {row.penalty &&
                          <span className="text-xs text-red-500 font-body">
                            +{row.penalty}
                          </span>
                        }
                      </div>
                    </td>
                  </tr>
                  {/* Individual Borrower Rows */}
                  {isExpanded &&
                    row.borrowerPayments.map((bp, bIdx) =>
                      <tr
                        key={`${row.number}-${bIdx}`}
                        className="bg-gray-50/60 border-b border-gray-50/80">

                        <td className="px-4 py-2.5"></td>
                        <td className="px-4 py-2.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mx-auto"></div>
                        </td>
                        <td
                          className="px-4 py-2.5 text-primary text-xs font-medium cursor-pointer hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/customers/${bp.id}`);
                          }}>

                          {bp.name}
                          <span className="text-gray-400 ml-1.5 font-normal">
                            {bp.id}
                          </span>
                        </td>
                        <td className="px-4 py-2.5" colSpan={2}></td>
                        <td className="px-4 py-2.5 text-xs text-gray-600">
                          {bp.amountDue}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-green-600 font-medium">
                          {bp.amountPaid}
                        </td>
                        <td
                          className={`px-4 py-2.5 text-xs font-medium ${bp.status === 'Overdue' ? 'text-red-600' : 'text-gray-600'}`}>

                          {bp.balance}
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusBadge
                            status={
                              bp.status === 'Paid' ?
                                'Completed' :
                                bp.status as BadgeStatus
                            } />

                        </td>
                      </tr>
                    )}
                </Fragment>);

            })}
          </tbody>
        </table>
      </div>
    </motion.div>);

}
export function LoanDetail() {
  const { id } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const routeState = (location.state as LoanDetailLocationState | null) ?? null;
  const [activeTab, setActiveTab] = useState('overview');
  const fallbackLoan = mockLoans[id || 'LN-0023'] || mockLoans['LN-0023'];
  const [loan, setLoan] = useState<LoanData>(() => {
    if (routeState?.selectedLoan) {
      return mapSelectedLoanToLoanData(routeState.selectedLoan);
    }

    return fallbackLoan;
  });
  const [isRefreshingLoan, setIsRefreshingLoan] = useState(false);
  const [isProcessingLoanAction, setIsProcessingLoanAction] = useState(false);
  const isSuperAdmin = user?.role === 'super_admin';
  const isAuthorizer = user?.role === 'authorizer';
  const isManager = user?.role === 'manager';
  // Mutable loan status
  const [loanStatus, setLoanStatus] = useState<string>(loan.status);

  useEffect(() => {
    setLoanStatus(loan.status);
  }, [loan.status]);

  useEffect(() => {
    const customerBackendId = routeState?.customerBackendId;
    const hasCustomerContext =
      typeof customerBackendId === 'string' && customerBackendId.trim().length > 0;
    const routeLoanId = typeof id === 'string' ? id.trim() : '';
    if (!hasCustomerContext && routeLoanId.length === 0) {
      return;
    }

    const loadFreshLoan = async () => {
      try {
        setIsRefreshingLoan(true);
        if (hasCustomerContext) {
          const response = await api.get(`/customers/${customerBackendId}/loans`);
          const source = response as {
            data?: { loans?: unknown[]; payload?: { loans?: unknown[] } };
            payload?: { loans?: unknown[] };
            loans?: unknown[];
          };
          const loans =
            (Array.isArray(source?.data?.loans) ? source.data.loans : undefined) ??
            (Array.isArray(source?.payload?.loans) ? source.payload.loans : undefined) ??
            (Array.isArray(source?.data?.payload?.loans) ? source.data.payload.loans : undefined) ??
            (Array.isArray(source?.loans) ? source.loans : []);
          const selectedId = routeState?.selectedLoan?.id?.trim() ?? '';
          const selectedLoanCode = routeState?.selectedLoan?.loanCode?.trim() ?? '';
          const looksLikeObjectId = /^[a-f\d]{24}$/i.test(routeLoanId);
          const preferredBackendId = selectedId || (looksLikeObjectId ? routeLoanId : '');
          const fallbackLoanCode = selectedLoanCode || (!looksLikeObjectId ? routeLoanId : '');

          const matched = loans.find((entry) => {
            if (!entry || typeof entry !== 'object') {
              return false;
            }

            const item = entry as Record<string, unknown>;
            const backendId = String(item.id ?? item._id ?? '').trim();
            const backendLoanCode = String(item.loanCode ?? '').trim();

            if (preferredBackendId.length > 0) {
              return backendId === preferredBackendId;
            }

            if (fallbackLoanCode.length > 0) {
              return backendLoanCode === fallbackLoanCode;
            }

            return false;
          });

          if (matched && typeof matched === 'object') {
            setLoan(mapBackendLoanToLoanData(matched as Record<string, unknown>));
          }
          return;
        }

        const directResponse = await api.get(`/loans/${encodeURIComponent(routeLoanId)}`);
        const directSource = directResponse as {
          data?: { loan?: unknown; payload?: { loan?: unknown } };
          payload?: { loan?: unknown };
          loan?: unknown;
        };
        const directLoan =
          (directSource.data && typeof directSource.data === 'object' ? directSource.data.loan : undefined) ??
          (directSource.payload && typeof directSource.payload === 'object' ? directSource.payload.loan : undefined) ??
          (directSource.data &&
          typeof directSource.data === 'object' &&
          directSource.data.payload &&
          typeof directSource.data.payload === 'object' ?
          directSource.data.payload.loan :
          undefined) ??
          directSource.loan;

        if (directLoan && typeof directLoan === 'object') {
          setLoan(mapBackendLoanToLoanData(directLoan as Record<string, unknown>));
        }
      } catch (_error) {
        setIsRefreshingLoan(false);
      } finally {
        setIsRefreshingLoan(false);
      }
    };

    void loadFreshLoan();
  }, [id, routeState?.customerBackendId, routeState?.selectedLoan?.id, routeState?.selectedLoan?.loanCode]);

  const routeLoanId = typeof id === 'string' ? id.trim() : '';
  const loanBackendId = useMemo(() => {
    const fromRouteState = routeState?.selectedLoan?.id?.trim() ?? '';
    if (OBJECT_ID_PATTERN.test(fromRouteState)) {
      return fromRouteState;
    }

    const fromMappedLoan = loan.backendId?.trim() ?? '';
    if (OBJECT_ID_PATTERN.test(fromMappedLoan)) {
      return fromMappedLoan;
    }

    if (OBJECT_ID_PATTERN.test(routeLoanId)) {
      return routeLoanId;
    }

    return '';
  }, [loan.backendId, routeLoanId, routeState?.selectedLoan?.id]);

  const actorId = useMemo(() => {
    const rawId = typeof user?.id === 'string' ? user.id.trim() : '';
    return rawId.length > 0 ? rawId : '';
  }, [user?.id]);

  const isPending = loanStatus === 'Pending Review';
  const isApproved = loanStatus === 'Approved';
  const isActive = loanStatus === 'Active' || loanStatus === 'Disbursed';
  const isOverdue = loanStatus === 'Overdue';
  const isCompleted = loanStatus === 'Completed';
  const getStageStatus = (stageName: string): StageStatus => {
    const entry = loan.approvalWorkflow.find((stage) => stage.stage === stageName);
    return entry?.status ?? 'Pending';
  };

  const branchStageStatus = getStageStatus('Branch Review');
  const authorizerStageStatus = getStageStatus('Authorization');
  const finalStageStatus = getStageStatus('Final Approval');

  const canBranchManagerReview = isManager && isPending && branchStageStatus === 'Pending';
  const canAuthorizerReview =
    isAuthorizer &&
    isPending &&
    branchStageStatus === 'Approved' &&
    authorizerStageStatus === 'Pending';
  const canSuperAdminFinalReview =
    isSuperAdmin &&
    isPending &&
    authorizerStageStatus === 'Approved' &&
    finalStageStatus === 'Pending';
  const canSuperAdminDisburse = isSuperAdmin && isApproved;
  // Action modal state
  const [activeModal, setActiveModal] = useState<string | null>(null);
  // Fingerprint verification state for disbursement
  const [verifiedBorrowers, setVerifiedBorrowers] = useState<Set<string>>(
    new Set()
  );
  const [fingerprintModalOpen, setFingerprintModalOpen] = useState(false);
  const [selectedBorrower, setSelectedBorrower] = useState<{
    name: string;
    id: string;
  } | null>(null);
  const [disbursementToast, setDisbursementToast] = useState<{
    message: string;
    visible: boolean;
  }>({
    message: '',
    visible: false
  });
  const allBorrowersVerified =
    loan.borrowers.length > 0 &&
    loan.borrowers.every((b) => verifiedBorrowers.has(b.id));
  const verifiedCount = loan.borrowers.filter((b) =>
    verifiedBorrowers.has(b.id)
  ).length;

  const reviewStageBanner = useMemo(() => {
    if (loanStatus === 'Rejected') {
      if (finalStageStatus === 'Rejected') {
        return {
          title: 'Current Review Stage: Final Approval (Rejected)',
          message: 'Super Admin rejected this loan application.',
          toneClass: 'border-red-200 bg-red-50 text-red-800',
        };
      }

      if (authorizerStageStatus === 'Rejected') {
        return {
          title: 'Current Review Stage: Authorization (Rejected)',
          message: 'Authorizer returned or rejected this loan application.',
          toneClass: 'border-red-200 bg-red-50 text-red-800',
        };
      }

      if (branchStageStatus === 'Rejected') {
        return {
          title: 'Current Review Stage: Branch Review (Rejected)',
          message: 'Branch Manager rejected this loan application.',
          toneClass: 'border-red-200 bg-red-50 text-red-800',
        };
      }

      return {
        title: 'Current Review Stage: Rejected',
        message: 'This loan application has been rejected.',
        toneClass: 'border-red-200 bg-red-50 text-red-800',
      };
    }

    if (loanStatus === 'Pending Review') {
      if (branchStageStatus === 'Pending') {
        return {
          title: 'Current Review Stage: Branch Review',
          message: 'Awaiting Branch Manager recommendation.',
          toneClass: 'border-amber-200 bg-amber-50 text-amber-800',
        };
      }

      if (branchStageStatus === 'Approved' && authorizerStageStatus === 'Pending') {
        return {
          title: 'Current Review Stage: Authorization',
          message: 'Awaiting Authorizer review decision.',
          toneClass: 'border-blue-200 bg-blue-50 text-blue-800',
        };
      }

      if (authorizerStageStatus === 'Approved' && finalStageStatus === 'Pending') {
        return {
          title: 'Current Review Stage: Final Approval',
          message: 'Awaiting Super Admin final decision.',
          toneClass: 'border-indigo-200 bg-indigo-50 text-indigo-800',
        };
      }
    }

    if (loanStatus === 'Approved') {
      return {
        title: 'Current Review Stage: Approved for Disbursement',
        message: `Loan is approved. Borrower fingerprint verification: ${verifiedCount}/${loan.borrowers.length}.`,
        toneClass: 'border-green-200 bg-green-50 text-green-800',
      };
    }

    if (loanStatus === 'Disbursed' || loanStatus === 'Active') {
      return {
        title: 'Current Review Stage: Disbursed',
        message: 'Loan has completed review and is now in repayment phase.',
        toneClass: 'border-emerald-200 bg-emerald-50 text-emerald-800',
      };
    }

    if (loanStatus === 'Overdue') {
      return {
        title: 'Current Review Stage: Overdue',
        message: 'Loan is disbursed but currently overdue.',
        toneClass: 'border-orange-200 bg-orange-50 text-orange-800',
      };
    }

    if (loanStatus === 'Completed') {
      return {
        title: 'Current Review Stage: Completed',
        message: 'Loan lifecycle has been completed.',
        toneClass: 'border-gray-200 bg-gray-50 text-gray-800',
      };
    }

    return null;
  }, [authorizerStageStatus, branchStageStatus, finalStageStatus, loan.borrowers.length, loanStatus, verifiedCount]);

  function showDisbursementToast(message: string) {
    setDisbursementToast({
      message,
      visible: true
    });
    setTimeout(
      () =>
        setDisbursementToast((t) => ({
          ...t,
          visible: false
        })),
      3000
    );
  }
  function handleVerifyBorrower(borrower: { name: string; id: string; }) {
    setSelectedBorrower(borrower);
    setFingerprintModalOpen(true);
  }
  function handleBorrowerVerified(borrowerId: string) {
    setVerifiedBorrowers((prev) => new Set([...prev, borrowerId]));
    showDisbursementToast(
      `Fingerprint verified for ${loan.borrowers.find((b) => b.id === borrowerId)?.name || borrowerId}`
    );
  }
  function handleDisburseClick() {
    if (!allBorrowersVerified) {
      setActiveTab('disbursement');
      showDisbursementToast(
        'All borrowers must be fingerprint-verified before disbursement'
      );
      return;
    }
    void handleLoanAction('disburse');
  }
  async function refreshLoanDetailsAfterAction(targetLoanId: string) {
    const directResponse = await api.get(`/loans/${encodeURIComponent(targetLoanId)}`);
    const directSource = directResponse as {
      data?: { loan?: unknown; payload?: { loan?: unknown } };
      payload?: { loan?: unknown };
      loan?: unknown;
    };
    const directLoan =
      (directSource.data && typeof directSource.data === 'object' ? directSource.data.loan : undefined) ??
      (directSource.payload && typeof directSource.payload === 'object' ? directSource.payload.loan : undefined) ??
      (directSource.data &&
      typeof directSource.data === 'object' &&
      directSource.data.payload &&
      typeof directSource.data.payload === 'object' ?
      directSource.data.payload.loan :
      undefined) ??
      directSource.loan;

    if (directLoan && typeof directLoan === 'object') {
      const mapped = mapBackendLoanToLoanData(directLoan as Record<string, unknown>);
      setLoan(mapped);
      setLoanStatus(mapped.status);
    }
  }

  async function handleLoanAction(action: string, inputValue?: string) {
    setActiveModal(null);

    if (action === 'recordPayment' || action === 'applyPenalty' || action === 'waivePenalty' || action === 'closeLoan') {
      const messages: Record<string, string> = {
        recordPayment: `Payment of ₦${inputValue} recorded successfully`,
        applyPenalty: `Penalty of ₦${inputValue} applied`,
        waivePenalty: 'Penalty waived successfully',
        closeLoan: 'Loan closed and archived',
      };
      if (action === 'closeLoan') {
        setLoanStatus('Completed');
      }
      showDisbursementToast(messages[action] || 'Action completed');
      return;
    }

    if (!loanBackendId) {
      showDisbursementToast('Unable to determine backend loan id for this action');
      return;
    }

    if (!actorId) {
      showDisbursementToast('Unable to determine acting user');
      return;
    }

    const comments = typeof inputValue === 'string' && inputValue.trim().length > 0 ? inputValue.trim() : undefined;

    try {
      setIsProcessingLoanAction(true);

      if (action === 'recommend') {
        await api.post(`/loans/${loanBackendId}/branch-recommendation`, {
          actorId,
          action: 'Approved',
          remarks: comments ?? 'Recommended by branch manager',
        });
        showDisbursementToast('Loan recommended by branch manager');
      } else if (action === 'flagForReview') {
        await api.post(`/loans/${loanBackendId}/branch-recommendation`, {
          actorId,
          action: 'Rejected',
          remarks: comments ?? 'Flagged by branch manager',
        });
        showDisbursementToast('Loan rejected by branch manager');
      } else if (action === 'approve') {
        if (canAuthorizerReview) {
          await api.post(`/loans/${loanBackendId}/review`, {
            actorId,
            action: 'Approved',
            remarks: comments ?? 'Approved by authorizer',
          });
          showDisbursementToast('Loan approved by authorizer');
        } else if (canSuperAdminFinalReview) {
          await api.post(`/loans/${loanBackendId}/head-office-decision`, {
            actorId,
            action: 'Approved',
            remarks: comments ?? 'Approved by super admin',
          });
          showDisbursementToast('Loan approved by super admin');
        } else {
          showDisbursementToast('This approval action is not available at current stage');
          return;
        }
      } else if (action === 'returnToBranch' || action === 'requestInfo') {
        await api.post(`/loans/${loanBackendId}/review`, {
          actorId,
          action: 'Returned',
          remarks: comments ?? 'Returned for branch clarification',
        });
        showDisbursementToast('Loan returned to branch manager');
      } else if (action === 'reject') {
        if (canAuthorizerReview) {
          await api.post(`/loans/${loanBackendId}/review`, {
            actorId,
            action: 'Rejected',
            remarks: comments ?? 'Rejected by authorizer',
          });
          showDisbursementToast('Loan rejected by authorizer');
        } else if (canSuperAdminFinalReview) {
          await api.post(`/loans/${loanBackendId}/head-office-decision`, {
            actorId,
            action: 'Rejected',
            remarks: comments ?? 'Rejected by super admin',
          });
          showDisbursementToast('Loan rejected by super admin');
        } else {
          showDisbursementToast('This reject action is not available at current stage');
          return;
        }
      } else if (action === 'disburse') {
        await api.post(`/loans/${loanBackendId}/disburse`, {
          actorId,
        });
        showDisbursementToast('Loan disbursed successfully');
      } else {
        showDisbursementToast('Unsupported action');
        return;
      }

      await refreshLoanDetailsAfterAction(loanBackendId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process loan action';
      showDisbursementToast(message);
    } finally {
      setIsProcessingLoanAction(false);
    }
  }
  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {disbursementToast.visible &&
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
            {disbursementToast.message}
          </motion.div>
        }
      </AnimatePresence>

      {/* Fingerprint Modal */}
      <DisbursementFingerprintModal
        isOpen={fingerprintModalOpen}
        onClose={() => setFingerprintModalOpen(false)}
        borrowerName={selectedBorrower?.name || ''}
        borrowerId={selectedBorrower?.id || ''}
        onVerified={handleBorrowerVerified} />


      {/* Loan Action Modals */}
      <LoanActionModals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        onConfirm={handleLoanAction}
        loanId={loan.id} />


      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm font-body text-gray-500 hover:text-primary transition-colors">

        <ArrowLeftIcon size={16} />
        Back to Loan Manager
      </button>

      {isRefreshingLoan &&
        <div className="text-xs font-body text-gray-400">
          Refreshing latest loan details...
        </div>
      }

      {/* Loan Summary Header */}
      <motion.div
        initial={{
          opacity: 0,
          y: 12
        }}
        animate={{
          opacity: 1,
          y: 0
        }}
        transition={{
          duration: 0.3
        }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-heading font-bold text-gray-900">
                {loan.id}
              </h2>
              <StatusBadge status={loanStatus as BadgeStatus} />
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm font-body text-gray-500">
              <span>{loan.group.name}</span>
              <span>{loan.branch}</span>
              <span>Applied {loan.dateApplied}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Role-based contextual actions */}
            {canAuthorizerReview &&
              <>
                <button
                  onClick={() => setActiveModal('approve')}
                  disabled={isProcessingLoanAction}
                  className="px-4 py-2 bg-primary text-white text-sm font-heading font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1.5">

                  <CheckCircleIcon size={15} /> Approve
                </button>
                <button
                  onClick={() => setActiveModal('reject')}
                  disabled={isProcessingLoanAction}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-heading font-bold rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1.5">

                  <XCircleIcon size={15} /> Reject
                </button>
              </>
            }
            {canAuthorizerReview &&
              <button
                onClick={() => setActiveModal('requestInfo')}
                disabled={isProcessingLoanAction}
                className="px-4 py-2 border border-blue-200 text-blue-600 text-sm font-heading font-bold rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1.5">

                <AlertCircleIcon size={15} /> Request Info
              </button>
            }
            {canAuthorizerReview &&
              <button
                onClick={() => setActiveModal('returnToBranch')}
                disabled={isProcessingLoanAction}
                className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-heading font-bold rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5">

                <CornerDownLeftIcon size={15} /> Return to Branch
              </button>
            }
            {canBranchManagerReview &&
              <button
                onClick={() => setActiveModal('recommend')}
                disabled={isProcessingLoanAction}
                className="px-4 py-2 bg-primary text-white text-sm font-heading font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1.5">

                <SendIcon size={15} /> Recommend
              </button>
            }
            {canBranchManagerReview &&
              <button
                onClick={() => setActiveModal('flagForReview')}
                disabled={isProcessingLoanAction}
                className="px-4 py-2 border border-orange-200 text-orange-600 text-sm font-heading font-bold rounded-lg hover:bg-orange-50 transition-colors flex items-center gap-1.5">

                <FlagIcon size={15} /> Flag for Review
              </button>
            }
            {canSuperAdminFinalReview &&
              <>
                <button
                  onClick={() => setActiveModal('approve')}
                  disabled={isProcessingLoanAction}
                  className="px-4 py-2 bg-primary text-white text-sm font-heading font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1.5">

                  <CheckCircleIcon size={15} /> Final Approve
                </button>
                <button
                  onClick={() => setActiveModal('reject')}
                  disabled={isProcessingLoanAction}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-heading font-bold rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1.5">

                  <XCircleIcon size={15} /> Final Reject
                </button>
              </>
            }
            {canSuperAdminDisburse &&
              <button
                onClick={handleDisburseClick}
                disabled={isProcessingLoanAction}
                className={`px-4 py-2 text-sm font-heading font-bold rounded-lg transition-colors flex items-center gap-1.5 ${allBorrowersVerified ? 'bg-accent text-white hover:bg-accent/90' : 'bg-accent/60 text-white cursor-default'}`}>

                <BanknoteIcon size={15} /> Disburse
                {!allBorrowersVerified &&
                  <span className="ml-1 text-xs bg-white/20 px-1.5 py-0.5 rounded">
                    {verifiedCount}/{loan.borrowers.length}
                  </span>
                }
              </button>
            }
            {(isActive || isOverdue) && (isSuperAdmin || isManager) &&
              <button
                onClick={() => setActiveModal('recordPayment')}
                className="px-4 py-2 bg-primary text-white text-sm font-heading font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1.5">

                <CreditCardIcon size={15} /> Record Payment
              </button>
            }
            {(isActive || isOverdue) && (isSuperAdmin || isManager) &&
              <button
                onClick={() => setActiveModal('applyPenalty')}
                className="px-4 py-2 border border-red-200 text-red-600 text-sm font-heading font-bold rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1.5">

                <GavelIcon size={15} /> Apply Penalty
              </button>
            }
            {isOverdue && isSuperAdmin &&
              <button
                onClick={() => setActiveModal('waivePenalty')}
                className="px-4 py-2 border border-green-200 text-green-600 text-sm font-heading font-bold rounded-lg hover:bg-green-50 transition-colors flex items-center gap-1.5">

                <ShieldCheckIcon size={15} /> Waive Penalty
              </button>
            }
            {isCompleted && isSuperAdmin &&
              <button
                onClick={() => setActiveModal('closeLoan')}
                className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-heading font-bold rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5">

                <ArchiveIcon size={15} /> Close Loan
              </button>
            }
          </div>
        </div>

        {reviewStageBanner &&
          <div className={`mb-5 rounded-lg border px-4 py-3 ${reviewStageBanner.toneClass}`}>
            <p className="text-sm font-heading font-semibold">{reviewStageBanner.title}</p>
            <p className="text-xs font-body mt-1 opacity-90">{reviewStageBanner.message}</p>
          </div>
        }

        {/* Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-4 border-t border-gray-100">
          <MetricCard label="Loan Amount" value={loan.amount} />
          <MetricCard label="Interest Rate" value={loan.interestRate} />
          <MetricCard label="Tenure" value={loan.tenure} />
          <MetricCard label="Monthly Repayment" value={loan.monthlyRepayment} />
          <MetricCard
            label="Outstanding"
            value={loan.outstanding}
            highlight={isOverdue} />

          <MetricCard label="Status" value={loan.status} />
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-100">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-body whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.key ? 'border-primary text-primary font-bold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>

                <Icon size={16} />
                {tab.label}
              </button>);

          })}
        </div>

        <div className="p-6">
          {/* Loan Overview */}
          {activeTab === 'overview' &&
            <motion.div
              initial={{
                opacity: 0
              }}
              animate={{
                opacity: 1
              }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

              {[
                {
                  label: 'Loan Code',
                  value: loan.id
                },
                {
                  label: 'Loan Product',
                  value: loan.loanProductType ?? '-'
                },
                {
                  label: 'Loan Type',
                  value: 'Group Loan'
                },
                {
                  label: 'Purpose',
                  value: loan.purpose
                },
                {
                  label: 'Amount Requested',
                  value: loan.amount
                },
                {
                  label: 'Amount Approved',
                  value: loan.amountApproved
                },
                {
                  label: 'Processing Fee',
                  value: loan.processingFee ?? '-'
                },
                {
                  label: 'Interest Rate',
                  value: loan.interestRate + ' per annum'
                },
                {
                  label: 'Tenure',
                  value: loan.tenure
                },
                {
                  label: 'Repayment Frequency',
                  value: loan.repaymentFrequency
                },
                {
                  label: 'Grace Period',
                  value: loan.gracePeriod
                },
                {
                  label: 'First Payment Date',
                  value: loan.firstPaymentDate
                },
                {
                  label: 'Maturity Date',
                  value: loan.maturityDate
                },
                {
                  label: 'Date Applied',
                  value: loan.dateApplied
                },
                {
                  label: 'Initiation Remarks',
                  value: loan.initiationRemarks ?? '-'
                },
                {
                  label: 'Total Interest',
                  value: loan.totalInterest
                },
                {
                  label: 'Total Repayable',
                  value: loan.totalRepayable
                }].
                map((item) =>
                  <div key={item.label}>
                    <p className="text-xs text-gray-400 font-body mb-1">
                      {item.label}
                    </p>
                    <p className="text-sm font-body font-medium text-gray-800">
                      {item.value}
                    </p>
                  </div>
                )}
            </motion.div>
          }

          {/* Borrowers & Group */}
          {activeTab === 'borrowers' &&
            <motion.div
              initial={{
                opacity: 0
              }}
              animate={{
                opacity: 1
              }}>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  {
                    label: 'Group Name',
                    value: loan.group.name || '-'
                  },
                  {
                    label: 'Group ID',
                    value: loan.group.id || '-'
                  },
                  {
                    label: 'Branch',
                    value: loan.branch || '-'
                  },
                  {
                    label: 'Group Leader',
                    value: loan.group.leader || '-'
                  },
                  {
                    label: 'Group Members',
                    value: String(loan.group.members || 0)
                  },
                  {
                    label: 'Borrowers On This Loan',
                    value: String(loan.borrowers.length)
                  },
                  {
                    label: 'Group Status',
                    value: loan.group.status || '-'
                  },
                  {
                    label: 'Loan Status',
                    value: loan.status
                  }].
                  map((item) =>
                    <div key={item.label} className="rounded-lg border border-gray-100 bg-gray-50/60 p-3.5">
                      <p className="text-xs text-gray-400 font-body mb-1">
                        {item.label}
                      </p>
                      <p className="text-sm font-body font-medium text-gray-800 break-words">
                        {item.value}
                      </p>
                    </div>
                  )}
              </div>
            </motion.div>
          }

          {/* Approval Workflow */}
          {activeTab === 'approval' &&
            <motion.div
              initial={{
                opacity: 0
              }}
              animate={{
                opacity: 1
              }}
              className="max-w-2xl">

              <div className="relative pl-8 space-y-8">
                {loan.approvalWorkflow.map((stage, idx) => {
                  const isApprovedStage = stage.status === 'Approved';
                  const isPendingStage = stage.status === 'Pending';
                  const isRejectedStage = stage.status === 'Rejected';
                  const dotColor = isApprovedStage ?
                    'bg-green-500 border-green-200' :
                    isPendingStage ?
                      'bg-yellow-500 border-yellow-200 animate-pulse' :
                      isRejectedStage ?
                        'bg-red-500 border-red-200' :
                        'bg-gray-300 border-gray-200';
                  const lineColor = isApprovedStage ?
                    'bg-green-200' :
                    'bg-gray-200';
                  return (
                    <div key={idx} className="relative">
                      {idx < loan.approvalWorkflow.length - 1 &&
                        <div
                          className={`absolute left-[-20px] top-6 w-0.5 h-full ${lineColor}`} />

                      }
                      <div
                        className={`absolute -left-[26px] top-1 w-5 h-5 rounded-full border-4 ${dotColor}`} />

                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="text-sm font-heading font-bold text-gray-800">
                              Stage {idx + 1}: {stage.stage}
                            </h4>
                            <p className="text-xs text-gray-400 font-body">
                              {stage.role}
                            </p>
                          </div>
                          <StatusBadge
                            status={
                              stage.status === 'Skipped' ?
                                'Pending' :
                                stage.status as BadgeStatus
                            } />

                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm font-body">
                          <div>
                            <p className="text-xs text-gray-400">Reviewer</p>
                            <p className="text-gray-700">{stage.reviewer}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Date</p>
                            <p className="text-gray-700">{stage.date}</p>
                          </div>
                        </div>
                        {stage.comments &&
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-400 font-body">
                              Comments
                            </p>
                            <p className="text-sm text-gray-600 font-body italic">
                              "{stage.comments}"
                            </p>
                          </div>
                        }
                      </div>
                    </div>);

                })}
              </div>
            </motion.div>
          }

          {/* Repayment Schedule */}
          {activeTab === 'repayment' &&
            <RepaymentScheduleTab
              schedule={loan.repaymentSchedule}
              navigate={navigate} />

          }

          {/* Disbursement Details */}
          {activeTab === 'disbursement' &&
            <motion.div
              initial={{
                opacity: 0
              }}
              animate={{
                opacity: 1
              }}>

              {!loan.disbursement ?
                <div className="space-y-6">
                  {/* Pre-Disbursement Fingerprint Verification */}
                  {isApproved &&
                    <div className="border border-gray-100 rounded-xl overflow-hidden">
                      <div className="bg-gray-50 px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <FingerprintIcon size={18} className="text-accent" />
                          <h4 className="text-sm font-heading font-bold text-gray-800">
                            Pre-Disbursement Biometric Verification
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                              initial={{
                                width: 0
                              }}
                              animate={{
                                width: `${verifiedCount / loan.borrowers.length * 100}%`
                              }}
                              transition={{
                                duration: 0.4
                              }}
                              className={`h-full rounded-full ${allBorrowersVerified ? 'bg-green-500' : 'bg-accent'}`} />

                          </div>
                          <span className="text-xs font-heading font-bold text-gray-600">
                            {verifiedCount}/{loan.borrowers.length}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 space-y-2">
                        <p className="text-xs font-body text-gray-500 mb-3">
                          Each borrower's fingerprint must be verified against
                          their stored biometric data before their individual
                          share can be disbursed.
                        </p>

                        {loan.borrowers.map((borrower) => {
                          const isVerified = verifiedBorrowers.has(borrower.id);
                          return (
                            <div
                              key={borrower.id}
                              className={`flex items-center justify-between p-3.5 rounded-lg transition-colors ${isVerified ? 'bg-green-50/60' : 'bg-gray-50'}`}>

                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${isVerified ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>

                                  {isVerified ?
                                    <CheckCircleIcon size={18} /> :

                                    <FingerprintIcon size={18} />
                                  }
                                </div>
                                <div>
                                  <p className="text-sm font-body font-medium text-gray-800">
                                    {borrower.name}
                                  </p>
                                  <p className="text-xs font-body text-gray-400">
                                    {borrower.id}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="text-sm font-heading font-bold text-gray-800">
                                    {borrower.share}
                                  </p>
                                  <p className="text-[10px] font-body text-gray-400 uppercase">
                                    Loan Share
                                  </p>
                                </div>
                                {isVerified ?
                                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 text-xs font-heading font-bold rounded-lg">
                                    <CheckCircleIcon size={14} />
                                    Verified
                                  </div> :

                                  <button
                                    onClick={() =>
                                      handleVerifyBorrower(borrower)
                                    }
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white text-xs font-heading font-bold rounded-lg hover:bg-accent/90 transition-colors">

                                    <FingerprintIcon size={14} />
                                    Verify
                                  </button>
                                }
                              </div>
                            </div>);

                        })}
                      </div>

                      {allBorrowersVerified &&
                        <motion.div
                          initial={{
                            opacity: 0,
                            height: 0
                          }}
                          animate={{
                            opacity: 1,
                            height: 'auto'
                          }}
                          className="border-t border-green-100 bg-green-50 px-5 py-3">

                          <div className="flex items-center gap-2 text-sm font-body text-green-700">
                            <CheckCircleIcon size={16} />
                            <span>
                              All borrowers verified. Loan is ready for
                              disbursement.
                            </span>
                          </div>
                        </motion.div>
                      }

                      {!allBorrowersVerified &&
                        <div className="border-t border-amber-100 bg-amber-50 px-5 py-3">
                          <div className="flex items-start gap-2">
                            <AlertCircleIcon
                              size={16}
                              className="text-amber-600 mt-0.5 flex-shrink-0" />

                            <p className="text-xs font-body text-amber-700">
                              {loan.borrowers.length - verifiedCount} borrower
                              {loan.borrowers.length - verifiedCount > 1 ?
                                's' :
                                ''}{' '}
                              pending verification. All must be verified before
                              disbursement.
                            </p>
                          </div>
                        </div>
                      }
                    </div>
                  }

                  {/* Disburse Button */}
                  {isApproved && isSuperAdmin &&
                    <div className="text-center">
                      <button
                        onClick={handleDisburseClick}
                        disabled={!allBorrowersVerified}
                        className={`px-8 py-3 text-sm font-heading font-bold rounded-lg transition-colors flex items-center gap-2 mx-auto ${allBorrowersVerified ? 'bg-accent text-white hover:bg-accent/90' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>

                        <BanknoteIcon size={18} />
                        {allBorrowersVerified ?
                          'Disburse Now' :
                          `Verify All Borrowers First (${verifiedCount}/${loan.borrowers.length})`}
                      </button>
                    </div>
                  }

                  {/* Not approved state */}
                  {!isApproved &&
                    <div className="text-center py-12">
                      <CreditCardIcon
                        size={40}
                        className="mx-auto text-gray-300 mb-3" />

                      <p className="text-sm text-gray-400 font-body">
                        Loan has not been disbursed yet.
                      </p>
                    </div>
                  }
                </div> :

                <div className="space-y-6">
                  {/* Group Disbursement Summary */}
                  <div className="border border-gray-100 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-5 py-3 border-b border-gray-100">
                      <h4 className="text-sm font-heading font-bold text-gray-800">
                        Group Disbursement Summary
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-100">
                      {[
                        {
                          label: 'Disbursement ID',
                          value: loan.disbursement.id
                        },
                        {
                          label: 'Total Amount',
                          value: loan.disbursement.amount
                        },
                        {
                          label: 'Method',
                          value: loan.disbursement.method
                        },
                        {
                          label: 'Date',
                          value: loan.disbursement.date
                        }].
                        map((item) =>
                          <div key={item.label} className="bg-white p-4">
                            <p className="text-[10px] text-gray-400 font-body uppercase tracking-wider">
                              {item.label}
                            </p>
                            <p className="text-sm font-heading font-bold text-gray-900 mt-1">
                              {item.value}
                            </p>
                          </div>
                        )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-100">
                      {[
                        {
                          label: 'Bank',
                          value: loan.disbursement.bank
                        },
                        {
                          label: 'Account',
                          value: loan.disbursement.account
                        },
                        {
                          label: 'Disbursed By',
                          value: loan.disbursement.disbursedBy
                        },
                        {
                          label: 'Reference',
                          value: loan.disbursement.reference
                        }].
                        map((item) =>
                          <div key={item.label} className="bg-white p-4">
                            <p className="text-[10px] text-gray-400 font-body uppercase tracking-wider">
                              {item.label}
                            </p>
                            <p className="text-sm font-body font-medium text-gray-700 mt-1">
                              {item.value}
                            </p>
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Per-Borrower Disbursement Records */}
                  <div className="border border-gray-100 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <UsersIcon size={16} className="text-primary" />
                        <h4 className="text-sm font-heading font-bold text-gray-800">
                          Per-Borrower Disbursement
                        </h4>
                      </div>
                      <span className="text-xs font-body text-gray-500">
                        {loan.borrowers.length} borrower
                        {loan.borrowers.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider font-heading">
                            <th className="px-5 py-3 font-medium">Borrower</th>
                            <th className="px-5 py-3 font-medium">
                              Customer ID
                            </th>
                            <th className="px-5 py-3 font-medium">
                              Loan Share
                            </th>
                            <th className="px-5 py-3 font-medium">Biometric</th>
                            <th className="px-5 py-3 font-medium">
                              Disbursement Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm font-body">
                          {loan.borrowers.map((borrower) =>
                            <tr
                              key={borrower.id}
                              onClick={() =>
                                navigate(`/customers/${borrower.id}`)
                              }
                              className="hover:bg-gray-50 transition-colors cursor-pointer">

                              <td className="px-5 py-3.5 font-medium text-primary">
                                {borrower.name}
                              </td>
                              <td className="px-5 py-3.5 text-gray-500">
                                {borrower.id}
                              </td>
                              <td className="px-5 py-3.5 font-heading font-bold text-gray-800">
                                {borrower.share}
                              </td>
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-1.5">
                                  <FingerprintIcon
                                    size={14}
                                    className="text-green-600" />

                                  <StatusBadge
                                    status={borrower.biometric as BadgeStatus} />

                                </div>
                              </td>
                              <td className="px-5 py-3.5">
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-heading font-bold rounded-md">
                                  <CheckCircleIcon size={12} />
                                  Disbursed
                                </span>
                              </td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-gray-200 bg-gray-50">
                            <td
                              className="px-5 py-3 font-heading font-bold text-gray-800 text-sm"
                              colSpan={2}>

                              Group Total
                            </td>
                            <td className="px-5 py-3 font-heading font-bold text-accent text-sm">
                              {loan.disbursement.amount}
                            </td>
                            <td className="px-5 py-3 text-xs font-body text-green-600">
                              All verified ✓
                            </td>
                            <td className="px-5 py-3">
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-heading font-bold rounded-md">
                                <CheckCircleIcon size={12} />
                                Complete
                              </span>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              }
            </motion.div>
          }

          {/* Activity Log */}
          {activeTab === 'activity' &&
            <motion.div
              initial={{
                opacity: 0
              }}
              animate={{
                opacity: 1
              }}
              className="max-w-2xl">

              <div className="relative pl-6 border-l-2 border-gray-100 space-y-6">
                {loan.activity.map((item, idx) =>
                  <div key={idx} className="relative">
                    <div className="absolute -left-[31px] w-4 h-4 rounded-full bg-white border-2 border-primary" />
                    <p className="text-sm font-body text-gray-800">
                      {item.action}
                    </p>
                    <p className="text-xs font-body text-gray-400 mt-0.5">
                      {item.date} • by {item.by}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          }
        </div>
      </div>
    </div>);

}
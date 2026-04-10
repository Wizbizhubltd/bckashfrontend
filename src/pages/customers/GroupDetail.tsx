import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, CalendarIcon, MapPinIcon, UsersIcon } from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';
import { api } from '../../app/api';

type GroupMemberRow = {
  id: string;
  name: string;
  phone: string;
  requestedLoanAmount: number;
  joinedAt: string;
  status: 'Approved' | 'Pending Approval' | 'Rejected';
};

type GroupLoanSummary = {
  loanAmountSubmitted: number;
  totalDisbursedAmount: number;
  numberOfApprovedMembers: number;
  totalAmountPaidBack: number;
};

type GroupDetailView = {
  id: string;
  name: string;
  code: string;
  status: string;
  description: string;
  branch: string;
  organization: string;
  leader: string;
  meetingDay: string;
  meetingLocation: string;
  createdAt: string;
  loanSummary: GroupLoanSummary;
  members: GroupMemberRow[];
};

const getString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toDisplayDate = (value: unknown): string => {
  const parsed = getString(value);
  if (!parsed) {
    return '-';
  }

  const date = new Date(parsed);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleDateString();
};

const toCurrencyAmount = (value: unknown): number => {
  const amount = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(amount) ? amount : 0;
};

const formatNairaAmount = (value: number): string => {
  return `₦${Math.round(value).toLocaleString()}`;
};

const getNamedEntity = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }

  if (!value || typeof value !== 'object') {
    return '-';
  }

  const source = value as Record<string, unknown>;
  return (
    getString(source.name) ||
    getString(source.groupName) ||
    getString(source.branchName) ||
    getString(source.code) ||
    '-'
  );
};

const getFullName = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }

  if (!value || typeof value !== 'object') {
    return '-';
  }

  const source = value as Record<string, unknown>;
  const fullName = getString(source.fullName);
  if (fullName) {
    return fullName;
  }

  const firstName = getString(source.firstName) || '';
  const lastName = getString(source.lastName) || '';
  const combined = `${firstName} ${lastName}`.trim();
  return combined || '-';
};

const extractGroupPayload = (response: unknown): Record<string, unknown> | null => {
  if (!response || typeof response !== 'object') {
    return null;
  }

  const source = response as Record<string, unknown>;
  const data = source.data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }

  if (
    (typeof source.id === 'string' && source.id.trim().length > 0) ||
    (typeof source._id === 'string' && source._id.trim().length > 0)
  ) {
    return source;
  }

  return null;
};

const mapGroupDetails = (raw: unknown): GroupDetailView | null => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const source = raw as Record<string, unknown>;
  const id = getString(source.id) || getString(source._id);

  if (!id) {
    return null;
  }

  const loanSummaryRaw =
    source.loanSummary && typeof source.loanSummary === 'object'
      ? (source.loanSummary as Record<string, unknown>)
      : {};

  const loanSummary: GroupLoanSummary = {
    loanAmountSubmitted: toCurrencyAmount(loanSummaryRaw.loanAmountSubmitted),
    totalDisbursedAmount: toCurrencyAmount(loanSummaryRaw.totalDisbursedAmount),
    numberOfApprovedMembers: Math.max(0, Math.round(toCurrencyAmount(loanSummaryRaw.numberOfApprovedMembers))),
    totalAmountPaidBack: toCurrencyAmount(loanSummaryRaw.totalAmountPaidBack),
  };

  const membersRaw = Array.isArray(source.members) ? source.members : [];
  const members = membersRaw
    .map((member, index): GroupMemberRow | null => {
      if (!member || typeof member !== 'object') {
        return null;
      }

      const memberSource = member as Record<string, unknown>;
      const customerSource = memberSource.customerId;
      const customerRecord =
        customerSource && typeof customerSource === 'object'
          ? (customerSource as Record<string, unknown>)
          : null;

      const memberId =
        (customerRecord && (getString(customerRecord.id) || getString(customerRecord._id))) ||
        getString(memberSource.id) ||
        getString(memberSource._id) ||
        `member-${index + 1}`;

      return {
        id: memberId,
        name: getFullName(customerRecord) || '-',
        phone: (customerRecord && (getString(customerRecord.phoneNumber) || getString(customerRecord.phone))) || '-',
        requestedLoanAmount: toCurrencyAmount(memberSource.requestedLoanAmount),
        joinedAt: toDisplayDate(memberSource.joinedAt),
        status:
          customerRecord && typeof customerRecord.isRejected === 'boolean' && customerRecord.isRejected
            ? 'Rejected'
            : customerRecord && typeof customerRecord.isApproved === 'boolean' && customerRecord.isApproved
              ? 'Approved'
              : 'Pending Approval',
      };
    })
    .filter((member): member is GroupMemberRow => member !== null);

  return {
    id,
    name: getString(source.groupName) || getString(source.name) || 'Unnamed Group',
    code: getString(source.groupCode) || '-',
    status:
      getString(source.status) ||
      (typeof source.isActive === 'boolean' ? (source.isActive ? 'Active' : 'Inactive') : 'Pending'),
    description: getString(source.description) || '-',
    branch: getNamedEntity(source.branchId),
    organization: getNamedEntity(source.organizationId),
    leader: members[0]?.name || getFullName(source.createdBy),
    meetingDay: getString(source.meetingDay) || '-',
    meetingLocation: getString(source.meetingLocation) || '-',
    createdAt: toDisplayDate(source.createdAt),
    loanSummary,
    members,
  };
};

export function GroupDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { groupId } = useParams<{ groupId: string }>();
  const customersBasePath = location.pathname.startsWith('/marketer') ? '/marketer/customers' : '/customers';

  const [group, setGroup] = useState<GroupDetailView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadGroup = async () => {
      const routeId = typeof groupId === 'string' ? groupId.trim() : '';

      if (!routeId) {
        if (isMounted) {
          setError('Invalid group id.');
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await api.get(`/groups/${encodeURIComponent(routeId)}`);
        const payload = extractGroupPayload(response);
        const mapped = mapGroupDetails(payload);

        if (!isMounted) {
          return;
        }

        if (!mapped) {
          setError('Group details could not be loaded.');
          setGroup(null);
        } else {
          setGroup(mapped);
        }
      } catch (requestError) {
        if (isMounted) {
          const message = requestError instanceof Error ? requestError.message : 'Failed to load group.';
          setError(message);
          setGroup(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadGroup();

    return () => {
      isMounted = false;
    };
  }, [groupId]);

  const memberSummary = useMemo(() => {
    const totalMembers = group?.members.length ?? 0;
    const approvedMembers = group?.members.filter((member) => member.status === 'Approved').length ?? 0;

    return {
      totalMembers,
      approvedMembers,
    };
  }, [group]);

  const approvedMembersDisplay = useMemo(() => {
    if (!group) {
      return 0;
    }

    return group.loanSummary.numberOfApprovedMembers;
  }, [group]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate(customersBasePath)}
          className="inline-flex items-center text-sm text-gray-600 hover:text-primary transition-colors"
        >
          <ArrowLeftIcon size={16} className="mr-2" />
          Back to Customers
        </button>
        <div className="bg-white border border-gray-100 rounded-xl p-6 text-sm text-gray-500">Loading group details...</div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate(customersBasePath)}
          className="inline-flex items-center text-sm text-gray-600 hover:text-primary transition-colors"
        >
          <ArrowLeftIcon size={16} className="mr-2" />
          Back to Customers
        </button>
        <div className="bg-white border border-gray-100 rounded-xl p-6">
          <p className="text-sm text-red-600">{error || 'Group not found.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(customersBasePath)}
        className="inline-flex items-center text-sm text-gray-600 hover:text-primary transition-colors"
      >
        <ArrowLeftIcon size={16} className="mr-2" />
        Back to Customers
      </button>

      <div className="bg-white border border-gray-100 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-heading font-bold text-primary">{group.name}</h2>
            <p className="text-sm text-gray-500 mt-1">Group Code: {group.code}</p>
          </div>
          <StatusBadge status={group.status as any} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="rounded-lg border border-blue-100 p-4 bg-blue-50">
            <p className="text-xs text-blue-700 uppercase tracking-wide">Loan Amount Submitted</p>
            <p className="text-lg text-blue-900 mt-1 font-bold">{formatNairaAmount(group.loanSummary.loanAmountSubmitted)}</p>
          </div>
          <div className="rounded-lg border border-green-100 p-4 bg-green-50">
            <p className="text-xs text-green-700 uppercase tracking-wide">Total Disbursed Amount</p>
            <p className="text-lg text-green-900 mt-1 font-bold">{formatNairaAmount(group.loanSummary.totalDisbursedAmount)}</p>
          </div>
          <div className="rounded-lg border border-purple-100 p-4 bg-purple-50">
            <p className="text-xs text-purple-700 uppercase tracking-wide">Approved Members</p>
            <p className="text-lg text-purple-900 mt-1 font-bold">{approvedMembersDisplay}</p>
          </div>
          <div className="rounded-lg border border-amber-100 p-4 bg-amber-50">
            <p className="text-xs text-amber-700 uppercase tracking-wide">Total Amount Paid Back</p>
            <p className="text-lg text-amber-900 mt-1 font-bold">{formatNairaAmount(group.loanSummary.totalAmountPaidBack)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div className="rounded-lg border border-gray-100 p-4 bg-gray-50">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Branch</p>
            <p className="text-sm text-gray-800 mt-1 font-medium">{group.branch}</p>
          </div>
          <div className="rounded-lg border border-gray-100 p-4 bg-gray-50">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Leader</p>
            <p className="text-sm text-gray-800 mt-1 font-medium">{group.leader}</p>
          </div>
          <div className="rounded-lg border border-gray-100 p-4 bg-gray-50">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Organization</p>
            <p className="text-sm text-gray-800 mt-1 font-medium">{group.organization}</p>
          </div>
          <div className="rounded-lg border border-gray-100 p-4 bg-gray-50">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Created</p>
            <p className="text-sm text-gray-800 mt-1 font-medium">{group.createdAt}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="rounded-lg border border-gray-100 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Description</p>
            <p className="text-sm text-gray-700 mt-1">{group.description}</p>
          </div>
          <div className="rounded-lg border border-gray-100 p-4 space-y-3">
            <div className="flex items-center text-sm text-gray-700">
              <CalendarIcon size={16} className="mr-2 text-gray-400" />
              Meeting Day: {group.meetingDay}
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <MapPinIcon size={16} className="mr-2 text-gray-400" />
              Meeting Location: {group.meetingLocation}
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <UsersIcon size={16} className="mr-2 text-gray-400" />
              Members: {memberSummary.approvedMembers}/{memberSummary.totalMembers} approved
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-heading font-bold text-primary">Group Members</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider font-heading">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Requested Loan Amount</th>
                <th className="px-6 py-3 font-medium">Phone</th>
                <th className="px-6 py-3 font-medium">Date Joined</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {group.members.map((member) => (
                <tr
                  key={member.id}
                  onClick={() => {
                    if (member.id && !member.id.startsWith('member-')) {
                      navigate(`${customersBasePath}/${member.id}`);
                    }
                  }}
                  className={`transition-colors cursor-pointer ${
                    member.status === 'Rejected' ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="px-6 py-4 text-gray-800 font-medium">{member.name}</td>
                  <td className="px-6 py-4 text-gray-600">{formatNairaAmount(member.requestedLoanAmount)}</td>
                  <td className="px-6 py-4 text-gray-600">{member.phone}</td>
                  <td className="px-6 py-4 text-gray-600">{member.joinedAt}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={member.status as any} />
                  </td>
                </tr>
              ))}
              {group.members.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-400">
                    No members found in this group.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

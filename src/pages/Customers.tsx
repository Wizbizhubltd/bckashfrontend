import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  SearchIcon,
  FilterIcon,
  MoreVerticalIcon } from
'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../app/api';

type StatusBadgeValue = React.ComponentProps<typeof StatusBadge>['status'];
type GroupRow = {
  id: string;
  name: string;
  leader: string;
  members: number;
  location: string;
  activeLoan: string;
  status: string;
  customers: string[];
};

type CustomerRow = {
  id: string;
  name: string;
  phone: string;
  group: string;
  branch: string;
  status: string;
};

function mapApiGroupToRow(raw: unknown): GroupRow | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const source = raw as Record<string, unknown>;
  const id =
    (typeof source.id === 'string' && source.id) ||
    (typeof source._id === 'string' && source._id) ||
    '';

  if (!id) {
    return null;
  }

  const name =
    (typeof source.groupName === 'string' && source.groupName.trim().length > 0
      ? source.groupName
      : undefined) ||
    (typeof source.name === 'string' && source.name.trim().length > 0 ? source.name : undefined) ||
    'Unnamed Group';

  const leader =
    (typeof source.leader === 'string' && source.leader.trim().length > 0
      ? source.leader
      : undefined) ||
    'Unassigned';

  const members = typeof source.members === 'number' ? source.members : 0;
  const location =
    (typeof source.location === 'string' && source.location.trim().length > 0
      ? source.location
      : undefined) ||
    (typeof source.branchName === 'string' && source.branchName.trim().length > 0 ? source.branchName : undefined) ||
    '-';

  const activeLoan =
    (typeof source.activeLoan === 'string' && source.activeLoan.trim().length > 0
      ? source.activeLoan
      : undefined) ||
    '₦0';

  const status =
    typeof source.status === 'string' && source.status.trim().length > 0
      ? source.status
      : 'Pending';

  const customers = Array.isArray(source.customers)
    ? source.customers.filter((item): item is string => typeof item === 'string')
    : [];

  return {
    id,
    name,
    leader,
    members,
    location,
    activeLoan,
    status,
    customers,
  };
}

function extractItems<T>(response: unknown): T[] {
  if (!response || typeof response !== 'object') {
    return [];
  }

  const source = response as { data?: unknown; payload?: unknown; items?: unknown };
  const candidates = [source.data, source.payload, source.items];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as T[];
    }
  }

  return [];
}

function mapApiCustomerToRow(raw: unknown): CustomerRow | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const source = raw as Record<string, unknown>;
  const id =
    (typeof source.id === 'string' && source.id) ||
    (typeof source._id === 'string' && source._id) ||
    '';

  if (!id) {
    return null;
  }

  const firstName = typeof source.firstName === 'string' ? source.firstName : '';
  const lastName = typeof source.lastName === 'string' ? source.lastName : '';
  const joinedName = `${firstName} ${lastName}`.trim();
  const branchRaw = source.branchId;
  const groupRaw = source.groupId;
  const groupObjectRaw = source.group;

  const branch =
    typeof branchRaw === 'string'
      ? branchRaw
      : branchRaw && typeof branchRaw === 'object' && typeof (branchRaw as { name?: unknown }).name === 'string'
        ? ((branchRaw as { name: string }).name || '-')
        : '-';

  const group =
    (typeof source.groupName === 'string' && source.groupName.trim().length > 0
      ? source.groupName
      : undefined) ||
    (groupObjectRaw && typeof groupObjectRaw === 'object' && typeof (groupObjectRaw as { groupName?: unknown }).groupName === 'string'
      ? ((groupObjectRaw as { groupName: string }).groupName || undefined)
      : undefined) ||
    (groupObjectRaw && typeof groupObjectRaw === 'object' && typeof (groupObjectRaw as { name?: unknown }).name === 'string'
      ? ((groupObjectRaw as { name: string }).name || undefined)
      : undefined) ||
    (groupRaw && typeof groupRaw === 'object' && typeof (groupRaw as { groupName?: unknown }).groupName === 'string'
      ? ((groupRaw as { groupName: string }).groupName || undefined)
      : undefined) ||
    (groupRaw && typeof groupRaw === 'object' && typeof (groupRaw as { name?: unknown }).name === 'string'
      ? ((groupRaw as { name: string }).name || undefined)
      : undefined) ||
    (typeof source.group === 'string' && source.group.trim().length > 0
      ? source.group
      : undefined) ||
    (typeof groupRaw === 'string' && groupRaw.trim().length > 0 ? groupRaw : undefined) ||
    'Ungrouped';

  const approvedFlag = typeof source.isApproved === 'boolean' ? source.isApproved : undefined;
  const fallbackStatus = typeof source.status === 'string' && source.status.trim().length > 0 ? source.status : 'Pending Approval';
  const status =
    approvedFlag === true
      ? 'Approved'
      : approvedFlag === false
        ? 'Pending Approval'
        : fallbackStatus;

  return {
    id,
    name:
      (typeof source.fullName === 'string' && source.fullName.trim().length > 0
        ? source.fullName
        : joinedName) || 'Unknown Customer',
    phone:
      (typeof source.phoneNumber === 'string' && source.phoneNumber) ||
      (typeof source.phone === 'string' && source.phone) ||
      '-',
    group,
    branch,
    status,
  };
}

export function Customers() {
  const navigate = useNavigate();
  const location = useLocation();
  const customerDetailsBasePath = location.pathname.startsWith('/marketer') ? '/marketer/customers' : '/customers';
  const groupDetailsBasePath = `${customerDetailsBasePath}/groups`;
  const [view, setView] = useState<'groups' | 'customers'>('customers');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [groups, setGroups] = useState<GroupRow[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadCustomers = async () => {
      try {
        const response = await api.get('/customers');
        const items = extractItems<Record<string, unknown>>(response);
        const mapped = items.map(mapApiCustomerToRow).filter((item): item is CustomerRow => item !== null);

        if (!isMounted) {
          return;
        }

        setCustomers(mapped);
      } catch {
        if (isMounted) {
          setCustomers([]);
        }
      }
    };

    void loadCustomers();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadGroups = async () => {
      try {
        const response = await api.get('/customers/groups');
        const items = extractItems<Record<string, unknown>>(response);
        const mapped = items.map(mapApiGroupToRow).filter((item): item is GroupRow => item !== null);

        if (!isMounted) {
          return;
        }

        setGroups(mapped);
      } catch {
        if (isMounted) {
          setGroups([]);
        }
      }
    };

    void loadGroups();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredCustomers = customers.filter((cust) => {
    const matchesSearch =
    !searchQuery.trim() ||
    [cust.name, cust.id, cust.phone, cust.group, cust.branch].some((field) =>
    field.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesStatus = statusFilter === 'all' || cust.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const filteredGroups = groups.filter((group) => {
    const matchesSearch =
    !searchQuery.trim() ||
    [group.name, group.id, group.leader, group.location].some((field) =>
    field.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesStatus =
    statusFilter === 'all' || group.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-heading font-bold text-primary">
            Customers Directory
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Manage borrowing groups and their members
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => {
                setView('customers');
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className={`px-3 py-1.5 text-sm font-body rounded-md transition-colors ${view === 'customers' ? 'bg-white text-primary font-bold shadow-sm' : 'text-gray-500'}`}>
              
              Customers
            </button>
            <button
              onClick={() => {
                setView('groups');
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className={`px-3 py-1.5 text-sm font-body rounded-md transition-colors ${view === 'groups' ? 'bg-white text-primary font-bold shadow-sm' : 'text-gray-500'}`}>
              
              Groups
            </button>
          </div>
          <div className="relative flex-1 sm:w-64">
            <SearchIcon
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
              view === 'customers' ?
              'Search customers...' :
              'Search groups...'
              }
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            
          </div>
          <div className="relative">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-sm font-medium">
              
              <FilterIcon size={16} className="mr-2" /> Filter
              {statusFilter !== 'all' &&
              <span className="ml-1.5 w-2 h-2 rounded-full bg-accent" />
              }
            </button>
            {filterOpen &&
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 w-40">
                {['all', 'Approved', 'Pending Approval', 'Rejected', 'Suspended'].map(
                (status) =>
                <button
                  key={status}
                  onClick={() => {
                    setStatusFilter(status);
                    setFilterOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm font-body hover:bg-gray-50 transition-colors ${statusFilter === status ? 'text-primary font-bold bg-primary/5' : 'text-gray-600'}`}>
                  
                      {status === 'all' ? 'All Statuses' : status}
                    </button>

              )}
              </div>
            }
          </div>
        </div>
      </div>

      {view === 'customers' ?
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider font-heading">
                  <th className="px-6 py-4 font-medium">Customer</th>
                  <th className="px-6 py-4 font-medium">Phone</th>
                  <th className="px-6 py-4 font-medium">Group</th>
                  <th className="px-6 py-4 font-medium">Branch</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredCustomers.map((cust) =>
              <tr
                key={cust.id}
                onClick={() => navigate(`${customerDetailsBasePath}/${cust.id}`)}
                className="hover:bg-gray-50 transition-colors cursor-pointer">
                
                    <td className="px-6 py-4">
                      <p className="font-heading font-medium text-primary">
                        {cust.name}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{cust.phone}</td>
                    <td className="px-6 py-4 text-gray-600">{cust.group}</td>
                    <td className="px-6 py-4 text-gray-600">{cust.branch}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={cust.status as StatusBadgeValue} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                    onClick={(e) => {
                      e.stopPropagation();
                        navigate(`${customerDetailsBasePath}/${cust.id}`);
                    }}
                    className="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100 transition-colors">
                    
                        <MoreVerticalIcon size={18} />
                      </button>
                    </td>
                  </tr>
              )}
                {filteredCustomers.length === 0 &&
              <tr>
                    <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-gray-400 text-sm font-body">
                  
                      No customers match your search.
                    </td>
                  </tr>
              }
              </tbody>
            </table>
          </div>
        </div> :

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider font-heading">
                  <th className="px-6 py-4 font-medium">Group Name</th>
                  <th className="px-6 py-4 font-medium">Group Leader</th>
                  <th className="px-6 py-4 font-medium">Members</th>
                  <th className="px-6 py-4 font-medium">Location</th>
                  <th className="px-6 py-4 font-medium">Active Loan</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredGroups.map((group) =>
              <tr
                key={group.id}
                onClick={() => navigate(`${groupDetailsBasePath}/${group.id}`)}
                className="hover:bg-gray-50 transition-colors cursor-pointer">
                
                    <td className="px-6 py-4">
                      <p className="font-heading font-medium text-primary">
                        {group.name}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{group.leader}</td>
                    <td className="px-6 py-4 text-gray-600">{group.members}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {group.location}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-700">
                      {group.activeLoan}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={group.status as StatusBadgeValue} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`${groupDetailsBasePath}/${group.id}`);
                        }}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-primary/20 text-primary hover:bg-primary/5 transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
              )}
                {filteredGroups.length === 0 &&
              <tr>
                    <td
                  colSpan={7}
                  className="px-6 py-12 text-center text-gray-400 text-sm font-body">
                  
                      No groups match your search.
                    </td>
                  </tr>
              }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>);

}
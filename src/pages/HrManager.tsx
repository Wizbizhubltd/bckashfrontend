import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  UsersIcon,
  UserCheckIcon,
  UserMinusIcon,
  BriefcaseIcon,
  LoaderIcon } from
'lucide-react';
import { api } from '../app/api';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useAppSelector } from '../store/hooks';
import { buildFrontendStaffIdWithSource, toTitleCase, type OrganizationNameSource } from '../utils/staff-display';

type EmployeeDirectoryItem = {
  id: string;
  backendId: string;
  organizationNameSource: OrganizationNameSource;
  name: string;
  role: string;
  branch: string;
  department: string;
  status: string;
};

type DepartmentLookup = {
  id: string;
  name: string;
};

type RoleLookup = {
  id: string;
  name: string;
  department: string;
};

type BranchLookup = {
  id: string;
  name: string;
};

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

function toRoleLabel(value: string): string {
  if (value === 'SuperAdmin') {
    return 'Super Admin';
  }

  if (value === 'BranchManager') {
    return 'Branch Manager';
  }

  return value;
}

function toStringId(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  if (value && typeof value === 'object' && typeof (value as { toString?: () => string }).toString === 'function') {
    const converted = (value as { toString: () => string }).toString();
    if (converted && converted !== '[object Object]') {
      return converted;
    }
  }

  return '';
}

function parseRef(value: unknown): { id: string; name?: string } {
  if (!value) {
    return { id: '' };
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return { id: String(value) };
  }

  if (typeof value === 'object') {
    const source = value as Record<string, unknown>;
    const id =
      toStringId(source.id) ||
      toStringId(source._id) ||
      toStringId(source._id && (source._id as Record<string, unknown>).$oid);
    const name = typeof source.name === 'string' ? source.name : undefined;

    return { id, name };
  }

  return { id: '' };
}

function mapEmployeeFromApi(
  raw: unknown,
  departments: DepartmentLookup[],
  roles: RoleLookup[],
  branches: BranchLookup[],
): EmployeeDirectoryItem | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const source = raw as Record<string, unknown>;
  const firstName = typeof source.firstName === 'string' ? source.firstName : '';
  const lastName = typeof source.lastName === 'string' ? source.lastName : '';
  const joinedName = `${firstName} ${lastName}`.trim();
  const roleRef = parseRef(source.roleId);
  const departmentRef = parseRef(source.departmentId);
  const branchRef = parseRef(source.branchId);
  const roleId = roleRef.id;
  const departmentId = departmentRef.id;
  const branchId = branchRef.id;
  const roleLookup = roleId ? roles.find((item) => item.id === roleId) : undefined;
  const departmentLookup = departmentId ? departments.find((item) => item.id === departmentId) : undefined;
  const branchLookup = branchId ? branches.find((item) => item.id === branchId) : undefined;
  const id =
    toStringId(source.staffId) ||
    toStringId(source.id) ||
    toStringId(source._id) ||
    toStringId(source._id && (source._id as Record<string, unknown>).$oid) ||
    '';

  if (!id) {
    return null;
  }

  const role =
    (typeof source.role === 'string' && source.role) ||
    (typeof roleRef.name === 'string' && roleRef.name) ||
    (typeof roleLookup?.name === 'string' && roleLookup.name) ||
    (typeof source.userLevel === 'string' && source.userLevel) ||
    '-';

  const department =
    (typeof source.department === 'string' && source.department.trim().length > 0 && source.department) ||
    (typeof departmentRef.name === 'string' && departmentRef.name) ||
    (typeof departmentLookup?.name === 'string' && departmentLookup.name) ||
    (typeof roleLookup?.department === 'string' && roleLookup.department) ||
    (role !== '-' ? 'Unassigned Department' : '—');

  const branch =
    (typeof source.branch === 'string' && source.branch.trim().length > 0 && source.branch) ||
    (typeof branchRef.name === 'string' && branchRef.name) ||
    (typeof branchLookup?.name === 'string' && branchLookup.name) ||
    '—';

  const displayId = buildFrontendStaffIdWithSource(source, id);

  return {
    id: displayId.id,
    backendId: id,
    organizationNameSource: displayId.organizationNameSource,
    name: toTitleCase((typeof source.name === 'string' && source.name) || joinedName || 'Unknown Staff'),
    role: toTitleCase(toRoleLabel(role)),
    branch: branch === '—' ? branch : toTitleCase(branch),
    department: department === '—' ? department : toTitleCase(department),
    status: toTitleCase(typeof source.status === 'string' && source.status.trim().length > 0 ? source.status : 'Active'),
  };
}

export function HrManager() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuth();
  const departments = useAppSelector((state) => state.lookups.departments);
  const roles = useAppSelector((state) => state.lookups.roles);
  const branches = useAppSelector((state) => state.lookups.branches);
  const [employees, setEmployees] = useState<EmployeeDirectoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const resolvedOrganizationId = useMemo(() => {
    const directId = typeof user?.organizationId === 'string' && user.organizationId.trim().length > 0
      ? user.organizationId.trim()
      : null;

    if (directId) {
      return directId;
    }

    if (!token || token.trim().length === 0) {
      return null;
    }

    const parts = token.split('.');
    if (parts.length < 2) {
      return null;
    }

    try {
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
      const payload = JSON.parse(atob(padded)) as { organizationId?: unknown };
      return typeof payload.organizationId === 'string' && payload.organizationId.trim().length > 0
        ? payload.organizationId.trim()
        : null;
    } catch {
      return null;
    }
  }, [token, user?.organizationId]);

  useEffect(() => {
    const isStaffDirectoryRoute = /^\/staff-management\/?$/.test(location.pathname);
    if (!isStaffDirectoryRoute) {
      return;
    }

    let isMounted = true;

    const loadOrganizationStaff = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const response = await api.get('/admin/staff', {
          params: {
            includeInactive: true,
            ...(resolvedOrganizationId ? { organizationId: resolvedOrganizationId } : {}),
          },
        });
        const mapped = extractItems<unknown>(response)
          .map((item) => mapEmployeeFromApi(item, departments, roles, branches))
          .filter((item): item is EmployeeDirectoryItem => item !== null);

        if (!isMounted) {
          return;
        }

        setEmployees(mapped);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Failed to load organization staff';
        setLoadError(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadOrganizationStaff();

    return () => {
      isMounted = false;
    };
  }, [branches, departments, location.pathname, resolvedOrganizationId, roles]);

  const activeStaffCount = useMemo(
    () => employees.filter((employee) => employee.status.toLowerCase() === 'active').length,
    [employees],
  );
  const onLeaveCount = useMemo(
    () => employees.filter((employee) => employee.status.toLowerCase() === 'on leave').length,
    [employees],
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-heading font-bold text-primary">
        Staff Management
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600 mr-4">
            <UsersIcon size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Total Employees</p>
            <h3 className="text-2xl font-heading font-bold text-primary">
              {isLoading ? '—' : employees.length}
            </h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-green-50 rounded-lg text-green-600 mr-4">
            <UserCheckIcon size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Active Staff</p>
            <h3 className="text-2xl font-heading font-bold text-primary">
              {isLoading ? '—' : activeStaffCount}
            </h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-yellow-50 rounded-lg text-yellow-600 mr-4">
            <UserMinusIcon size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">On Leave</p>
            <h3 className="text-2xl font-heading font-bold text-primary">{isLoading ? '—' : onLeaveCount}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-purple-50 rounded-lg text-purple-600 mr-4">
            <BriefcaseIcon size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Open Positions</p>
            <h3 className="text-2xl font-heading font-bold text-primary">12</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-6">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-heading font-bold text-primary">
            Employee Directory
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider font-heading">
                <th className="px-6 py-4 font-medium">Employee</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Branch</th>
                <th className="px-6 py-4 font-medium">Department</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {isLoading &&
              <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="inline-flex items-center gap-2">
                      <LoaderIcon size={18} className="animate-spin" />
                      <span>Loading organization staff...</span>
                    </div>
                  </td>
                </tr>
              }

              {!isLoading && loadError &&
              <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-red-600">
                    {loadError}
                  </td>
                </tr>
              }

              {!isLoading && !loadError && employees.length === 0 &&
              <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                    No staff records found for this organization.
                  </td>
                </tr>
              }

              {!isLoading && !loadError && employees.map((emp) =>
              <tr
                key={emp.id}
                onClick={() => navigate(`/staff-management/${emp.backendId}`)}
                className="hover:bg-gray-50 transition-colors cursor-pointer">
                
                  <td className="px-6 py-4">
                    <p className="font-heading font-medium text-primary">
                      {emp.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-400">{emp.id}</p>
                      {import.meta.env.DEV &&
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200">
                          {emp.organizationNameSource}
                        </span>
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{emp.role}</td>
                  <td className="px-6 py-4 text-gray-600">{emp.branch}</td>
                  <td className="px-6 py-4 text-gray-600">{emp.department}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={emp.status as any} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>);

}
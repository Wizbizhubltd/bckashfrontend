import { describe, expect, it, vi } from 'vitest';
import {
  upsertBranchScoped,
  upsertDepartmentScoped,
  upsertRoleScoped,
  type BranchLookup,
  type DepartmentLookup,
  type RoleLookup,
} from './lookupsSlice';
import type { RootState } from '../index';

const getStateWithOrg = (organizationId?: string): RootState =>
  ({
    auth: {
      user:
        organizationId === undefined
          ? null
          : {
              id: 'user-1',
              name: 'Test User',
              email: 'test@example.com',
              role: 'super_admin',
              organizationId,
              avatar: '',
            },
      token: 'token',
      isAuthenticated: true,
    },
    lookups: {
      states: [],
      departments: [],
      roles: [],
      branches: [],
      branchManagers: [],
      hydrated: false,
      loading: false,
      error: null,
    },
    ui: {
      isSidebarOpen: true,
      notifications: [],
      theme: 'light',
    },
    finConUi: {
      activeSection: 'overview',
      sectionFilters: {},
      dateRange: {
        from: null,
        to: null,
      },
      searchQuery: '',
      panelState: {
        isCollapsed: false,
      },
    },
  } as unknown as RootState);

describe('lookups scoped upsert thunks', () => {
  it('forces department organizationId from auth state', async () => {
    const payload: DepartmentLookup = {
      id: 'dept-1',
      name: 'Operations',
      organizationId: 'malicious-org',
    };

    const action = await upsertDepartmentScoped(payload)(
      vi.fn(),
      () => getStateWithOrg('org-123'),
      undefined,
    );

    expect(action.payload).toEqual({
      ...payload,
      organizationId: 'org-123',
    });
  });

  it('forces role organizationId from auth state', async () => {
    const payload: RoleLookup = {
      id: 'role-1',
      name: 'Branch Manager',
      department: 'Operations',
      organizationId: 'wrong-org',
    };

    const action = await upsertRoleScoped(payload)(
      vi.fn(),
      () => getStateWithOrg('org-456'),
      undefined,
    );

    expect(action.payload).toEqual({
      ...payload,
      organizationId: 'org-456',
    });
  });

  it('forces branch organizationId from auth state', async () => {
    const payload: BranchLookup = {
      id: 'branch-1',
      name: 'Ikeja Branch',
      organizationId: 'untrusted-org',
    };

    const action = await upsertBranchScoped(payload)(
      vi.fn(),
      () => getStateWithOrg('org-789'),
      undefined,
    );

    expect(action.payload).toEqual({
      ...payload,
      organizationId: 'org-789',
    });
  });

  it('returns null payload when auth orgId is missing', async () => {
    const payload: DepartmentLookup = {
      id: 'dept-2',
      name: 'Credit',
      organizationId: 'ignored',
    };

    const missingOrgAction = await upsertDepartmentScoped(payload)(
      vi.fn(),
      () => getStateWithOrg(undefined),
      undefined,
    );

    const blankOrgAction = await upsertDepartmentScoped(payload)(
      vi.fn(),
      () => getStateWithOrg('   '),
      undefined,
    );

    expect(missingOrgAction.payload).toBeNull();
    expect(blankOrgAction.payload).toBeNull();
  });
});

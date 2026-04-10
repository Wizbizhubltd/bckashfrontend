import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../app/api';
import type { RootState } from '../index';

export type LookupOption = {
  id: string;
  name: string;
};

export type DepartmentLookup = {
  id: string;
  name: string;
  description?: string;
  status?: 'Active' | 'Inactive';
  staffCount?: number;
  dateCreated?: string;
  organizationId?: string;
};

export type RoleLookup = {
  id: string;
  name: string;
  department: string;
  description?: string;
  staffCount?: number;
  status?: 'Active' | 'Inactive';
  dateCreated?: string;
  organizationId?: string;
};

export type BranchLookup = {
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
};

export type BranchManagerLookup = {
  id: string;
  fullName: string;
  email: string;
  userLevel: string;
};

type LookupsState = {
  states: LookupOption[];
  departments: DepartmentLookup[];
  roles: RoleLookup[];
  branches: BranchLookup[];
  branchManagers: BranchManagerLookup[];
  hydrated: boolean;
  loading: boolean;
  error: string | null;
};

type ApiEnvelope<T> = {
  data?: T;
  payload?: T;
  items?: T;
};

const getOrganizationIdFromState = (state: RootState): string | null => {
  const organizationId = state.auth.user?.organizationId;
  if (typeof organizationId !== 'string') {
    return null;
  }

  const trimmedOrganizationId = organizationId.trim();
  return trimmedOrganizationId.length > 0 ? trimmedOrganizationId : null;
};

const initialState: LookupsState = {
  states: [],
  departments: [],
  roles: [],
  branches: [],
  branchManagers: [],
  hydrated: false,
  loading: false,
  error: null,
};

const normalizeCollection = <T>(response: unknown): T[] => {
  if (!response || typeof response !== 'object') {
    return [];
  }

  const source = response as ApiEnvelope<T[]>;
  if (Array.isArray(source.data)) {
    return source.data;
  }

  if (Array.isArray(source.payload)) {
    return source.payload;
  }

  if (Array.isArray(source.items)) {
    return source.items;
  }

  return [];
};

const toStringId = (value: unknown): string => {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  if (!value || typeof value !== 'object') {
    return '';
  }

  const source = value as Record<string, unknown>;
  const preferred = source.id ?? source._id;
  if (typeof preferred === 'string' || typeof preferred === 'number') {
    return String(preferred);
  }

  return '';
};

const mapState = (raw: unknown): LookupOption | null => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const source = raw as Record<string, unknown>;
  const id = source.id ?? source._id ?? source.name;
  const name = source.name ?? source.title;

  if ((typeof id !== 'string' && typeof id !== 'number') || typeof name !== 'string') {
    return null;
  }

  return {
    id: String(id),
    name,
  };
};

const mapDepartment = (raw: unknown): DepartmentLookup | null => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const source = raw as Record<string, unknown>;
  const id = source.id ?? source._id;
  const name = source.name;

  if ((typeof id !== 'string' && typeof id !== 'number') || typeof name !== 'string') {
    return null;
  }

  return {
    id: String(id),
    name,
    description: typeof source.description === 'string' ? source.description : undefined,
    status: source.status === 'Inactive' ? 'Inactive' : 'Active',
    staffCount: typeof source.staffCount === 'number' ? source.staffCount : undefined,
    dateCreated: typeof source.dateCreated === 'string' ? source.dateCreated : undefined,
    organizationId: typeof source.organizationId === 'string' ? source.organizationId : undefined,
  };
};

const mapRole = (raw: unknown): RoleLookup | null => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const source = raw as Record<string, unknown>;
  const id = source.id ?? source._id;
  const name = source.name;
  const department = source.department;

  if (
    (typeof id !== 'string' && typeof id !== 'number') ||
    typeof name !== 'string' ||
    typeof department !== 'string'
  ) {
    return null;
  }

  return {
    id: String(id),
    name,
    department,
    description: typeof source.description === 'string' ? source.description : undefined,
    staffCount: typeof source.staffCount === 'number' ? source.staffCount : undefined,
    status: source.status === 'Inactive' ? 'Inactive' : 'Active',
    dateCreated: typeof source.dateCreated === 'string' ? source.dateCreated : undefined,
    organizationId: typeof source.organizationId === 'string' ? source.organizationId : undefined,
  };
};

const mapBranch = (raw: unknown): BranchLookup | null => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const source = raw as Record<string, unknown>;
  const id = source.id ?? source._id;
  const name = source.name;

  if ((typeof id !== 'string' && typeof id !== 'number') || typeof name !== 'string') {
    return null;
  }

  return {
    id: String(id),
    name,
    code: typeof source.code === 'string' ? source.code : undefined,
    address: typeof source.address === 'string' ? source.address : undefined,
    city: typeof source.city === 'string' ? source.city : undefined,
    state: typeof source.state === 'string' ? source.state : undefined,
    phone: typeof source.phone === 'string' ? source.phone : undefined,
    email: typeof source.email === 'string' ? source.email : undefined,
    managerId: toStringId(source.managerId) || undefined,
    organizationId: typeof source.organizationId === 'string' ? source.organizationId : undefined,
    isActive: typeof source.isActive === 'boolean' ? source.isActive : undefined,
  };
};

const deriveBranchManagersFromBranches = (branches: BranchLookup[], rawBranches: unknown[]): BranchManagerLookup[] => {
  const collected = new Map<string, BranchManagerLookup>();

  rawBranches.forEach((rawBranch) => {
    if (!rawBranch || typeof rawBranch !== 'object') {
      return;
    }

    const branchSource = rawBranch as Record<string, unknown>;
    const managerSource = branchSource.managerId;

    if (!managerSource || typeof managerSource !== 'object') {
      return;
    }

    const manager = managerSource as Record<string, unknown>;
    const id = toStringId(manager);
    if (!id) {
      return;
    }

    const fullName = `${typeof manager.firstName === 'string' ? manager.firstName : ''} ${typeof manager.lastName === 'string' ? manager.lastName : ''}`.trim();
    const fallbackName =
      (typeof manager.name === 'string' && manager.name.trim().length > 0 ? manager.name.trim() : '') ||
      (typeof manager.fullName === 'string' && manager.fullName.trim().length > 0 ? manager.fullName.trim() : '') ||
      fullName ||
      (branches.find((item) => item.managerId === id)?.name ?? 'Branch Manager');

    const email = typeof manager.email === 'string' ? manager.email : '';
    const userLevel = typeof manager.userLevel === 'string' ? manager.userLevel : 'BranchManager';

    collected.set(id, {
      id,
      fullName: fallbackName,
      email,
      userLevel,
    });
  });

  return Array.from(collected.values());
};

export const hydrateLookups = createAsyncThunk(
  'lookups/hydrateLookups',
  async () => {
    const [statesResponse, departmentsResponse, rolesResponse, branchesResponse] = await Promise.all([
      api.get('/locations/states'),
      api.get('/admin/departments'),
      api.get('/admin/roles'),
      api.get('/admin/branches'),
    ]);

    const normalizedBranches = normalizeCollection<unknown>(branchesResponse).map(mapBranch).filter(Boolean) as BranchLookup[];

    return {
      states: normalizeCollection<unknown>(statesResponse).map(mapState).filter(Boolean) as LookupOption[],
      departments: normalizeCollection<unknown>(departmentsResponse)
        .map(mapDepartment)
        .filter(Boolean) as DepartmentLookup[],
      roles: normalizeCollection<unknown>(rolesResponse).map(mapRole).filter(Boolean) as RoleLookup[],
      branches: normalizedBranches,
      branchManagers: deriveBranchManagersFromBranches(
        normalizedBranches,
        normalizeCollection<unknown>(branchesResponse),
      ),
    };
  },
  {
    condition: (_, { getState }) => {
      const state = getState() as RootState;
      if (state.lookups.loading) {
        return false;
      }
      if (state.lookups.hydrated) {
        return false;
      }
      return true;
    },
  },
);

export const upsertDepartmentScoped = createAsyncThunk<DepartmentLookup | null, DepartmentLookup, { state: RootState }>(
  'lookups/upsertDepartmentScoped',
  async (payload, { getState }) => {
    const organizationId = getOrganizationIdFromState(getState());
    if (!organizationId) {
      return null;
    }

    return {
      ...payload,
      organizationId,
    };
  },
);

export const upsertRoleScoped = createAsyncThunk<RoleLookup | null, RoleLookup, { state: RootState }>(
  'lookups/upsertRoleScoped',
  async (payload, { getState }) => {
    const organizationId = getOrganizationIdFromState(getState());
    if (!organizationId) {
      return null;
    }

    return {
      ...payload,
      organizationId,
    };
  },
);

export const upsertBranchScoped = createAsyncThunk<BranchLookup | null, BranchLookup, { state: RootState }>(
  'lookups/upsertBranchScoped',
  async (payload, { getState }) => {
    const organizationId = getOrganizationIdFromState(getState());
    if (!organizationId) {
      return null;
    }

    return {
      ...payload,
      organizationId,
    };
  },
);

const upsertById = <T extends { id: string }>(items: T[], incoming: T): T[] => {
  const existingIndex = items.findIndex((item) => item.id === incoming.id);
  if (existingIndex === -1) {
    return [...items, incoming];
  }

  const next = [...items];
  next[existingIndex] = incoming;
  return next;
};

const lookupsSlice = createSlice({
  name: 'lookups',
  initialState,
  reducers: {
    setStates(state, action: PayloadAction<LookupOption[]>) {
      state.states = action.payload;
    },
    setDepartments(state, action: PayloadAction<DepartmentLookup[]>) {
      state.departments = action.payload;
    },
    setRoles(state, action: PayloadAction<RoleLookup[]>) {
      state.roles = action.payload;
    },
    setBranches(state, action: PayloadAction<BranchLookup[]>) {
      state.branches = action.payload;
    },
    setBranchManagers(state, action: PayloadAction<BranchManagerLookup[]>) {
      state.branchManagers = action.payload;
    },
    mergeDepartmentInternal(state, action: PayloadAction<DepartmentLookup>) {
      state.departments = upsertById(state.departments, action.payload);
    },
    mergeRoleInternal(state, action: PayloadAction<RoleLookup>) {
      state.roles = upsertById(state.roles, action.payload);
    },
    mergeBranchInternal(state, action: PayloadAction<BranchLookup>) {
      state.branches = upsertById(state.branches, action.payload);
    },
    upsertBranchManager(state, action: PayloadAction<BranchManagerLookup>) {
      state.branchManagers = upsertById(state.branchManagers, action.payload);
    },
    clearLookups(state) {
      state.states = [];
      state.departments = [];
      state.roles = [];
      state.branches = [];
      state.branchManagers = [];
      state.hydrated = false;
      state.loading = false;
      state.error = null;
    },
    markLookupsStale(state) {
      state.hydrated = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateLookups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(hydrateLookups.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.hydrated = true;
        state.states = action.payload.states;
        state.departments = action.payload.departments;
        state.roles = action.payload.roles;
        state.branches = action.payload.branches;
        state.branchManagers = action.payload.branchManagers;
      })
      .addCase(hydrateLookups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to load lookup data';
      })
      .addCase(upsertDepartmentScoped.fulfilled, (state, action) => {
        if (!action.payload) {
          return;
        }
        state.departments = upsertById(state.departments, action.payload);
      })
      .addCase(upsertRoleScoped.fulfilled, (state, action) => {
        if (!action.payload) {
          return;
        }
        state.roles = upsertById(state.roles, action.payload);
      })
      .addCase(upsertBranchScoped.fulfilled, (state, action) => {
        if (!action.payload) {
          return;
        }
        state.branches = upsertById(state.branches, action.payload);
      });
  },
});

export const {
  setStates,
  setDepartments,
  setRoles,
  setBranches,
  setBranchManagers,
  upsertBranchManager,
  clearLookups,
  markLookupsStale,
} = lookupsSlice.actions;

export default lookupsSlice.reducer;

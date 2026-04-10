import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFormik } from 'formik';
import {
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  XIcon,
  BuildingIcon,
  ShieldIcon,
  CheckCircleIcon,
  UsersIcon,
  BriefcaseIcon } from
'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';
import { departmentSchema, roleSchema } from '../../validators/nonAuthSchemas';
import { api } from '../../app/api';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { hydrateLookups, markLookupsStale, upsertDepartmentScoped, upsertRoleScoped } from '../../store/slices/lookupsSlice';
import { useAuth } from '../../context/AuthContext';
// ─── Types ──────────────────────────────────────────────────────
interface Department {
  id: string;
  name: string;
  description: string;
  status: 'Active' | 'Inactive';
  staffCount: number;
  dateCreated: string;
  organizationId?: string;
}
interface Role {
  id: string;
  name: string;
  department: string;
  description: string;
  staffCount: number;
  status: 'Active' | 'Inactive';
  dateCreated: string;
  organizationId?: string;
}

function extractItem<T>(response: unknown): T | null {
  if (!response || typeof response !== 'object') {
    return null;
  }

  const source = response as { data?: T; payload?: T; item?: T };

  if (source.data && !Array.isArray(source.data)) {
    return source.data;
  }

  if (source.payload && !Array.isArray(source.payload)) {
    return source.payload;
  }

  if (source.item && !Array.isArray(source.item)) {
    return source.item;
  }

  return null;
}
// ─── Mock Data ──────────────────────────────────────────────────
const initialDepartments: Department[] = [
{
  id: 'DEP-001',
  name: 'Operations',
  description: 'Branch operations and field activities',
  status: 'Active',
  staffCount: 24,
  dateCreated: '2022-01-10'
},
{
  id: 'DEP-002',
  name: 'Credit & Risk',
  description: 'Loan underwriting, credit analysis and risk management',
  status: 'Active',
  staffCount: 12,
  dateCreated: '2022-01-10'
},
{
  id: 'DEP-003',
  name: 'Customer Service',
  description: 'Customer support and relationship management',
  status: 'Active',
  staffCount: 8,
  dateCreated: '2022-03-01'
},
{
  id: 'DEP-004',
  name: 'Finance & Accounts',
  description: 'Financial reporting, reconciliation and treasury',
  status: 'Active',
  staffCount: 6,
  dateCreated: '2022-01-10'
},
{
  id: 'DEP-005',
  name: 'IT & Support',
  description: 'Technology infrastructure and system support',
  status: 'Active',
  staffCount: 4,
  dateCreated: '2022-06-15'
},
{
  id: 'DEP-006',
  name: 'Human Resources',
  description: 'Staff recruitment, welfare and compliance',
  status: 'Inactive',
  staffCount: 3,
  dateCreated: '2023-02-01'
}];

const initialRoles: Role[] = [
{
  id: 'ROL-001',
  name: 'Branch Manager',
  department: 'Operations',
  description: 'Manages branch operations and staff',
  staffCount: 3,
  status: 'Active',
  dateCreated: '2022-01-10'
},
{
  id: 'ROL-002',
  name: 'Loan Officer',
  department: 'Operations',
  description: 'Processes loan applications in the field',
  staffCount: 7,
  status: 'Active',
  dateCreated: '2022-01-10'
},
{
  id: 'ROL-003',
  name: 'Credit Analyst',
  department: 'Credit & Risk',
  description: 'Evaluates loan applications and creditworthiness',
  staffCount: 4,
  status: 'Active',
  dateCreated: '2022-01-10'
},
{
  id: 'ROL-004',
  name: 'Customer Service Rep',
  department: 'Customer Service',
  description: 'Handles customer enquiries and complaints',
  staffCount: 5,
  status: 'Active',
  dateCreated: '2022-03-01'
},
{
  id: 'ROL-005',
  name: 'Teller',
  department: 'Operations',
  description: 'Processes cash transactions at the branch',
  staffCount: 6,
  status: 'Active',
  dateCreated: '2022-01-10'
},
{
  id: 'ROL-006',
  name: 'IT Admin',
  department: 'IT & Support',
  description: 'Manages systems and user access',
  staffCount: 2,
  status: 'Active',
  dateCreated: '2022-06-15'
},
{
  id: 'ROL-007',
  name: 'HR Officer',
  department: 'Human Resources',
  description: 'Handles recruitment and staff welfare',
  staffCount: 1,
  status: 'Active',
  dateCreated: '2023-02-01'
},
{
  id: 'ROL-008',
  name: 'Compliance Officer',
  department: 'Credit & Risk',
  description: 'Ensures regulatory compliance',
  staffCount: 2,
  status: 'Active',
  dateCreated: '2022-04-20'
}];

// ─── Shared helpers ─────────────────────────────────────────────
const inputClass =
'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all';
const selectClass = `${inputClass} bg-white`;

const toTitleCase = (value: string): string =>
value
  .split(/\s+/)
  .map((word) => {
    if (!word) {
      return word;
    }

    if (word === word.toUpperCase()) {
      return word;
    }

    return `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`;
  })
  .join(' ');

function mapDepartment(raw: unknown): Department | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const source = raw as Record<string, unknown>;
  const id = source.id ?? source._id;
  const name = source.name;
  const description = source.description;

  if ((typeof id !== 'string' && typeof id !== 'number') || typeof name !== 'string' || typeof description !== 'string') {
    return null;
  }

  const status = source.status === 'Inactive' ? 'Inactive' : 'Active';
  const staffCount = typeof source.staffCount === 'number' ? source.staffCount : 0;
  const dateCreated = typeof source.dateCreated === 'string' ? source.dateCreated : '';

  return {
    id: String(id),
    name,
    description,
    status,
    staffCount,
    dateCreated,
    organizationId: typeof source.organizationId === 'string' ? source.organizationId : undefined,
  };
}

function mapRole(raw: unknown): Role | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const source = raw as Record<string, unknown>;
  const id = source.id ?? source._id;
  const name = source.name;
  const department = source.department;
  const description = source.description;

  if (
    (typeof id !== 'string' && typeof id !== 'number') ||
    typeof name !== 'string' ||
    typeof department !== 'string' ||
    typeof description !== 'string'
  ) {
    return null;
  }

  const status = source.status === 'Inactive' ? 'Inactive' : 'Active';
  const staffCount = typeof source.staffCount === 'number' ? source.staffCount : 0;
  const dateCreated = typeof source.dateCreated === 'string' ? source.dateCreated : '';

  return {
    id: String(id),
    name,
    department,
    description,
    staffCount,
    status,
    dateCreated,
    organizationId: typeof source.organizationId === 'string' ? source.organizationId : undefined,
  };
}

function ModalWrapper({
  isOpen,
  onClose,
  children




}: {isOpen: boolean;onClose: () => void;children: React.ReactNode;}) {
  return (
    <AnimatePresence>
      {isOpen &&
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
        
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
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
          
            {children}
          </motion.div>
        </motion.div>
      }
    </AnimatePresence>);

}
// ─── Component ──────────────────────────────────────────────────
export function DepartmentsRoles() {
  const { user, token } = useAuth();
  const dispatch = useAppDispatch();
  const lookupDepartments = useAppSelector((state) => state.lookups.departments);
  const lookupRoles = useAppSelector((state) => state.lookups.roles);

  const resolveOrganizationIdFromToken = (jwtToken?: string | null): string | null => {
    if (!jwtToken || jwtToken.trim().length === 0) {
      return null;
    }

    const parts = jwtToken.split('.');
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
  };

  const userRecord = user as (typeof user & {
    organization?: { id?: string | null; name?: string | null } | null;
  }) | null;
  const organizationIdFromUser =
    typeof user?.organizationId === 'string' && user.organizationId.trim().length > 0
      ? user.organizationId.trim()
      : typeof userRecord?.organization?.id === 'string' && userRecord.organization.id.trim().length > 0
        ? userRecord.organization.id.trim()
        : resolveOrganizationIdFromToken(token);

  const [departments, setDepartments] =
  useState<Department[]>(initialDepartments);
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [isSubmittingDepartment, setIsSubmittingDepartment] = useState(false);
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);
  // Modal states
  const [deptModal, setDeptModal] = useState<{
    open: boolean;
    editing: Department | null;
  }>({
    open: false,
    editing: null
  });
  const [roleModal, setRoleModal] = useState<{
    open: boolean;
    editing: Role | null;
  }>({
    open: false,
    editing: null
  });
  const [deleteModal, setDeleteModal] = useState<{
    type: 'dept' | 'role';
    id: string;
    name: string;
    staffCount?: number;
  } | null>(null);
  useEffect(() => {
    if (lookupDepartments.length > 0) {
      const normalizedDepartments = lookupDepartments.map((department) => ({
        id: department.id,
        name: department.name,
        description: department.description ?? '',
        status: (department.status === 'Inactive' ? 'Inactive' : 'Active') as Department['status'],
        staffCount: typeof department.staffCount === 'number' ? department.staffCount : 0,
        dateCreated: department.dateCreated ?? '',
        organizationId: department.organizationId,
      }));
      setDepartments(normalizedDepartments);
    } else {
      setDepartments(initialDepartments);
    }
  }, [lookupDepartments]);

  useEffect(() => {
    if (lookupRoles.length > 0) {
      const normalizedRoles = lookupRoles.map((role) => ({
        id: role.id,
        name: role.name,
        department: role.department,
        description: role.description ?? '',
        staffCount: typeof role.staffCount === 'number' ? role.staffCount : 0,
        status: (role.status === 'Inactive' ? 'Inactive' : 'Active') as Role['status'],
        dateCreated: role.dateCreated ?? '',
        organizationId: role.organizationId,
      }));
      setRoles(normalizedRoles);
    } else {
      setRoles(initialRoles);
    }
  }, [lookupRoles]);

  const deptFormik = useFormik({
    initialValues: {
      name: '',
      description: ''
    },
    validationSchema: departmentSchema,
    validateOnMount: true,
    onSubmit: async (values) => {
      if (!organizationIdFromUser) {
        showToast('Organization ID is missing from your account');
        return;
      }

      if (deptModal.editing) {
        setDepartments((prev) =>
        prev.map((d) =>
        d.id === deptModal.editing!.id ?
        {
          ...d,
          name: values.name.trim(),
          description: values.description.trim(),
          organizationId: organizationIdFromUser,
        } :
        d
        )
        );
        showToast('Department updated successfully');
      } else {
        try {
          setIsSubmittingDepartment(true);
          const response = await api.post('/admin/departments', {
            name: values.name.trim(),
            description: values.description.trim(),
            organizationId: organizationIdFromUser,
          });

          const createdRaw = extractItem<unknown>(response);
          const createdDepartment = mapDepartment(createdRaw);
          if (createdDepartment) {
            dispatch(
              upsertDepartmentScoped({
                id: createdDepartment.id,
                name: createdDepartment.name,
                description: createdDepartment.description,
                status: createdDepartment.status,
                staffCount: createdDepartment.staffCount,
                dateCreated: createdDepartment.dateCreated,
                organizationId: createdDepartment.organizationId,
              }),
            );
          }

          dispatch(markLookupsStale());
          await dispatch(hydrateLookups());

          showToast(`Department "${values.name.trim()}" created`);
        } catch {
          const newDept: Department = {
            id: `DEP-${String(departments.length + 1).padStart(3, '0')}`,
            name: values.name.trim(),
            description: values.description.trim(),
            status: 'Active',
            staffCount: 0,
            dateCreated: new Date().toISOString().split('T')[0],
            organizationId: organizationIdFromUser,
          };
          setDepartments((prev) => [...prev, newDept]);
          showToast(`Department "${newDept.name}" created (local fallback)`);
        } finally {
          setIsSubmittingDepartment(false);
        }
      }
      closeDeptModal();
    }
  });

  const roleFormik = useFormik({
    initialValues: {
      name: '',
      department: '',
      description: ''
    },
    validationSchema: roleSchema,
    validateOnMount: true,
    onSubmit: async (values) => {
      if (!organizationIdFromUser) {
        showToast('Organization ID is missing from your account');
        return;
      }

      if (roleModal.editing) {
        const editingRole = roleModal.editing;
        const selectedDepartmentName =
        departments.find((dept) => dept.id === values.department)?.name ||
        values.department;

        setRoles((prev) =>
        prev.map((r) =>
        r.id === editingRole.id ?
        {
          ...r,
          name: values.name.trim(),
          department: selectedDepartmentName,
          description: values.description.trim(),
            staffCount: editingRole.staffCount,
          organizationId: organizationIdFromUser,
        } :
        r
        )
        );
        showToast('Role updated successfully');
      } else {
        try {
          setIsSubmittingRole(true);
          const response = await api.post('/admin/roles', {
            name: values.name.trim(),
            description: values.description.trim(),
            departmentId: values.department,
            organizationId: organizationIdFromUser,
          });

          const createdRaw = extractItem<unknown>(response);
          const createdRole = mapRole(createdRaw);
          if (createdRole) {
            dispatch(
              upsertRoleScoped({
                id: createdRole.id,
                name: createdRole.name,
                department: createdRole.department,
                description: createdRole.description,
                staffCount: createdRole.staffCount,
                status: createdRole.status,
                dateCreated: createdRole.dateCreated,
                organizationId: createdRole.organizationId,
              }),
            );
          }

          dispatch(markLookupsStale());
          await dispatch(hydrateLookups());

          showToast(`Role "${values.name.trim()}" created`);
        } catch {
          const selectedDepartmentName =
          departments.find((dept) => dept.id === values.department)?.name ||
          values.department;

          const newRole: Role = {
            id: `ROL-${String(roles.length + 1).padStart(3, '0')}`,
            name: values.name.trim(),
            department: selectedDepartmentName,
            description: values.description.trim(),
            staffCount: 0,
            status: 'Active',
            dateCreated: new Date().toISOString().split('T')[0],
            organizationId: organizationIdFromUser,
          };
          setRoles((prev) => [...prev, newRole]);
          showToast(`Role "${newRole.name}" created (local fallback)`);
        } finally {
          setIsSubmittingRole(false);
        }
      }
      closeRoleModal();
    }
  });
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
  // ─── Department CRUD ────────────────────────────────────────
  function openDeptModal(dept?: Department) {
    if (dept) {
      if (dept.staffCount > 0) {
        showToast('You cannot edit a department that already has staff members');
        return;
      }

      deptFormik.setValues({
        name: dept.name,
        description: dept.description
      });
      deptFormik.setTouched({});
      setDeptModal({
        open: true,
        editing: dept
      });
    } else {
      deptFormik.setValues({
        name: '',
        description: ''
      });
      deptFormik.setTouched({});
      setDeptModal({
        open: true,
        editing: null
      });
    }
  }
  function closeDeptModal() {
    deptFormik.resetForm();
    setDeptModal({
      open: false,
      editing: null
    });
  }
  function toggleDeptStatus(id: string) {
    setDepartments((prev) =>
    prev.map((d) =>
    d.id === id ?
    {
      ...d,
      status: d.status === 'Active' ? 'Inactive' : 'Active'
    } :
    d
    )
    );
    showToast('Department status updated');
  }
  // ─── Role CRUD ──────────────────────────────────────────────
  function openRoleModal(role?: Role) {
    if (role) {
      if (role.staffCount > 0) {
        showToast('You cannot edit a role that already has staff members');
        return;
      }

      const matchedDepartment = departments.find((dept) => dept.name === role.department);
      roleFormik.setValues({
        name: role.name,
        department: matchedDepartment?.id || '',
        description: role.description
      });
      roleFormik.setTouched({});
      setRoleModal({
        open: true,
        editing: role
      });
    } else {
      roleFormik.setValues({
        name: '',
        department: departments.find((d) => d.status === 'Active')?.id || '',
        description: ''
      });
      roleFormik.setTouched({});
      setRoleModal({
        open: true,
        editing: null
      });
    }
  }
  function closeRoleModal() {
    roleFormik.resetForm();
    setRoleModal({
      open: false,
      editing: null
    });
  }
  function toggleRoleStatus(id: string) {
    setRoles((prev) =>
    prev.map((r) =>
    r.id === id ?
    {
      ...r,
      status: r.status === 'Active' ? 'Inactive' : 'Active'
    } :
    r
    )
    );
    showToast('Role status updated');
  }
  function handleDelete() {
    if (!deleteModal) return;
    if (deleteModal.type === 'dept') {
      if ((deleteModal.staffCount ?? 0) > 0) {
        showToast('You cannot delete a department that already has staff members');
        setDeleteModal(null);
        return;
      }

      setDepartments((prev) => prev.filter((d) => d.id !== deleteModal.id));
      showToast(`Department "${deleteModal.name}" deleted`);
    } else {
      if ((deleteModal.staffCount ?? 0) > 0) {
        showToast('You cannot delete a role that already has staff members');
        setDeleteModal(null);
        return;
      }

      setRoles((prev) => prev.filter((r) => r.id !== deleteModal.id));
      showToast(`Role "${deleteModal.name}" deleted`);
    }
    setDeleteModal(null);
  }
  const activeDepts = departments.filter((d) => d.status === 'Active').length;
  return (
    <div className="space-y-8">
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

      {/* Delete Confirmation */}
      <ModalWrapper
        isOpen={deleteModal !== null}
        onClose={() => setDeleteModal(null)}>
        
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Trash2Icon size={24} className="text-red-600" />
          </div>
          <h3 className="text-lg font-heading font-bold text-gray-900 mb-2">
            Delete {deleteModal?.type === 'dept' ? 'Department' : 'Role'}
          </h3>
          <p className="text-sm font-body text-gray-500 mb-6">
            Are you sure you want to delete <strong>{deleteModal?.name}</strong>
            ? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setDeleteModal(null)}
              className="px-4 py-2 text-sm font-heading font-bold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-heading font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              
              Delete
            </button>
          </div>
        </div>
      </ModalWrapper>

      {/* ─── Departments ─────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BuildingIcon size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-heading font-bold text-gray-900">
                Departments
              </h3>
              <p className="text-sm font-body text-gray-500">
                {activeDepts} active of {departments.length} total
              </p>
            </div>
          </div>
          <button
            onClick={() => openDeptModal()}
            className="flex items-center gap-1.5 px-4 py-2 bg-accent text-white rounded-lg text-sm font-heading font-bold hover:bg-[#e64a19] transition-colors">
            
            <PlusIcon size={14} />
            Add Department
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider font-heading">
                <th className="px-6 py-3 font-medium">Department</th>
                <th className="px-6 py-3 font-medium">Description</th>
                <th className="px-6 py-3 font-medium">Staff</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Created</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {departments.map((dept) =>
              <tr
                key={dept.id}
                className="hover:bg-gray-50/50 transition-colors">
                
                  <td className="px-6 py-4">
                    <p className="font-heading font-medium text-gray-900">
                      {toTitleCase(dept.name)}
                    </p>
                    <p className="text-xs text-gray-400">{dept.id}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600 max-w-[200px] truncate">
                    {toTitleCase(dept.description)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1 text-gray-600">
                      <UsersIcon size={13} />
                      {dept.staffCount}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleDeptStatus(dept.id)}>
                      <StatusBadge status={dept.status as any} />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {dept.dateCreated}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                    onClick={() => openDeptModal(dept)}
                    className="text-primary hover:text-accent mr-3 transition-colors">
                    
                      <PencilIcon size={14} />
                    </button>
                    <button
                    onClick={() => {
                    if (dept.staffCount > 0) {
                      showToast('You cannot delete a department that already has staff members');
                      return;
                    }

                    setDeleteModal({
                      type: 'dept',
                      id: dept.id,
                      name: dept.name,
                      staffCount: dept.staffCount,
                    });
                    }}
                    className={`transition-colors ${dept.staffCount > 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-red-600'}`}>
                    
                      <Trash2Icon size={14} />
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Department Modal */}
      <ModalWrapper
        isOpen={deptModal.open}
        onClose={closeDeptModal}>
        
        <button
          onClick={closeDeptModal}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
          
          <XIcon size={18} />
        </button>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <BuildingIcon size={20} />
          </div>
          <div>
            <h3 className="text-lg font-heading font-bold text-gray-900">
              {deptModal.editing ? 'Edit Department' : 'Add Department'}
            </h3>
            <p className="text-xs font-body text-gray-500">
              {deptModal.editing ?
              deptModal.editing.id :
              'Create a new department'}
            </p>
          </div>
        </div>
        <form onSubmit={deptFormik.handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-body font-medium text-gray-600 mb-1.5">
              Department Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={deptFormik.values.name}
              onChange={deptFormik.handleChange}
              onBlur={deptFormik.handleBlur}
              placeholder="e.g. Operations"
              className={inputClass}
              required />

            {deptFormik.touched.name && deptFormik.errors.name &&
            <p className="text-xs text-red-600 mt-1">{deptFormik.errors.name}</p>
            }
          </div>
          <div>
            <label className="block text-xs font-body font-medium text-gray-600 mb-1.5">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={deptFormik.values.description}
              onChange={deptFormik.handleChange}
              onBlur={deptFormik.handleBlur}
              placeholder="Brief description of the department"
              rows={3}
              className={`${inputClass} resize-none`} />
            
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={closeDeptModal}
              className="px-4 py-2 text-sm font-heading font-bold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              
              Cancel
            </button>
            <button
              type="submit"
              disabled={!deptFormik.isValid || isSubmittingDepartment}
              className="px-4 py-2 text-sm font-heading font-bold bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              
              {isSubmittingDepartment ? 'Saving...' : deptModal.editing ? 'Save Changes' : 'Add Department'}
            </button>
          </div>
        </form>
      </ModalWrapper>

      {/* ─── Roles ───────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <ShieldIcon size={20} className="text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-heading font-bold text-gray-900">
                Roles
              </h3>
              <p className="text-sm font-body text-gray-500">
                {roles.filter((r) => r.status === 'Active').length} active roles
                across {activeDepts} departments
              </p>
            </div>
          </div>
          <button
            onClick={() => openRoleModal()}
            className="flex items-center gap-1.5 px-4 py-2 bg-accent text-white rounded-lg text-sm font-heading font-bold hover:bg-[#e64a19] transition-colors">
            
            <PlusIcon size={14} />
            Add Role
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider font-heading">
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">Department</th>
                <th className="px-6 py-3 font-medium">Staff</th>
                <th className="px-6 py-3 font-medium">Description</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Created</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {roles.map((role) =>
              <tr
                key={role.id}
                className="hover:bg-gray-50/50 transition-colors">
                
                  <td className="px-6 py-4">
                    <p className="font-heading font-medium text-gray-900">
                      {toTitleCase(role.name)}
                    </p>
                    <p className="text-xs text-gray-400">{role.id}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-gray-600">
                      <BriefcaseIcon size={13} />
                      {toTitleCase(role.department)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1 text-gray-600">
                      <UsersIcon size={13} />
                      {role.staffCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 max-w-[200px] truncate">
                    {toTitleCase(role.description)}
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleRoleStatus(role.id)}>
                      <StatusBadge status={role.status as any} />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {role.dateCreated}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                    onClick={() => openRoleModal(role)}
                    className={`mr-3 transition-colors ${role.staffCount > 0 ? 'text-gray-300 cursor-not-allowed' : 'text-primary hover:text-accent'}`}>
                    
                      <PencilIcon size={14} />
                    </button>
                    <button
                    onClick={() => {
                    if (role.staffCount > 0) {
                      showToast('You cannot delete a role that already has staff members');
                      return;
                    }

                    setDeleteModal({
                      type: 'role',
                      id: role.id,
                      name: role.name,
                      staffCount: role.staffCount,
                    });
                    }}
                    className={`transition-colors ${role.staffCount > 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-red-600'}`}>
                    
                      <Trash2Icon size={14} />
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Modal */}
      <ModalWrapper
        isOpen={roleModal.open}
        onClose={closeRoleModal}>
        
        <button
          onClick={closeRoleModal}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
          
          <XIcon size={18} />
        </button>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
            <ShieldIcon size={20} />
          </div>
          <div>
            <h3 className="text-lg font-heading font-bold text-gray-900">
              {roleModal.editing ? 'Edit Role' : 'Add Role'}
            </h3>
            <p className="text-xs font-body text-gray-500">
              {roleModal.editing ? roleModal.editing.id : 'Create a new role'}
            </p>
          </div>
        </div>
        <form onSubmit={roleFormik.handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-body font-medium text-gray-600 mb-1.5">
              Role Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={roleFormik.values.name}
              onChange={roleFormik.handleChange}
              onBlur={roleFormik.handleBlur}
              placeholder="e.g. Loan Officer"
              className={inputClass}
              required />

            {roleFormik.touched.name && roleFormik.errors.name &&
            <p className="text-xs text-red-600 mt-1">{roleFormik.errors.name}</p>
            }
          </div>
          <div>
            <label className="block text-xs font-body font-medium text-gray-600 mb-1.5">
              Department <span className="text-red-500">*</span>
            </label>
            <select
              id="department"
              name="department"
              value={roleFormik.values.department}
              onChange={roleFormik.handleChange}
              onBlur={roleFormik.handleBlur}
              className={selectClass}
              required>
              
              <option value="">Select department...</option>
              {departments.
              filter((d) => d.status === 'Active').
              map((d) =>
              <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
              )}
            </select>

            {roleFormik.touched.department && roleFormik.errors.department &&
            <p className="text-xs text-red-600 mt-1">{roleFormik.errors.department}</p>
            }
          </div>
          <div>
            <label className="block text-xs font-body font-medium text-gray-600 mb-1.5">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={roleFormik.values.description}
              onChange={roleFormik.handleChange}
              onBlur={roleFormik.handleBlur}
              placeholder="Brief description of the role"
              rows={3}
              className={`${inputClass} resize-none`} />
            
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={closeRoleModal}
              className="px-4 py-2 text-sm font-heading font-bold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              
              Cancel
            </button>
            <button
              type="submit"
              disabled={!roleFormik.isValid || isSubmittingRole}
              className="px-4 py-2 text-sm font-heading font-bold bg-accent text-white rounded-lg hover:bg-[#e64a19] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              
              {isSubmittingRole ? 'Saving...' : roleModal.editing ? 'Save Changes' : 'Add Role'}
            </button>
          </div>
        </form>
      </ModalWrapper>
    </div>);

}
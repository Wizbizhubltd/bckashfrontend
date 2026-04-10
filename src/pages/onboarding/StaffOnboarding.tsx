import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2Icon, ChevronRightIcon, PlusIcon, UploadCloudIcon, XIcon } from 'lucide-react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { api } from '../../app/api';
import { ReusableReactSelect, SelectOption } from '../../components/ReusableReactSelect';
import { useAuth } from '../../context/AuthContext';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { hydrateLookups, markLookupsStale, upsertBranchManager } from '../../store/slices/lookupsSlice';

type OptionItem = {
  id: string;
  name: string;
};

type StaffOnboardingValues = {
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  state: string;
  city: string;
  address: string;
  departmentId: string;
  staffLevel: string;
  roleId: string;
  branchId: string;
  startDate: string;
  bvn: string;
  idType: string;
  idNumber: string;
  nokName: string;
  nokRelationship: string;
  nokPhone: string;
  nokAddress: string;
  referenceName: string;
  referenceRelationship: string;
  referencePhone: string;
  referenceAddress: string;
};

const steps = [
  { id: 1, title: 'Personal Info' },
  { id: 2, title: 'Employment Details' },
  { id: 3, title: 'KYC & Contacts' },
  { id: 4, title: 'Review' },
] as const;

const initialValues: StaffOnboardingValues = {
  fullName: '',
  email: '',
  phoneNumber: '',
  dateOfBirth: '',
  gender: '',
  state: '',
  city: '',
  address: '',
  departmentId: '',
  staffLevel: '',
  roleId: '',
  branchId: '',
  startDate: '',
  bvn: '',
  idType: '',
  idNumber: '',
  nokName: '',
  nokRelationship: '',
  nokPhone: '',
  nokAddress: '',
  referenceName: '',
  referenceRelationship: '',
  referencePhone: '',
  referenceAddress: '',
};

const numericPhoneRule = Yup.string()
  .matches(/^\d{7,15}$/, 'Phone number must be 7-15 digits')
  .required('Phone number is required');

const fullSchema = Yup.object({
  fullName: Yup.string().trim().required('Full name is required'),
  email: Yup.string().trim().email('Enter a valid email').required('Email is required'),
  phoneNumber: numericPhoneRule,
  dateOfBirth: Yup.string().required('Date of birth is required'),
  gender: Yup.string().required('Gender is required'),
  state: Yup.string().trim().required('State is required'),
  city: Yup.string().trim().required('City is required'),
  address: Yup.string().trim().required('Address is required'),
  departmentId: Yup.string().required('Department is required'),
  staffLevel: Yup.string().required('Staff level is required'),
  roleId: Yup.string().required('Role is required'),
  branchId: Yup.string().required('Branch is required'),
  startDate: Yup.string().required('Start date is required'),
  bvn: Yup.string().matches(/^\d{11}$/, 'BVN must be 11 digits').required('BVN is required'),
  idType: Yup.string().required('ID type is required'),
  idNumber: Yup.string().trim().required('ID number is required'),
  nokName: Yup.string().trim().required('Next of kin name is required'),
  nokRelationship: Yup.string().trim().required('Next of kin relationship is required'),
  nokPhone: numericPhoneRule,
  nokAddress: Yup.string().trim().required('Next of kin address is required'),
  referenceName: Yup.string().trim().required('Reference name is required'),
  referenceRelationship: Yup.string().trim().required('Reference relationship is required'),
  referencePhone: numericPhoneRule,
  referenceAddress: Yup.string().trim().required('Reference address is required'),
});

const stepFieldMap: Record<number, Array<keyof StaffOnboardingValues>> = {
  1: ['fullName', 'email', 'phoneNumber', 'dateOfBirth', 'gender', 'state', 'city', 'address'],
  2: ['departmentId', 'staffLevel', 'roleId', 'branchId', 'startDate'],
  3: [
    'bvn',
    'idType',
    'idNumber',
    'nokName',
    'nokRelationship',
    'nokPhone',
    'nokAddress',
    'referenceName',
    'referenceRelationship',
    'referencePhone',
    'referenceAddress',
  ],
  4: [],
};

const fallbackDepartments: OptionItem[] = [
  { id: 'operations', name: 'Operations' },
  { id: 'credit-risk', name: 'Credit & Risk' },
  { id: 'customer-service', name: 'Customer Service' },
];

const fallbackRolesByDepartment: Record<string, OptionItem[]> = {
  operations: [
    { id: 'branch-manager', name: 'Branch Manager' },
    { id: 'loan-officer', name: 'Loan Officer' },
  ],
  'credit-risk': [
    { id: 'credit-analyst', name: 'Credit Analyst' },
    { id: 'compliance-officer', name: 'Compliance Officer' },
  ],
  'customer-service': [{ id: 'customer-service-rep', name: 'Customer Service Rep' }],
};

const fallbackBranches: OptionItem[] = [
  { id: 'ikeja', name: 'Ikeja Branch' },
  { id: 'surulere', name: 'Surulere Branch' },
  { id: 'mushin', name: 'Mushin Branch' },
  { id: 'head-office', name: 'Head Office' },
];

const genderOptions: SelectOption[] = [
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
];

const staffLevelOptions: SelectOption[] = [
  { label: 'Super Admin', value: 'SuperAdmin' },
  { label: 'Branch Manager', value: 'BranchManager' },
  { label: 'Marketer', value: 'Marketer' },
  { label: 'Authorizer', value: 'Authorizer' },
];

const idTypeOptions: SelectOption[] = [
  { label: 'NIN (National ID)', value: 'NIN' },
  { label: 'International Passport', value: 'Passport' },
  { label: "Driver's License", value: 'DriversLicense' },
  { label: "Voter's Card", value: 'VotersCard' },
];

function normalizeName(input: string): string {
  return input.trim().toLowerCase();
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

function mapCreatedBranchManager(raw: unknown) {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const source = raw as Record<string, unknown>;
  const id = source.id ?? source._id;
  const firstName = source.firstName;
  const lastName = source.lastName;
  const email = source.email;
  const userLevel = source.userLevel;

  if (
    (typeof id !== 'string' && typeof id !== 'number') ||
    typeof firstName !== 'string' ||
    typeof lastName !== 'string' ||
    typeof email !== 'string' ||
    typeof userLevel !== 'string'
  ) {
    return null;
  }

  if (userLevel.toLowerCase() !== 'branchmanager') {
    return null;
  }

  return {
    id: String(id),
    fullName: `${firstName} ${lastName}`.trim(),
    email,
    userLevel,
  };
}

export function StaffOnboarding() {
  const { user, token } = useAuth();
  const dispatch = useAppDispatch();
  const [step, setStep] = useState(1);
  const [cities, setCities] = useState<OptionItem[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [departmentModalOpen, setDepartmentModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [isCreatingDepartment, setIsCreatingDepartment] = useState(false);
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [departmentForm, setDepartmentForm] = useState({ name: '', description: '' });
  const [roleForm, setRoleForm] = useState({ name: '', description: '', departmentId: '' });
  const [modalError, setModalError] = useState<string | null>(null);
  const [inlineCreateSuccess, setInlineCreateSuccess] = useState<string | null>(null);

  const storeStates = useAppSelector((state) => state.lookups.states);
  const storeDepartments = useAppSelector((state) => state.lookups.departments);
  const storeRoles = useAppSelector((state) => state.lookups.roles);
  const storeBranches = useAppSelector((state) => state.lookups.branches);
  const isLoadingOptions = useAppSelector((state) => state.lookups.loading);
  const optionsError = useAppSelector((state) => state.lookups.error);

  const states = useMemo<OptionItem[]>(() => {
    if (storeStates.length > 0) {
      return storeStates.map((stateItem) => ({ id: stateItem.id, name: stateItem.name }));
    }
    return [];
  }, [storeStates]);

  const departments = useMemo<OptionItem[]>(() => {
    if (storeDepartments.length > 0) {
      return storeDepartments.map((department) => ({ id: department.id, name: department.name }));
    }
    return fallbackDepartments;
  }, [storeDepartments]);

  const branches = useMemo<OptionItem[]>(() => {
    if (storeBranches.length > 0) {
      return storeBranches.map((branch) => ({ id: branch.id, name: branch.name }));
    }
    return fallbackBranches;
  }, [storeBranches]);

  const formik = useFormik<StaffOnboardingValues>({
    initialValues,
    validationSchema: fullSchema,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: async (values) => {
      setSubmissionMessage(null);
      setSubmissionError(null);

      if (!resolvedOrganizationId) {
        setSubmissionError('Organization ID is missing in your session. Please log in again as a Super Admin.');
        return;
      }

      const payload = {
        fullName: values.fullName.trim(),
        email: values.email.trim().toLowerCase(),
        organizationId: resolvedOrganizationId,
        phoneNumber: values.phoneNumber.trim(),
        dateOfBirth: values.dateOfBirth,
        gender: values.gender,
        state: values.state.trim(),
        city: values.city.trim(),
        address: values.address.trim(),
        departmentId: values.departmentId,
        roleId: values.roleId,
        branchId: values.branchId,
        staffLevel: values.staffLevel,
        userType: 'None',
        startDate: values.startDate,
        bvn: values.bvn.trim(),
        idType: values.idType,
        idNumber: values.idNumber.trim(),
        nokName: values.nokName.trim(),
        nokRelationship: values.nokRelationship.trim(),
        nokPhone: values.nokPhone.trim(),
        nokAddress: values.nokAddress.trim(),
        referenceName: values.referenceName.trim(),
        referenceRelationship: values.referenceRelationship.trim(),
        referencePhone: values.referencePhone.trim(),
        referenceAddress: values.referenceAddress.trim(),
      };

      try {
        const response = await api.post('/users', payload);
        const createdRaw = extractItem<unknown>(response);
        const createdBranchManager = mapCreatedBranchManager(createdRaw);
        if (createdBranchManager) {
          dispatch(upsertBranchManager(createdBranchManager));
        }

        setSubmissionMessage('Staff registration submitted successfully. Login credentials will be sent by email.');
        formik.resetForm();
        setCities([]);
        setStep(1);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to submit staff registration';
        setSubmissionError(message);
      }
    },
  });

  const selectedDepartment = useMemo(
    () => departments.find((item) => item.id === formik.values.departmentId),
    [departments, formik.values.departmentId],
  );
  const selectedRole = useMemo(
    () => storeRoles.find((item) => item.id === formik.values.roleId),
    [storeRoles, formik.values.roleId],
  );
  const selectedBranch = useMemo(
    () => branches.find((item) => item.id === formik.values.branchId),
    [branches, formik.values.branchId],
  );

  const stateOptions: SelectOption[] = useMemo(
    () => states.map((stateItem) => ({ label: stateItem.name, value: stateItem.name })),
    [states],
  );

  const cityOptions: SelectOption[] = useMemo(
    () => cities.map((cityItem) => ({ label: cityItem.name, value: cityItem.name })),
    [cities],
  );

  const departmentOptions: SelectOption[] = useMemo(
    () => departments.map((department) => ({ label: department.name, value: department.id })),
    [departments],
  );

  const selectedDepartmentName = useMemo(
    () => departments.find((department) => department.id === formik.values.departmentId)?.name,
    [departments, formik.values.departmentId],
  );

  const roles = useMemo<OptionItem[]>(() => {
    if (!selectedDepartmentName) {
      return [];
    }

    const matches = storeRoles
      .filter((role) => normalizeName(role.department) === normalizeName(selectedDepartmentName))
      .map((role) => ({ id: role.id, name: role.name }));

    if (matches.length > 0) {
      return matches;
    }

    return fallbackRolesByDepartment[formik.values.departmentId] ?? [];
  }, [storeRoles, selectedDepartmentName, formik.values.departmentId]);

  const roleOptions: SelectOption[] = useMemo(
    () => roles.map((role) => ({ label: role.name, value: role.id })),
    [roles],
  );

  const branchOptions: SelectOption[] = useMemo(
    () => branches.map((branch) => ({ label: branch.name, value: branch.id })),
    [branches],
  );

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

  const resolvedOrganizationId = useMemo(() => {
    const directId = typeof user?.organizationId === 'string' && user.organizationId.trim().length > 0
      ? user.organizationId.trim()
      : null;

    return directId ?? resolveOrganizationIdFromToken(token);
  }, [token, user?.organizationId]);

  const createDepartmentInline = async () => {
    setModalError(null);

    if (!resolvedOrganizationId) {
      setModalError('Organization ID is missing in your session. Please log in again as a Super Admin.');
      return;
    }

    const name = departmentForm.name.trim();
    const description = departmentForm.description.trim();

    if (!name) {
      setModalError('Department name is required.');
      return;
    }

    try {
      setIsCreatingDepartment(true);
      const response = await api.post('/admin/departments', {
        name,
        description,
        organizationId: resolvedOrganizationId,
      });

      const createdRaw = extractItem<Record<string, unknown>>(response);
      const createdDepartmentId = createdRaw
        ? String(createdRaw.id ?? createdRaw._id ?? '')
        : '';

      dispatch(markLookupsStale());
      await dispatch(hydrateLookups());

      if (createdDepartmentId) {
        formik.setFieldValue('departmentId', createdDepartmentId, false);
      }

      setDepartmentForm({ name: '', description: '' });
      setDepartmentModalOpen(false);
      setSubmissionMessage('Department created successfully.');
      setInlineCreateSuccess('Department created successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create department';
      setModalError(message);
    } finally {
      setIsCreatingDepartment(false);
    }
  };

  const createRoleInline = async () => {
    setModalError(null);

    if (!resolvedOrganizationId) {
      setModalError('Organization ID is missing in your session. Please log in again as a Super Admin.');
      return;
    }

    const name = roleForm.name.trim();
    const description = roleForm.description.trim();
    const departmentId = roleForm.departmentId.trim();

    if (!name) {
      setModalError('Role name is required.');
      return;
    }

    if (!departmentId) {
      setModalError('Department is required for role creation.');
      return;
    }

    try {
      setIsCreatingRole(true);
      const response = await api.post('/admin/roles', {
        name,
        description,
        departmentId,
        organizationId: resolvedOrganizationId,
      });

      const createdRaw = extractItem<Record<string, unknown>>(response);
      const createdRoleId = createdRaw
        ? String(createdRaw.id ?? createdRaw._id ?? '')
        : '';

      dispatch(markLookupsStale());
      await dispatch(hydrateLookups());

      if (createdRoleId) {
        formik.setFieldValue('roleId', createdRoleId, false);
      }

      setRoleForm({ name: '', description: '', departmentId: formik.values.departmentId || '' });
      setRoleModalOpen(false);
      setSubmissionMessage('Role created successfully.');
      setInlineCreateSuccess('Role created successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create role';
      setModalError(message);
    } finally {
      setIsCreatingRole(false);
    }
  };

  const fetchStateLocalGovernments = async (stateName: string) => {
    const response = await api.get(`/locations/states/${encodeURIComponent(stateName)}/local-governments`);

    const source = response as {
      data?: {
        localGovernments?: unknown;
      };
      payload?: {
        localGovernments?: unknown;
      };
    };

    const localGovernments =
      (Array.isArray(source.data?.localGovernments) ? source.data?.localGovernments : undefined) ??
      (Array.isArray(source.payload?.localGovernments) ? source.payload?.localGovernments : undefined) ??
      [];

    return localGovernments
      .filter((item): item is string => typeof item === 'string')
      .map((name) => ({ id: name, name }));
  };

  useEffect(() => {
    formik.setFieldValue('roleId', '', false);
  }, [formik.values.departmentId]);

  useEffect(() => {
    if (!inlineCreateSuccess) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setInlineCreateSuccess(null);
    }, 2500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [inlineCreateSuccess]);

  useEffect(() => {
    const loadCities = async () => {
      if (!formik.values.state) {
        setIsLoadingCities(false);
        setCities([]);
        return;
      }

      try {
        setIsLoadingCities(true);
        const cityList = await fetchStateLocalGovernments(formik.values.state);
        setCities(cityList);
      } catch {
        setCities([]);
      } finally {
        setIsLoadingCities(false);
      }
    };

    formik.setFieldValue('city', '', false);
    void loadCities();
  }, [formik.values.state]);

  const getError = (field: keyof StaffOnboardingValues) => {
    if (!formik.touched[field]) {
      return '';
    }

    const error = formik.errors[field];
    return typeof error === 'string' ? error : '';
  };

  const markStepFieldsTouched = (currentStep: number) => {
    const touchedFields = stepFieldMap[currentStep] ?? [];
    for (const field of touchedFields) {
      formik.setFieldTouched(field, true, false);
    }
  };

  const stepHasErrors = async (currentStep: number) => {
    const allErrors = await formik.validateForm();
    const fields = stepFieldMap[currentStep] ?? [];
    return fields.some((field) => Boolean(allErrors[field]));
  };

  const handleNextStep = async () => {
    markStepFieldsTouched(step);
    const hasErrors = await stepHasErrors(step);

    if (hasErrors) {
      return;
    }

    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handleNumericChange = (field: keyof StaffOnboardingValues, maxLength: number) => {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      const sanitized = event.target.value.replace(/\D/g, '').slice(0, maxLength);
      formik.setFieldValue(field, sanitized);
    };
  };

  const renderInput = (
    field: keyof StaffOnboardingValues,
    label: string,
    type: string,
    placeholder?: string,
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        name={field}
        value={formik.values[field]}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
      />
      {getError(field) && <p className="text-xs text-red-600 mt-1">{getError(field)}</p>}
    </div>
  );

  const renderStepContent = () => {
    if (step === 1) {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-heading font-bold text-primary border-b pb-2">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderInput('fullName', 'Full Name', 'text', 'e.g. Adebayo Johnson')}
            {renderInput('email', 'Email Address', 'email', 'adebayo@bckash.com')}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                name="phoneNumber"
                value={formik.values.phoneNumber}
                onChange={handleNumericChange('phoneNumber', 15)}
                onBlur={formik.handleBlur}
                placeholder="08000000000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
              {getError('phoneNumber') && <p className="text-xs text-red-600 mt-1">{getError('phoneNumber')}</p>}
            </div>

            {renderInput('dateOfBirth', 'Date of Birth', 'date')}

            <ReusableReactSelect
              name="gender"
              label="Gender"
              formik={formik}
              options={genderOptions}
              placeholder="Select Gender"
            />

            <ReusableReactSelect
              name="state"
              label="State"
              formik={formik}
              options={stateOptions}
              placeholder="Search and select state"
              isLoading={isLoadingOptions}
              isDisabled={isLoadingOptions}
            />

            <ReusableReactSelect
              name="city"
              label="City / LGA"
              formik={formik}
              options={cityOptions}
              placeholder={formik.values.state ? 'Search and select city/LGA' : 'Select state first'}
              isDisabled={!formik.values.state}
              isLoading={isLoadingCities}
              helperText={
                !formik.values.state
                  ? 'Select a state to load cities/LGAs'
                  : isLoadingCities
                    ? 'Loading LGAs...'
                    : cityOptions.length === 0
                      ? 'No LGAs found for selected state'
                      : undefined
              }
              noOptionsMessage={isLoadingCities ? 'Loading LGAs...' : 'No LGAs found'}
            />

            <div className="md:col-span-2">{renderInput('address', 'Address', 'text', 'Enter staff residential address')}</div>
          </div>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-heading font-bold text-primary border-b pb-2">Employment Details</h3>
          {optionsError && <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-md">{optionsError}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Staff ID (Auto-generated)</label>
              <input
                type="text"
                value="BCK-2026-089"
                disabled
                className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-500"
              />
            </div>

            <ReusableReactSelect
              name="departmentId"
              label="Department"
              formik={formik}
              options={departmentOptions}
              labelAction={
                <button
                  type="button"
                  onClick={() => {
                    setModalError(null);
                    setDepartmentModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-[#123e31]"
                >
                  <PlusIcon size={13} /> Create Department
                </button>
              }
              placeholder="Select Department"
              isDisabled={isLoadingOptions}
              isLoading={isLoadingOptions}
              helperText={
                isLoadingOptions
                  ? 'Loading departments...'
                  : departmentOptions.length === 0
                    ? 'No departments available'
                    : undefined
              }
              noOptionsMessage={isLoadingOptions ? 'Loading departments...' : 'No departments found'}
            />

            <ReusableReactSelect
              name="staffLevel"
              label="Staff Level"
              formik={formik}
              options={staffLevelOptions}
              placeholder="Select staff level"
            />

            <ReusableReactSelect
              name="roleId"
              label="Role"
              formik={formik}
              options={roleOptions}
              labelAction={
                <button
                  type="button"
                  onClick={() => {
                    setModalError(null);
                    setRoleForm((prev) => ({
                      ...prev,
                      departmentId: formik.values.departmentId || prev.departmentId,
                    }));
                    setRoleModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-[#123e31]"
                >
                  <PlusIcon size={13} /> Create Role
                </button>
              }
              placeholder={formik.values.departmentId ? 'Search and select role' : 'Select department first'}
              isDisabled={!formik.values.departmentId}
              helperText={
                !formik.values.departmentId
                  ? 'Select a department to load roles'
                  : roleOptions.length === 0
                    ? 'No roles found for selected department'
                    : undefined
              }
              noOptionsMessage={
                !formik.values.departmentId ? 'Select a department first' : 'No roles found for selected department'
              }
            />

            <ReusableReactSelect
              name="branchId"
              label="Branch Assignment"
              formik={formik}
              options={branchOptions}
              placeholder="Select Branch"
              isDisabled={isLoadingOptions}
              isLoading={isLoadingOptions}
              helperText={
                isLoadingOptions
                  ? 'Loading branches...'
                  : branchOptions.length === 0
                    ? 'No branches available'
                    : undefined
              }
              noOptionsMessage={isLoadingOptions ? 'Loading branches...' : 'No branches found'}
            />

            {renderInput('startDate', 'Start Date', 'date')}
          </div>
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-heading font-bold text-primary border-b pb-2">KYC, NOK & Reference</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">BVN (11 digits)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  name="bvn"
                  value={formik.values.bvn}
                  onChange={handleNumericChange('bvn', 11)}
                  onBlur={formik.handleBlur}
                  placeholder="11-digit BVN"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm border border-gray-200"
                >
                  Verify
                </button>
              </div>
              {getError('bvn') && <p className="text-xs text-red-600 mt-1">{getError('bvn')}</p>}
            </div>

            <ReusableReactSelect
              name="idType"
              label="ID Type"
              formik={formik}
              options={idTypeOptions}
              placeholder="Select ID Type"
            />

            {renderInput('idNumber', 'ID Number', 'text')}

            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 cursor-pointer transition-colors">
                <UploadCloudIcon size={32} className="text-gray-400 mb-2" />
                <p className="text-sm font-medium text-gray-700">Upload ID Document</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG or PDF (Max 5MB)</p>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 cursor-pointer transition-colors">
                <UploadCloudIcon size={32} className="text-gray-400 mb-2" />
                <p className="text-sm font-medium text-gray-700">Upload Passport Photo</p>
                <p className="text-xs text-gray-400 mt-1">PNG or JPG (Max 2MB)</p>
              </div>
            </div>

            <div className="md:col-span-2 border-t pt-4">
              <h4 className="text-md font-semibold text-primary mb-3">Next of Kin Details</h4>
            </div>
            {renderInput('nokName', 'NOK Full Name', 'text')}
            {renderInput('nokRelationship', 'NOK Relationship', 'text')}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NOK Phone Number</label>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                name="nokPhone"
                value={formik.values.nokPhone}
                onChange={handleNumericChange('nokPhone', 15)}
                onBlur={formik.handleBlur}
                placeholder="08000000000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
              {getError('nokPhone') && <p className="text-xs text-red-600 mt-1">{getError('nokPhone')}</p>}
            </div>
            {renderInput('nokAddress', 'NOK Address', 'text')}

            <div className="md:col-span-2 border-t pt-4">
              <h4 className="text-md font-semibold text-primary mb-3">Reference Details</h4>
            </div>
            {renderInput('referenceName', 'Reference Full Name', 'text')}
            {renderInput('referenceRelationship', 'Reference Relationship', 'text')}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference Phone Number</label>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                name="referencePhone"
                value={formik.values.referencePhone}
                onChange={handleNumericChange('referencePhone', 15)}
                onBlur={formik.handleBlur}
                placeholder="08000000000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
              {getError('referencePhone') && <p className="text-xs text-red-600 mt-1">{getError('referencePhone')}</p>}
            </div>
            {renderInput('referenceAddress', 'Reference Address', 'text')}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2Icon size={32} />
          </div>
          <h3 className="text-xl font-heading font-bold text-primary mb-2">Review & Submit</h3>
          <p className="text-gray-500 max-w-md mx-auto">Please review the staff details before final submission.</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm">
          <p className="font-medium text-gray-700 mb-2">Summary:</p>
          <ul className="space-y-2 text-gray-600">
            <li>
              <span className="font-medium">Name:</span> {formik.values.fullName || '—'}
            </li>
            <li>
              <span className="font-medium">Department:</span> {selectedDepartment?.name || '—'}
            </li>
            <li>
              <span className="font-medium">Staff Level:</span> {formik.values.staffLevel || '—'}
            </li>
            <li>
              <span className="font-medium">Role:</span> {selectedRole?.name || '—'}
            </li>
            <li>
              <span className="font-medium">Branch:</span> {selectedBranch?.name || '—'}
            </li>
            <li>
              <span className="font-medium">State/City:</span> {formik.values.state || '—'} / {formik.values.city || '—'}
            </li>
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-heading font-bold text-primary">Staff Onboarding</h2>
          <p className="text-gray-500 text-sm mt-1">Register a new staff member into the system</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 z-0" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary z-0 transition-all duration-300"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          />

          {steps.map((currentStep) => (
            <div key={currentStep.id} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                  step >= currentStep.id ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step > currentStep.id ? <CheckCircle2Icon size={16} /> : currentStep.id}
              </div>
              <span className={`text-xs mt-2 font-medium ${step >= currentStep.id ? 'text-primary' : 'text-gray-400'}`}>
                {currentStep.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={formik.handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
          {renderStepContent()}
        </motion.div>

        {submissionMessage && <p className="text-xs text-green-700 bg-green-50 p-2 rounded-md mt-6">{submissionMessage}</p>}
        {submissionError && <p className="text-xs text-red-700 bg-red-50 p-2 rounded-md mt-2">{submissionError}</p>}

        <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={() => setStep((prev) => Math.max(prev - 1, 1))}
            disabled={step === 1}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            Back
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={() => {
                void handleNextStep();
              }}
              disabled={formik.isSubmitting}
              className="flex items-center px-6 py-2 bg-primary text-white rounded-lg hover:bg-[#123e31] font-medium transition-colors shadow-sm"
            >
              Continue <ChevronRightIcon size={18} className="ml-1" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={formik.isSubmitting}
              className="flex items-center px-8 py-2 bg-accent text-white rounded-lg hover:bg-[#e64a19] font-heading font-bold transition-colors shadow-md"
            >
              {formik.isSubmitting ? 'Submitting...' : 'Submit Registration'}
            </button>
          )}
        </div>
      </form>

      {departmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDepartmentModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <button
              type="button"
              onClick={() => setDepartmentModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600"
            >
              <XIcon size={18} />
            </button>
            <h3 className="text-lg font-heading font-bold text-primary mb-4">Create Department</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                <input
                  type="text"
                  value={departmentForm.name}
                  onChange={(event) => setDepartmentForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  placeholder="e.g. Internal Control"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={departmentForm.description}
                  onChange={(event) => setDepartmentForm((prev) => ({ ...prev, description: event.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  rows={3}
                />
              </div>
              {modalError && <p className="text-xs text-red-700 bg-red-50 p-2 rounded-md">{modalError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setDepartmentModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
                <button
                  type="button"
                  onClick={() => void createDepartmentInline()}
                  disabled={isCreatingDepartment}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm disabled:opacity-50"
                >
                  {isCreatingDepartment ? 'Creating...' : 'Create Department'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {roleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setRoleModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <button
              type="button"
              onClick={() => setRoleModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600"
            >
              <XIcon size={18} />
            </button>
            <h3 className="text-lg font-heading font-bold text-primary mb-4">Create Role</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                <input
                  type="text"
                  value={roleForm.name}
                  onChange={(event) => setRoleForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  placeholder="e.g. Internal Auditor"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={roleForm.departmentId}
                  onChange={(event) => setRoleForm((prev) => ({ ...prev, departmentId: event.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                >
                  <option value="">Select department...</option>
                  {departmentOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={roleForm.description}
                  onChange={(event) => setRoleForm((prev) => ({ ...prev, description: event.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  rows={3}
                />
              </div>
              {modalError && <p className="text-xs text-red-700 bg-red-50 p-2 rounded-md">{modalError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setRoleModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
                <button
                  type="button"
                  onClick={() => void createRoleInline()}
                  disabled={isCreatingRole}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm disabled:opacity-50"
                >
                  {isCreatingRole ? 'Creating...' : 'Create Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {inlineCreateSuccess && (
        <div className="fixed bottom-6 right-6 z-[60]">
          <div className="flex items-center gap-2 rounded-lg bg-green-600 text-white px-4 py-3 shadow-xl">
            <CheckCircle2Icon size={16} />
            <span className="text-sm font-medium">{inlineCreateSuccess}</span>
          </div>
        </div>
      )}
    </div>
  );
}
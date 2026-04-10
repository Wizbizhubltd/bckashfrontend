import * as Yup from 'yup';

export const createBranchSchema = Yup.object({
  name: Yup.string().trim().required('Branch name is required'),
  code: Yup.string().trim().required('Branch code is required'),
  state: Yup.string().trim().required('State is required'),
  city: Yup.string().trim().required('LGA is required'),
  address: Yup.string().trim().required('Address is required'),
  phone: Yup.string()
    .trim()
    .optional()
    .test('empty-or-numeric-phone', 'Phone number must be 7-15 digits', (value) => !value || /^\d{7,15}$/.test(value)),
  email: Yup.string().trim().email('Enter a valid email address').optional(),
  managerId: Yup.string()
    .trim()
    .optional()
    .test('empty-or-objectid', 'Manager ID must be a valid ObjectId', (value) => !value || /^[a-f\d]{24}$/i.test(value)),
});

export const editBranchSchema = Yup.object({
  name: Yup.string().trim().required('Branch name is required'),
  code: Yup.string().trim().required('Branch code is required'),
  state: Yup.string().trim().required('State is required'),
  city: Yup.string().trim().required('LGA is required'),
  address: Yup.string().trim().required('Address is required'),
  phone: Yup.string()
    .trim()
    .optional()
    .test('empty-or-numeric-phone', 'Phone number must be 7-15 digits', (value) => !value || /^\d{7,15}$/.test(value)),
  email: Yup.string().trim().email('Enter a valid email address').optional(),
  managerId: Yup.string()
    .trim()
    .optional()
    .test('empty-or-objectid', 'Manager ID must be a valid ObjectId', (value) => !value || /^[a-f\d]{24}$/i.test(value)),
  status: Yup.string().oneOf(['Active', 'Inactive']).required('Status is required'),
});

export const fundBranchSchema = Yup.object({
  amount: Yup.string()
    .required('Amount is required')
    .test('valid-amount', 'Enter a valid amount', (value) => {
      const parsed = Number((value || '').replace(/,/g, ''));
      return Number.isFinite(parsed) && parsed > 0;
    }),
  bankAccountId: Yup.string()
    .trim()
    .required('Destination bank is required')
    .test('objectid', 'Select a valid bank account', (value) => !!value && /^[a-f\d]{24}$/i.test(value)),
  transactionReference: Yup.string().trim().required('Transaction reference is required'),
  note: Yup.string(),
});

export const addBankAccountSchema = Yup.object({
  bankName: Yup.string().required('Bank name is required'),
  accountNumber: Yup.string()
    .matches(/^\d{10}$/, 'Account number must be 10 digits')
    .required('Account number is required'),
  accountName: Yup.string().trim().required('Account name is required'),
  isCurrent: Yup.boolean().required(),
});

export const loanProductSchema = Yup.object({
  name: Yup.string().trim().required('Product name is required'),
  duration: Yup.string().required('Duration is required'),
  interestRate: Yup.number().typeError('Enter a valid interest rate').moreThan(0).required('Interest rate is required'),
  minAmount: Yup.number().typeError('Enter a valid minimum amount').moreThan(0).required('Minimum amount is required'),
  maxAmount: Yup.number()
    .typeError('Enter a valid maximum amount')
    .moreThan(Yup.ref('minAmount'), 'Maximum must be greater than minimum')
    .required('Maximum amount is required'),
});

export const feeSchema = Yup.object({
  name: Yup.string().trim().required('Fee name is required'),
  billingType: Yup.string().oneOf(['Fixed', 'Percentage']).required('Billing type is required'),
  amount: Yup.number().typeError('Enter a valid amount').moreThan(0).required('Amount is required'),
  description: Yup.string(),
  appliesTo: Yup.string().required('Applies-to selection is required'),
});

export const departmentSchema = Yup.object({
  name: Yup.string().trim().required('Department name is required'),
  description: Yup.string(),
});

export const roleSchema = Yup.object({
  name: Yup.string().trim().required('Role name is required'),
  department: Yup.string().required('Department is required'),
  description: Yup.string(),
});

export const expenseSchema = Yup.object({
  category: Yup.string().required('Category is required'),
  description: Yup.string().trim().required('Description is required'),
  amount: Yup.number().typeError('Enter a valid amount').moreThan(0).required('Amount is required'),
  branch: Yup.string().required('Branch is required'),
  date: Yup.string(),
});

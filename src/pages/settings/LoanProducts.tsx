import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFormik } from 'formik';
import {
  PlusIcon,
  PencilIcon,
  XIcon,
  CheckCircleIcon,
  PackageIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  HistoryIcon } from
'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';
import { loanProductSchema } from '../../validators/nonAuthSchemas';
// ─── Types ──────────────────────────────────────────────────────
interface ProductChange {
  id: string;
  date: string;
  field: string;
  oldValue: string;
  newValue: string;
  modifiedBy: string;
}
interface LoanProduct {
  id: string;
  name: string;
  duration: string;
  interestRate: string;
  minAmount: string;
  maxAmount: string;
  status: 'Active' | 'Inactive';
  dateCreated: string;
  lastModified: string;
  modifiedBy: string;
  changeHistory: ProductChange[];
}
// ─── Mock Data ──────────────────────────────────────────────────
const initialProducts: LoanProduct[] = [
{
  id: 'LP-001',
  name: 'Quick Cash',
  duration: '2 Weeks',
  interestRate: '2.5',
  minAmount: '10000',
  maxAmount: '100000',
  status: 'Active',
  dateCreated: '2023-01-15',
  lastModified: '2025-11-20',
  modifiedBy: 'Adebayo Johnson',
  changeHistory: [
  {
    id: 'CH-001',
    date: '2025-11-20',
    field: 'Interest Rate',
    oldValue: '3%',
    newValue: '2.5%',
    modifiedBy: 'Adebayo Johnson'
  },
  {
    id: 'CH-002',
    date: '2024-06-10',
    field: 'Max Amount',
    oldValue: '₦80,000',
    newValue: '₦100,000',
    modifiedBy: 'Adebayo Johnson'
  }]

},
{
  id: 'LP-002',
  name: 'Standard Loan',
  duration: '4 Weeks',
  interestRate: '4',
  minAmount: '50000',
  maxAmount: '500000',
  status: 'Active',
  dateCreated: '2023-01-15',
  lastModified: '2025-08-05',
  modifiedBy: 'Adebayo Johnson',
  changeHistory: [
  {
    id: 'CH-003',
    date: '2025-08-05',
    field: 'Min Amount',
    oldValue: '₦30,000',
    newValue: '₦50,000',
    modifiedBy: 'Adebayo Johnson'
  }]

},
{
  id: 'LP-003',
  name: 'Business Boost',
  duration: '8 Weeks',
  interestRate: '5',
  minAmount: '100000',
  maxAmount: '2000000',
  status: 'Active',
  dateCreated: '2023-06-01',
  lastModified: '2026-01-12',
  modifiedBy: 'Adebayo Johnson',
  changeHistory: [
  {
    id: 'CH-004',
    date: '2026-01-12',
    field: 'Interest Rate',
    oldValue: '5.5%',
    newValue: '5%',
    modifiedBy: 'Adebayo Johnson'
  },
  {
    id: 'CH-005',
    date: '2025-03-18',
    field: 'Max Amount',
    oldValue: '₦1,500,000',
    newValue: '₦2,000,000',
    modifiedBy: 'Adebayo Johnson'
  },
  {
    id: 'CH-006',
    date: '2024-09-01',
    field: 'Duration',
    oldValue: '6 Weeks',
    newValue: '8 Weeks',
    modifiedBy: 'Adebayo Johnson'
  }]

},
{
  id: 'LP-004',
  name: 'Premium Loan',
  duration: '12 Weeks',
  interestRate: '6',
  minAmount: '500000',
  maxAmount: '5000000',
  status: 'Active',
  dateCreated: '2023-09-20',
  lastModified: '2025-12-01',
  modifiedBy: 'Adebayo Johnson',
  changeHistory: [
  {
    id: 'CH-007',
    date: '2025-12-01',
    field: 'Min Amount',
    oldValue: '₦300,000',
    newValue: '₦500,000',
    modifiedBy: 'Adebayo Johnson'
  }]

},
{
  id: 'LP-005',
  name: 'Micro Starter',
  duration: '1 Week',
  interestRate: '1.5',
  minAmount: '5000',
  maxAmount: '50000',
  status: 'Active',
  dateCreated: '2024-02-10',
  lastModified: '2024-02-10',
  modifiedBy: 'Adebayo Johnson',
  changeHistory: []
},
{
  id: 'LP-006',
  name: 'Group Enterprise',
  duration: '6 Weeks',
  interestRate: '3.5',
  minAmount: '200000',
  maxAmount: '3000000',
  status: 'Inactive',
  dateCreated: '2024-05-15',
  lastModified: '2026-02-01',
  modifiedBy: 'Adebayo Johnson',
  changeHistory: [
  {
    id: 'CH-008',
    date: '2026-02-01',
    field: 'Status',
    oldValue: 'Active',
    newValue: 'Inactive',
    modifiedBy: 'Adebayo Johnson'
  }]

}];

const durationOptions = [
'1 Week',
'2 Weeks',
'3 Weeks',
'4 Weeks',
'6 Weeks',
'8 Weeks',
'12 Weeks',
'3 Months',
'6 Months'];

const inputClass =
'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all';
const selectClass = `${inputClass} bg-white`;
function formatAmount(val: string): string {
  const num = parseInt(val, 10);
  if (isNaN(num)) return '₦0';
  return `₦${num.toLocaleString()}`;
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
          className="relative bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
          
            {children}
          </motion.div>
        </motion.div>
      }
    </AnimatePresence>);

}
// ─── Component ──────────────────────────────────────────────────
export function LoanProducts() {
  const [products, setProducts] = useState<LoanProduct[]>(initialProducts);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modal, setModal] = useState<{
    open: boolean;
    editing: LoanProduct | null;
  }>({
    open: false,
    editing: null
  });
  const formik = useFormik({
    initialValues: {
      name: '',
      duration: '2 Weeks',
      interestRate: '',
      minAmount: '',
      maxAmount: ''
    },
    validationSchema: loanProductSchema,
    validateOnMount: true,
    onSubmit: (values) => {
      const now = new Date().toISOString().split('T')[0];

      if (modal.editing) {
        const changes: ProductChange[] = [];
        const old = modal.editing;

        if (old.name !== values.name.trim())
        changes.push({
          id: `CH-${Date.now()}-1`,
          date: now,
          field: 'Name',
          oldValue: old.name,
          newValue: values.name.trim(),
          modifiedBy: 'Adebayo Johnson'
        });
        if (old.duration !== values.duration)
        changes.push({
          id: `CH-${Date.now()}-2`,
          date: now,
          field: 'Duration',
          oldValue: old.duration,
          newValue: values.duration,
          modifiedBy: 'Adebayo Johnson'
        });
        if (old.interestRate !== values.interestRate)
        changes.push({
          id: `CH-${Date.now()}-3`,
          date: now,
          field: 'Interest Rate',
          oldValue: `${old.interestRate}%`,
          newValue: `${values.interestRate}%`,
          modifiedBy: 'Adebayo Johnson'
        });
        if (old.minAmount !== values.minAmount)
        changes.push({
          id: `CH-${Date.now()}-4`,
          date: now,
          field: 'Min Amount',
          oldValue: formatAmount(old.minAmount),
          newValue: formatAmount(values.minAmount),
          modifiedBy: 'Adebayo Johnson'
        });
        if (old.maxAmount !== values.maxAmount)
        changes.push({
          id: `CH-${Date.now()}-5`,
          date: now,
          field: 'Max Amount',
          oldValue: formatAmount(old.maxAmount),
          newValue: formatAmount(values.maxAmount),
          modifiedBy: 'Adebayo Johnson'
        });

        setProducts((prev) =>
        prev.map((p) =>
        p.id === old.id ?
        {
          ...p,
          name: values.name.trim(),
          duration: values.duration,
          interestRate: values.interestRate,
          minAmount: values.minAmount,
          maxAmount: values.maxAmount,
          lastModified: now,
          modifiedBy: 'Adebayo Johnson',
          changeHistory: [...changes, ...p.changeHistory]
        } :
        p
        )
        );
        showToast('Loan product updated — changes recorded');
      } else {
        const newProduct: LoanProduct = {
          id: `LP-${String(products.length + 1).padStart(3, '0')}`,
          name: values.name.trim(),
          duration: values.duration,
          interestRate: values.interestRate,
          minAmount: values.minAmount,
          maxAmount: values.maxAmount,
          status: 'Active',
          dateCreated: now,
          lastModified: now,
          modifiedBy: 'Adebayo Johnson',
          changeHistory: []
        };
        setProducts((prev) => [...prev, newProduct]);
        showToast(`Loan product "${newProduct.name}" created`);
      }

      setModal({
        open: false,
        editing: null
      });
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
  function openModal(product?: LoanProduct) {
    if (product) {
      formik.setValues({
        name: product.name,
        duration: product.duration,
        interestRate: product.interestRate,
        minAmount: product.minAmount,
        maxAmount: product.maxAmount
      });
      formik.setTouched({});
      setModal({
        open: true,
        editing: product
      });
    } else {
      formik.resetForm();
      formik.setValues({
        name: '',
        duration: '2 Weeks',
        interestRate: '',
        minAmount: '',
        maxAmount: ''
      });
      formik.setTouched({});
      setModal({
        open: true,
        editing: null
      });
    }
  }

  function closeModal() {
    formik.resetForm();
    setModal({
      open: false,
      editing: null
    });
  }
  function toggleStatus(id: string) {
    const now = new Date().toISOString().split('T')[0];
    setProducts((prev) =>
    prev.map((p) => {
      if (p.id !== id) return p;
      const newStatus = p.status === 'Active' ? 'Inactive' : 'Active';
      const change: ProductChange = {
        id: `CH-${Date.now()}`,
        date: now,
        field: 'Status',
        oldValue: p.status,
        newValue: newStatus,
        modifiedBy: 'Adebayo Johnson'
      };
      return {
        ...p,
        status: newStatus,
        lastModified: now,
        modifiedBy: 'Adebayo Johnson',
        changeHistory: [change, ...p.changeHistory]
      };
    })
    );
    showToast('Product status updated — change recorded');
  }
  const activeCount = products.filter((p) => p.status === 'Active').length;
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <PackageIcon size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-heading font-bold text-gray-900">
              Loan Products
            </h3>
            <p className="text-sm font-body text-gray-500">
              {activeCount} active of {products.length} products
            </p>
          </div>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-1.5 px-4 py-2 bg-accent text-white rounded-lg text-sm font-heading font-bold hover:bg-[#e64a19] transition-colors">
          
          <PlusIcon size={14} />
          Add Product
        </button>
      </div>

      {/* Product Cards */}
      <div className="space-y-3">
        {products.map((product) =>
        <div
          key={product.id}
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          
            {/* Product Row */}
            <div
            className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 transition-colors"
            onClick={() =>
            setExpandedId(expandedId === product.id ? null : product.id)
            }>
            
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${product.status === 'Active' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'}`}>
                
                  <PackageIcon size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-heading font-bold text-gray-900">
                      {product.name}
                    </p>
                    <StatusBadge status={product.status as any} />
                  </div>
                  <p className="text-xs font-body text-gray-400 mt-0.5">
                    {product.id} · Created {product.dateCreated}
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-6 mr-4">
                <div className="text-center">
                  <p className="text-xs font-body text-gray-400">Duration</p>
                  <p className="text-sm font-heading font-bold text-gray-800">
                    {product.duration}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-body text-gray-400">Interest</p>
                  <p className="text-sm font-heading font-bold text-accent">
                    {product.interestRate}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-body text-gray-400">Range</p>
                  <p className="text-xs font-body font-medium text-gray-700">
                    {formatAmount(product.minAmount)} –{' '}
                    {formatAmount(product.maxAmount)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                onClick={(e) => {
                  e.stopPropagation();
                  openModal(product);
                }}
                className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors">
                
                  <PencilIcon size={14} />
                </button>
                {expandedId === product.id ?
              <ChevronUpIcon size={16} className="text-gray-400" /> :

              <ChevronDownIcon size={16} className="text-gray-400" />
              }
              </div>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
              {expandedId === product.id &&
            <motion.div
              initial={{
                height: 0,
                opacity: 0
              }}
              animate={{
                height: 'auto',
                opacity: 1
              }}
              exit={{
                height: 0,
                opacity: 0
              }}
              transition={{
                duration: 0.2
              }}
              className="overflow-hidden">
              
                  <div className="px-6 pb-5 border-t border-gray-100 pt-4">
                    {/* Details Grid (mobile-friendly) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5 sm:hidden">
                      <div>
                        <p className="text-xs text-gray-400">Duration</p>
                        <p className="text-sm font-bold text-gray-800">
                          {product.duration}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Interest</p>
                        <p className="text-sm font-bold text-accent">
                          {product.interestRate}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Min</p>
                        <p className="text-sm font-bold text-gray-800">
                          {formatAmount(product.minAmount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Max</p>
                        <p className="text-sm font-bold text-gray-800">
                          {formatAmount(product.maxAmount)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-body text-gray-400">
                          Last modified: {product.lastModified} by{' '}
                          {product.modifiedBy}
                        </p>
                      </div>
                      <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStatus(product.id);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold transition-colors ${product.status === 'Active' ? 'border border-red-200 text-red-600 hover:bg-red-50' : 'border border-green-200 text-green-600 hover:bg-green-50'}`}>
                    
                        {product.status === 'Active' ?
                    'Deactivate' :
                    'Activate'}
                      </button>
                    </div>

                    {/* Change History */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <HistoryIcon size={14} className="text-gray-500" />
                        <h4 className="text-sm font-heading font-bold text-gray-700">
                          Change History
                        </h4>
                        <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                          {product.changeHistory.length}
                        </span>
                      </div>
                      {product.changeHistory.length === 0 ?
                  <p className="text-xs font-body text-gray-400 italic">
                          No changes recorded yet.
                        </p> :

                  <div className="space-y-2">
                          {product.changeHistory.map((change) =>
                    <div
                      key={change.id}
                      className="flex items-start gap-3 text-xs">
                      
                              <ClockIcon
                        size={12}
                        className="text-gray-400 mt-0.5 flex-shrink-0" />
                      
                              <div>
                                <span className="text-gray-500">
                                  {change.date}
                                </span>
                                <span className="mx-1.5 text-gray-300">·</span>
                                <span className="font-medium text-gray-700">
                                  {change.field}
                                </span>
                                <span className="text-gray-400">
                                  {' '}
                                  changed from{' '}
                                </span>
                                <span className="text-red-500 line-through">
                                  {change.oldValue}
                                </span>
                                <span className="text-gray-400"> to </span>
                                <span className="text-green-600 font-medium">
                                  {change.newValue}
                                </span>
                                <span className="text-gray-400">
                                  {' '}
                                  by {change.modifiedBy}
                                </span>
                              </div>
                            </div>
                    )}
                        </div>
                  }
                    </div>
                  </div>
                </motion.div>
            }
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Product Modal */}
      <ModalWrapper
        isOpen={modal.open}
        onClose={closeModal}>
        
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
          
          <XIcon size={18} />
        </button>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <PackageIcon size={20} />
          </div>
          <div>
            <h3 className="text-lg font-heading font-bold text-gray-900">
              {modal.editing ? 'Edit Loan Product' : 'Add Loan Product'}
            </h3>
            <p className="text-xs font-body text-gray-500">
              {modal.editing ?
              `${modal.editing.id} — Changes will be recorded` :
              'Configure a new loan product'}
            </p>
          </div>
        </div>
        <form onSubmit={formik.handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-body font-medium text-gray-600 mb-1.5">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="e.g. Quick Cash"
              className={inputClass}
              required />

            {formik.touched.name && formik.errors.name &&
            <p className="text-xs text-red-600 mt-1">{formik.errors.name}</p>
            }
            
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-body font-medium text-gray-600 mb-1.5">
                Duration <span className="text-red-500">*</span>
              </label>
              <select
                id="duration"
                name="duration"
                value={formik.values.duration}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={selectClass}>
                
                {durationOptions.map((d) =>
                <option key={d} value={d}>
                    {d}
                  </option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-body font-medium text-gray-600 mb-1.5">
                Interest Rate <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="interestRate"
                  name="interestRate"
                  type="number"
                  step="0.1"
                  value={formik.values.interestRate}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="e.g. 2.5"
                  className={`${inputClass} pr-8`}
                  required />
                
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  %
                </span>
              </div>

              {formik.touched.interestRate && formik.errors.interestRate &&
              <p className="text-xs text-red-600 mt-1">{formik.errors.interestRate}</p>
              }
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-body font-medium text-gray-600 mb-1.5">
                Min Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  ₦
                </span>
                <input
                  id="minAmount"
                  name="minAmount"
                  type="number"
                  value={formik.values.minAmount}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="10000"
                  className={`${inputClass} pl-8`}
                  required />
                
              </div>

              {formik.touched.minAmount && formik.errors.minAmount &&
              <p className="text-xs text-red-600 mt-1">{formik.errors.minAmount}</p>
              }
            </div>
            <div>
              <label className="block text-xs font-body font-medium text-gray-600 mb-1.5">
                Max Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  ₦
                </span>
                <input
                  id="maxAmount"
                  name="maxAmount"
                  type="number"
                  value={formik.values.maxAmount}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="500000"
                  className={`${inputClass} pl-8`}
                  required />
                
              </div>

              {formik.touched.maxAmount && formik.errors.maxAmount &&
              <p className="text-xs text-red-600 mt-1">{formik.errors.maxAmount}</p>
              }
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-sm font-heading font-bold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formik.isValid}
              className="px-4 py-2 text-sm font-heading font-bold bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              
              {modal.editing ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </ModalWrapper>
    </div>);

}
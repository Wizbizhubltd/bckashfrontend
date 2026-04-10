import React, { useEffect, useMemo, useState } from 'react';
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
  HistoryIcon,
  Loader2Icon,
  Trash2Icon,
} from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';
import { loanProductSchema } from '../../validators/nonAuthSchemas';
import { api } from '../../app/api';

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

const durationOptions = ['1 Week', '2 Weeks', '3 Weeks', '4 Weeks', '6 Weeks', '8 Weeks', '12 Weeks', '3 Months', '6 Months'];

const inputClass =
  'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all';
const selectClass = `${inputClass} bg-white`;

function formatAmount(value: string): string {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return '₦0';
  }

  return `₦${Math.round(parsed).toLocaleString()}`;
}

function toIsoDate(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    return new Date().toISOString().split('T')[0];
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().split('T')[0];
  }

  return parsed.toISOString().split('T')[0];
}

function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== 'object') {
    return fallback;
  }

  const source = error as {
    message?: unknown;
    response?: {
      data?: {
        message?: unknown;
        error?: unknown;
        errors?: unknown;
      };
    };
  };

  const data = source.response?.data;

  if (data) {
    if (typeof data.message === 'string' && data.message.trim()) {
      return data.message;
    }

    if (typeof data.error === 'string' && data.error.trim()) {
      return data.error;
    }

    if (Array.isArray(data.errors) && data.errors.length > 0) {
      const first = data.errors[0];
      if (typeof first === 'string' && first.trim()) {
        return first;
      }
      if (first && typeof first === 'object' && 'message' in first) {
        const entry = first as { message?: unknown };
        if (typeof entry.message === 'string' && entry.message.trim()) {
          return entry.message;
        }
      }
    }
  }

  if (typeof source.message === 'string' && source.message.trim()) {
    return source.message;
  }

  return fallback;
}

function extractLoanProducts(response: unknown): LoanProduct[] {
  if (!response || typeof response !== 'object') {
    return [];
  }

  const source = response as {
    data?: unknown;
    payload?: unknown;
    loanProducts?: unknown;
  };

  const container =
    (source.data && typeof source.data === 'object' ? source.data : null) ||
    (source.payload && typeof source.payload === 'object' ? source.payload : null) ||
    source;

  const rawItems =
    Array.isArray((container as { loanProducts?: unknown }).loanProducts)
      ? (container as { loanProducts: unknown[] }).loanProducts
      : Array.isArray(container)
      ? container
      : [];

  return rawItems
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const row = item as Record<string, unknown>;
      const status = row.status === 'Inactive' ? 'Inactive' : 'Active';
      const historyRaw = Array.isArray(row.changeHistory) ? row.changeHistory : [];

      const changeHistory: ProductChange[] = historyRaw
        .map((entry) => {
          if (!entry || typeof entry !== 'object') {
            return null;
          }
          const value = entry as Record<string, unknown>;
          return {
            id: String(value.id ?? value._id ?? `CH-${Date.now()}`),
            date: toIsoDate(value.date),
            field: typeof value.field === 'string' ? value.field : '',
            oldValue: typeof value.oldValue === 'string' ? value.oldValue : '',
            newValue: typeof value.newValue === 'string' ? value.newValue : '',
            modifiedBy: typeof value.modifiedBy === 'string' && value.modifiedBy.trim() ? value.modifiedBy : 'System User',
          };
        })
        .filter((entry): entry is ProductChange => entry !== null);

      return {
        id: String(row.id ?? row._id ?? ''),
        name: typeof row.name === 'string' ? row.name : '',
        duration: typeof row.duration === 'string' ? row.duration : '',
        interestRate: String(typeof row.interestRate === 'number' ? row.interestRate : Number(row.interestRate ?? 0)),
        minAmount: String(typeof row.minAmount === 'number' ? row.minAmount : Number(row.minAmount ?? 0)),
        maxAmount: String(typeof row.maxAmount === 'number' ? row.maxAmount : Number(row.maxAmount ?? 0)),
        status,
        dateCreated: toIsoDate(row.dateCreated),
        lastModified: toIsoDate(row.lastModified),
        modifiedBy: typeof row.modifiedBy === 'string' && row.modifiedBy.trim() ? row.modifiedBy : 'System User',
        changeHistory,
      } satisfies LoanProduct;
    })
    .filter((entry): entry is LoanProduct => entry !== null && Boolean(entry.id) && Boolean(entry.name));
}

function createFieldChanges(
  previous: LoanProduct,
  next: { name: string; duration: string; interestRate: string; minAmount: string; maxAmount: string },
  actor: string,
): ProductChange[] {
  const today = new Date().toISOString().split('T')[0];
  const changes: ProductChange[] = [];

  if (previous.name !== next.name.trim()) {
    changes.push({
      id: `CH-${Date.now()}-1`,
      date: today,
      field: 'Name',
      oldValue: previous.name,
      newValue: next.name.trim(),
      modifiedBy: actor,
    });
  }

  if (previous.duration !== next.duration) {
    changes.push({
      id: `CH-${Date.now()}-2`,
      date: today,
      field: 'Duration',
      oldValue: previous.duration,
      newValue: next.duration,
      modifiedBy: actor,
    });
  }

  if (previous.interestRate !== next.interestRate) {
    changes.push({
      id: `CH-${Date.now()}-3`,
      date: today,
      field: 'Interest Rate',
      oldValue: `${previous.interestRate}%`,
      newValue: `${next.interestRate}%`,
      modifiedBy: actor,
    });
  }

  if (previous.minAmount !== next.minAmount) {
    changes.push({
      id: `CH-${Date.now()}-4`,
      date: today,
      field: 'Min Amount',
      oldValue: formatAmount(previous.minAmount),
      newValue: formatAmount(next.minAmount),
      modifiedBy: actor,
    });
  }

  if (previous.maxAmount !== next.maxAmount) {
    changes.push({
      id: `CH-${Date.now()}-5`,
      date: today,
      field: 'Max Amount',
      oldValue: formatAmount(previous.maxAmount),
      newValue: formatAmount(next.maxAmount),
      modifiedBy: actor,
    });
  }

  return changes;
}

function ModalWrapper({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function LoanProductsCrud() {
  const [products, setProducts] = useState<LoanProduct[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [inlineAlert, setInlineAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [modal, setModal] = useState<{ open: boolean; editing: LoanProduct | null }>({
    open: false,
    editing: null,
  });
  const [deleteTarget, setDeleteTarget] = useState<LoanProduct | null>(null);
  const actorName = 'System User';

  const [toast, setToast] = useState({ message: '', visible: false });

  const formik = useFormik({
    initialValues: {
      name: '',
      duration: '2 Weeks',
      interestRate: '',
      minAmount: '',
      maxAmount: '',
    },
    validationSchema: loanProductSchema,
    validateOnMount: true,
    onSubmit: async (values) => {
      const trimmedName = values.name.trim();
      const now = new Date().toISOString().split('T')[0];
      const payload = {
        name: trimmedName,
        duration: values.duration,
        interestRate: Number(values.interestRate),
        minAmount: Number(values.minAmount),
        maxAmount: Number(values.maxAmount),
        modifiedBy: actorName,
      };

      if (!Number.isFinite(payload.interestRate) || !Number.isFinite(payload.minAmount) || !Number.isFinite(payload.maxAmount)) {
        showToast('Please provide valid numeric values');
        return;
      }

      if (payload.minAmount > payload.maxAmount) {
        showToast('Min amount cannot be greater than max amount');
        return;
      }

      try {
        setSubmitting(true);
        setInlineAlert(null);

        if (modal.editing) {
          const oldProduct = modal.editing;
          const changes = createFieldChanges(oldProduct, values, actorName);

          const response = await api.patch(`/admin/business-rules/loan-products/${oldProduct.id}`, {
            ...payload,
            changeHistory: changes.map((change) => ({
              date: change.date,
              field: change.field,
              oldValue: change.oldValue,
              newValue: change.newValue,
              modifiedBy: change.modifiedBy,
            })),
          });

          const updated = extractLoanProducts({ data: [response] })[0];
          if (updated) {
            setProducts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
          }

          showToast('Loan product updated — changes recorded');
          setInlineAlert({ type: 'success', message: 'Loan product updated successfully.' });
        } else {
          const response = await api.post('/admin/business-rules/loan-products', {
            ...payload,
            status: 'Active',
            dateCreated: now,
            lastModified: now,
            changeHistory: [],
          });

          const created = extractLoanProducts({ data: [response] })[0];
          if (created) {
            setProducts((current) => [created, ...current]);
            showToast(`Loan product "${created.name}" created`);
            setInlineAlert({ type: 'success', message: 'Loan product created and saved to backend.' });
          }
        }

        setModal({ open: false, editing: null });
      } catch (error) {
        const message = extractApiErrorMessage(error, modal.editing ? 'Failed to update loan product' : 'Failed to create loan product');
        showToast(message);
        setInlineAlert({ type: 'error', message });
      } finally {
        setSubmitting(false);
      }
    },
  });

  function showToast(message: string) {
    setToast({ message, visible: true });
    setTimeout(() => setToast((state) => ({ ...state, visible: false })), 3000);
  }

  const fetchLoanProducts = async () => {
    try {
      setLoading(true);
      setInlineAlert(null);
      const response = await api.get('/admin/business-rules/loan-products');
      const rows = extractLoanProducts(response);
      setProducts(rows);
      setInlineAlert({ type: 'success', message: 'Loan products loaded from backend.' });
    } catch (error) {
      const message = extractApiErrorMessage(error, 'Failed to load loan products');
      setProducts([]);
      setInlineAlert({ type: 'error', message });
      showToast(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchLoanProducts();
  }, []);

  useEffect(() => {
    if (!inlineAlert || inlineAlert.type !== 'success') {
      return;
    }

    const timerId = setTimeout(() => {
      setInlineAlert((state) => (state?.type === 'success' ? null : state));
    }, 4500);

    return () => {
      clearTimeout(timerId);
    };
  }, [inlineAlert]);

  function openModal(product?: LoanProduct) {
    setInlineAlert(null);

    if (product) {
      formik.setValues({
        name: product.name,
        duration: product.duration,
        interestRate: product.interestRate,
        minAmount: product.minAmount,
        maxAmount: product.maxAmount,
      });
      formik.setTouched({});
      setModal({ open: true, editing: product });
      return;
    }

    formik.resetForm();
    formik.setValues({
      name: '',
      duration: '2 Weeks',
      interestRate: '',
      minAmount: '',
      maxAmount: '',
    });
    formik.setTouched({});
    setModal({ open: true, editing: null });
  }

  function closeModal() {
    formik.resetForm();
    setModal({ open: false, editing: null });
  }

  async function toggleStatus(product: LoanProduct) {
    const now = new Date().toISOString().split('T')[0];
    const nextStatus: LoanProduct['status'] = product.status === 'Active' ? 'Inactive' : 'Active';

    const change: ProductChange = {
      id: `CH-${Date.now()}`,
      date: now,
      field: 'Status',
      oldValue: product.status,
      newValue: nextStatus,
      modifiedBy: actorName,
    };

    try {
      setSubmitting(true);
      const response = await api.patch(`/admin/business-rules/loan-products/${product.id}`, {
        status: nextStatus,
        modifiedBy: actorName,
        changeHistory: [
          {
            date: change.date,
            field: change.field,
            oldValue: change.oldValue,
            newValue: change.newValue,
            modifiedBy: change.modifiedBy,
          },
        ],
      });

      const updated = extractLoanProducts({ data: [response] })[0];
      if (updated) {
        setProducts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      }

      showToast('Product status updated — change recorded');
    } catch (error) {
      const message = extractApiErrorMessage(error, 'Failed to update product status');
      showToast(message);
      setInlineAlert({ type: 'error', message });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteProduct() {
    if (!deleteTarget) {
      return;
    }

    try {
      setSubmitting(true);
      await api.delete(`/admin/business-rules/loan-products/${deleteTarget.id}`);
      setProducts((current) => current.filter((item) => item.id !== deleteTarget.id));
      setExpandedId((current) => (current === deleteTarget.id ? null : current));
      setDeleteTarget(null);
      showToast(`Deleted ${deleteTarget.name}`);
    } catch (error) {
      const message = extractApiErrorMessage(error, 'Failed to delete loan product');
      showToast(message);
      setInlineAlert({ type: 'error', message });
    } finally {
      setSubmitting(false);
    }
  }

  const activeCount = useMemo(() => products.filter((item) => item.status === 'Active').length, [products]);

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-4 left-1/2 z-[60] bg-primary text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm font-body">
            <CheckCircleIcon size={16} />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <PackageIcon size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-heading font-bold text-gray-900">Loan Products</h3>
            <p className="text-sm font-body text-gray-500">
              {activeCount} active of {products.length} products
            </p>
          </div>
        </div>
        <button
          onClick={() => openModal()}
          disabled={submitting || loading}
          className="flex items-center gap-1.5 px-4 py-2 bg-accent text-white rounded-lg text-sm font-heading font-bold hover:bg-[#e64a19] transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
          <PlusIcon size={14} />
          Add Product
        </button>
      </div>

      {inlineAlert && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            inlineAlert.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}>
          {inlineAlert.message}
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-100 px-6 py-12 text-center text-gray-500 text-sm">Loading loan products...</div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 px-6 py-12 text-center">
            <PackageIcon size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-heading font-bold text-gray-500">No loan products configured</p>
            <p className="text-xs font-body text-gray-400 mt-1">Create a product to populate this list.</p>
          </div>
        ) : (
          products.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div
                className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 transition-colors"
                onClick={() => setExpandedId(expandedId === product.id ? null : product.id)}>
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      product.status === 'Active' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'
                    }`}>
                    <PackageIcon size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-heading font-bold text-gray-900">{product.name}</p>
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
                    <p className="text-sm font-heading font-bold text-gray-800">{product.duration}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-body text-gray-400">Interest</p>
                    <p className="text-sm font-heading font-bold text-accent">{product.interestRate}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-body text-gray-400">Range</p>
                    <p className="text-xs font-body font-medium text-gray-700">
                      {formatAmount(product.minAmount)} – {formatAmount(product.maxAmount)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      openModal(product);
                    }}
                    className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors">
                    <PencilIcon size={14} />
                  </button>
                  {expandedId === product.id ? <ChevronUpIcon size={16} className="text-gray-400" /> : <ChevronDownIcon size={16} className="text-gray-400" />}
                </div>
              </div>

              <AnimatePresence>
                {expandedId === product.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden">
                    <div className="px-6 pb-5 border-t border-gray-100 pt-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5 sm:hidden">
                        <div>
                          <p className="text-xs text-gray-400">Duration</p>
                          <p className="text-sm font-bold text-gray-800">{product.duration}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Interest</p>
                          <p className="text-sm font-bold text-accent">{product.interestRate}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Min</p>
                          <p className="text-sm font-bold text-gray-800">{formatAmount(product.minAmount)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Max</p>
                          <p className="text-sm font-bold text-gray-800">{formatAmount(product.maxAmount)}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
                        <p className="text-xs font-body text-gray-400">
                          Last modified: {product.lastModified} by {product.modifiedBy}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            disabled={submitting}
                            onClick={(event) => {
                              event.stopPropagation();
                              void toggleStatus(product);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold transition-colors disabled:opacity-60 ${
                              product.status === 'Active'
                                ? 'border border-red-200 text-red-600 hover:bg-red-50'
                                : 'border border-green-200 text-green-600 hover:bg-green-50'
                            }`}>
                            {product.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            disabled={submitting}
                            onClick={(event) => {
                              event.stopPropagation();
                              setDeleteTarget(product);
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-heading font-bold border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60 flex items-center gap-1">
                            <Trash2Icon size={12} /> Delete
                          </button>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <HistoryIcon size={14} className="text-gray-500" />
                          <h4 className="text-sm font-heading font-bold text-gray-700">Change History</h4>
                          <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{product.changeHistory.length}</span>
                        </div>
                        {product.changeHistory.length === 0 ? (
                          <p className="text-xs font-body text-gray-400 italic">No changes recorded yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {product.changeHistory.map((change) => (
                              <div key={change.id} className="flex items-start gap-3 text-xs">
                                <ClockIcon size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                <div>
                                  <span className="text-gray-500">{change.date}</span>
                                  <span className="mx-1.5 text-gray-300">·</span>
                                  <span className="font-medium text-gray-700">{change.field}</span>
                                  <span className="text-gray-400"> changed from </span>
                                  <span className="text-red-500 line-through">{change.oldValue}</span>
                                  <span className="text-gray-400"> to </span>
                                  <span className="text-green-600 font-medium">{change.newValue}</span>
                                  <span className="text-gray-400"> by {change.modifiedBy}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>

      <ModalWrapper isOpen={modal.open} onClose={closeModal}>
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
            <h3 className="text-lg font-heading font-bold text-gray-900">{modal.editing ? 'Edit Loan Product' : 'Add Loan Product'}</h3>
            <p className="text-xs font-body text-gray-500">
              {modal.editing ? `${modal.editing.id} — Changes will be recorded` : 'Configure a new loan product'}
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
              required
            />
            {formik.touched.name && formik.errors.name && <p className="text-xs text-red-600 mt-1">{formik.errors.name}</p>}
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
                {durationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
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
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
              </div>
              {formik.touched.interestRate && formik.errors.interestRate && (
                <p className="text-xs text-red-600 mt-1">{formik.errors.interestRate}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-body font-medium text-gray-600 mb-1.5">
                Min Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₦</span>
                <input
                  id="minAmount"
                  name="minAmount"
                  type="number"
                  value={formik.values.minAmount}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="10000"
                  className={`${inputClass} pl-8`}
                  required
                />
              </div>
              {formik.touched.minAmount && formik.errors.minAmount && <p className="text-xs text-red-600 mt-1">{formik.errors.minAmount}</p>}
            </div>

            <div>
              <label className="block text-xs font-body font-medium text-gray-600 mb-1.5">
                Max Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₦</span>
                <input
                  id="maxAmount"
                  name="maxAmount"
                  type="number"
                  value={formik.values.maxAmount}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="500000"
                  className={`${inputClass} pl-8`}
                  required
                />
              </div>
              {formik.touched.maxAmount && formik.errors.maxAmount && <p className="text-xs text-red-600 mt-1">{formik.errors.maxAmount}</p>}
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
              disabled={!formik.isValid || submitting}
              className="px-4 py-2 text-sm font-heading font-bold bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              {submitting && <Loader2Icon size={14} className="animate-spin" />}
              {modal.editing ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </ModalWrapper>

      <ModalWrapper isOpen={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <div className="pr-8">
          <h3 className="text-lg font-heading font-bold text-gray-900">Delete Loan Product</h3>
          <p className="text-sm text-gray-600 mt-1">
            Delete <span className="font-semibold">{deleteTarget?.name}</span>? This action cannot be undone.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-6">
          <button
            type="button"
            onClick={() => setDeleteTarget(null)}
            className="px-4 py-2 text-sm font-heading font-bold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => {
              void handleDeleteProduct();
            }}
            className="px-4 py-2 text-sm font-heading font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center gap-2">
            {submitting && <Loader2Icon size={14} className="animate-spin" />}
            Delete Product
          </button>
        </div>
      </ModalWrapper>
    </div>
  );
}

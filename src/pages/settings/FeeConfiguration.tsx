import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  XIcon,
  CheckCircleIcon,
  Loader2Icon,
  ReceiptIcon,
  BuildingIcon,
  UsersIcon,
  BanknoteIcon,
  GitBranchIcon,
  SaveIcon,
} from 'lucide-react';
import { api } from '../../app/api';

type BackendFeeCategory = 'organization' | 'branch' | 'group' | 'loan';
type BackendChargingType = 'fixed' | 'percentage';

type FeeRule = {
  category: BackendFeeCategory;
  chargingType: BackendChargingType;
  feeTitle: string;
  description: string;
  amount: number;
  isApproved?: boolean;
};

type FeeFormState = {
  category: BackendFeeCategory;
  chargingType: BackendChargingType;
  feeTitle: string;
  description: string;
  amount: string;
  isApproved: boolean;
};

const categoryMeta: Record<BackendFeeCategory, { label: string; icon: React.ReactNode; color: string }> = {
  organization: {
    label: 'Organization Fees',
    icon: <BuildingIcon size={16} />,
    color: 'bg-primary/10 text-primary',
  },
  branch: {
    label: 'Branch Fees',
    icon: <GitBranchIcon size={16} />,
    color: 'bg-blue-50 text-blue-600',
  },
  group: {
    label: 'Group Fees',
    icon: <UsersIcon size={16} />,
    color: 'bg-purple-50 text-purple-600',
  },
  loan: {
    label: 'Loan Fees',
    icon: <BanknoteIcon size={16} />,
    color: 'bg-orange-50 text-orange-600',
  },
};

const inputClass =
  'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all';

function ModalWrapper({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) {
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

function toCurrency(value: number): string {
  return `₦${Math.round(value).toLocaleString()}`;
}

function extractFees(response: unknown): FeeRule[] {
  if (!response || typeof response !== 'object') {
    return [];
  }

  const source = response as {
    data?: unknown;
    payload?: unknown;
    fees?: unknown;
  };

  const container =
    (source.data && typeof source.data === 'object' ? source.data : null) ||
    (source.payload && typeof source.payload === 'object' ? source.payload : null) ||
    source;

  if (!container || typeof container !== 'object') {
    return [];
  }

  const rawFees = (container as { fees?: unknown }).fees;
  if (!Array.isArray(rawFees)) {
    return [];
  }

  return rawFees
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const row = item as Record<string, unknown>;
      const amount = typeof row.amount === 'number' ? row.amount : Number(row.amount);
      if (!['organization', 'branch', 'group', 'loan'].includes(String(row.category))) {
        return null;
      }
      if (!['fixed', 'percentage'].includes(String(row.chargingType))) {
        return null;
      }
      if (!Number.isFinite(amount)) {
        return null;
      }

      return {
        category: row.category as BackendFeeCategory,
        chargingType: row.chargingType as BackendChargingType,
        feeTitle: typeof row.feeTitle === 'string' ? row.feeTitle : '',
        description: typeof row.description === 'string' ? row.description : '',
        amount,
        isApproved: Boolean(row.isApproved),
      } satisfies FeeRule;
    })
    .filter((item): item is FeeRule => item !== null);
}

function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== 'object') {
    return fallback;
  }

  const maybeError = error as {
    message?: unknown;
    response?: {
      data?: {
        message?: unknown;
        error?: unknown;
        errors?: unknown;
      };
    };
  };

  const responseData = maybeError.response?.data;
  if (responseData) {
    if (typeof responseData.message === 'string' && responseData.message.trim()) {
      return responseData.message;
    }
    if (typeof responseData.error === 'string' && responseData.error.trim()) {
      return responseData.error;
    }
    if (Array.isArray(responseData.errors) && responseData.errors.length > 0) {
      const first = responseData.errors[0];
      if (typeof first === 'string' && first.trim()) {
        return first;
      }
      if (first && typeof first === 'object' && 'message' in first) {
        const details = first as { message?: unknown };
        if (typeof details.message === 'string' && details.message.trim()) {
          return details.message;
        }
      }
    }
  }

  if (typeof maybeError.message === 'string' && maybeError.message.trim()) {
    return maybeError.message;
  }

  return fallback;
}

export function FeeConfiguration() {
  const [fees, setFees] = useState<FeeRule[]>([]);
  const [activeCategory, setActiveCategory] = useState<BackendFeeCategory>('organization');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formError, setFormError] = useState('');
  const [formState, setFormState] = useState<FeeFormState>({
    category: 'organization',
    chargingType: 'fixed',
    feeTitle: '',
    description: '',
    amount: '',
    isApproved: false,
  });
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [toast, setToast] = useState({ message: '', visible: false });
  const [inlineAlert, setInlineAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  function showToast(message: string) {
    setToast({ message, visible: true });
    setTimeout(() => setToast((current) => ({ ...current, visible: false })), 3000);
  }

  useEffect(() => {
    let isMounted = true;

    const loadFees = async () => {
      try {
        setLoading(true);
        setInlineAlert(null);
        const response = await api.get('/admin/business-rules');
        const incoming = extractFees(response);
        if (isMounted) {
          setFees(incoming);
          setInlineAlert({
            type: 'success',
            message: 'Fee configuration loaded from backend.',
          });
        }
      } catch (error) {
        if (isMounted) {
          const message = extractApiErrorMessage(error, 'Failed to load fee configuration');
          showToast(message);
          setInlineAlert({ type: 'error', message });
          setFees([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadFees();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!inlineAlert || inlineAlert.type !== 'success') {
      return;
    }

    const timeoutId = setTimeout(() => {
      setInlineAlert((current) => {
        if (!current || current.type !== 'success') {
          return current;
        }
        return null;
      });
    }, 4500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [inlineAlert]);

  const categoryFees = useMemo(() => fees.filter((fee) => fee.category === activeCategory), [fees, activeCategory]);

  const openCreate = (category: BackendFeeCategory) => {
    setEditingIndex(null);
    setFormError('');
    setInlineAlert(null);
    setFormState({
      category,
      chargingType: 'fixed',
      feeTitle: '',
      description: '',
      amount: '',
      isApproved: false,
    });
    setModalOpen(true);
  };

  const openEdit = (fee: FeeRule, index: number) => {
    setEditingIndex(index);
    setFormError('');
    setInlineAlert(null);
    setFormState({
      category: fee.category,
      chargingType: fee.chargingType,
      feeTitle: fee.feeTitle,
      description: fee.description,
      amount: String(fee.amount),
      isApproved: Boolean(fee.isApproved),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingIndex(null);
    setFormError('');
  };

  const handleSubmitFee = async () => {
    const title = formState.feeTitle.trim();
    const description = formState.description.trim();
    const amount = Number(formState.amount);

    if (title.length < 2) {
      setFormError('Fee title must be at least 2 characters');
      return;
    }
    if (description.length < 2) {
      setFormError('Description must be at least 2 characters');
      return;
    }
    if (!Number.isFinite(amount) || amount < 0) {
      setFormError('Amount must be 0 or greater');
      return;
    }

    const nextFee: FeeRule = {
      category: formState.category,
      chargingType: formState.chargingType,
      feeTitle: title,
      description,
      amount,
      isApproved: formState.isApproved,
    };

    const nextFees =
      editingIndex === null
        ? [...fees, nextFee]
        : fees.map((fee, index) => (index === editingIndex ? nextFee : fee));

    if (editingIndex === null) {
      try {
        setSaving(true);
        setInlineAlert(null);
        const response = await api.put('/admin/business-rules/fees', { fees: nextFees });
        setFees(extractFees(response));
        const successMessage = 'Fee added and saved to backend.';
        setInlineAlert({ type: 'success', message: successMessage });
        showToast(successMessage);
        closeModal();
      } catch (error) {
        const message = extractApiErrorMessage(error, 'Failed to add fee to backend');
        setInlineAlert({ type: 'error', message });
        showToast(message);
      } finally {
        setSaving(false);
      }
      return;
    }

    setFees(nextFees);
    showToast('Fee updated locally');
    closeModal();
  };

  const handleDeleteFee = () => {
    if (deleteIndex === null) {
      return;
    }

    setFees((previous) => previous.filter((_, index) => index !== deleteIndex));
    setDeleteIndex(null);
    showToast('Fee removed locally');
  };

  const handleSaveAll = async () => {
    if (fees.length === 0) {
      const message = 'Add at least one fee before saving';
      showToast(message);
      setInlineAlert({ type: 'error', message });
      return;
    }

    try {
      setSaving(true);
      setInlineAlert(null);
      const response = await api.put('/admin/business-rules/fees', { fees });
      setFees(extractFees(response));
      const successMessage = 'Fee configuration saved to backend.';
      setInlineAlert({ type: 'success', message: successMessage });
      showToast(successMessage);
    } catch (error) {
      const message = extractApiErrorMessage(error, 'Failed to save fee configuration');
      setInlineAlert({ type: 'error', message });
      showToast(message);
    } finally {
      setSaving(false);
    }
  };

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

      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-heading font-bold text-gray-900">Fee Configuration</h3>
          <p className="text-sm text-gray-500">Configured from backend business rules (`/admin/business-rules/fees`).</p>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={saving || loading}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-heading font-bold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
          {saving ? <Loader2Icon size={14} className="animate-spin" /> : <SaveIcon size={14} />} Save to Backend
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(Object.keys(categoryMeta) as BackendFeeCategory[]).map((category) => {
          const count = fees.filter((fee) => fee.category === category).length;
          return (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`p-4 rounded-xl border text-left transition-all ${
                activeCategory === category ? 'border-primary/30 ring-1 ring-primary/10 bg-white shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200'
              }`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${categoryMeta[category].color}`}>
                {categoryMeta[category].icon}
              </div>
              <p className="text-xs font-body text-gray-500">{categoryMeta[category].label}</p>
              <p className="text-lg font-heading font-bold text-gray-900">{count}</p>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${categoryMeta[activeCategory].color}`}>
              {categoryMeta[activeCategory].icon}
            </div>
            <div>
              <h3 className="text-lg font-heading font-bold text-gray-900">{categoryMeta[activeCategory].label}</h3>
              <p className="text-sm font-body text-gray-500">{categoryFees.length} fee{categoryFees.length !== 1 ? 's' : ''} configured</p>
            </div>
          </div>
          <button
            onClick={() => openCreate(activeCategory)}
            className="flex items-center gap-1.5 px-4 py-2 bg-accent text-white rounded-lg text-sm font-heading font-bold hover:bg-[#e64a19] transition-colors">
            <PlusIcon size={14} />
            Add Fee
          </button>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-gray-500 text-sm">Loading fee configuration...</div>
        ) : categoryFees.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <ReceiptIcon size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-heading font-bold text-gray-500">No fees configured</p>
            <p className="text-xs font-body text-gray-400 mt-1">Add a fee and save to backend.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider font-heading">
                  <th className="px-6 py-3 font-medium">Fee Title</th>
                  <th className="px-6 py-3 font-medium">Charging Type</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Approved</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {categoryFees.map((fee, idx) => {
                  const sourceIndex = fees.findIndex((item) => item === fee);
                  return (
                    <tr key={`${fee.category}-${fee.feeTitle}-${idx}`} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-heading font-medium text-gray-900">{fee.feeTitle}</p>
                        <p className="text-xs text-gray-400 mt-0.5 max-w-[280px] truncate">{fee.description}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-heading font-medium ${
                            fee.chargingType === 'fixed'
                              ? 'bg-blue-100 text-blue-700 border border-blue-200'
                              : 'bg-purple-100 text-purple-700 border border-purple-200'
                          }`}>
                          {fee.chargingType}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-heading font-bold text-gray-800">
                        {fee.chargingType === 'fixed' ? toCurrency(fee.amount) : `${fee.amount}%`}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setFees((previous) => {
                              const next = [...previous];
                              next[sourceIndex] = { ...next[sourceIndex], isApproved: !next[sourceIndex].isApproved };
                              return next;
                            });
                          }}
                          className={`px-2.5 py-1 rounded-full text-xs font-heading font-bold ${
                            fee.isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                          {fee.isApproved ? 'Approved' : 'Pending'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openEdit(fee, sourceIndex)}
                          className="text-primary hover:text-accent mr-3 transition-colors">
                          <PencilIcon size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteIndex(sourceIndex)}
                          className="text-gray-400 hover:text-red-600 transition-colors">
                          <Trash2Icon size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ModalWrapper isOpen={deleteIndex !== null} onClose={() => setDeleteIndex(null)}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Trash2Icon size={24} className="text-red-600" />
          </div>
          <h3 className="text-lg font-heading font-bold text-gray-900 mb-2">Delete Fee</h3>
          <p className="text-sm font-body text-gray-500 mb-6">This removes the fee locally. Click “Save to Backend” to persist.</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setDeleteIndex(null)}
              className="px-4 py-2 text-sm font-heading font-bold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleDeleteFee}
              className="px-4 py-2 text-sm font-heading font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              Delete
            </button>
          </div>
        </div>
      </ModalWrapper>

      <ModalWrapper isOpen={modalOpen} onClose={closeModal}>
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
          <XIcon size={18} />
        </button>
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${categoryMeta[formState.category].color}`}>
            <ReceiptIcon size={20} />
          </div>
          <div>
            <h3 className="text-lg font-heading font-bold text-gray-900">{editingIndex === null ? 'Add Fee Rule' : 'Edit Fee Rule'}</h3>
            <p className="text-xs font-body text-gray-500">Backend category + charging type aligned to API</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-body font-medium text-gray-600 mb-1.5">Category</label>
            <select
              value={formState.category}
              onChange={(event) => setFormState((previous) => ({ ...previous, category: event.target.value as BackendFeeCategory }))}
              className={`${inputClass} bg-white`}>
              {(Object.keys(categoryMeta) as BackendFeeCategory[]).map((category) => (
                <option key={category} value={category}>
                  {categoryMeta[category].label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-body font-medium text-gray-600 mb-1.5">Fee Title</label>
            <input
              value={formState.feeTitle}
              onChange={(event) => setFormState((previous) => ({ ...previous, feeTitle: event.target.value }))}
              className={inputClass}
              placeholder="e.g. Registration Form"
            />
          </div>

          <div>
            <label className="block text-xs font-body font-medium text-gray-600 mb-1.5">Charging Type</label>
            <select
              value={formState.chargingType}
              onChange={(event) => setFormState((previous) => ({ ...previous, chargingType: event.target.value as BackendChargingType }))}
              className={`${inputClass} bg-white`}>
              <option value="fixed">Fixed</option>
              <option value="percentage">Percentage</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-body font-medium text-gray-600 mb-1.5">Amount</label>
            <input
              type="number"
              min={0}
              step={formState.chargingType === 'percentage' ? '0.01' : '1'}
              value={formState.amount}
              onChange={(event) => setFormState((previous) => ({ ...previous, amount: event.target.value }))}
              className={inputClass}
              placeholder={formState.chargingType === 'percentage' ? '2.5' : '500'}
            />
          </div>

          <div>
            <label className="block text-xs font-body font-medium text-gray-600 mb-1.5">Description</label>
            <textarea
              value={formState.description}
              onChange={(event) => setFormState((previous) => ({ ...previous, description: event.target.value }))}
              rows={3}
              className={`${inputClass} resize-none`}
              placeholder="Describe what this fee applies to"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={formState.isApproved}
              onChange={(event) => setFormState((previous) => ({ ...previous, isApproved: event.target.checked }))}
            />
            Mark as approved
          </label>

          {formError && <p className="text-xs text-red-600">{formError}</p>}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-sm font-heading font-bold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmitFee}
              className="px-4 py-2 text-sm font-heading font-bold bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
              {editingIndex === null ? 'Add Fee' : 'Save Changes'}
            </button>
          </div>
        </div>
      </ModalWrapper>
    </div>
  );
}
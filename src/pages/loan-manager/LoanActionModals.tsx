import React from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
  CornerDownLeftIcon,
  SendIcon,
  FlagIcon,
  CreditCardIcon,
  GavelIcon,
  ShieldCheckIcon,
  ArchiveIcon } from
'lucide-react';
import { ConfirmationModal } from '../../components/ConfirmationModal';
interface LoanActionModalsProps {
  activeModal: string | null;
  onClose: () => void;
  onConfirm: (action: string, inputValue?: string) => void;
  loanId: string;
}
export function LoanActionModals({
  activeModal,
  onClose,
  onConfirm,
  loanId
}: LoanActionModalsProps) {
  return (
    <>
      <ConfirmationModal
        isOpen={activeModal === 'approve'}
        onClose={onClose}
        onConfirm={(val) => onConfirm('approve', val)}
        title="Approve Loan"
        description={`Are you sure you want to approve loan ${loanId}? This will advance the loan to the next stage in the approval workflow.`}
        icon={
        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
            <CheckCircleIcon size={20} />
          </div>
        }
        confirmLabel="Approve Loan"
        confirmVariant="primary"
        inputType="textarea"
        inputLabel="Comments (optional)"
        inputPlaceholder="Add approval comments..." />
      

      <ConfirmationModal
        isOpen={activeModal === 'reject'}
        onClose={onClose}
        onConfirm={(val) => onConfirm('reject', val)}
        title="Reject Loan"
        description={`Are you sure you want to reject loan ${loanId}? This action cannot be easily undone.`}
        icon={
        <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
            <XCircleIcon size={20} />
          </div>
        }
        confirmLabel="Reject Loan"
        confirmVariant="danger"
        inputType="textarea"
        inputLabel="Reason for rejection"
        inputPlaceholder="Provide the reason for rejecting this loan..."
        requireInput />
      

      <ConfirmationModal
        isOpen={activeModal === 'requestInfo'}
        onClose={onClose}
        onConfirm={(val) => onConfirm('requestInfo', val)}
        title="Request Additional Information"
        description="Send a request for additional information or documentation from the branch."
        icon={
        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <AlertCircleIcon size={20} />
          </div>
        }
        confirmLabel="Send Request"
        confirmVariant="blue"
        inputType="textarea"
        inputLabel="Information needed"
        inputPlaceholder="Describe what additional information is required..."
        requireInput />
      

      <ConfirmationModal
        isOpen={activeModal === 'returnToBranch'}
        onClose={onClose}
        onConfirm={(val) => onConfirm('returnToBranch', val)}
        title="Return to Branch"
        description={`Return loan ${loanId} to the originating branch for further review or corrections.`}
        icon={
        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
            <CornerDownLeftIcon size={20} />
          </div>
        }
        confirmLabel="Return to Branch"
        inputType="textarea"
        inputLabel="Reason for return (optional)"
        inputPlaceholder="Explain why this loan is being returned..." />
      

      <ConfirmationModal
        isOpen={activeModal === 'recommend'}
        onClose={onClose}
        onConfirm={(val) => onConfirm('recommend', val)}
        title="Recommend for Approval"
        description={`Recommend loan ${loanId} for approval by the next level in the workflow.`}
        icon={
        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
            <SendIcon size={20} />
          </div>
        }
        confirmLabel="Recommend"
        confirmVariant="primary"
        inputType="textarea"
        inputLabel="Recommendation notes (optional)"
        inputPlaceholder="Add your recommendation notes..." />
      

      <ConfirmationModal
        isOpen={activeModal === 'flagForReview'}
        onClose={onClose}
        onConfirm={(val) => onConfirm('flagForReview', val)}
        title="Flag for Review"
        description="Flag this loan application for additional review or investigation."
        icon={
        <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
            <FlagIcon size={20} />
          </div>
        }
        confirmLabel="Flag for Review"
        confirmVariant="orange"
        inputType="textarea"
        inputLabel="Reason for flagging"
        inputPlaceholder="Describe the concern or issue..."
        requireInput />
      

      <ConfirmationModal
        isOpen={activeModal === 'recordPayment'}
        onClose={onClose}
        onConfirm={(val) => onConfirm('recordPayment', val)}
        title="Record Payment"
        description={`Record a repayment for loan ${loanId}.`}
        icon={
        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
            <CreditCardIcon size={20} />
          </div>
        }
        confirmLabel="Record Payment"
        confirmVariant="primary"
        inputType="amount"
        inputLabel="Payment amount"
        inputPlaceholder="Enter amount"
        requireInput />
      

      <ConfirmationModal
        isOpen={activeModal === 'applyPenalty'}
        onClose={onClose}
        onConfirm={(val) => onConfirm('applyPenalty', val)}
        title="Apply Late Payment Penalty"
        description="Apply a penalty for late or missed payment on this loan."
        icon={
        <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
            <GavelIcon size={20} />
          </div>
        }
        confirmLabel="Apply Penalty"
        confirmVariant="danger"
        inputType="amount"
        inputLabel="Penalty amount"
        inputPlaceholder="Enter penalty amount"
        requireInput />
      

      <ConfirmationModal
        isOpen={activeModal === 'waivePenalty'}
        onClose={onClose}
        onConfirm={(val) => onConfirm('waivePenalty', val)}
        title="Waive Penalty"
        description="Waive the outstanding penalty on this loan. This requires Super Admin authorization."
        icon={
        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
            <ShieldCheckIcon size={20} />
          </div>
        }
        confirmLabel="Waive Penalty"
        confirmVariant="primary"
        inputType="textarea"
        inputLabel="Reason for waiver (optional)"
        inputPlaceholder="Explain why the penalty is being waived..." />
      

      <ConfirmationModal
        isOpen={activeModal === 'closeLoan'}
        onClose={onClose}
        onConfirm={(val) => onConfirm('closeLoan', val)}
        title="Close Loan"
        description={`Close loan ${loanId} and archive it. This marks the loan as fully completed.`}
        icon={
        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
            <ArchiveIcon size={20} />
          </div>
        }
        confirmLabel="Close Loan" />
      
    </>);

}
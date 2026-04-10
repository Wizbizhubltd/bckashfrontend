import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  FileTextIcon,
  ImageIcon,
  FingerprintIcon,
  AlertCircleIcon,
  ChevronRightIcon } from
'lucide-react';
interface KycStatuses {
  bvn: string;
  nin: string;
  utilityBill: string;
  passportPhoto: string;
  biometric: string;
}
interface KycOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  kycStatuses: KycStatuses;
  onVerifyItem: (type: string) => void;
}
const kycItems = [
{
  key: 'bvn',
  label: 'BVN Verification',
  icon: ShieldCheckIcon
},
{
  key: 'nin',
  label: 'NIN Verification',
  icon: FileTextIcon
},
{
  key: 'utilityBill',
  label: 'Utility Bill',
  icon: FileTextIcon
},
{
  key: 'passportPhoto',
  label: 'Passport Photo',
  icon: ImageIcon
},
{
  key: 'biometric',
  label: 'Biometric Capture',
  icon: FingerprintIcon
}];

function isVerified(status: string): boolean {
  return status === 'Verified' || status === 'Captured';
}
export function KycOverviewModal({
  isOpen,
  onClose,
  kycStatuses,
  onVerifyItem
}: KycOverviewModalProps) {
  const verifiedCount = Object.values(kycStatuses).filter(isVerified).length;
  const totalCount = 5;
  const progressPercent = verifiedCount / totalCount * 100;
  const allVerified = verifiedCount === totalCount;
  if (!isOpen) return null;
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
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}>
        
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div
          initial={{
            opacity: 0,
            scale: 0.95,
            y: 20
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0
          }}
          exit={{
            opacity: 0,
            scale: 0.95,
            y: 20
          }}
          transition={{
            duration: 0.2
          }}
          className="relative bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}>
          
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ShieldCheckIcon size={16} className="text-primary" />
                </div>
                <h3 className="text-lg font-heading font-bold text-gray-900">
                  KYC Verification
                </h3>
              </div>
              <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              
                <XIcon size={18} />
              </button>
            </div>

            {/* Progress Section */}
            <div className="px-6 pt-5 pb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-body font-medium text-gray-700">
                  Verification Progress
                </p>
                <p className="text-sm font-heading font-bold text-primary">
                  {verifiedCount}/{totalCount}
                </p>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                initial={{
                  width: 0
                }}
                animate={{
                  width: `${progressPercent}%`
                }}
                transition={{
                  duration: 0.5,
                  ease: 'easeOut'
                }}
                className={`h-full rounded-full ${allVerified ? 'bg-green-500' : 'bg-primary'}`} />
              
              </div>
              {allVerified &&
            <motion.p
              initial={{
                opacity: 0
              }}
              animate={{
                opacity: 1
              }}
              className="text-xs font-body text-green-600 mt-2 flex items-center gap-1">
              
                  <CheckCircleIcon size={12} />
                  All KYC requirements verified
                </motion.p>
            }
            </div>

            {/* KYC Items */}
            <div className="px-6 pb-6 space-y-1.5">
              {kycItems.map((item) => {
              const status = kycStatuses[item.key as keyof KycStatuses];
              const verified = isVerified(status);
              const Icon = item.icon;
              return (
                <div
                  key={item.key}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${verified ? 'bg-green-50/60' : 'bg-gray-50 hover:bg-gray-100'}`}>
                  
                    <div className="flex items-center gap-3">
                      <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${verified ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                      
                        {verified ?
                      <CheckCircleIcon size={18} /> :

                      <Icon size={18} />
                      }
                      </div>
                      <div>
                        <p className="text-sm font-body font-medium text-gray-800">
                          {item.label}
                        </p>
                        <p
                        className={`text-xs font-body ${verified ? 'text-green-600' : 'text-amber-600'}`}>
                        
                          {status}
                        </p>
                      </div>
                    </div>
                    {!verified ?
                  <button
                    onClick={() => {
                      onClose();
                      setTimeout(() => onVerifyItem(item.key), 200);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-heading font-bold rounded-lg hover:bg-primary/90 transition-colors">
                    
                        Verify
                        <ChevronRightIcon size={14} />
                      </button> :

                  <span className="text-xs font-body font-medium text-green-600 flex items-center gap-1">
                        <CheckCircleIcon size={14} />
                        Done
                      </span>
                  }
                  </div>);

            })}
            </div>

            {/* Footer */}
            {!allVerified &&
          <div className="px-6 pb-5">
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                  <AlertCircleIcon
                size={16}
                className="text-amber-600 mt-0.5 flex-shrink-0" />
              
                  <p className="text-xs font-body text-amber-700">
                    {totalCount - verifiedCount} item
                    {totalCount - verifiedCount > 1 ? 's' : ''} pending
                    verification. Complete all KYC requirements before loan
                    disbursement.
                  </p>
                </div>
              </div>
          }
          </motion.div>
        </motion.div>
      }
    </AnimatePresence>);

}
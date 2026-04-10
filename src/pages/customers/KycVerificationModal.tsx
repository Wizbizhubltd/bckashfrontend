import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon,
  FileTextIcon,
  UploadIcon,
  FileIcon,
  LoaderIcon } from
'lucide-react';
type KycType = 'bvn' | 'nin' | 'utilityBill' | 'passportPhoto';
type VerifyStep = 'input' | 'verifying' | 'success' | 'failed';
type UploadStep = 'upload' | 'review' | 'approved';
interface KycVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  kycType: KycType;
  currentNumber?: string;
  onVerified: (kycType: KycType) => void;
}
const kycLabels: Record<KycType, string> = {
  bvn: 'BVN Verification',
  nin: 'NIN Verification',
  utilityBill: 'Utility Bill Verification',
  passportPhoto: 'Passport Photo Verification'
};
const kycDescriptions: Record<KycType, string> = {
  bvn: "Enter the customer's Bank Verification Number to verify their identity.",
  nin: "Enter the customer's National Identification Number to verify their identity.",
  utilityBill:
  'Upload a recent utility bill (electricity, water, or waste) as proof of address.',
  passportPhoto:
  'Upload a clear passport photograph of the customer for identity verification.'
};
function isDocumentType(type: KycType): boolean {
  return type === 'utilityBill' || type === 'passportPhoto';
}
export function KycVerificationModal({
  isOpen,
  onClose,
  kycType,
  currentNumber,
  onVerified
}: KycVerificationModalProps) {
  const [verifyStep, setVerifyStep] = useState<VerifyStep>('input');
  const [uploadStep, setUploadStep] = useState<UploadStep>('upload');
  const [inputValue, setInputValue] = useState('');
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  useEffect(() => {
    if (!isOpen) {
      setVerifyStep('input');
      setUploadStep('upload');
      setInputValue('');
      setUploadedFile(null);
      setIsDragOver(false);
    }
  }, [isOpen]);
  useEffect(() => {
    if (verifyStep === 'verifying') {
      const timer = setTimeout(() => {
        // Simulate: always succeed for demo
        setVerifyStep('success');
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [verifyStep]);
  function handleVerifyNumber() {
    if (!inputValue.trim()) return;
    setVerifyStep('verifying');
  }
  function handleNumberSuccess() {
    onVerified(kycType);
    onClose();
  }
  function handleFileUpload() {
    const fileNames: Record<string, string> = {
      utilityBill: 'utility_bill_EKEDC_Mar2025.pdf',
      passportPhoto: 'passport_photo_customer.jpg'
    };
    setUploadedFile(fileNames[kycType] || 'document.pdf');
    setUploadStep('review');
  }
  function handleApproveDocument() {
    setUploadStep('approved');
    setTimeout(() => {
      onVerified(kycType);
      onClose();
    }, 1200);
  }
  if (!isOpen) return null;
  const isDoc = isDocumentType(kycType);
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
                  {isDoc ?
                <FileTextIcon size={16} className="text-primary" /> :

                <ShieldCheckIcon size={16} className="text-primary" />
                }
                </div>
                <h3 className="text-lg font-heading font-bold text-gray-900">
                  {kycLabels[kycType]}
                </h3>
              </div>
              <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              
                <XIcon size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              {/* Number-based verification (BVN / NIN) */}
              {!isDoc &&
            <>
                  {verifyStep === 'input' &&
              <div className="space-y-4">
                      <p className="text-sm font-body text-gray-500">
                        {kycDescriptions[kycType]}
                      </p>
                      {currentNumber &&
                <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs font-body text-gray-400">
                            Current on file
                          </p>
                          <p className="text-sm font-body font-medium text-gray-700 mt-0.5">
                            {currentNumber}
                          </p>
                        </div>
                }
                      <div>
                        <label className="block text-xs font-body font-medium text-gray-600 mb-1.5">
                          {kycType === 'bvn' ?
                    'BVN (11 digits)' :
                    'NIN (11 digits)'}
                        </label>
                        <input
                    type="text"
                    value={inputValue}
                    onChange={(e) =>
                    setInputValue(
                      e.target.value.replace(/\D/g, '').slice(0, 11)
                    )
                    }
                    placeholder={
                    kycType === 'bvn' ?
                    'Enter BVN number' :
                    'Enter NIN number'
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-body text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
                  
                        {inputValue.length > 0 && inputValue.length < 11 &&
                  <p className="text-xs font-body text-amber-600 mt-1">
                            {11 - inputValue.length} more digits required
                          </p>
                  }
                      </div>
                      <button
                  onClick={handleVerifyNumber}
                  disabled={inputValue.length !== 11}
                  className="w-full px-5 py-3 bg-primary text-white text-sm font-heading font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  
                        <ShieldCheckIcon size={16} />
                        Verify Now
                      </button>
                    </div>
              }

                  {verifyStep === 'verifying' &&
              <div className="text-center py-6 space-y-4">
                      <motion.div
                  animate={{
                    rotate: 360
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                  className="w-12 h-12 mx-auto">
                  
                        <LoaderIcon size={48} className="text-primary" />
                      </motion.div>
                      <div>
                        <h4 className="text-base font-heading font-bold text-gray-900">
                          Verifying {kycType.toUpperCase()}...
                        </h4>
                        <p className="text-sm font-body text-gray-500 mt-1">
                          Checking against NIBSS database. Please wait.
                        </p>
                      </div>
                      <motion.div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                    initial={{
                      width: '0%'
                    }}
                    animate={{
                      width: '100%'
                    }}
                    transition={{
                      duration: 1.8,
                      ease: 'linear'
                    }}
                    className="h-full bg-primary rounded-full" />
                  
                      </motion.div>
                    </div>
              }

                  {verifyStep === 'success' &&
              <div className="text-center py-4 space-y-4">
                      <motion.div
                  initial={{
                    scale: 0
                  }}
                  animate={{
                    scale: 1
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 15
                  }}
                  className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                  
                        <CheckCircleIcon size={36} className="text-green-600" />
                      </motion.div>
                      <div>
                        <h4 className="text-base font-heading font-bold text-gray-900">
                          Verification Successful
                        </h4>
                        <p className="text-sm font-body text-gray-500 mt-1">
                          {kycType.toUpperCase()} has been verified and
                          confirmed.
                        </p>
                      </div>
                      <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-left">
                        <div className="grid grid-cols-2 gap-2 text-sm font-body">
                          <div>
                            <p className="text-xs text-green-600">Name Match</p>
                            <p className="font-medium text-green-800">
                              Confirmed ✓
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-green-600">DOB Match</p>
                            <p className="font-medium text-green-800">
                              Confirmed ✓
                            </p>
                          </div>
                        </div>
                      </div>
                      <button
                  onClick={handleNumberSuccess}
                  className="w-full px-5 py-3 bg-primary text-white text-sm font-heading font-bold rounded-lg hover:bg-primary/90 transition-colors">
                  
                        Done
                      </button>
                    </div>
              }

                  {verifyStep === 'failed' &&
              <div className="text-center py-4 space-y-4">
                      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
                        <XCircleIcon size={36} className="text-red-500" />
                      </div>
                      <div>
                        <h4 className="text-base font-heading font-bold text-gray-900">
                          Verification Failed
                        </h4>
                        <p className="text-sm font-body text-gray-500 mt-1">
                          The {kycType.toUpperCase()} could not be verified.
                          Please check and try again.
                        </p>
                      </div>
                      <button
                  onClick={() => {
                    setVerifyStep('input');
                    setInputValue('');
                  }}
                  className="w-full px-5 py-3 bg-primary text-white text-sm font-heading font-bold rounded-lg hover:bg-primary/90 transition-colors">
                  
                        Try Again
                      </button>
                    </div>
              }
                </>
            }

              {/* Document-based verification (Utility Bill / Passport Photo) */}
              {isDoc &&
            <>
                  {uploadStep === 'upload' &&
              <div className="space-y-4">
                      <p className="text-sm font-body text-gray-500">
                        {kycDescriptions[kycType]}
                      </p>
                      <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    handleFileUpload();
                  }}
                  onClick={handleFileUpload}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragOver ? 'border-primary bg-primary/5' : 'border-gray-200 bg-gray-50 hover:bg-primary/5 hover:border-primary/30'}`}>
                  
                        <UploadIcon
                    size={32}
                    className="mx-auto text-gray-400 mb-3" />
                  
                        <p className="text-sm font-body font-medium text-gray-700">
                          Drag & drop file here
                        </p>
                        <p className="text-xs font-body text-gray-400 mt-1">
                          {kycType === 'utilityBill' ?
                    'PDF, JPG, PNG — Max 5MB' :
                    'JPG, PNG — Max 2MB'}
                        </p>
                      </div>
                    </div>
              }

                  {uploadStep === 'review' &&
              <div className="space-y-4">
                      <p className="text-sm font-body text-gray-500">
                        Review the uploaded document and approve or reject it.
                      </p>
                      <motion.div
                  initial={{
                    opacity: 0,
                    y: 8
                  }}
                  animate={{
                    opacity: 1,
                    y: 0
                  }}
                  className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileIcon size={20} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-body font-medium text-gray-800 truncate">
                            {uploadedFile}
                          </p>
                          <p className="text-xs font-body text-gray-500">
                            Uploaded just now
                          </p>
                        </div>
                      </motion.div>

                      {kycType === 'passportPhoto' &&
                <div className="bg-gray-100 rounded-lg h-40 flex items-center justify-center">
                          <p className="text-xs font-body text-gray-400">
                            Photo Preview Area
                          </p>
                        </div>
                }

                      <div className="flex gap-3">
                        <button
                    onClick={() => {
                      setUploadStep('upload');
                      setUploadedFile(null);
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-heading font-bold rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5">
                    
                          <XCircleIcon size={15} />
                          Reject
                        </button>
                        <button
                    onClick={handleApproveDocument}
                    className="flex-1 px-4 py-2.5 bg-primary text-white text-sm font-heading font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5">
                    
                          <CheckCircleIcon size={15} />
                          Approve
                        </button>
                      </div>
                    </div>
              }

                  {uploadStep === 'approved' &&
              <div className="text-center py-4 space-y-4">
                      <motion.div
                  initial={{
                    scale: 0
                  }}
                  animate={{
                    scale: 1
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 15
                  }}
                  className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                  
                        <CheckCircleIcon size={36} className="text-green-600" />
                      </motion.div>
                      <div>
                        <h4 className="text-base font-heading font-bold text-gray-900">
                          Document Approved
                        </h4>
                        <p className="text-sm font-body text-gray-500 mt-1">
                          {kycLabels[kycType]} has been verified successfully.
                        </p>
                      </div>
                    </div>
              }
                </>
            }
            </div>
          </motion.div>
        </motion.div>
      }
    </AnimatePresence>);

}
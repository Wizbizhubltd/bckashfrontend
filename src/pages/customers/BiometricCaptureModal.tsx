import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FingerprintIcon,
  XIcon,
  CheckCircleIcon,
  UploadIcon,
  FileIcon } from
'lucide-react';
type Step = 'start' | 'scanning' | 'success' | 'upload';
interface BiometricCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}
export function BiometricCaptureModal({
  isOpen,
  onClose,
  onComplete
}: BiometricCaptureModalProps) {
  const [step, setStep] = useState<Step>('start');
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  useEffect(() => {
    if (!isOpen) {
      setStep('start');
      setUploadedFile(null);
      setIsDragOver(false);
    }
  }, [isOpen]);
  useEffect(() => {
    if (step === 'scanning') {
      const timer = setTimeout(() => setStep('success'), 2500);
      return () => clearTimeout(timer);
    }
  }, [step]);
  function handleStartCapture() {
    setStep('scanning');
  }
  function handleDone() {
    onComplete();
    onClose();
  }
  function handleFileUpload() {
    setUploadedFile('fingerprint_scan_001.bmp');
  }
  function handleUploadComplete() {
    onComplete();
    onClose();
  }
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
              <h3 className="text-lg font-heading font-bold text-gray-900">
                Biometric Capture
              </h3>
              <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              
                <XIcon size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-8">
              {step === 'start' &&
            <div className="text-center space-y-5">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <FingerprintIcon size={40} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="text-base font-heading font-bold text-gray-900">
                      Ready to Capture Fingerprint
                    </h4>
                    <p className="text-sm font-body text-gray-500 mt-1.5">
                      Place the customer's finger on the scanner device and
                      click "Start Capture" to begin.
                    </p>
                  </div>
                  <button
                onClick={handleStartCapture}
                className="w-full px-5 py-3 bg-primary text-white text-sm font-heading font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                
                    <FingerprintIcon size={18} />
                    Start Capture
                  </button>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-white px-3 text-xs font-body text-gray-400">
                        or
                      </span>
                    </div>
                  </div>
                  <button
                onClick={() => setStep('upload')}
                className="w-full px-5 py-3 border border-gray-200 text-gray-700 text-sm font-heading font-bold rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                
                    <UploadIcon size={18} />
                    Upload Fingerprint File
                  </button>
                </div>
            }

              {step === 'scanning' &&
            <div className="text-center space-y-5">
                  <div className="relative w-24 h-24 mx-auto">
                    <motion.div
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.3, 0.1, 0.3]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                  className="absolute inset-0 rounded-full bg-primary/20" />
                
                    <motion.div
                  animate={{
                    scale: [1, 1.15, 1],
                    opacity: [0.5, 0.2, 0.5]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 0.2
                  }}
                  className="absolute inset-2 rounded-full bg-primary/20" />
                
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                    animate={{
                      opacity: [0.6, 1, 0.6]
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}>
                    
                        <FingerprintIcon size={44} className="text-primary" />
                      </motion.div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-base font-heading font-bold text-gray-900">
                      Scanning Fingerprint...
                    </h4>
                    <p className="text-sm font-body text-gray-500 mt-1.5">
                      Please keep the finger steady on the scanner.
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
                    duration: 2.5,
                    ease: 'linear'
                  }}
                  className="h-full bg-primary rounded-full" />
                
                  </motion.div>
                </div>
            }

              {step === 'success' &&
            <div className="text-center space-y-5">
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
                className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                
                    <CheckCircleIcon size={44} className="text-green-600" />
                  </motion.div>
                  <div>
                    <h4 className="text-base font-heading font-bold text-gray-900">
                      Capture Successful
                    </h4>
                    <p className="text-sm font-body text-gray-500 mt-1.5">
                      Fingerprint has been captured and stored successfully.
                    </p>
                  </div>
                  <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm font-body text-green-700">
                      <FingerprintIcon size={16} />
                      <span>
                        Quality Score: <strong>92/100</strong> — Excellent
                      </span>
                    </div>
                  </div>
                  <button
                onClick={handleDone}
                className="w-full px-5 py-3 bg-primary text-white text-sm font-heading font-bold rounded-lg hover:bg-primary/90 transition-colors">
                
                    Done
                  </button>
                </div>
            }

              {step === 'upload' &&
            <div className="space-y-5">
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
                      Drag & drop fingerprint file here
                    </p>
                    <p className="text-xs font-body text-gray-400 mt-1">
                      or click to browse — BMP, PNG, WSQ formats
                    </p>
                  </div>

                  {uploadedFile &&
              <motion.div
                initial={{
                  opacity: 0,
                  y: 8
                }}
                animate={{
                  opacity: 1,
                  y: 0
                }}
                className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-lg">
                
                      <FileIcon size={18} className="text-green-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-body font-medium text-green-800 truncate">
                          {uploadedFile}
                        </p>
                        <p className="text-xs font-body text-green-600">
                          Uploaded successfully
                        </p>
                      </div>
                      <CheckCircleIcon size={18} className="text-green-600" />
                    </motion.div>
              }

                  <div className="flex gap-3">
                    <button
                  onClick={() => setStep('start')}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-heading font-bold rounded-lg hover:bg-gray-50 transition-colors">
                  
                      Back
                    </button>
                    <button
                  onClick={handleUploadComplete}
                  disabled={!uploadedFile}
                  className="flex-1 px-4 py-2.5 bg-primary text-white text-sm font-heading font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  
                      Confirm Upload
                    </button>
                  </div>
                </div>
            }
            </div>
          </motion.div>
        </motion.div>
      }
    </AnimatePresence>);

}
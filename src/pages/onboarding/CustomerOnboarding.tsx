import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2Icon,
  ChevronRightIcon,
  PlusIcon,
  FingerprintIcon,
  ShieldCheckIcon } from
'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';
export function CustomerOnboarding() {
  const [step, setStep] = useState(1);
  const steps = [
  {
    id: 1,
    title: 'Group Info'
  },
  {
    id: 2,
    title: 'Add Members'
  },
  {
    id: 3,
    title: 'KYC & Biometrics'
  },
  {
    id: 4,
    title: 'Review'
  }];

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));
  const mockMembers = [
  {
    name: 'Aisha Bello',
    phone: '08012345678',
    bvn: 'Verified',
    id: 'Verified',
    bio: 'Captured'
  },
  {
    name: 'Fatima Yusuf',
    phone: '08087654321',
    bvn: 'Verified',
    id: 'Pending',
    bio: 'Pending'
  },
  {
    name: 'Chidinma Okafor',
    phone: '08123456789',
    bvn: 'Pending',
    id: 'Pending',
    bio: 'Pending'
  }];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-heading font-bold text-primary">
            Customer / Group Onboarding
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Register a new borrowing group and its members
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 z-0"></div>
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary z-0 transition-all duration-300"
            style={{
              width: `${(step - 1) / 3 * 100}%`
            }}>
          </div>

          {steps.map((s) =>
          <div
            key={s.id}
            className="relative z-10 flex flex-col items-center">
            
              <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= s.id ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
              
                {step > s.id ? <CheckCircle2Icon size={16} /> : s.id}
              </div>
              <span
              className={`text-xs mt-2 font-medium ${step >= s.id ? 'text-primary' : 'text-gray-400'}`}>
              
                {s.title}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Form Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
        <motion.div
          key={step}
          initial={{
            opacity: 0,
            x: 20
          }}
          animate={{
            opacity: 1,
            x: 0
          }}
          transition={{
            duration: 0.3
          }}>
          
          {step === 1 &&
          <div className="space-y-6">
              <h3 className="text-lg font-heading font-bold text-primary border-b pb-2">
                Group Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Group Name
                  </label>
                  <input
                  type="text"
                  placeholder="e.g. Iya Oloja Market Women"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Group Leader Name
                  </label>
                  <input
                  type="text"
                  placeholder="e.g. Alhaja Aminat"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Market / Location
                  </label>
                  <input
                  type="text"
                  placeholder="e.g. Oshodi Market"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Number of Members
                  </label>
                  <input
                  type="number"
                  placeholder="e.g. 10"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meeting Day
                  </label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white">
                    <option>Monday</option>
                    <option>Tuesday</option>
                    <option>Wednesday</option>
                    <option>Thursday</option>
                    <option>Friday</option>
                  </select>
                </div>
              </div>
            </div>
          }

          {step === 2 &&
          <div className="space-y-6">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-lg font-heading font-bold text-primary">
                  Add Group Members
                </h3>
                <button className="flex items-center text-sm text-accent font-medium hover:text-[#e64a19]">
                  <PlusIcon size={16} className="mr-1" /> Add Member
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider font-heading">
                      <th className="px-4 py-3 font-medium">Full Name</th>
                      <th className="px-4 py-3 font-medium">Phone Number</th>
                      <th className="px-4 py-3 font-medium">BVN</th>
                      <th className="px-4 py-3 font-medium">ID Type</th>
                      <th className="px-4 py-3 font-medium text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                        type="text"
                        defaultValue="Aisha Bello"
                        className="w-full bg-transparent border-b border-gray-200 focus:border-primary outline-none" />
                      
                      </td>
                      <td className="px-4 py-3">
                        <input
                        type="text"
                        defaultValue="08012345678"
                        className="w-full bg-transparent border-b border-gray-200 focus:border-primary outline-none" />
                      
                      </td>
                      <td className="px-4 py-3">
                        <input
                        type="text"
                        defaultValue="22334455667"
                        className="w-full bg-transparent border-b border-gray-200 focus:border-primary outline-none" />
                      
                      </td>
                      <td className="px-4 py-3">
                        <select className="w-full bg-transparent border-b border-gray-200 focus:border-primary outline-none">
                          <option>NIN</option>
                          <option>Voter's Card</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right text-red-500 cursor-pointer hover:text-red-700">
                        Remove
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                        type="text"
                        defaultValue="Fatima Yusuf"
                        className="w-full bg-transparent border-b border-gray-200 focus:border-primary outline-none" />
                      
                      </td>
                      <td className="px-4 py-3">
                        <input
                        type="text"
                        defaultValue="08087654321"
                        className="w-full bg-transparent border-b border-gray-200 focus:border-primary outline-none" />
                      
                      </td>
                      <td className="px-4 py-3">
                        <input
                        type="text"
                        placeholder="Enter BVN"
                        className="w-full bg-transparent border-b border-gray-200 focus:border-primary outline-none" />
                      
                      </td>
                      <td className="px-4 py-3">
                        <select className="w-full bg-transparent border-b border-gray-200 focus:border-primary outline-none">
                          <option>NIN</option>
                          <option>Voter's Card</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right text-red-500 cursor-pointer hover:text-red-700">
                        Remove
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          }

          {step === 3 &&
          <div className="space-y-6">
              <h3 className="text-lg font-heading font-bold text-primary border-b pb-2">
                KYC & Biometric Verification
              </h3>
              <p className="text-sm text-gray-500">
                Verify BVN, ID documents, and capture fingerprints for all
                members.
              </p>

              <div className="space-y-4 mt-4">
                {mockMembers.map((member, idx) =>
              <div
                key={idx}
                className="border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                
                    <div>
                      <p className="font-heading font-bold text-primary">
                        {member.name}
                      </p>
                      <p className="text-xs text-gray-500">{member.phone}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <div
                    className={`flex items-center px-3 py-1 rounded border text-xs font-medium ${member.bvn === 'Verified' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                    
                        <ShieldCheckIcon size={14} className="mr-1" /> BVN:{' '}
                        {member.bvn}
                      </div>
                      <div
                    className={`flex items-center px-3 py-1 rounded border text-xs font-medium ${member.id === 'Verified' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                    
                        <ShieldCheckIcon size={14} className="mr-1" /> ID:{' '}
                        {member.id}
                      </div>
                      <button
                    className={`flex items-center px-3 py-1 rounded border text-xs font-medium transition-colors ${member.bio === 'Captured' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-primary border-primary hover:bg-primary hover:text-white cursor-pointer'}`}>
                    
                        <FingerprintIcon size={14} className="mr-1" />{' '}
                        Biometric: {member.bio}
                      </button>
                    </div>
                  </div>
              )}
              </div>
            </div>
          }

          {step === 4 &&
          <div className="space-y-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2Icon size={32} />
                </div>
                <h3 className="text-xl font-heading font-bold text-primary mb-2">
                  Review & Submit
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Group registration is complete. Once submitted, the group will
                  be available for loan applications.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm">
                <p className="font-medium text-gray-700 mb-2">Group Summary:</p>
                <ul className="space-y-2 text-gray-600">
                  <li>
                    <span className="font-medium">Group Name:</span> Iya Oloja
                    Market Women
                  </li>
                  <li>
                    <span className="font-medium">Leader:</span> Alhaja Aminat
                  </li>
                  <li>
                    <span className="font-medium">Total Members:</span> 3
                    Registered
                  </li>
                  <li>
                    <span className="font-medium">KYC Status:</span>{' '}
                    <span className="text-yellow-600 font-medium">
                      Pending Completion
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          }
        </motion.div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
          <button
            onClick={prevStep}
            disabled={step === 1}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors">
            
            Back
          </button>

          {step < 4 ?
          <button
            onClick={nextStep}
            className="flex items-center px-6 py-2 bg-primary text-white rounded-lg hover:bg-[#123e31] font-medium transition-colors shadow-sm">
            
              Continue <ChevronRightIcon size={18} className="ml-1" />
            </button> :

          <button className="flex items-center px-8 py-2 bg-accent text-white rounded-lg hover:bg-[#e64a19] font-heading font-bold transition-colors shadow-md">
              Complete Onboarding
            </button>
          }
        </div>
      </div>
    </div>);

}
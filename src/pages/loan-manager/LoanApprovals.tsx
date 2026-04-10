import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SearchIcon,
  FilterIcon,
  CheckIcon,
  XIcon,
  AlertCircleIcon,
  CheckCircleIcon } from
'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';
const mockApprovals = [
{
  id: 'APP-2026-089',
  group: 'Alaba Traders Union',
  amount: '₦200,000',
  branch: 'Alaba Branch',
  date: '14 Jun 2026',
  stage: 'Authorization',
  assignedTo: 'Chukwuma Okonkwo'
},
{
  id: 'APP-2026-090',
  group: 'Oshodi Market Vendors',
  amount: '₦300,000',
  branch: 'Ikeja Branch',
  date: '15 Jun 2026',
  stage: 'Super Admin Approval',
  assignedTo: 'Adebayo Johnson'
},
{
  id: 'APP-2026-091',
  group: 'Wakulima Bora',
  amount: '₦800,000',
  branch: 'Surulere Branch',
  date: '16 Jun 2026',
  stage: 'Branch Review',
  assignedTo: 'Emeka Nnamdi'
}];

export function LoanApprovals() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [approvalStatuses, setApprovalStatuses] = useState<
    Record<string, string>>(
    {});
  const [toast, setToast] = useState<{
    message: string;
    visible: boolean;
  }>({
    message: '',
    visible: false
  });
  function showToast(message: string) {
    setToast({
      message,
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
  function handleApprove(appId: string, e: React.MouseEvent) {
    e.stopPropagation();
    setApprovalStatuses((prev) => ({
      ...prev,
      [appId]: 'Approved'
    }));
    showToast(`Application ${appId} approved`);
  }
  function handleReject(appId: string, e: React.MouseEvent) {
    e.stopPropagation();
    setApprovalStatuses((prev) => ({
      ...prev,
      [appId]: 'Rejected'
    }));
    showToast(`Application ${appId} rejected`);
  }
  function handleRequestInfo(appId: string, e: React.MouseEvent) {
    e.stopPropagation();
    showToast(`Information request sent for ${appId}`);
  }
  const filteredApprovals = mockApprovals.filter((app) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      app.id.toLowerCase().includes(q) ||
      app.group.toLowerCase().includes(q) ||
      app.branch.toLowerCase().includes(q) ||
      app.assignedTo.toLowerCase().includes(q));

  });
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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-heading font-bold text-primary">
            Loan Approvals Queue
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Review and approve pending loan applications
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <SearchIcon
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search applications..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            
          </div>
          <button className="flex items-center px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-sm font-medium">
            <FilterIcon size={16} className="mr-2" /> Filter
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider font-heading">
                <th className="px-6 py-4 font-medium">Application ID</th>
                <th className="px-6 py-4 font-medium">Group Name</th>
                <th className="px-6 py-4 font-medium">Amount Requested</th>
                <th className="px-6 py-4 font-medium">Branch</th>
                <th className="px-6 py-4 font-medium">Current Stage</th>
                <th className="px-6 py-4 font-medium">Assigned To</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredApprovals.map((app, idx) => {
                const status = approvalStatuses[app.id];
                return (
                  <tr
                    key={idx}
                    onClick={() => navigate(`/loan-manager/loans/${app.id}`)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer">
                    
                    <td className="px-6 py-4 font-heading font-medium text-primary">
                      {app.id}
                    </td>
                    <td className="px-6 py-4 text-gray-700">{app.group}</td>
                    <td className="px-6 py-4 font-medium text-gray-700">
                      {app.amount}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{app.branch}</td>
                    <td className="px-6 py-4">
                      {status ?
                      <StatusBadge status={status as any} /> :

                      <span className="px-2.5 py-1 rounded-full text-xs font-heading font-medium border bg-yellow-100 text-yellow-800 border-yellow-200">
                          {app.stage}
                        </span>
                      }
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {app.assignedTo}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {status ?
                      <span
                        className={`text-xs font-heading font-bold ${status === 'Approved' ? 'text-green-600' : 'text-red-600'}`}>
                        
                          {status}
                        </span> :

                      <div className="flex justify-end gap-2">
                          <button
                          onClick={(e) => handleApprove(app.id, e)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Approve">
                          
                            <CheckIcon size={18} />
                          </button>
                          <button
                          onClick={(e) => handleReject(app.id, e)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Reject">
                          
                            <XIcon size={18} />
                          </button>
                          <button
                          onClick={(e) => handleRequestInfo(app.id, e)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Request Info">
                          
                            <AlertCircleIcon size={18} />
                          </button>
                        </div>
                      }
                    </td>
                  </tr>);

              })}
              {filteredApprovals.length === 0 &&
              <tr>
                  <td
                  colSpan={7}
                  className="px-6 py-12 text-center text-gray-400 text-sm font-body">
                  
                    No applications match your search.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>);

}
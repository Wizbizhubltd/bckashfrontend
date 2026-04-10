import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon, FilterIcon, MoreVerticalIcon } from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';
const mockRepayments = [
{
  id: 'REP-5092',
  loanId: 'LN-0023',
  group: 'Iya Oloja Market Women',
  amountDue: '₦45,000',
  amountPaid: '₦45,000',
  dueDate: '12 Jul 2026',
  status: 'Completed'
},
{
  id: 'REP-5093',
  loanId: 'LN-0028',
  group: 'Surulere Youth Coop',
  amountDue: '₦120,000',
  amountPaid: '₦0',
  dueDate: '01 Jul 2026',
  status: 'Pending'
},
{
  id: 'REP-5088',
  loanId: 'LN-0028',
  group: 'Yaba Tailors',
  amountDue: '₦15,000',
  amountPaid: '₦5,000',
  dueDate: '05 Jun 2026',
  status: 'Overdue'
},
{
  id: 'REP-5094',
  loanId: 'LN-0023',
  group: 'Ikeja Transport Sacco',
  amountDue: '₦250,000',
  amountPaid: '₦250,000',
  dueDate: '15 Jun 2026',
  status: 'Completed'
}];

export function LoanRepayment() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-heading font-bold text-primary">
          Loan Repayments
        </h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <SearchIcon
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            
            <input
              type="text"
              placeholder="Search payments..."
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
                <th className="px-6 py-4 font-medium">Payment ID</th>
                <th className="px-6 py-4 font-medium">Group Name</th>
                <th className="px-6 py-4 font-medium">Amount Due</th>
                <th className="px-6 py-4 font-medium">Amount Paid</th>
                <th className="px-6 py-4 font-medium">Due Date</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {mockRepayments.map((item, idx) =>
              <tr
                key={idx}
                onClick={() => navigate(`/loan-manager/loans/${item.loanId}`)}
                className="hover:bg-gray-50 transition-colors cursor-pointer">
                
                  <td className="px-6 py-4 font-heading font-medium text-primary">
                    {item.id}
                  </td>
                  <td className="px-6 py-4 text-gray-700">{item.group}</td>
                  <td className="px-6 py-4 font-medium text-gray-700">
                    {item.amountDue}
                  </td>
                  <td className="px-6 py-4 font-medium text-green-600">
                    {item.amountPaid}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{item.dueDate}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={item.status as any} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/loan-manager/loans/${item.loanId}`);
                    }}
                    className="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100 transition-colors">
                    
                      <MoreVerticalIcon size={18} />
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>);

}
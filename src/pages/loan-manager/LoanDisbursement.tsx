import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon, FilterIcon, MoreVerticalIcon } from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';
const mockDisbursements = [
{
  id: 'DIS-1042',
  loanId: 'LN-0023',
  group: 'Iya Oloja Market Women',
  amount: '₦450,000',
  date: '12 Jun 2026',
  method: 'Bank Transfer',
  status: 'Disbursed'
},
{
  id: 'DIS-1041',
  loanId: 'LN-0028',
  group: 'Surulere Youth Coop',
  amount: '₦500,000',
  date: '11 Jun 2026',
  method: 'Mobile Money',
  status: 'Disbursed'
},
{
  id: 'DIS-1043',
  loanId: 'LN-0011',
  group: 'Mushin Artisans Group',
  amount: '₦1,200,000',
  date: '01 May 2026',
  method: 'Bank Transfer',
  status: 'Disbursed'
},
{
  id: 'DIS-1044',
  loanId: 'APP-2026-089',
  group: 'Alaba Traders Union',
  amount: '₦200,000',
  date: '-',
  method: 'Mobile Money',
  status: 'Pending'
}];

export function LoanDisbursement() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-heading font-bold text-primary">
          Loan Disbursements
        </h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <SearchIcon
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            
            <input
              type="text"
              placeholder="Search disbursements..."
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
                <th className="px-6 py-4 font-medium">Disbursement ID</th>
                <th className="px-6 py-4 font-medium">Group Name</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Method</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {mockDisbursements.map((item, idx) =>
              <tr
                key={idx}
                onClick={() => navigate(`/loan-manager/loans/${item.loanId}`)}
                className="hover:bg-gray-50 transition-colors cursor-pointer">
                
                  <td className="px-6 py-4 font-heading font-medium text-primary">
                    {item.id}
                  </td>
                  <td className="px-6 py-4 text-gray-700">{item.group}</td>
                  <td className="px-6 py-4 font-medium text-gray-700">
                    {item.amount}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{item.date}</td>
                  <td className="px-6 py-4 text-gray-600">{item.method}</td>
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
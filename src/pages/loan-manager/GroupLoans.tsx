import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon, FilterIcon, MoreVerticalIcon } from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';
const mockGroups = [
{
  id: 'GRP-001',
  loanId: 'LN-0023',
  name: 'Iya Oloja Market Women',
  members: 15,
  totalLoan: '₦450,000',
  balance: '₦120,000',
  status: 'Active'
},
{
  id: 'GRP-002',
  loanId: 'APP-2026-089',
  name: 'Alaba Traders Union',
  members: 10,
  totalLoan: '₦200,000',
  balance: '₦200,000',
  status: 'Pending'
},
{
  id: 'GRP-003',
  loanId: 'LN-0028',
  name: 'Surulere Youth Coop',
  members: 25,
  totalLoan: '₦1,200,000',
  balance: '₦850,000',
  status: 'Active'
},
{
  id: 'GRP-004',
  loanId: 'LN-0011',
  name: 'Mushin Artisans Group',
  members: 12,
  totalLoan: '₦850,000',
  balance: '₦0',
  status: 'Completed'
},
{
  id: 'GRP-005',
  loanId: 'APP-2026-090',
  name: 'Oshodi Market Vendors',
  members: 8,
  totalLoan: '₦300,000',
  balance: '₦300,000',
  status: 'Pending'
},
{
  id: 'GRP-006',
  loanId: 'LN-0023',
  name: 'Ikeja Transport Sacco',
  members: 30,
  totalLoan: '₦2,500,000',
  balance: '₦1,800,000',
  status: 'Active'
},
{
  id: 'GRP-007',
  loanId: 'LN-0028',
  name: 'Yaba Tailors',
  members: 5,
  totalLoan: '₦150,000',
  balance: '₦45,000',
  status: 'Overdue'
}];

export function GroupLoans() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-heading font-bold text-primary">
          Group Loans Directory
        </h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <SearchIcon
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            
            <input
              type="text"
              placeholder="Search groups..."
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
                <th className="px-6 py-4 font-medium">Group Name</th>
                <th className="px-6 py-4 font-medium">Members</th>
                <th className="px-6 py-4 font-medium">Total Loan</th>
                <th className="px-6 py-4 font-medium">Outstanding Balance</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {mockGroups.map((group, idx) =>
              <tr
                key={idx}
                onClick={() =>
                navigate(`/loan-manager/loans/${group.loanId}`)
                }
                className="hover:bg-gray-50 transition-colors cursor-pointer">
                
                  <td className="px-6 py-4">
                    <p className="font-heading font-medium text-primary">
                      {group.name}
                    </p>
                    <p className="text-xs text-gray-400">{group.id}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{group.members}</td>
                  <td className="px-6 py-4 font-medium text-gray-700">
                    {group.totalLoan}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-700">
                    {group.balance}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={group.status as any} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/loan-manager/loans/${group.loanId}`);
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

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <span>Showing 1 to 7 of 42 entries</span>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50">
              Prev
            </button>
            <button className="px-3 py-1 bg-primary text-white rounded">
              1
            </button>
            <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50">
              2
            </button>
            <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50">
              3
            </button>
            <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>);

}
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUpIcon,
  UsersIcon,
  CheckCircle2Icon,
  ClockIcon,
  PlusIcon,
  CreditCardIcon,
  FileTextIcon } from
'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer } from
'recharts';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
const chartData = [
{
  name: 'Jan',
  amount: 4500000
},
{
  name: 'Feb',
  amount: 5200000
},
{
  name: 'Mar',
  amount: 4800000
},
{
  name: 'Apr',
  amount: 6100000
},
{
  name: 'May',
  amount: 5900000
},
{
  name: 'Jun',
  amount: 7200000
}];

const recentActivity = [
{
  id: 'GL-1042',
  group: 'Iya Oloja Market Women',
  amount: '₦450,000',
  status: 'Active',
  date: '12 Jun 2026',
  nextPayment: '12 Jul 2026'
},
{
  id: 'GL-1043',
  group: 'Alaba Traders Union',
  amount: '₦200,000',
  status: 'Pending',
  date: '14 Jun 2026',
  nextPayment: '-'
},
{
  id: 'GL-1038',
  group: 'Surulere Youth Coop',
  amount: '₦1,200,000',
  status: 'Active',
  date: '01 May 2026',
  nextPayment: '01 Jul 2026'
},
{
  id: 'GL-1021',
  group: 'Mushin Artisans Group',
  amount: '₦850,000',
  status: 'Completed',
  date: '15 Jan 2026',
  nextPayment: '-'
},
{
  id: 'GL-1044',
  group: 'Oshodi Market Vendors',
  amount: '₦300,000',
  status: 'Pending',
  date: '15 Jun 2026',
  nextPayment: '-'
}];

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const getGreeting = () => {
    if (user?.role === 'super_admin') return 'Super Admin Dashboard';
    if (user?.role === 'manager') return `Branch Dashboard — ${user.branch}`;
    return 'Authorizer Dashboard';
  };
  // Map loan IDs to detail routes
  const loanRouteMap: Record<string, string> = {
    'GL-1042': '/loan-manager/loans/LN-0023',
    'GL-1043': '/loan-manager/loans/APP-2026-089',
    'GL-1038': '/loan-manager/loans/LN-0028',
    'GL-1021': '/loan-manager/loans/LN-0035',
    'GL-1044': '/loan-manager/loans/APP-2026-090'
  };
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-primary">
            {getGreeting()}
          </h2>
          <p className="text-gray-500 font-body text-sm mt-1">
            Welcome back, {user?.name} • {today}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate('/loan-manager/reports')}
            className="flex items-center px-4 py-2 bg-white text-primary border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-heading font-medium shadow-sm">
            
            <FileTextIcon size={16} className="mr-2" />
            Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">
                Total Disbursed (YTD)
              </p>
              <h3 className="text-2xl font-heading font-bold text-primary">
                ₦34.2M
              </h3>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <TrendingUpIcon size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium flex items-center">
              <TrendingUpIcon size={14} className="mr-1" /> +12.5%
            </span>
            <span className="text-gray-400 ml-2">vs last year</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">
                Active Group Loans
              </p>
              <h3 className="text-2xl font-heading font-bold text-primary">
                142
              </h3>
            </div>
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <UsersIcon size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium flex items-center">
              <TrendingUpIcon size={14} className="mr-1" /> +8
            </span>
            <span className="text-gray-400 ml-2">this month</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">
                Repayment Rate
              </p>
              <h3 className="text-2xl font-heading font-bold text-primary">
                96.8%
              </h3>
            </div>
            <div className="p-2 bg-green-50 rounded-lg text-green-600">
              <CheckCircle2Icon size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium flex items-center">
              <TrendingUpIcon size={14} className="mr-1" /> +1.2%
            </span>
            <span className="text-gray-400 ml-2">vs last month</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">
                Pending Applications
              </p>
              <h3 className="text-2xl font-heading font-bold text-primary">
                24
              </h3>
            </div>
            <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600">
              <ClockIcon size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-red-500 font-medium flex items-center">
              <TrendingUpIcon size={14} className="mr-1" /> +5
            </span>
            <span className="text-gray-400 ml-2">this week</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-heading font-bold text-primary mb-6">
            Disbursement Trend (6 Months)
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 20,
                  bottom: 5,
                  left: 0
                }}>
                
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f0f0f0" />
                
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: '#6b7280',
                    fontSize: 12
                  }}
                  dy={10} />
                
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: '#6b7280',
                    fontSize: 12
                  }}
                  tickFormatter={(value) => `₦${(value / 1000000).toFixed(1)}M`} />
                
                <Tooltip
                  cursor={{
                    fill: '#f3f4f6'
                  }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  formatter={(value: number) => [
                  `₦${value.toLocaleString()}`,
                  'Disbursed']
                  } />
                
                <Bar
                  dataKey="amount"
                  fill="#1A5745"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50} />
                
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 lg:col-span-1 flex flex-col">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-heading font-bold text-primary">
              Recent Activity
            </h3>
            <button
              onClick={() => navigate('/loan-manager/group-loans')}
              className="text-sm text-accent hover:text-[#e64a19] font-medium">
              
              View All
            </button>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-heading">
                  <th className="px-6 py-3 font-medium">Group</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {recentActivity.map((item, idx) =>
                <tr
                  key={idx}
                  onClick={() =>
                  navigate(
                    loanRouteMap[item.id] || '/loan-manager/group-loans'
                  )
                  }
                  className="hover:bg-gray-50 transition-colors cursor-pointer">
                  
                    <td className="px-6 py-4">
                      <p className="font-heading font-medium text-primary">
                        {item.group}
                      </p>
                      <p className="text-xs text-gray-400">{item.id}</p>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-700">
                      {item.amount}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={item.status as any} />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>);

}
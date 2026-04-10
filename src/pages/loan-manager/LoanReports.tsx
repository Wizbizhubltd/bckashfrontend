import React from 'react';
import {
  FileTextIcon,
  DownloadIcon,
  PieChartIcon,
  AlertTriangleIcon,
  TrendingUpIcon } from
'lucide-react';
const reports = [
{
  title: 'Portfolio Summary',
  description:
  'Overview of total active loans, outstanding balances, and overall portfolio health.',
  icon: <PieChartIcon size={24} className="text-blue-600" />,
  bg: 'bg-blue-50'
},
{
  title: 'Delinquency Report',
  description:
  'Detailed list of overdue payments, at-risk groups, and aging analysis.',
  icon: <AlertTriangleIcon size={24} className="text-red-600" />,
  bg: 'bg-red-50'
},
{
  title: 'Collection Report',
  description:
  'Daily, weekly, and monthly collection metrics versus expected repayments.',
  icon: <TrendingUpIcon size={24} className="text-green-600" />,
  bg: 'bg-green-50'
},
{
  title: 'Group Performance',
  description:
  'Metrics on individual group repayment rates, savings, and credit scores.',
  icon: <FileTextIcon size={24} className="text-indigo-600" />,
  bg: 'bg-indigo-50'
}];

export function LoanReports() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-heading font-bold text-primary">
          Loan Reports
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report, idx) =>
        <div
          key={idx}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
          
            <div className="flex items-start mb-4">
              <div className={`p-3 rounded-lg ${report.bg} mr-4`}>
                {report.icon}
              </div>
              <div>
                <h3 className="text-lg font-heading font-bold text-primary">
                  {report.title}
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  {report.description}
                </p>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-gray-100 flex justify-end gap-3">
              <button className="px-4 py-2 text-sm font-medium text-primary bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                View Online
              </button>
              <button className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-[#123e31] rounded-lg transition-colors shadow-sm">
                <DownloadIcon size={16} className="mr-2" />
                Export PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>);

}
// src/components/admin/AdminReports.tsx (NEW FILE)
import React, { useState } from 'react';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  TrendingUp,
  TrendingDown,
  FileText,
  Filter,
  RefreshCw
} from 'lucide-react';

interface AdminReportsProps {
  reports: any[];
  onGenerateReport: (type: string, period: string) => Promise<any>;
  loading: boolean;
}

const AdminReports: React.FC<AdminReportsProps> = ({
  reports,
  onGenerateReport,
  loading
}) => {
  const [reportType, setReportType] = useState('sales');
  const [period, setPeriod] = useState('monthly');

  const handleGenerateReport = async () => {
    await onGenerateReport(reportType, period);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'sales': return 'Sales Report';
      case 'user_activity': return 'User Activity';
      case 'product_performance': return 'Product Performance';
      case 'financial': return 'Financial Report';
      default: return type;
    }
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'yearly': return 'Yearly';
      default: return period;
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Reports & Analytics</h2>
            <p className="text-sm text-gray-600">Generate and view platform performance reports</p>
          </div>
        </div>

        {/* Report Generator */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Generate New Report</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="sales">Sales Report</option>
                <option value="user_activity">User Activity</option>
                <option value="product_performance">Product Performance</option>
                <option value="financial">Financial Report</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Period
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleGenerateReport}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Generate Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Recent Reports */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Reports</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Report</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Generated</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="font-medium">{getReportTypeLabel(report.type)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {getPeriodLabel(report.period)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(report.generated_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <button
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          title="View"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
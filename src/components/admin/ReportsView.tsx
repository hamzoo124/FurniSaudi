// src/components/admin/ReportsView.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Download,
  Filter,
  Calendar,
  RefreshCw,
  Search,
  Eye,
  EyeOff,
  Printer,
  Share2,
  FileText,
  Database,
  Users,
  ShoppingBag,
  Package,
  DollarSign,
  Percent,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  ExternalLink,
  Copy,
  Save,
  Upload,
  BarChart,
  Activity,
  Home,
  Store,
  CreditCard,
  MessageCircle,
  Tag,
  Shield,
  Settings,
  Grid,
  List,
  Menu,
  DownloadCloud,
  UploadCloud,
  FileWarning,
  CheckSquare,
  XSquare
} from 'lucide-react';
import { useAdminReports } from '@/hooks/useAdminReports';
import { format, subDays, subMonths, subYears, startOfMonth, endOfMonth } from 'date-fns';

interface ReportsViewProps {
  compact?: boolean;
}

const ReportsView: React.FC<ReportsViewProps> = ({ compact = false }) => {
  const {
    loading,
    error,
    savedReports,
    generateSalesReport,
    generateUserReport,
    generateFinancialReport,
    saveReport,
    getSavedReports
  } = useAdminReports();

  const [activeTab, setActiveTab] = useState<'sales' | 'users' | 'financial' | 'saved'>('sales');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState<string>(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [month, setMonth] = useState<string>(format(new Date(), 'MM'));
  const [year, setYear] = useState<string>(format(new Date(), 'yyyy'));
  const [reportData, setReportData] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [viewMode, setViewMode] = useState<'summary' | 'detailed' | 'charts'>('summary');
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf' | 'excel'>('csv');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [comparisonPeriod, setComparisonPeriod] = useState<'previous_period' | 'previous_year' | 'none'>('none');
  
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const dateRanges = {
    today: {
      start: format(new Date(), 'yyyy-MM-dd'),
      end: format(new Date(), 'yyyy-MM-dd')
    },
    week: {
      start: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
      end: format(new Date(), 'yyyy-MM-dd')
    },
    month: {
      start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
    },
    year: {
      start: format(subYears(new Date(), 1), 'yyyy-MM-dd'),
      end: format(new Date(), 'yyyy-MM-dd')
    },
    custom: {
      start: customStartDate,
      end: customEndDate
    }
  };

  const filteredSavedReports = savedReports.filter(report =>
    report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateReport = async () => {
    try {
      setGenerating(true);
      let result;

      switch (activeTab) {
        case 'sales':
          result = await generateSalesReport(dateRanges[dateRange].start, dateRanges[dateRange].end);
          break;
        case 'users':
          result = await generateUserReport();
          break;
        case 'financial':
          result = await generateFinancialReport(month, year);
          break;
        default:
          return;
      }

      if (result.success) {
        setReportData(result.data);
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveReport = async () => {
    if (!reportTitle.trim() || !reportData) return;

    try {
      const reportToSave = {
        type: activeTab,
        period: dateRange === 'custom' ? 'custom' : dateRange,
        title: reportTitle,
        data: reportData,
        generated_at: new Date().toISOString()
      };

      const result = await saveReport(reportToSave);
      if (result.success) {
        setShowSaveModal(false);
        setReportTitle('');
      }
    } catch (error) {
      console.error('Error saving report:', error);
    }
  };

  const exportReport = () => {
    if (!reportData) return;

    let content: string;
    let filename: string;
    let mimeType: string;

    switch (exportFormat) {
      case 'csv':
        content = convertToCSV(reportData);
        filename = `${activeTab}_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        mimeType = 'text/csv';
        break;
      case 'excel':
        content = convertToExcel(reportData);
        filename = `${activeTab}_report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'pdf':
        // For PDF, we would typically use a library like jsPDF
        // This is a simplified version
        content = JSON.stringify(reportData, null, 2);
        filename = `${activeTab}_report_${format(new Date(), 'yyyy-MM-dd')}.json`;
        mimeType = 'application/json';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const convertToCSV = (data: any) => {
    if (!data) return '';
    
    if (Array.isArray(data)) {
      const headers = Object.keys(data[0] || {}).join(',');
      const rows = data.map(row => Object.values(row).join(',')).join('\n');
      return `${headers}\n${rows}`;
    }
    
    return JSON.stringify(data);
  };

  const convertToExcel = (data: any) => {
    // Simplified - in real app, use a library like xlsx
    return convertToCSV(data);
  };

  const printReport = () => {
    window.print();
  };

  const shareReport = () => {
    if (navigator.share) {
      navigator.share({
        title: `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Report`,
        text: `Check out this ${activeTab} report`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Report link copied to clipboard!');
    }
  };

  const getReportStats = () => {
    if (!reportData) return null;

    switch (activeTab) {
      case 'sales':
        const salesMetrics = {
          totalOrders: reportData.length,
          totalRevenue: reportData.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0),
          averageOrderValue: reportData.length > 0 
            ? reportData.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0) / reportData.length 
            : 0,
          deliveredOrders: reportData.filter((order: any) => order.status === 'delivered').length,
          cancelledOrders: reportData.filter((order: any) => order.status === 'cancelled').length
        };
        return salesMetrics;
      
      case 'users':
        const userMetrics = {
          totalUsers: reportData.length,
          newUsers: reportData.filter((user: any) => {
            const userDate = new Date(user.created_at);
            const thirtyDaysAgo = subDays(new Date(), 30);
            return userDate > thirtyDaysAgo;
          }).length,
          activeSellers: reportData.filter((user: any) => user.sellers?.length > 0).length,
          buyers: reportData.filter((user: any) => !user.sellers?.length).length
        };
        return userMetrics;
      
      case 'financial':
        return {
          totalRevenue: reportData.totalRevenue || 0,
          totalPayouts: reportData.totalPayouts || 0,
          netProfit: (reportData.totalRevenue || 0) - (reportData.totalPayouts || 0),
          ordersCount: reportData.orders?.length || 0,
          payoutsCount: reportData.payouts?.length || 0
        };
      
      default:
        return null;
    }
  };

  const getTrendIcon = (value: number, comparison: number) => {
    if (value > comparison) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (value < comparison) {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
    return null;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
      case 'completed':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
      case 'rejected':
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    if (activeTab !== 'saved') {
      generateReport();
    }
  }, [activeTab, dateRange, month, year]);

  useEffect(() => {
    getSavedReports();
  }, []);

  if (compact) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Reports</h3>
            <p className="text-xs text-gray-600">Latest platform insights</p>
          </div>
          <button
            onClick={() => setActiveTab('sales')}
            className="inline-flex items-center px-2 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <BarChart3 className="w-3 h-3 mr-1" />
            Generate
          </button>
        </div>

        <div className="space-y-2">
          {filteredSavedReports.slice(0, 3).map((report) => (
            <div key={report.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
              <div className="flex items-center space-x-2">
                <FileText className="w-3 h-3 text-gray-500" />
                <div>
                  <div className="text-xs font-medium text-gray-900 truncate max-w-[150px]">
                    {report.title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(report.generated_at), 'MMM d')} • {report.type}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedReport(report)}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                <Eye className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600 mt-1">Generate insights and track platform performance</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={printReport}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </button>
            <button
              onClick={shareReport}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </button>
            <button
              onClick={generateReport}
              disabled={generating}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
            >
              {generating ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {generating ? 'Generating...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'sales', label: 'Sales Report', icon: ShoppingBag },
              { id: 'users', label: 'User Analytics', icon: Users },
              { id: 'financial', label: 'Financial Report', icon: DollarSign },
              { id: 'saved', label: 'Saved Reports', icon: FileText }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    group inline-flex items-center py-3 px-1 border-b-2 font-medium text-sm
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 mr-2 ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Report Controls */}
        {activeTab !== 'saved' && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Date Range Selector */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Date Range
                  </label>
                  <div className="flex items-center space-x-2">
                    <select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value as any)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="today">Today</option>
                      <option value="week">Last 7 Days</option>
                      <option value="month">This Month</option>
                      <option value="year">Last Year</option>
                      <option value="custom">Custom Range</option>
                    </select>
                    
                    {dateRange === 'custom' && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    )}

                    {activeTab === 'financial' && (
                      <div className="flex items-center space-x-2">
                        <select
                          value={month}
                          onChange={(e) => setMonth(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          {Array.from({ length: 12 }, (_, i) => {
                            const monthNum = (i + 1).toString().padStart(2, '0');
                            const monthName = format(new Date(2000, i, 1), 'MMM');
                            return (
                              <option key={monthNum} value={monthNum}>
                                {monthName}
                              </option>
                            );
                          })}
                        </select>
                        <select
                          value={year}
                          onChange={(e) => setYear(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          {Array.from({ length: 5 }, (_, i) => {
                            const yearNum = new Date().getFullYear() - i;
                            return (
                              <option key={yearNum} value={yearNum}>
                                {yearNum}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Comparison Period */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Compare With
                  </label>
                  <select
                    value={comparisonPeriod}
                    onChange={(e) => setComparisonPeriod(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="none">No Comparison</option>
                    <option value="previous_period">Previous Period</option>
                    <option value="previous_year">Previous Year</option>
                  </select>
                </div>

                {/* View Mode */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    View
                  </label>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setViewMode('summary')}
                      className={`px-3 py-2 text-sm rounded-l-lg border ${
                        viewMode === 'summary'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300'
                      }`}
                    >
                      Summary
                    </button>
                    <button
                      onClick={() => setViewMode('detailed')}
                      className={`px-3 py-2 text-sm border-t border-b ${
                        viewMode === 'detailed'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300'
                      }`}
                    >
                      Detailed
                    </button>
                    <button
                      onClick={() => setViewMode('charts')}
                      className={`px-3 py-2 text-sm rounded-r-lg border ${
                        viewMode === 'charts'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300'
                      }`}
                    >
                      Charts
                    </button>
                  </div>
                </div>
              </div>

              {/* Export Controls */}
              <div className="flex items-center space-x-3">
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="csv">CSV</option>
                  <option value="excel">Excel</option>
                  <option value="pdf">PDF</option>
                </select>
                <button
                  onClick={exportReport}
                  disabled={!reportData}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 disabled:opacity-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Saved Reports Search */}
        {activeTab === 'saved' && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search saved reports..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Current
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Generating report...</p>
          </div>
        )}

        {/* Report Content */}
        {!loading && reportData && activeTab !== 'saved' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            {viewMode === 'summary' && getReportStats() && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(getReportStats() || {}).map(([key, value]: [string, any], index) => (
                  <div key={key} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-gray-500 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      {index === 0 && <TrendingUp className="w-4 h-4 text-green-500" />}
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {typeof value === 'number' 
                        ? key.toLowerCase().includes('revenue') || key.toLowerCase().includes('profit') || key.toLowerCase().includes('amount')
                          ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : value.toLocaleString()
                        : value}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {key === 'totalOrders' && 'Total orders in period'}
                      {key === 'totalRevenue' && 'Gross revenue before fees'}
                      {key === 'averageOrderValue' && 'Average order value'}
                      {key === 'deliveredOrders' && 'Successfully delivered'}
                      {key === 'totalUsers' && 'Registered users'}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Charts View */}
            {viewMode === 'charts' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart 1 */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {activeTab === 'sales' ? 'Revenue Trend' : 'User Growth'}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                  <div ref={chartContainerRef} className="h-64 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>Chart visualization would appear here</p>
                      <p className="text-sm">Using libraries like Chart.js or Recharts</p>
                    </div>
                  </div>
                </div>

                {/* Chart 2 */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {activeTab === 'sales' ? 'Order Status Distribution' : 'User Types'}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <PieChart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>Pie chart visualization</p>
                      <p className="text-sm">Distribution breakdown</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Data Table */}
            {(viewMode === 'detailed' || viewMode === 'summary') && (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {activeTab === 'sales' && 'Order Details'}
                      {activeTab === 'users' && 'User Details'}
                      {activeTab === 'financial' && 'Transaction Details'}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        Showing {Array.isArray(reportData) ? reportData.length : 0} records
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {activeTab === 'sales' && (
                          <>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                          </>
                        )}
                        {activeTab === 'users' && (
                          <>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          </>
                        )}
                        {activeTab === 'financial' && (
                          <>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Array.isArray(reportData) && reportData.slice(0, 10).map((item: any, index: number) => (
                        <tr key={index} className="hover:bg-gray-50">
                          {activeTab === 'sales' && (
                            <>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                #{item.order_number || item.id?.slice(-8)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.buyer?.full_name || 'Unknown'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {format(new Date(item.created_at), 'MMM d, yyyy')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                ${item.total_amount?.toFixed(2) || '0.00'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                  {item.status || 'Unknown'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {item.order_items?.length || 0} items
                              </td>
                            </>
                          )}
                          {activeTab === 'users' && (
                            <>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                                    {item.avatar_url ? (
                                      <img src={item.avatar_url} alt="" className="h-8 w-8 rounded-full" />
                                    ) : (
                                      <span className="text-sm font-semibold text-gray-600">
                                        {item.full_name?.charAt(0) || 'U'}
                                      </span>
                                    )}
                                  </div>
                                  <div className="ml-3">
                                    <div className="text-sm font-medium text-gray-900">{item.full_name || 'Unknown'}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.email}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  item.sellers?.length > 0 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {item.sellers?.length > 0 ? 'Seller' : 'Buyer'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {format(new Date(item.created_at), 'MMM d, yyyy')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.orders?.count || 0}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  item.status === 'active' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {item.status || 'Unknown'}
                                </span>
                              </td>
                            </>
                          )}
                          {activeTab === 'financial' && (
                            <>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {format(new Date(item.created_at), 'MMM d, yyyy')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  item.type === 'revenue' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {item.type || 'Unknown'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.description || 'No description'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                ${item.amount?.toFixed(2) || '0.00'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                  {item.status || 'Unknown'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {item.reference_id || 'N/A'}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Report Actions */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Report generated on {format(new Date(), 'MMM d, yyyy HH:mm')}
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-sm font-medium rounded text-gray-700 hover:bg-gray-50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Report
                </button>
                <button
                  onClick={exportReport}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Saved Reports View */}
        {activeTab === 'saved' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading saved reports...</p>
              </div>
            ) : filteredSavedReports.length === 0 ? (
              <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
                <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved reports</h3>
                <p className="text-gray-600 mb-4">Generate and save reports to view them here</p>
                <button
                  onClick={() => setActiveTab('sales')}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Generate Report
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSavedReports.map((report) => (
                  <div key={report.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-blue-100">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{report.title}</h3>
                          <p className="text-sm text-gray-500 capitalize">{report.type} • {report.period}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (expandedReportId === report.id) {
                            setExpandedReportId(null);
                          } else {
                            setExpandedReportId(report.id);
                          }
                        }}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        {expandedReportId === report.id ? (
                          <ChevronUp className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                    </div>

                    <div className="text-sm text-gray-600 mb-3">
                      Generated {format(new Date(report.generated_at), 'MMM d, yyyy HH:mm')}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setReportData(report.data);
                            setActiveTab(report.type as any);
                          }}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          View
                        </button>
                        <button
                          onClick={() => {
                            const blob = new Blob([JSON.stringify(report.data, null, 2)], { type: 'application/json' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${report.title}_${format(new Date(report.generated_at), 'yyyy-MM-dd')}.json`;
                            a.click();
                          }}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          Export
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(report.data, null, 2));
                          alert('Report data copied to clipboard!');
                        }}
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Expanded View */}
                    {expandedReportId === report.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="text-sm">
                          <h4 className="font-medium text-gray-900 mb-2">Report Details</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-gray-500">Type:</span>
                              <span className="ml-2 font-medium capitalize">{report.type}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Period:</span>
                              <span className="ml-2 font-medium">{report.period}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Data Points:</span>
                              <span className="ml-2 font-medium">
                                {Array.isArray(report.data) ? report.data.length : Object.keys(report.data || {}).length}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Size:</span>
                              <span className="ml-2 font-medium">
                                {Math.round(JSON.stringify(report.data).length / 1024)} KB
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save Report Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Save Report</h2>
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report Title *
                  </label>
                  <input
                    type="text"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Q4 Sales Analysis"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Add notes about this report..."
                  />
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Report Details</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Type:</span>
                      <span className="font-medium capitalize">{activeTab}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Period:</span>
                      <span className="font-medium">{dateRange}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Generated:</span>
                      <span className="font-medium">{format(new Date(), 'MMM d, yyyy HH:mm')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveReport}
                  disabled={!reportTitle.trim() || loading}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Save Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Report Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">{selectedReport.title}</h2>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Type</div>
                    <div className="font-medium capitalize">{selectedReport.type}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Period</div>
                    <div className="font-medium">{selectedReport.period}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Generated</div>
                    <div className="font-medium">
                      {format(new Date(selectedReport.generated_at), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Data Size</div>
                    <div className="font-medium">
                      {Math.round(JSON.stringify(selectedReport.data).length / 1024)} KB
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-medium text-gray-900">Report Preview</h3>
                  </div>
                  <div className="p-4 max-h-96 overflow-y-auto">
                    <pre className="text-sm bg-gray-50 p-4 rounded overflow-x-auto">
                      {JSON.stringify(selectedReport.data, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Report ID: {selectedReport.id?.slice(0, 8)}...
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(selectedReport.data, null, 2));
                        alert('Report data copied to clipboard!');
                      }}
                      className="px-4 py-2 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Copy className="w-4 h-4 inline mr-2" />
                      Copy Data
                    </button>
                    <button
                      onClick={() => {
                        const blob = new Blob([JSON.stringify(selectedReport.data, null, 2)], { type: 'application/json' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${selectedReport.title}_${format(new Date(), 'yyyy-MM-dd')}.json`;
                        a.click();
                      }}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
                    >
                      <Download className="w-4 h-4 inline mr-2" />
                      Download JSON
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsView;
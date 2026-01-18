// src/hooks/useAdminReports.ts
import { useState, useEffect, useCallback } from 'react';
import { adminReportAPI } from '@/api/adminReports';
import { supabase } from '@/lib/supabase';

export const useAdminReports = () => {
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [currentReport, setCurrentReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    type: 'all',
    period: 'all',
    search: ''
  });
  const [analytics, setAnalytics] = useState<any>(null);

  const fetchSavedReports = useCallback(async (page: number = 1, customFilters?: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const currentFilters = customFilters || filters;
      const result = await adminReportAPI.getSavedReports(pagination.limit, page, currentFilters);
      
      setSavedReports(result.data || []);
      setPagination({
        page,
        limit: pagination.limit,
        total: result.total || 0,
        totalPages: Math.ceil((result.total || 0) / pagination.limit)
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch saved reports');
      console.error('Error fetching saved reports:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  const generateSalesReport = useCallback(async (startDate: string, endDate: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await adminReportAPI.generateSalesReport(startDate, endDate);
      setCurrentReport({
        type: 'sales',
        period: 'custom',
        data,
        generated_at: new Date().toISOString()
      });
      
      return { success: true, data };
    } catch (err: any) {
      setError(err.message || 'Failed to generate sales report');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const generateUserReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await adminReportAPI.generateUserReport();
      setCurrentReport({
        type: 'users',
        period: 'monthly',
        data,
        generated_at: new Date().toISOString()
      });
      
      return { success: true, data };
    } catch (err: any) {
      setError(err.message || 'Failed to generate user report');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const generateFinancialReport = useCallback(async (month: string, year: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await adminReportAPI.generateFinancialReport(month, year);
      setCurrentReport({
        type: 'financial',
        period: 'monthly',
        data,
        generated_at: new Date().toISOString()
      });
      
      return { success: true, data };
    } catch (err: any) {
      setError(err.message || 'Failed to generate financial report');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const generateProductReport = useCallback(async (startDate: string, endDate: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await adminReportAPI.generateProductReport(startDate, endDate);
      setCurrentReport({
        type: 'products',
        period: 'custom',
        data,
        generated_at: new Date().toISOString()
      });
      
      return { success: true, data };
    } catch (err: any) {
      setError(err.message || 'Failed to generate product report');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const saveReport = useCallback(async (reportData: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const savedReport = await adminReportAPI.saveReport(reportData);
      setSavedReports(prev => [savedReport, ...prev]);
      
      // Update analytics
      if (analytics) {
        setAnalytics(prev => ({
          ...prev,
          total_reports: prev.total_reports + 1,
          by_type: {
            ...prev.by_type,
            [reportData.type]: (prev.by_type[reportData.type] || 0) + 1
          },
          by_period: {
            ...prev.by_period,
            [reportData.period]: (prev.by_period[reportData.period] || 0) + 1
          }
        }));
      }
      
      return { success: true, data: savedReport };
    } catch (err: any) {
      setError(err.message || 'Failed to save report');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [analytics]);

  const getReport = useCallback(async (reportId: string) => {
    try {
      setLoading(true);
      const report = await adminReportAPI.getReport(reportId);
      return { success: true, data: report };
    } catch (err: any) {
      setError(err.message || 'Failed to fetch report');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateReport = useCallback(async (reportId: string, updates: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedReport = await adminReportAPI.updateReport(reportId, updates);
      
      setSavedReports(prev => 
        prev.map(report => report.id === reportId ? updatedReport : report)
      );
      
      return { success: true, data: updatedReport };
    } catch (err: any) {
      setError(err.message || 'Failed to update report');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteReport = useCallback(async (reportId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await adminReportAPI.deleteReport(reportId);
      
      const deletedReport = savedReports.find(r => r.id === reportId);
      setSavedReports(prev => prev.filter(report => report.id !== reportId));
      
      // Update analytics
      if (analytics && deletedReport) {
        setAnalytics(prev => ({
          ...prev,
          total_reports: prev.total_reports - 1,
          by_type: {
            ...prev.by_type,
            [deletedReport.type]: Math.max(0, (prev.by_type[deletedReport.type] || 0) - 1)
          },
          by_period: {
            ...prev.by_period,
            [deletedReport.period]: Math.max(0, (prev.by_period[deletedReport.period] || 0) - 1)
          }
        }));
      }
      
      return { success: true };
    } catch (err: any) {
      setError(err.message || 'Failed to delete report');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [savedReports, analytics]);

  const bulkDeleteReports = useCallback(async (reportIds: string[]) => {
    try {
      setLoading(true);
      setError(null);
      
      await adminReportAPI.bulkDeleteReports(reportIds);
      
      const deletedReports = savedReports.filter(r => reportIds.includes(r.id));
      setSavedReports(prev => prev.filter(report => !reportIds.includes(report.id)));
      
      // Update analytics
      if (analytics && deletedReports.length > 0) {
        const typeCounts = deletedReports.reduce((acc, report) => {
          acc[report.type] = (acc[report.type] || 0) + 1;
          return acc;
        }, {} as any);
        
        const periodCounts = deletedReports.reduce((acc, report) => {
          acc[report.period] = (acc[report.period] || 0) + 1;
          return acc;
        }, {} as any);
        
        setAnalytics(prev => ({
          ...prev,
          total_reports: prev.total_reports - deletedReports.length,
          by_type: Object.keys(prev.by_type).reduce((acc, type) => ({
            ...acc,
            [type]: Math.max(0, (prev.by_type[type] || 0) - (typeCounts[type] || 0))
          }), {}),
          by_period: Object.keys(prev.by_period).reduce((acc, period) => ({
            ...acc,
            [period]: Math.max(0, (prev.by_period[period] || 0) - (periodCounts[period] || 0))
          }), {})
        }));
      }
      
      return { success: true, deleted: reportIds.length };
    } catch (err: any) {
      setError(err.message || 'Failed to bulk delete reports');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [savedReports, analytics]);

  const exportReportData = useCallback(async (reportId: string, format: 'csv' | 'json' = 'csv') => {
    try {
      setLoading(true);
      const data = await adminReportAPI.exportReportData(reportId, format);
      return { success: true, data };
    } catch (err: any) {
      setError(err.message || 'Failed to export report data');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const analyticsData = await adminReportAPI.getReportAnalytics();
      setAnalytics(analyticsData);
      return { success: true, data: analyticsData };
    } catch (err: any) {
      setError(err.message || 'Failed to fetch report analytics');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const generateCustomReport = useCallback(async (config: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await adminReportAPI.generateCustomReport(config);
      setCurrentReport({
        type: config.type,
        period: 'custom',
        data,
        generated_at: new Date().toISOString()
      });
      
      return { success: true, data };
    } catch (err: any) {
      setError(err.message || 'Failed to generate custom report');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Update filters
  const updateFilters = useCallback((newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Change page
  const changePage = useCallback((page: number) => {
    fetchSavedReports(page);
  }, [fetchSavedReports]);

  // Change limit
  const changeLimit = useCallback((limit: number) => {
    setPagination(prev => ({ ...prev, limit }));
  }, []);

  // Clear current report
  const clearCurrentReport = useCallback(() => {
    setCurrentReport(null);
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchSavedReports();
    fetchAnalytics();
  }, [fetchSavedReports, fetchAnalytics]);

  return {
    savedReports,
    currentReport,
    loading,
    error,
    pagination,
    filters,
    analytics,
    fetchSavedReports,
    generateSalesReport,
    generateUserReport,
    generateFinancialReport,
    generateProductReport,
    saveReport,
    getReport,
    updateReport,
    deleteReport,
    bulkDeleteReports,
    exportReportData,
    fetchAnalytics,
    generateCustomReport,
    updateFilters,
    changePage,
    changeLimit,
    clearCurrentReport
  };
};
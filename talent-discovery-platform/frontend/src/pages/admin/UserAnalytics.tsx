import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  UsersIcon,
  UserPlusIcon,
  UserMinusIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  GlobeAltIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface AnalyticsData {
  summary: {
    totalActiveUsers: number;
    totalDeletedUsers: number;
    newUsersInPeriod: number;
    deletedInPeriod: number;
    netGrowth: number;
  };
  newUsers: { period: string; count: string }[];
  deletedUsers: { period: string; count: string }[];
  byCountry: { country: string; count: string }[];
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
}

type PeriodType = 'day' | 'week' | 'month' | 'quarter' | 'year';

const UserAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodType>('month');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/analytics/users?period=${period}`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'xlsx') => {
    setExporting(true);
    try {
      const response = await api.get(`/admin/analytics/users/export?format=${format}&period=${period}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], {
        type: format === 'xlsx'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `user-analytics-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Analytics exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  // Merge new users and deleted users data for the table
  const getMergedData = () => {
    if (!analytics) return [];

    const periodMap = new Map<string, { period: string; newUsers: number; deletedUsers: number; netGrowth: number }>();

    analytics.newUsers.forEach(item => {
      periodMap.set(item.period, {
        period: item.period,
        newUsers: parseInt(item.count) || 0,
        deletedUsers: 0,
        netGrowth: parseInt(item.count) || 0
      });
    });

    analytics.deletedUsers.forEach(item => {
      const existing = periodMap.get(item.period);
      if (existing) {
        existing.deletedUsers = parseInt(item.count) || 0;
        existing.netGrowth = existing.newUsers - existing.deletedUsers;
      } else {
        periodMap.set(item.period, {
          period: item.period,
          newUsers: 0,
          deletedUsers: parseInt(item.count) || 0,
          netGrowth: -(parseInt(item.count) || 0)
        });
      }
    });

    return Array.from(periodMap.values()).sort((a, b) => a.period.localeCompare(b.period));
  };

  const getPeriodLabel = (periodType: PeriodType) => {
    switch (periodType) {
      case 'day': return 'Daily';
      case 'week': return 'Weekly';
      case 'month': return 'Monthly';
      case 'quarter': return 'Quarterly';
      case 'year': return 'Yearly';
      default: return 'Monthly';
    }
  };

  const formatPeriodDisplay = (periodStr: string) => {
    if (period === 'week' && periodStr.includes('-')) {
      const [year, week] = periodStr.split('-');
      return `Week ${week}, ${year}`;
    }
    if (period === 'quarter' && periodStr.includes('-Q')) {
      const [year, q] = periodStr.split('-');
      return `${q} ${year}`;
    }
    if (period === 'month' && periodStr.match(/^\d{4}-\d{2}$/)) {
      const [year, month] = periodStr.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    return periodStr;
  };

  const mergedData = getMergedData();

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <ChartBarIcon className="w-8 h-8 text-primary-500" />
            User Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track user growth, retention, and geographic distribution
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex gap-3 mt-4 md:mt-0">
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting || loading}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl font-medium
                     hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            Export CSV
          </button>
          <button
            onClick={() => handleExport('xlsx')}
            disabled={exporting || loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl font-medium
                     hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <CalendarIcon className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">View By:</span>
        </div>
        <div className="flex bg-white dark:bg-white/5 rounded-xl p-1 border border-gray-200 dark:border-white/10 inline-flex">
          {(['day', 'week', 'month', 'quarter', 'year'] as PeriodType[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize
                        ${period === p
                          ? 'bg-primary-500 text-white shadow-lg'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                        }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white/60 dark:bg-white/5 rounded-2xl h-32" />
            ))}
          </div>
          <div className="animate-pulse bg-white/60 dark:bg-white/5 rounded-2xl h-96" />
        </div>
      ) : analytics ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {/* Total Active Users */}
            <div className="bg-white dark:bg-white/5 rounded-2xl p-5 border border-gray-100 dark:border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <UsersIcon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {analytics.summary.totalActiveUsers.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Active Users</div>
            </div>

            {/* New Users in Period */}
            <div className="bg-white dark:bg-white/5 rounded-2xl p-5 border border-gray-100 dark:border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <UserPlusIcon className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-green-600">
                +{analytics.summary.newUsersInPeriod.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">New Users ({getPeriodLabel(period)})</div>
            </div>

            {/* Deleted Users in Period */}
            <div className="bg-white dark:bg-white/5 rounded-2xl p-5 border border-gray-100 dark:border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <UserMinusIcon className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-red-600">
                -{analytics.summary.deletedInPeriod.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Deleted Accounts ({getPeriodLabel(period)})</div>
            </div>

            {/* Net Growth */}
            <div className="bg-white dark:bg-white/5 rounded-2xl p-5 border border-gray-100 dark:border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center
                              ${analytics.summary.netGrowth >= 0 ? 'bg-emerald-500/20' : 'bg-orange-500/20'}`}>
                  {analytics.summary.netGrowth >= 0
                    ? <ArrowTrendingUpIcon className="w-6 h-6 text-emerald-600" />
                    : <ArrowTrendingDownIcon className="w-6 h-6 text-orange-600" />
                  }
                </div>
              </div>
              <div className={`text-3xl font-bold ${analytics.summary.netGrowth >= 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                {analytics.summary.netGrowth >= 0 ? '+' : ''}{analytics.summary.netGrowth.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Net Growth ({getPeriodLabel(period)})</div>
            </div>

            {/* Total Deleted */}
            <div className="bg-white dark:bg-white/5 rounded-2xl p-5 border border-gray-100 dark:border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gray-500/20 flex items-center justify-center">
                  <UserMinusIcon className="w-6 h-6 text-gray-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">
                {analytics.summary.totalDeletedUsers.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Deleted (All Time)</div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Growth Table - Takes 2 columns */}
            <div className="lg:col-span-2 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden">
              <div className="p-5 border-b border-gray-100 dark:border-white/10">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <ChartBarIcon className="w-5 h-5 text-primary-500" />
                  {getPeriodLabel(period)} Growth Breakdown
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {new Date(analytics.dateRange.start).toLocaleDateString()} - {new Date(analytics.dateRange.end).toLocaleDateString()}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-white/5">
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Period
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        New Users
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Deleted
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Net Growth
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                    {mergedData.length > 0 ? (
                      mergedData.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-white/5">
                          <td className="px-5 py-4 text-sm font-medium text-gray-900 dark:text-white">
                            {formatPeriodDisplay(row.period)}
                          </td>
                          <td className="px-5 py-4 text-sm text-right text-green-600 font-medium">
                            +{row.newUsers.toLocaleString()}
                          </td>
                          <td className="px-5 py-4 text-sm text-right text-red-600 font-medium">
                            -{row.deletedUsers.toLocaleString()}
                          </td>
                          <td className={`px-5 py-4 text-sm text-right font-bold
                                        ${row.netGrowth >= 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                            {row.netGrowth >= 0 ? '+' : ''}{row.netGrowth.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                          No data available for this period
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {mergedData.length > 0 && (
                    <tfoot>
                      <tr className="bg-gray-50 dark:bg-white/5 font-bold">
                        <td className="px-5 py-4 text-sm text-gray-900 dark:text-white">TOTAL</td>
                        <td className="px-5 py-4 text-sm text-right text-green-600">
                          +{mergedData.reduce((sum, r) => sum + r.newUsers, 0).toLocaleString()}
                        </td>
                        <td className="px-5 py-4 text-sm text-right text-red-600">
                          -{mergedData.reduce((sum, r) => sum + r.deletedUsers, 0).toLocaleString()}
                        </td>
                        <td className={`px-5 py-4 text-sm text-right
                                      ${mergedData.reduce((sum, r) => sum + r.netGrowth, 0) >= 0
                                        ? 'text-emerald-600' : 'text-orange-600'}`}>
                          {(() => {
                            const total = mergedData.reduce((sum, r) => sum + r.netGrowth, 0);
                            return `${total >= 0 ? '+' : ''}${total.toLocaleString()}`;
                          })()}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Country Breakdown */}
            <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden">
              <div className="p-5 border-b border-gray-100 dark:border-white/10">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <GlobeAltIcon className="w-5 h-5 text-primary-500" />
                  Users by Country
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Top 20 countries
                </p>
              </div>

              <div className="overflow-y-auto max-h-96">
                <table className="w-full">
                  <thead className="sticky top-0 bg-gray-50 dark:bg-white/5">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Country
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Users
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                    {analytics.byCountry.length > 0 ? (
                      analytics.byCountry.map((country, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-white/5">
                          <td className="px-5 py-3 text-sm text-gray-900 dark:text-white">
                            {country.country || 'Unknown'}
                          </td>
                          <td className="px-5 py-3 text-sm text-right text-gray-600 dark:text-gray-400 font-medium">
                            {parseInt(country.count).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                          No country data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-16 bg-white/60 dark:bg-white/5 rounded-2xl">
          <ChartBarIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No Analytics Data</h3>
          <p className="text-gray-500">Unable to load analytics data</p>
        </div>
      )}
    </div>
  );
};

export default UserAnalytics;

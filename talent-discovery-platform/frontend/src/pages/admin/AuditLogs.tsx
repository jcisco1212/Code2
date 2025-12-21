import React, { useState, useEffect } from 'react';
import { getUploadUrl } from '../../services/api';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

const actionLabels: Record<string, { label: string; color: string }> = {
  user_create: { label: 'User Created', color: 'bg-green-100 text-green-700' },
  user_update: { label: 'User Updated', color: 'bg-blue-100 text-blue-700' },
  user_delete: { label: 'User Deleted', color: 'bg-red-100 text-red-700' },
  user_ban: { label: 'User Banned', color: 'bg-red-100 text-red-700' },
  user_unban: { label: 'User Unbanned', color: 'bg-green-100 text-green-700' },
  user_verify: { label: 'User Verified', color: 'bg-green-100 text-green-700' },
  user_role_change: { label: 'Role Changed', color: 'bg-purple-100 text-purple-700' },
  video_create: { label: 'Video Created', color: 'bg-green-100 text-green-700' },
  video_update: { label: 'Video Updated', color: 'bg-blue-100 text-blue-700' },
  video_delete: { label: 'Video Deleted', color: 'bg-red-100 text-red-700' },
  video_flag: { label: 'Video Flagged', color: 'bg-yellow-100 text-yellow-700' },
  video_unflag: { label: 'Video Unflagged', color: 'bg-green-100 text-green-700' },
  category_create: { label: 'Category Created', color: 'bg-green-100 text-green-700' },
  category_update: { label: 'Category Updated', color: 'bg-blue-100 text-blue-700' },
  category_delete: { label: 'Category Deleted', color: 'bg-red-100 text-red-700' },
  announcement_create: { label: 'Announcement Created', color: 'bg-green-100 text-green-700' },
  announcement_update: { label: 'Announcement Updated', color: 'bg-blue-100 text-blue-700' },
  announcement_delete: { label: 'Announcement Deleted', color: 'bg-red-100 text-red-700' },
  settings_update: { label: 'Settings Updated', color: 'bg-blue-100 text-blue-700' },
  comment_delete: { label: 'Comment Deleted', color: 'bg-red-100 text-red-700' },
  report_resolve: { label: 'Report Resolved', color: 'bg-green-100 text-green-700' },
  content_moderate: { label: 'Content Moderated', color: 'bg-yellow-100 text-yellow-700' }
};

const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    userId: '',
    targetType: '',
    startDate: '',
    endDate: ''
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 50 };
      if (filters.action) params.action = filters.action;
      if (filters.userId) params.userId = filters.userId;
      if (filters.targetType) params.targetType = filters.targetType;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await api.get('/admin/audit-logs', { params });
      setLogs(response.data.logs || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (err) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      action: '',
      userId: '',
      targetType: '',
      startDate: '',
      endDate: ''
    });
    setPage(1);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionInfo = (action: string) => {
    return actionLabels[action] || { label: action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), color: 'bg-gray-100 text-gray-700' };
  };

  const uniqueActions = [...new Set(logs.map(l => l.action))];
  const uniqueTargetTypes = [...new Set(logs.map(l => l.targetType))];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Track all administrative actions on the platform</p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Action</label>
            <select
              value={filters.action}
              onChange={e => handleFilterChange('action', e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Actions</option>
              {Object.keys(actionLabels).map(action => (
                <option key={action} value={action}>{actionLabels[action].label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Type</label>
            <select
              value={filters.targetType}
              onChange={e => handleFilterChange('targetType', e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Types</option>
              <option value="user">User</option>
              <option value="video">Video</option>
              <option value="category">Category</option>
              <option value="announcement">Announcement</option>
              <option value="comment">Comment</option>
              <option value="report">Report</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={e => handleFilterChange('startDate', e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={e => handleFilterChange('endDate', e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No audit logs found</h2>
          <p className="text-gray-500 dark:text-gray-400">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Timestamp</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Action</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Target</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">IP Address</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {logs.map(log => {
                    const actionInfo = getActionInfo(log.action);
                    return (
                      <React.Fragment key={log.id}>
                        <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {formatDate(log.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            {log.user ? (
                              <div className="flex items-center gap-2">
                                <img
                                  src={log.user.avatarUrl ? getUploadUrl(log.user.avatarUrl) : '/default-avatar.png'}
                                  alt={log.user.displayName}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">{log.user.displayName}</p>
                                  <p className="text-xs text-gray-500">@{log.user.username}</p>
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">System</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded ${actionInfo.color}`}>
                              {actionInfo.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            <span className="capitalize">{log.targetType}</span>
                            {log.targetId && (
                              <span className="text-gray-500 ml-1 text-xs">({log.targetId.slice(0, 8)}...)</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                            {log.ipAddress || '-'}
                          </td>
                          <td className="px-4 py-3">
                            {log.details ? (
                              <button
                                onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                                className="text-sm text-indigo-600 hover:text-indigo-700"
                              >
                                {expandedLog === log.id ? 'Hide' : 'View'}
                              </button>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                        {expandedLog === log.id && log.details && (
                          <tr>
                            <td colSpan={6} className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50">
                              <pre className="text-xs text-gray-600 dark:text-gray-300 overflow-x-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                              {log.userAgent && (
                                <p className="text-xs text-gray-500 mt-2">
                                  User Agent: {log.userAgent}
                                </p>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminAuditLogs;

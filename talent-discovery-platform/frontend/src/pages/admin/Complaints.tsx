import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  UserIcon,
  FilmIcon,
  ChatBubbleLeftIcon,
  ClockIcon,
  FlagIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline';

interface Report {
  id: string;
  type: 'video' | 'user' | 'comment';
  reason: string;
  description: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  targetId: string;
  resolution: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reporter: {
    id: string;
    username: string;
  };
}

const Complaints: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewing' | 'resolved' | 'dismissed'>('pending');
  const [typeFilter, setTypeFilter] = useState<'all' | 'video' | 'user' | 'comment'>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [resolution, setResolution] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, [filter, typeFilter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const response = await api.get(`/admin/reports?${params.toString()}`);
      setReports(response.data.reports || []);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (reportId: string, status: 'resolved' | 'dismissed', resolutionText?: string) => {
    setProcessing(reportId);
    try {
      await api.put(`/admin/reports/${reportId}/review`, {
        status,
        resolution: resolutionText || resolution
      });
      toast.success(`Report ${status === 'resolved' ? 'resolved' : 'dismissed'}`);
      fetchReports();
      setSelectedReport(null);
      setResolution('');
    } catch (error) {
      console.error('Review failed:', error);
      toast.error('Failed to update report');
    } finally {
      setProcessing(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <FilmIcon className="w-5 h-5" />;
      case 'user':
        return <UserIcon className="w-5 h-5" />;
      case 'comment':
        return <ChatBubbleLeftIcon className="w-5 h-5" />;
      default:
        return <FlagIcon className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-600 dark:text-yellow-400' },
      reviewing: { bg: 'bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400' },
      resolved: { bg: 'bg-green-500/20', text: 'text-green-600 dark:text-green-400' },
      dismissed: { bg: 'bg-gray-500/20', text: 'text-gray-600 dark:text-gray-400' }
    };
    const style = styles[status] || styles.pending;
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text} capitalize`}>
        {status}
      </span>
    );
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      spam: 'Spam or Misleading',
      harassment: 'Harassment or Bullying',
      hate_speech: 'Hate Speech',
      violence: 'Violence or Harmful Content',
      sexual_content: 'Sexual Content',
      copyright: 'Copyright Infringement',
      impersonation: 'Impersonation',
      other: 'Other'
    };
    return labels[reason] || reason;
  };

  const stats = {
    pending: reports.filter(r => r.status === 'pending').length,
    total: reports.length
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports & Complaints</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Handle user-submitted reports and complaints</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex bg-white dark:bg-white/5 rounded-xl p-1 border border-gray-200 dark:border-white/10">
          {(['all', 'pending', 'reviewing', 'resolved', 'dismissed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize
                        ${filter === status
                          ? 'bg-primary-500 text-white shadow-lg'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                        }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="flex bg-white dark:bg-white/5 rounded-xl p-1 border border-gray-200 dark:border-white/10">
          {(['all', 'video', 'user', 'comment'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize
                        ${typeFilter === type
                          ? 'bg-primary-500 text-white shadow-lg'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                        }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white/60 dark:bg-white/5 rounded-2xl h-32" />
          ))
        ) : reports.length === 0 ? (
          <div className="text-center py-16 bg-white/60 dark:bg-white/5 rounded-2xl">
            <ShieldExclamationIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No reports found</h3>
            <p className="text-gray-500">
              {filter === 'pending' ? 'All reports have been handled' : 'No reports match your filters'}
            </p>
          </div>
        ) : (
          reports.map((report) => (
            <div
              key={report.id}
              className="bg-white dark:bg-white/5 rounded-2xl p-5 border border-gray-100 dark:border-white/10
                       hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  {/* Type Icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center
                                ${report.type === 'video' ? 'bg-purple-500/20 text-purple-600' :
                                  report.type === 'user' ? 'bg-blue-500/20 text-blue-600' :
                                  'bg-green-500/20 text-green-600'}`}>
                    {getTypeIcon(report.type)}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 dark:text-white capitalize">
                        {report.type} Report
                      </span>
                      {getStatusBadge(report.status)}
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <span className="font-medium text-red-600 dark:text-red-400">
                        {getReasonLabel(report.reason)}
                      </span>
                    </div>

                    {report.description && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-white/5 rounded-lg p-3 mb-3 max-w-2xl">
                        "{report.description}"
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <UserIcon className="w-3.5 h-3.5" />
                        Reported by: {report.reporter?.username || 'Anonymous'}
                      </span>
                      <span className="flex items-center gap-1">
                        <ClockIcon className="w-3.5 h-3.5" />
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {report.resolution && (
                      <div className="mt-3 p-3 bg-green-50 dark:bg-green-500/10 rounded-lg border border-green-200 dark:border-green-500/20">
                        <div className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">Resolution:</div>
                        <p className="text-sm text-green-800 dark:text-green-300">{report.resolution}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  {report.type === 'video' && (
                    <Link
                      to={`/watch/${report.targetId}`}
                      target="_blank"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-white/10
                               text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium
                               hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                    >
                      <EyeIcon className="w-4 h-4" />
                      View
                    </Link>
                  )}

                  {report.status === 'pending' && (
                    <>
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-500/20
                                 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium
                                 hover:bg-blue-200 dark:hover:bg-blue-500/30 transition-colors"
                      >
                        <ExclamationTriangleIcon className="w-4 h-4" />
                        Review
                      </button>
                      <button
                        onClick={() => handleReview(report.id, 'dismissed', 'No action required')}
                        disabled={processing === report.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-white/10
                                 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium
                                 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors
                                 disabled:opacity-50"
                      >
                        <XCircleIcon className="w-4 h-4" />
                        Dismiss
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Review Report</h3>

            <div className="mb-4 p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-gray-900 dark:text-white capitalize">
                  {selectedReport.type} Report
                </span>
                <span className="text-red-600 dark:text-red-400 text-sm">
                  {getReasonLabel(selectedReport.reason)}
                </span>
              </div>
              {selectedReport.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400">"{selectedReport.description}"</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Resolution Notes
              </label>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Describe the action taken..."
                rows={3}
                className="w-full p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10
                         text-gray-900 dark:text-white placeholder:text-gray-400"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quick Actions
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setResolution('Content has been removed');
                  }}
                  className="p-2 text-sm bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 rounded-lg
                           hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                >
                  Remove Content
                </button>
                <button
                  onClick={() => {
                    setResolution('User has been warned');
                  }}
                  className="p-2 text-sm bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 rounded-lg
                           hover:bg-yellow-100 dark:hover:bg-yellow-500/20 transition-colors"
                >
                  Warn User
                </button>
                <button
                  onClick={() => {
                    setResolution('User account has been suspended');
                  }}
                  className="p-2 text-sm bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 rounded-lg
                           hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors"
                >
                  Suspend User
                </button>
                <button
                  onClick={() => {
                    setResolution('No violation found - false report');
                  }}
                  className="p-2 text-sm bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-400 rounded-lg
                           hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  False Report
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedReport(null);
                  setResolution('');
                }}
                className="flex-1 py-2.5 px-4 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300
                         rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReview(selectedReport.id, 'resolved')}
                disabled={!resolution || processing === selectedReport.id}
                className="flex-1 py-2.5 px-4 bg-green-500 text-white rounded-xl font-medium
                         hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircleIcon className="w-5 h-5" />
                Resolve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Complaints;

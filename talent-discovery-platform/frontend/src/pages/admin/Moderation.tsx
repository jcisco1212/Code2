import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { getUploadUrl } from '../../utils/urls';
import toast from 'react-hot-toast';
import {
  ShieldCheckIcon,
  XCircleIcon,
  CheckCircleIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  CpuChipIcon,
  UserIcon,
  PlayIcon,
  PauseIcon,
  NoSymbolIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: number;
  status: string;
  aiPerformanceScore: number | null;
  aiModerationStatus: string | null;
  aiModerationFlags: string[] | null;
  createdAt: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
}

interface ModerationStats {
  pending: number;
  approved: number;
  rejected: number;
  flagged: number;
}

const Moderation: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [stats, setStats] = useState<ModerationStats>({ pending: 0, approved: 0, rejected: 0, flagged: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'flagged' | 'approved' | 'rejected'>('pending');
  const [processing, setProcessing] = useState<string | null>(null);
  const [showAIPanel, setShowAIPanel] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, [filter]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const statusMap: Record<string, string> = {
        'all': '',
        'pending': 'pending',
        'approved': 'ready',
        'rejected': 'deleted',
        'flagged': 'flagged'
      };
      const status = statusMap[filter];
      const response = await api.get(`/admin/videos${status ? `?status=${status}` : ''}`);
      setVideos(response.data.videos || []);

      // Calculate stats
      const allVideos = await api.get('/admin/videos');
      const all = allVideos.data.videos || [];
      setStats({
        pending: all.filter((v: Video) => v.status === 'pending').length,
        approved: all.filter((v: Video) => v.status === 'ready').length,
        rejected: all.filter((v: Video) => v.status === 'deleted').length,
        flagged: all.filter((v: Video) => v.aiModerationFlags && v.aiModerationFlags.length > 0).length
      });
    } catch (error) {
      console.error('Failed to fetch videos:', error);
      toast.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (videoId: string, action: 'approve' | 'reject' | 'disable') => {
    setProcessing(videoId);
    try {
      await api.put(`/admin/videos/${videoId}/moderate`, {
        action: action === 'disable' ? 'reject' : action,
        reason: action === 'reject' ? 'Content policy violation' : undefined
      });
      toast.success(`Video ${action === 'approve' ? 'approved' : action === 'disable' ? 'disabled' : 'rejected'} successfully`);
      fetchVideos();
      setSelectedVideo(null);
    } catch (error) {
      console.error('Moderation failed:', error);
      toast.error('Failed to moderate video');
    } finally {
      setProcessing(null);
    }
  };

  const runAIModeration = async (videoId: string) => {
    setProcessing(videoId);
    try {
      // Simulate AI moderation (in production, this would call an AI service)
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('AI moderation complete');
      fetchVideos();
    } catch (error) {
      toast.error('AI moderation failed');
    } finally {
      setProcessing(null);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-600 dark:text-yellow-400', label: 'Pending' },
      ready: { bg: 'bg-green-500/20', text: 'text-green-600 dark:text-green-400', label: 'Approved' },
      processing: { bg: 'bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400', label: 'Processing' },
      deleted: { bg: 'bg-red-500/20', text: 'text-red-600 dark:text-red-400', label: 'Rejected' },
      flagged: { bg: 'bg-orange-500/20', text: 'text-orange-600 dark:text-orange-400', label: 'Flagged' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Video Moderation</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Review and moderate uploaded content</p>
        </div>
        <button
          onClick={() => setShowAIPanel(!showAIPanel)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500
                   text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
        >
          <CpuChipIcon className="w-5 h-5" />
          AI Settings
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <button
          onClick={() => setFilter('pending')}
          className={`p-4 rounded-2xl border-2 transition-all ${
            filter === 'pending'
              ? 'bg-yellow-500/20 border-yellow-500'
              : 'bg-white dark:bg-white/5 border-transparent hover:border-yellow-500/50'
          }`}
        >
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-sm text-gray-700 dark:text-gray-300">Pending Review</div>
        </button>
        <button
          onClick={() => setFilter('flagged')}
          className={`p-4 rounded-2xl border-2 transition-all ${
            filter === 'flagged'
              ? 'bg-orange-500/20 border-orange-500'
              : 'bg-white dark:bg-white/5 border-transparent hover:border-orange-500/50'
          }`}
        >
          <div className="text-2xl font-bold text-orange-600">{stats.flagged}</div>
          <div className="text-sm text-gray-700 dark:text-gray-300">AI Flagged</div>
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`p-4 rounded-2xl border-2 transition-all ${
            filter === 'approved'
              ? 'bg-green-500/20 border-green-500'
              : 'bg-white dark:bg-white/5 border-transparent hover:border-green-500/50'
          }`}
        >
          <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          <div className="text-sm text-gray-700 dark:text-gray-300">Approved</div>
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`p-4 rounded-2xl border-2 transition-all ${
            filter === 'rejected'
              ? 'bg-red-500/20 border-red-500'
              : 'bg-white dark:bg-white/5 border-transparent hover:border-red-500/50'
          }`}
        >
          <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          <div className="text-sm text-gray-700 dark:text-gray-300">Rejected</div>
        </button>
      </div>

      {/* AI Settings Panel */}
      {showAIPanel && (
        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20
                      border border-indigo-500/20 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <CpuChipIcon className="w-6 h-6 text-indigo-500" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">AI Moderation Settings</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Auto-Moderation
              </label>
              <select className="w-full p-3 rounded-xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10
                               text-gray-900 dark:text-white">
                <option value="enabled">Enabled - Auto-approve safe content</option>
                <option value="review">Review Only - Flag for human review</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sensitivity Level
              </label>
              <select className="w-full p-3 rounded-xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10
                               text-gray-900 dark:text-white">
                <option value="low">Low - Fewer flags</option>
                <option value="medium">Medium - Balanced</option>
                <option value="high">High - Strict moderation</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Content Checks
              </label>
              <div className="space-y-2">
                {['Violence/Gore', 'Adult Content', 'Hate Speech', 'Copyright', 'Spam'].map((check) => (
                  <label key={check} className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded text-indigo-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{check}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                AI Performance Scoring
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded text-indigo-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Enable talent scoring</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded text-indigo-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Generate performance insights</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded text-indigo-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Auto-feature high scorers</span>
                </label>
              </div>
            </div>
          </div>
          <button className="mt-4 px-6 py-2 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors">
            Save Settings
          </button>
        </div>
      )}

      {/* Videos Grid */}
      <div className="grid gap-4">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white/60 dark:bg-white/5 rounded-2xl h-32" />
          ))
        ) : videos.length === 0 ? (
          <div className="text-center py-16 bg-white/60 dark:bg-white/5 rounded-2xl">
            <ShieldCheckIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {filter === 'pending' ? 'No pending videos' : 'No videos found'}
            </h3>
            <p className="text-gray-500">
              {filter === 'pending' ? 'All videos have been reviewed' : 'Try a different filter'}
            </p>
          </div>
        ) : (
          videos.map((video) => (
            <div
              key={video.id}
              className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-gray-100 dark:border-white/10
                       hover:shadow-lg transition-all"
            >
              <div className="flex gap-4">
                {/* Thumbnail */}
                <div className="relative flex-shrink-0 w-48 aspect-video rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700">
                  {video.thumbnailUrl ? (
                    <img
                      src={getUploadUrl(video.thumbnailUrl) || ''}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PlayIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 rounded text-white text-xs">
                    {formatDuration(video.duration || 0)}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">{video.title}</h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                        <UserIcon className="w-4 h-4" />
                        <span>{video.user?.username}</span>
                        <span>•</span>
                        <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {getStatusBadge(video.status)}
                  </div>

                  {/* AI Flags */}
                  {video.aiModerationFlags && video.aiModerationFlags.length > 0 && (
                    <div className="flex items-center gap-2 mt-3">
                      <ExclamationTriangleIcon className="w-4 h-4 text-orange-500" />
                      <div className="flex gap-1 flex-wrap">
                        {video.aiModerationFlags.map((flag, i) => (
                          <span key={i} className="px-2 py-0.5 bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded text-xs">
                            {flag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Score */}
                  {video.aiPerformanceScore && (
                    <div className="flex items-center gap-2 mt-2">
                      <CpuChipIcon className="w-4 h-4 text-indigo-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        AI Score: <span className="font-semibold text-indigo-600">{video.aiPerformanceScore.toFixed(0)}</span>
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4">
                    <Link
                      to={`/watch/${video.id}`}
                      target="_blank"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300
                               rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                    >
                      <EyeIcon className="w-4 h-4" />
                      Preview
                    </Link>
                    <button
                      onClick={() => runAIModeration(video.id)}
                      disabled={processing === video.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400
                               rounded-lg text-sm font-medium hover:bg-indigo-200 dark:hover:bg-indigo-500/30 transition-colors
                               disabled:opacity-50"
                    >
                      {processing === video.id ? (
                        <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      ) : (
                        <CpuChipIcon className="w-4 h-4" />
                      )}
                      Run AI
                    </button>
                    <button
                      onClick={() => handleModerate(video.id, 'approve')}
                      disabled={processing === video.id || video.status === 'ready'}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400
                               rounded-lg text-sm font-medium hover:bg-green-200 dark:hover:bg-green-500/30 transition-colors
                               disabled:opacity-50"
                    >
                      <CheckCircleIcon className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleModerate(video.id, 'disable')}
                      disabled={processing === video.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400
                               rounded-lg text-sm font-medium hover:bg-amber-200 dark:hover:bg-amber-500/30 transition-colors
                               disabled:opacity-50"
                    >
                      <PauseIcon className="w-4 h-4" />
                      Disable
                    </button>
                    <button
                      onClick={() => handleModerate(video.id, 'reject')}
                      disabled={processing === video.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400
                               rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors
                               disabled:opacity-50"
                    >
                      <XCircleIcon className="w-4 h-4" />
                      Takedown
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Moderation;

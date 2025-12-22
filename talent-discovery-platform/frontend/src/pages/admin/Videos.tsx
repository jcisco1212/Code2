import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUploadUrl } from '../../services/api';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  TrashIcon,
  EyeIcon,
  FlagIcon,
  CheckIcon,
  XCircleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

interface Video {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  status: string;
  visibility: string;
  viewCount: number;
  isFlagged: boolean;
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  category?: {
    id: string;
    name: string;
  };
}

const AdminVideos: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    status: '',
    visibility: '',
    flagged: ''
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [bulkAction, setBulkAction] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, [page, filters]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (filters.status) params.status = filters.status;
      if (filters.visibility) params.visibility = filters.visibility;
      if (filters.flagged) params.flagged = filters.flagged;

      const response = await api.get('/admin/videos', { params });
      setVideos(response.data.videos || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (err) {
      toast.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedVideos.size === videos.length) {
      setSelectedVideos(new Set());
    } else {
      setSelectedVideos(new Set(videos.map(v => v.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedVideos);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedVideos(newSelected);
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedVideos.size === 0) return;

    setProcessing(true);
    try {
      const videoIds = Array.from(selectedVideos);

      switch (bulkAction) {
        case 'delete':
          if (!window.confirm(`Delete ${videoIds.length} videos? This cannot be undone.`)) {
            setProcessing(false);
            return;
          }
          await api.post('/admin/videos/bulk-delete', { videoIds });
          toast.success(`${videoIds.length} videos deleted`);
          break;
        case 'flag':
          await api.post('/admin/videos/bulk-flag', { videoIds });
          toast.success(`${videoIds.length} videos flagged`);
          break;
        case 'unflag':
          await api.post('/admin/videos/bulk-unflag', { videoIds });
          toast.success(`${videoIds.length} videos unflagged`);
          break;
        case 'publish':
          await api.post('/admin/videos/bulk-publish', { videoIds });
          toast.success(`${videoIds.length} videos published`);
          break;
        case 'unpublish':
          await api.post('/admin/videos/bulk-unpublish', { videoIds });
          toast.success(`${videoIds.length} videos unpublished`);
          break;
      }

      setSelectedVideos(new Set());
      setBulkAction('');
      fetchVideos();
    } catch (err) {
      toast.error('Bulk action failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleSingleAction = async (videoId: string, action: string) => {
    try {
      switch (action) {
        case 'delete':
          if (!window.confirm('Delete this video?')) return;
          await api.delete(`/admin/videos/${videoId}`);
          toast.success('Video deleted');
          break;
        case 'flag':
          await api.post(`/admin/videos/${videoId}/flag`);
          toast.success('Video flagged');
          break;
        case 'unflag':
          await api.post(`/admin/videos/${videoId}/unflag`);
          toast.success('Video unflagged');
          break;
      }
      fetchVideos();
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatViews = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      published: 'bg-green-100 text-green-700',
      processing: 'bg-yellow-100 text-yellow-700',
      draft: 'bg-gray-100 text-gray-700',
      failed: 'bg-red-100 text-red-700'
    };
    return styles[status] || styles.draft;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Video Moderation</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and moderate all videos on the platform</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filters.status}
            onChange={e => { setFilters(p => ({ ...p, status: e.target.value })); setPage(1); }}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value="published">Published</option>
            <option value="processing">Processing</option>
            <option value="draft">Draft</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={filters.visibility}
            onChange={e => { setFilters(p => ({ ...p, visibility: e.target.value })); setPage(1); }}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Visibility</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="unlisted">Unlisted</option>
          </select>

          <select
            value={filters.flagged}
            onChange={e => { setFilters(p => ({ ...p, flagged: e.target.value })); setPage(1); }}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Videos</option>
            <option value="true">Flagged Only</option>
            <option value="false">Not Flagged</option>
          </select>

          <button
            onClick={() => { setFilters({ status: '', visibility: '', flagged: '' }); setPage(1); }}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedVideos.size > 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-xl p-4 mb-6 flex items-center justify-between">
          <span className="text-indigo-700 dark:text-indigo-300 font-medium">
            {selectedVideos.size} video{selectedVideos.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-3">
            <select
              value={bulkAction}
              onChange={e => setBulkAction(e.target.value)}
              className="p-2 border border-indigo-300 dark:border-indigo-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Choose Action</option>
              <option value="delete">Delete Videos</option>
              <option value="flag">Flag Videos</option>
              <option value="unflag">Unflag Videos</option>
              <option value="publish">Publish Videos</option>
              <option value="unpublish">Unpublish Videos</option>
            </select>
            <button
              onClick={handleBulkAction}
              disabled={!bulkAction || processing}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Processing...' : 'Apply'}
            </button>
            <button
              onClick={() => setSelectedVideos(new Set())}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Videos Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
          <p className="text-gray-500">No videos found</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedVideos.size === videos.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Video</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Creator</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Views</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {videos.map(video => (
                <tr key={video.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${selectedVideos.has(video.id) ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedVideos.has(video.id)}
                      onChange={() => toggleSelect(video.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link to={`/watch/${video.id}`} className="flex-shrink-0">
                        <img
                          src={video.thumbnailUrl ? getUploadUrl(video.thumbnailUrl) || '/placeholder-video.jpg' : '/placeholder-video.jpg'}
                          alt={video.title}
                          className="w-20 h-12 object-cover rounded"
                        />
                      </Link>
                      <div className="min-w-0">
                        <Link to={`/watch/${video.id}`} className="font-medium text-gray-900 dark:text-white hover:text-indigo-600 line-clamp-1">
                          {video.title}
                        </Link>
                        {video.isFlagged && (
                          <span className="inline-flex items-center gap-1 text-xs text-red-600">
                            <FlagIcon className="w-3 h-3" /> Flagged
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/profile/${video.user.username}`} className="flex items-center gap-2">
                      <img
                        src={video.user.avatarUrl ? getUploadUrl(video.user.avatarUrl) || '/default-avatar.png' : '/default-avatar.png'}
                        alt={video.user.displayName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="text-sm text-gray-900 dark:text-white hover:text-indigo-600">{video.user.displayName}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded ${getStatusBadge(video.status)}`}>
                      {video.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatViews(video.viewCount)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(video.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link to={`/watch/${video.id}`} className="p-1.5 text-gray-400 hover:text-indigo-600" title="View">
                        <EyeIcon className="w-5 h-5" />
                      </Link>
                      {video.isFlagged ? (
                        <button onClick={() => handleSingleAction(video.id, 'unflag')} className="p-1.5 text-green-600 hover:text-green-700" title="Unflag">
                          <CheckIcon className="w-5 h-5" />
                        </button>
                      ) : (
                        <button onClick={() => handleSingleAction(video.id, 'flag')} className="p-1.5 text-yellow-600 hover:text-yellow-700" title="Flag">
                          <FlagIcon className="w-5 h-5" />
                        </button>
                      )}
                      <button onClick={() => handleSingleAction(video.id, 'delete')} className="p-1.5 text-red-600 hover:text-red-700" title="Delete">
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
    </div>
  );
};

export default AdminVideos;

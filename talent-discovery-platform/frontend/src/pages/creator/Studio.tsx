import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { videosAPI, analyticsAPI, getUploadUrl } from '../../services/api';
import {
  VideoCameraIcon,
  PlusIcon,
  EyeIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  PencilIcon,
  TrashIcon,
  ChartBarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Video {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  status: string;
  visibility: string;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  duration: number | null;
  createdAt: string;
}

interface DashboardStats {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalVideos: number;
  subscriberCount: number;
}

const Studio: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [videos, setVideos] = useState<Video[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    totalVideos: 0,
    subscriberCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch user's videos
        const videosResponse = await videosAPI.getVideos({
          userId: user?.id,
          limit: 50
        });
        const userVideos = videosResponse.data.videos || [];
        setVideos(userVideos);

        // Calculate stats from videos
        const totalViews = userVideos.reduce((sum: number, v: Video) => sum + (v.viewsCount || 0), 0);
        const totalLikes = userVideos.reduce((sum: number, v: Video) => sum + (v.likesCount || 0), 0);
        const totalComments = userVideos.reduce((sum: number, v: Video) => sum + (v.commentsCount || 0), 0);

        setStats({
          totalViews,
          totalLikes,
          totalComments,
          totalVideos: userVideos.length,
          subscriberCount: (user as any)?.followersCount || 0
        });
      } catch (err) {
        console.error('Failed to fetch studio data:', err);
        toast.error('Failed to load studio data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, user, navigate]);

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return;
    }

    setDeletingId(videoId);
    try {
      await videosAPI.deleteVideo(videoId);
      setVideos(prev => prev.filter(v => v.id !== videoId));
      toast.success('Video deleted successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete video');
    } finally {
      setDeletingId(null);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string, visibility: string) => {
    if (status !== 'ready') {
      return (
        <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">
          Processing
        </span>
      );
    }
    if (visibility === 'private') {
      return (
        <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded-full">
          Private
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full">
        Public
      </span>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Creator Studio</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your videos and track performance</p>
        </div>
        <Link
          to="/creator/upload"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Upload Video
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <EyeIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Views</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{formatNumber(stats.totalViews)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <HeartIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Likes</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{formatNumber(stats.totalLikes)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <ChatBubbleLeftIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Comments</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{formatNumber(stats.totalComments)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <UserGroupIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Followers</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{formatNumber(stats.subscriberCount)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
        <Link
          to="/analytics"
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
        >
          <ChartBarIcon className="w-5 h-5" />
          View Analytics
        </Link>
        <Link
          to={`/profile/${user?.username}`}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
        >
          <UserGroupIcon className="w-5 h-5" />
          View Channel
        </Link>
      </div>

      {/* Videos List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Your Videos ({stats.totalVideos})
          </h2>
        </div>

        {videos.length === 0 ? (
          <div className="p-8 text-center">
            <VideoCameraIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No videos yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Upload your first video to get started!</p>
            <Link
              to="/creator/upload"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Upload Video
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {videos.map((video) => (
              <div key={video.id} className="p-4 flex gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                {/* Thumbnail */}
                <Link to={`/watch/${video.id}`} className="flex-shrink-0">
                  <div className="relative w-40 aspect-video rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                    {video.thumbnailUrl ? (
                      <img
                        src={getUploadUrl(video.thumbnailUrl) || ''}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <VideoCameraIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    {video.duration && (
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/75 text-white text-xs rounded">
                        {formatDuration(video.duration)}
                      </span>
                    )}
                  </div>
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        to={`/watch/${video.id}`}
                        className="font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 line-clamp-2"
                      >
                        {video.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(video.status, video.visibility)}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(video.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <EyeIcon className="w-4 h-4" />
                      {formatNumber(video.viewsCount)}
                    </span>
                    <span className="flex items-center gap-1">
                      <HeartIcon className="w-4 h-4" />
                      {formatNumber(video.likesCount)}
                    </span>
                    <span className="flex items-center gap-1">
                      <ChatBubbleLeftIcon className="w-4 h-4" />
                      {formatNumber(video.commentsCount)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    to={`/creator/edit/${video.id}`}
                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                    title="Edit video"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </Link>
                  <Link
                    to={`/creator/analytics/${video.id}`}
                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                    title="View analytics"
                  >
                    <ChartBarIcon className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => handleDeleteVideo(video.id)}
                    disabled={deletingId === video.id}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete video"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Studio;

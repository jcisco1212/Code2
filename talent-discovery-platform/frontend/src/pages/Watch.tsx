import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { videosAPI, getUploadUrl } from '../services/api';
import { EyeIcon, HeartIcon, ShareIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

interface Video {
  id: string;
  title: string;
  description: string | null;
  hlsUrl: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  user?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    bio: string | null;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

const Watch: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const fetchVideo = async () => {
      if (!videoId) return;
      try {
        setLoading(true);
        const response = await videosAPI.getVideo(videoId);
        setVideo(response.data.video);
        setLiked(response.data.userLiked === true);
      } catch (err: any) {
        console.error('Failed to fetch video:', err);
        setError(err.response?.data?.error?.message || 'Failed to load video');
      } finally {
        setLoading(false);
      }
    };
    fetchVideo();
  }, [videoId]);

  const handleLike = async () => {
    if (!video) return;
    try {
      if (liked) {
        await videosAPI.unlikeVideo(video.id);
        setLiked(false);
        setVideo(prev => prev ? { ...prev, likesCount: prev.likesCount - 1 } : null);
      } else {
        await videosAPI.likeVideo(video.id);
        setLiked(true);
        setVideo(prev => prev ? { ...prev, likesCount: prev.likesCount + 1 } : null);
      }
    } catch (err: any) {
      toast.error('Please log in to like videos');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  const formatViews = (count: number | null | undefined) => {
    if (count == null) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="aspect-video bg-gray-300 dark:bg-gray-700 rounded-xl mb-4"></div>
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Video Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400">{error || 'This video may have been removed or is unavailable.'}</p>
          <Link to="/" className="mt-4 inline-block text-indigo-600 hover:text-indigo-800">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  const videoUrl = video.hlsUrl ? getUploadUrl(video.hlsUrl) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Video Player */}
          <div className="aspect-video bg-black rounded-xl overflow-hidden mb-4">
            {videoUrl ? (
              <video
                src={videoUrl}
                controls
                autoPlay
                className="w-full h-full"
                poster={video.thumbnailUrl ? getUploadUrl(video.thumbnailUrl) || undefined : undefined}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <span className="text-6xl block mb-2">🎬</span>
                  <p>Video processing...</p>
                </div>
              </div>
            )}
          </div>

          {/* Video Info */}
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {video.title}
          </h1>

          {/* Stats and Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <EyeIcon className="w-5 h-5" />
                {formatViews(video.viewsCount)} views
              </span>
              <span>{formatDate(video.createdAt)}</span>
              {video.category && (
                <Link
                  to={`/category/${video.category.slug}`}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  {video.category.name}
                </Link>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                  liked
                    ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {liked ? (
                  <HeartSolidIcon className="w-5 h-5" />
                ) : (
                  <HeartIcon className="w-5 h-5" />
                )}
                <span>{formatViews(video.likesCount)}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <ShareIcon className="w-5 h-5" />
                <span>Share</span>
              </button>

              <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <BookmarkIcon className="w-5 h-5" />
                <span>Save</span>
              </button>
            </div>
          </div>

          {/* Creator Info */}
          {video.user && (
            <div className="flex items-start gap-4 py-4 border-b border-gray-200 dark:border-gray-700">
              <Link to={`/profile/${video.user.username}`}>
                {video.user.avatarUrl ? (
                  <img
                    src={getUploadUrl(video.user.avatarUrl) || ''}
                    alt={video.user.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium text-lg">
                    {video.user.firstName?.[0] || '?'}
                  </div>
                )}
              </Link>
              <div className="flex-1">
                <Link
                  to={`/profile/${video.user.username}`}
                  className="font-semibold text-gray-900 dark:text-white hover:text-indigo-600"
                >
                  {video.user.firstName} {video.user.lastName}
                </Link>
                <p className="text-sm text-gray-500 dark:text-gray-400">@{video.user.username}</p>
              </div>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors">
                Follow
              </button>
            </div>
          )}

          {/* Description */}
          {video.description && (
            <div className="py-4">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {video.description}
              </p>
            </div>
          )}

          {/* Comments Section Placeholder */}
          <div className="py-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {video.commentsCount} Comments
            </h2>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>Comments coming soon...</p>
            </div>
          </div>
        </div>

        {/* Sidebar - Related Videos */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            More Videos
          </h2>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>Related videos coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Watch;

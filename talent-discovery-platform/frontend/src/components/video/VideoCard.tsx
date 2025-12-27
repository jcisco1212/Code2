import React from 'react';
import { Link } from 'react-router-dom';
import { getUploadUrl } from '../../services/api';

interface VideoCardProps {
  video: {
    id: string;
    title: string;
    thumbnailUrl: string | null;
    duration: number | null;
    views?: number;
    viewsCount?: number;
    likes?: number;
    likesCount?: number;
    aiPerformanceScore?: number | null;
    createdAt: string;
    user?: {
      id: string;
      username: string;
      firstName: string;
      lastName: string;
      displayName?: string;
      profileImageUrl?: string | null;
      avatarUrl?: string | null;
    };
    category?: {
      id: string;
      name: string;
      slug: string;
    };
  };
  featured?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const VideoCard: React.FC<VideoCardProps> = ({ video, featured, size = 'medium' }) => {
  if (!video) return null;

  const views = video.views ?? video.viewsCount ?? 0;
  const userAvatar = video.user?.profileImageUrl || video.user?.avatarUrl;
  const userName = video.user?.displayName ||
    (video.user?.firstName && video.user?.lastName
      ? `${video.user.firstName} ${video.user.lastName}`
      : video.user?.username) || 'Unknown';
  const userInitial = video.user?.firstName?.[0] || video.user?.username?.[0] || '?';

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (count: number | null | undefined) => {
    if (count == null) return '0 views';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M views`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K views`;
    return `${count} views`;
  };

  const timeAgo = (date: string | undefined | null) => {
    if (!date) return '';
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 604800)} weeks ago`;
    if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} months ago`;
    return `${Math.floor(seconds / 31536000)} year${Math.floor(seconds / 31536000) > 1 ? 's' : ''} ago`;
  };

  return (
    <Link
      to={`/watch/${video.id}`}
      className="block group"
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900">
        {video.thumbnailUrl ? (
          <img
            src={getUploadUrl(video.thumbnailUrl) || ''}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            decoding="async"
            style={{ imageRendering: 'auto' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
            <svg className="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Duration Badge - Bottom Right */}
        {video.duration && video.duration > 0 && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 rounded text-white text-xs font-medium">
            {formatDuration(video.duration)}
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      </div>

      {/* Video Info - YouTube Style */}
      <div className="flex gap-3 mt-3">
        {/* Creator Avatar */}
        {video.user && (
          <div className="flex-shrink-0">
            {userAvatar ? (
              <img
                src={getUploadUrl(userAvatar) || ''}
                alt={userName}
                className="w-9 h-9 rounded-full object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold">
                {userInitial}
              </div>
            )}
          </div>
        )}

        {/* Title and Meta */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="font-medium text-sm leading-5 line-clamp-2 text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-200">
            {video.title}
          </h3>

          {/* Creator Name */}
          {video.user && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 hover:text-gray-900 dark:hover:text-gray-200">
              {userName}
            </p>
          )}

          {/* Views and Time */}
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {formatViews(views)} • {timeAgo(video.createdAt)}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default VideoCard;

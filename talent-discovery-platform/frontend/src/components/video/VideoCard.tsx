import React from 'react';
import { Link } from 'react-router-dom';
import { EyeIcon, HeartIcon, ClockIcon, SparklesIcon } from '@heroicons/react/24/outline';
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
    aiPerformanceScore: number | null;
    createdAt: string;
    user?: {
      id: string;
      username: string;
      firstName: string;
      lastName: string;
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
}

const VideoCard: React.FC<VideoCardProps> = ({ video, featured }) => {
  // Early return if video is null/undefined
  if (!video) return null;

  // Handle both naming conventions from API with safe defaults
  const views = video.views ?? video.viewsCount ?? 0;
  const likes = video.likes ?? video.likesCount ?? 0;
  const userAvatar = video.user?.profileImageUrl || video.user?.avatarUrl;
  const userInitial = video.user?.firstName?.[0] || video.user?.username?.[0] || '?';

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (count: number | null | undefined) => {
    if (count == null) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const timeAgo = (date: string | undefined | null) => {
    if (!date) return '';
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-gray-400';
    if (score >= 90) return 'text-green-500';
    if (score >= 75) return 'text-blue-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Link
      to={`/watch/${video.id}`}
      className={`block group ${featured ? 'col-span-1' : ''}`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700">
        {video.thumbnailUrl ? (
          <img
            src={getUploadUrl(video.thumbnailUrl) || ''}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span className="text-4xl">🎬</span>
          </div>
        )}

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 rounded text-white text-xs font-medium">
          {formatDuration(video.duration)}
        </div>

        {/* AI Score badge */}
        {video.aiPerformanceScore && (
          <div className={`absolute top-2 right-2 px-2 py-0.5 bg-black/80 rounded text-xs font-medium flex items-center gap-1 ${getScoreColor(video.aiPerformanceScore)}`}>
            <SparklesIcon className="w-3 h-3" />
            {video.aiPerformanceScore.toFixed(0)}
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-3 flex gap-3">
        {video.user && (
          <div className="flex-shrink-0">
            {userAvatar ? (
              <img
                src={getUploadUrl(userAvatar) || ''}
                alt={video.user.username}
                className="w-9 h-9 rounded-full object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium">
                {userInitial}
              </div>
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm line-clamp-2 group-hover:text-indigo-600 transition-colors">
            {video.title}
          </h3>
          {video.user && (
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {video.user.firstName} {video.user.lastName}
            </p>
          )}
          <div className="flex items-center flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
            {video.category && (
              <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full">
                {video.category.name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <EyeIcon className="w-3.5 h-3.5" />
              {formatViews(views)}
            </span>
            <span className="flex items-center gap-1">
              <HeartIcon className="w-3.5 h-3.5" />
              {formatViews(likes)}
            </span>
            <span>{timeAgo(video.createdAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default VideoCard;

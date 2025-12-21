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
    aiPerformanceScore?: number | null;
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
    if (score >= 90) return 'text-emerald-400';
    if (score >= 75) return 'text-primary-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <Link
      to={`/watch/${video.id}`}
      className={`block group ${featured ? 'col-span-1' : ''}`}
    >
      {/* Glass Card Container */}
      <div className="relative rounded-2xl overflow-hidden
                      bg-white/60 dark:bg-white/5
                      backdrop-blur-md
                      border border-white/50 dark:border-white/10
                      shadow-lg hover:shadow-aurora dark:hover:shadow-aurora
                      transition-all duration-300 hover:-translate-y-1">

        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden">
          {video.thumbnailUrl ? (
            <img
              src={getUploadUrl(video.thumbnailUrl) || ''}
              alt={video.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-500/20 to-accent-500/20">
              <span className="text-5xl">🎬</span>
            </div>
          )}

          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent
                          opacity-0 group-hover:opacity-100 transition-all duration-300" />

          {/* Duration badge - glass style */}
          <div className="absolute bottom-3 right-3 px-2.5 py-1
                          bg-black/60 backdrop-blur-sm rounded-lg
                          text-white text-xs font-medium
                          border border-white/10">
            {formatDuration(video.duration)}
          </div>

          {/* AI Score badge - gradient style */}
          {video.aiPerformanceScore && (
            <div className={`absolute top-3 right-3 px-2.5 py-1
                            bg-gradient-to-r from-primary-600/90 to-accent-600/90 backdrop-blur-sm
                            rounded-lg text-xs font-bold flex items-center gap-1.5
                            border border-white/20 shadow-lg ${getScoreColor(video.aiPerformanceScore)}`}>
              <SparklesIcon className="w-3.5 h-3.5" />
              {video.aiPerformanceScore.toFixed(0)}
            </div>
          )}

          {/* Play button on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="w-14 h-14 rounded-full
                            bg-white/90 dark:bg-white/20 backdrop-blur-md
                            flex items-center justify-center
                            shadow-xl border border-white/50
                            transform scale-90 group-hover:scale-100 transition-transform duration-300">
              <svg className="w-6 h-6 text-primary-600 dark:text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Info section with glass effect */}
        <div className="p-4">
          <div className="flex gap-3">
            {video.user && (
              <div className="flex-shrink-0">
                {userAvatar ? (
                  <img
                    src={getUploadUrl(userAvatar) || ''}
                    alt={video.user.username}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-white/50 dark:ring-white/20"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500
                                  flex items-center justify-center text-white font-semibold
                                  ring-2 ring-white/50 dark:ring-white/20 shadow-lg">
                    {userInitial}
                  </div>
                )}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm line-clamp-2 text-gray-800 dark:text-white
                            group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {video.title}
              </h3>
              {video.user && (
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-0.5">
                  {video.user.firstName} {video.user.lastName}
                </p>
              )}
              <div className="flex items-center flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400 mt-2">
                {video.category && (
                  <span className="px-2.5 py-1
                                  bg-gradient-to-r from-primary-500/10 to-accent-500/10
                                  dark:from-primary-500/20 dark:to-accent-500/20
                                  text-primary-600 dark:text-primary-400
                                  rounded-full font-medium
                                  border border-primary-500/20">
                    {video.category.name}
                  </span>
                )}
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100/80 dark:bg-white/5">
                  <EyeIcon className="w-3.5 h-3.5" />
                  {formatViews(views)}
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100/80 dark:bg-white/5">
                  <HeartIcon className="w-3.5 h-3.5" />
                  {formatViews(likes)}
                </span>
                <span className="text-gray-400">{timeAgo(video.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Gradient accent line at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500
                        opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    </Link>
  );
};

export default VideoCard;

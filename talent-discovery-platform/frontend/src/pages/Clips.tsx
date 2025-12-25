import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { clipsAPI, getUploadUrl } from '../services/api';
import { PlayIcon, EyeIcon, HeartIcon, FireIcon } from '@heroicons/react/24/solid';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface Clip {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  duration: number | null;
  viewsCount: number;
  likesCount: number;
  creator?: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    isVerified: boolean;
  };
}

const formatDuration = (seconds: number | null): string => {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

const Clips: React.FC = () => {
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'trending' | 'recent' | 'popular'>('trending');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchClips = async (pageNum: number, append: boolean = false) => {
    try {
      setLoading(true);
      const response = await clipsAPI.getClips({ page: pageNum, limit: 20, sortBy });
      const newClips = response.data.clips || [];

      if (append) {
        setClips(prev => [...prev, ...newClips]);
      } else {
        setClips(newClips);
      }

      setHasMore(newClips.length === 20);
    } catch (err) {
      console.error('Failed to fetch clips:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchClips(1);
  }, [sortBy]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchClips(nextPage, true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-r from-pink-500 to-violet-500 text-white">
            <PlayIcon className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Clips</h1>
        </div>

        {/* Sort Tabs */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setSortBy('trending')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              sortBy === 'trending'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <FireIcon className="w-4 h-4 inline mr-1" />
            Trending
          </button>
          <button
            onClick={() => setSortBy('recent')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              sortBy === 'recent'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => setSortBy('popular')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              sortBy === 'popular'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Popular
          </button>
        </div>
      </div>

      {/* Clips Grid - Vertical Video Style like TikTok/Reels */}
      {loading && clips.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-xl aspect-[9/16]" />
              <div className="mt-2 h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="mt-1 h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : clips.length === 0 ? (
        <div className="text-center py-20">
          <PlayIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No clips yet</h3>
          <p className="text-gray-500 dark:text-gray-400">
            Be the first to share a clip! Short videos under 60 seconds.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {clips.map((clip) => (
              <Link
                key={clip.id}
                to={`/watch/${clip.id}`}
                className="group relative"
              >
                {/* Thumbnail Container - 9:16 aspect ratio */}
                <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                  {clip.thumbnailUrl ? (
                    <img
                      src={getUploadUrl(clip.thumbnailUrl) || ''}
                      alt={clip.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-500 to-violet-500">
                      <PlayIcon className="w-12 h-12 text-white/80" />
                    </div>
                  )}

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

                  {/* Play button on hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                      <PlayIcon className="w-6 h-6 text-gray-900 ml-1" />
                    </div>
                  </div>

                  {/* Duration Badge */}
                  {clip.duration && (
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 rounded text-xs text-white font-medium">
                      {formatDuration(clip.duration)}
                    </div>
                  )}

                  {/* Stats Overlay */}
                  <div className="absolute bottom-2 left-2 flex items-center gap-2 text-white text-xs">
                    <span className="flex items-center gap-1 bg-black/50 px-1.5 py-0.5 rounded">
                      <EyeIcon className="w-3 h-3" />
                      {formatCount(clip.viewsCount)}
                    </span>
                    <span className="flex items-center gap-1 bg-black/50 px-1.5 py-0.5 rounded">
                      <HeartIcon className="w-3 h-3" />
                      {formatCount(clip.likesCount)}
                    </span>
                  </div>
                </div>

                {/* Title and Creator */}
                <div className="mt-2">
                  <h3 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {clip.title}
                  </h3>
                  {clip.creator && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                      {clip.creator.avatarUrl && (
                        <img
                          src={getUploadUrl(clip.creator.avatarUrl) || ''}
                          alt=""
                          className="w-4 h-4 rounded-full object-cover"
                        />
                      )}
                      <span className="truncate">{clip.creator.displayName || clip.creator.username}</span>
                      {clip.creator.isVerified && (
                        <svg className="w-3 h-3 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center mt-8">
              <button
                onClick={loadMore}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Clips;

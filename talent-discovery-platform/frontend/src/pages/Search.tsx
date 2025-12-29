import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { videosAPI, usersAPI, categoriesAPI, getUploadUrl } from '../services/api';
import toast from 'react-hot-toast';
import {
  FunnelIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

interface Video {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  duration: number;
  viewCount: number;
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

interface User {
  id: string;
  username: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl: string | null;
  bio: string | null;
  followerCount?: number;
  role: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const Search: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [activeTab, setActiveTab] = useState<'videos' | 'creators'>('videos');

  // Results
  const [videos, setVideos] = useState<Video[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    categoryId: searchParams.get('category') || '',
    duration: searchParams.get('duration') || '',
    uploadDate: searchParams.get('date') || '',
    sortBy: searchParams.get('sort') || 'relevance',
    minViews: searchParams.get('minViews') || '',
    maxViews: searchParams.get('maxViews') || ''
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (query) {
      performSearch();
    }
  }, [query, activeTab, filters]);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getCategories();
      setCategories(response.data.categories || []);
    } catch (err) {
      console.error('Failed to fetch categories');
    }
  };

  const performSearch = async () => {
    setLoading(true);
    try {
      if (activeTab === 'videos') {
        const params: any = {
          q: query,
          limit: 24
        };
        if (filters.categoryId) params.categoryId = filters.categoryId;
        if (filters.duration) params.duration = filters.duration;
        if (filters.uploadDate) params.uploadDate = filters.uploadDate;
        if (filters.sortBy) params.sortBy = filters.sortBy;
        if (filters.minViews) params.minViews = filters.minViews;
        if (filters.maxViews) params.maxViews = filters.maxViews;

        const response = await videosAPI.search(query, params);
        setVideos(response.data.videos || []);
      } else {
        const response = await usersAPI.search(query, { limit: 24 });
        setUsers(response.data.users || []);
      }
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));

    // Update URL params
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key === 'categoryId' ? 'category' : key === 'uploadDate' ? 'date' : key, value);
    } else {
      newParams.delete(key === 'categoryId' ? 'category' : key === 'uploadDate' ? 'date' : key);
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setFilters({
      categoryId: '',
      duration: '',
      uploadDate: '',
      sortBy: 'relevance',
      minViews: '',
      maxViews: ''
    });
    const newParams = new URLSearchParams();
    if (query) newParams.set('q', query);
    setSearchParams(newParams);
  };

  const hasActiveFilters = filters.categoryId || filters.duration || filters.uploadDate || filters.sortBy !== 'relevance' || filters.minViews || filters.maxViews;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (count: number | undefined | null) => {
    if (count === undefined || count === null) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {query ? `Search results for "${query}"` : 'Search'}
          </h1>
          {!loading && query && (
            <p className="text-gray-500 mt-1">
              {activeTab === 'videos' ? `${videos.length} videos found` : `${users.length} creators found`}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
            hasActiveFilters
              ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-600 dark:text-indigo-300'
              : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
          } hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors`}
        >
          <AdjustmentsHorizontalIcon className="w-5 h-5" />
          Filters
          {hasActiveFilters && (
            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('videos')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'videos'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Videos
        </button>
        <button
          onClick={() => setActiveTab('creators')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'creators'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Creators
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && activeTab === 'videos' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <select
                value={filters.categoryId}
                onChange={e => handleFilterChange('categoryId', e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration</label>
              <select
                value={filters.duration}
                onChange={e => handleFilterChange('duration', e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="">Any Duration</option>
                <option value="short">Short (&lt; 1 min)</option>
                <option value="medium">Medium (1-5 min)</option>
                <option value="long">Long (&gt; 5 min)</option>
              </select>
            </div>

            {/* Upload Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Upload Date</label>
              <select
                value={filters.uploadDate}
                onChange={e => handleFilterChange('uploadDate', e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="">Any Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={e => handleFilterChange('sortBy', e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="relevance">Relevance</option>
                <option value="views">Most Views</option>
                <option value="date">Newest</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

            {/* Min Views */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Views</label>
              <input
                type="number"
                value={filters.minViews}
                onChange={e => handleFilterChange('minViews', e.target.value)}
                placeholder="0"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Max Views */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Views</label>
              <input
                type="number"
                value={filters.maxViews}
                onChange={e => handleFilterChange('maxViews', e.target.value)}
                placeholder="Unlimited"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          {/* Video Results */}
          {activeTab === 'videos' && (
            <>
              {videos.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
                  <MagnifyingGlassIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No videos found</h2>
                  <p className="text-gray-500 dark:text-gray-400">
                    {query ? 'Try adjusting your search or filters' : 'Enter a search term to find videos'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {videos.map(video => (
                    <Link
                      key={video.id}
                      to={`/watch/${video.id}`}
                      className="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all"
                    >
                      <div className="relative aspect-video">
                        <img
                          src={video.thumbnailUrl ? getUploadUrl(video.thumbnailUrl) || '/placeholder-video.jpg' : '/placeholder-video.jpg'}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                          {formatDuration(video.duration)}
                        </span>
                      </div>
                      <div className="p-3">
                        <div className="flex gap-3">
                          <Link to={`/profile/${video.user.username}`} className="flex-shrink-0">
                            <img
                              src={video.user.avatarUrl ? getUploadUrl(video.user.avatarUrl) || '/default-avatar.png' : '/default-avatar.png'}
                              alt={video.user.displayName}
                              className="w-9 h-9 rounded-full object-cover"
                            />
                          </Link>
                          <div className="min-w-0">
                            <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-indigo-600">
                              {video.title}
                            </h3>
                            <Link
                              to={`/profile/${video.user.username}`}
                              className="text-sm text-gray-500 hover:text-indigo-600"
                              onClick={e => e.stopPropagation()}
                            >
                              {video.user.displayName}
                            </Link>
                            <p className="text-xs text-gray-400">
                              {formatViews(video.viewCount)} views • {formatDate(video.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Creator Results */}
          {activeTab === 'creators' && (
            <>
              {users.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
                  <MagnifyingGlassIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No creators found</h2>
                  <p className="text-gray-500 dark:text-gray-400">
                    {query ? 'Try adjusting your search' : 'Enter a search term to find creators'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {users.map(user => {
                    // Construct display name from firstName + lastName if displayName is not available
                    const displayName = user.displayName ||
                      (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` :
                       user.firstName || user.lastName || user.username);

                    return (
                      <Link
                        key={user.id}
                        to={`/profile/${user.username}`}
                        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all flex items-center gap-4"
                      >
                        <img
                          src={user.avatarUrl ? getUploadUrl(user.avatarUrl) || '/default-avatar.png' : '/default-avatar.png'}
                          alt={displayName}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{displayName}</h3>
                          <p className="text-sm text-gray-500">@{user.username}</p>
                          {user.followerCount !== undefined && user.followerCount > 0 && (
                            <p className="text-sm text-gray-400">{formatViews(user.followerCount)} followers</p>
                          )}
                          {user.bio && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 mt-1">{user.bio}</p>
                          )}
                        </div>
                        {user.role === 'creator' && (
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded">Creator</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Search;

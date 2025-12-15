import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookmarkIcon,
  TrashIcon,
  UserGroupIcon,
  PlayIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

interface BookmarkedTalent {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  category: string;
  aiScore: number;
  followers: number;
  videos: number;
  bookmarkedAt: string;
  notes: string;
}

const AgentBookmarks: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<BookmarkedTalent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'recent' | 'aiScore' | 'name'>('recent');

  useEffect(() => {
    setTimeout(() => {
      setBookmarks([
        { id: '1', username: 'starvoice', displayName: 'Star Voice', avatarUrl: null, category: 'Singing', aiScore: 94, followers: 15420, videos: 24, bookmarkedAt: '2024-12-10', notes: 'Excellent vocal range, potential for recording contract' },
        { id: '4', username: 'comedyking', displayName: 'Comedy King', avatarUrl: null, category: 'Comedy', aiScore: 88, followers: 8900, videos: 32, bookmarkedAt: '2024-12-08', notes: 'Great timing, consider for comedy tour' },
        { id: '6', username: 'magician_x', displayName: 'Magician X', avatarUrl: null, category: 'Magic', aiScore: 85, followers: 3200, videos: 8, bookmarkedAt: '2024-12-05', notes: 'Unique style, good for corporate events' },
        { id: '9', username: 'voicequeen', displayName: 'Voice Queen', avatarUrl: null, category: 'Singing', aiScore: 91, followers: 11200, videos: 19, bookmarkedAt: '2024-12-03', notes: 'Powerful voice, needs more experience' },
        { id: '10', username: 'groovydan', displayName: 'Groovy Dan', avatarUrl: null, category: 'Dancing', aiScore: 89, followers: 9400, videos: 27, bookmarkedAt: '2024-12-01', notes: 'Versatile dancer, good choreography skills' },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const removeBookmark = (id: string, name: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
    toast.success(`Removed ${name} from bookmarks`);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600 bg-green-100 dark:bg-green-900/50';
    if (score >= 80) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/50';
    return 'text-gray-600 bg-gray-100 dark:bg-gray-700';
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const categories = ['all', ...Array.from(new Set(bookmarks.map(b => b.category)))];

  const filteredBookmarks = bookmarks
    .filter(b => filterCategory === 'all' || b.category === filterCategory)
    .filter(b => !searchQuery || b.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || b.username.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'recent') return new Date(b.bookmarkedAt).getTime() - new Date(a.bookmarkedAt).getTime();
      if (sortBy === 'aiScore') return b.aiScore - a.aiScore;
      return a.displayName.localeCompare(b.displayName);
    });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookmarkSolidIcon className="w-8 h-8 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bookmarked Talents</h1>
            <p className="text-gray-600 dark:text-gray-400">{bookmarks.length} talents saved</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search bookmarks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Categories</option>
              {categories.filter(c => c !== 'all').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="recent">Recently Added</option>
              <option value="aiScore">Highest AI Score</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredBookmarks.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
          <BookmarkIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">No bookmarks found</h3>
          <p className="text-gray-500 mt-2">
            {searchQuery || filterCategory !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Start discovering talents to bookmark them'}
          </p>
          <Link
            to="/agent/discover"
            className="inline-block mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Discover Talents
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookmarks.map(talent => (
            <div
              key={talent.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <Link to={`/profile/${talent.username}`} className="flex items-center gap-4 flex-1">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-2xl">{talent.displayName.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white hover:text-indigo-600 truncate">
                        {talent.displayName}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getScoreColor(talent.aiScore)}`}>
                        {talent.aiScore} AI
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">@{talent.username} · {talent.category}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <UserGroupIcon className="w-4 h-4" />
                        {formatNumber(talent.followers)}
                      </span>
                      <span className="flex items-center gap-1">
                        <PlayIcon className="w-4 h-4" />
                        {talent.videos} videos
                      </span>
                    </div>
                  </div>
                </Link>

                <div className="flex items-center gap-4">
                  <div className="text-right hidden lg:block">
                    <p className="text-xs text-gray-500">Bookmarked</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{formatDate(talent.bookmarkedAt)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/profile/${talent.username}`}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
                    >
                      View Profile
                    </Link>
                    <button
                      onClick={() => removeBookmark(talent.id, talent.displayName)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Remove bookmark"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {talent.notes && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Notes:</span> {talent.notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentBookmarks;

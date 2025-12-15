import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  BookmarkIcon,
  UserGroupIcon,
  PlayIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';

interface Talent {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  category: string;
  aiScore: number;
  followers: number;
  videos: number;
  isBookmarked: boolean;
  bio: string;
  topSkills: string[];
}

const categories = [
  { id: 'all', name: 'All Categories', icon: '✨' },
  { id: 'singing', name: 'Singing', icon: '🎤' },
  { id: 'dancing', name: 'Dancing', icon: '💃' },
  { id: 'acting', name: 'Acting', icon: '🎭' },
  { id: 'comedy', name: 'Comedy', icon: '😂' },
  { id: 'music', name: 'Music', icon: '🎵' },
  { id: 'modeling', name: 'Modeling', icon: '📸' },
  { id: 'sports', name: 'Sports', icon: '⚽' },
  { id: 'art', name: 'Art', icon: '🎨' },
  { id: 'magic', name: 'Magic', icon: '🪄' },
];

const AgentDiscover: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'aiScore' | 'followers' | 'recent'>('aiScore');
  const [minScore, setMinScore] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [talents, setTalents] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setTalents([
        { id: '1', username: 'starvoice', displayName: 'Star Voice', avatarUrl: null, category: 'Singing', aiScore: 94, followers: 15420, videos: 24, isBookmarked: true, bio: 'Professional vocalist with 5 years experience', topSkills: ['Vocals', 'Range', 'Stage Presence'] },
        { id: '2', username: 'dancequeen', displayName: 'Dance Queen', avatarUrl: null, category: 'Dancing', aiScore: 91, followers: 12300, videos: 18, isBookmarked: false, bio: 'Contemporary and hip-hop dancer', topSkills: ['Choreography', 'Flexibility', 'Rhythm'] },
        { id: '3', username: 'actorpro', displayName: 'Actor Pro', avatarUrl: null, category: 'Acting', aiScore: 90, followers: 7600, videos: 15, isBookmarked: false, bio: 'Theater trained actor', topSkills: ['Drama', 'Comedy', 'Improv'] },
        { id: '4', username: 'comedyking', displayName: 'Comedy King', avatarUrl: null, category: 'Comedy', aiScore: 88, followers: 8900, videos: 32, isBookmarked: true, bio: 'Stand-up comedian and writer', topSkills: ['Timing', 'Writing', 'Crowd Work'] },
        { id: '5', username: 'musicmaestro', displayName: 'Music Maestro', avatarUrl: null, category: 'Music', aiScore: 87, followers: 5400, videos: 12, isBookmarked: false, bio: 'Multi-instrumentalist producer', topSkills: ['Piano', 'Guitar', 'Production'] },
        { id: '6', username: 'magician_x', displayName: 'Magician X', avatarUrl: null, category: 'Magic', aiScore: 85, followers: 3200, videos: 8, isBookmarked: true, bio: 'Close-up magic specialist', topSkills: ['Sleight of Hand', 'Card Magic', 'Mentalism'] },
        { id: '7', username: 'modelstar', displayName: 'Model Star', avatarUrl: null, category: 'Modeling', aiScore: 83, followers: 9800, videos: 6, isBookmarked: false, bio: 'Fashion and commercial model', topSkills: ['Posing', 'Expression', 'Runway'] },
        { id: '8', username: 'artgenius', displayName: 'Art Genius', avatarUrl: null, category: 'Art', aiScore: 82, followers: 4100, videos: 20, isBookmarked: false, bio: 'Digital and traditional artist', topSkills: ['Digital Art', 'Portraits', 'Animation'] },
      ]);
      setLoading(false);
    }, 500);
  }, [selectedCategory, sortBy, minScore]);

  const toggleBookmark = (id: string) => {
    setTalents(prev => prev.map(t => t.id === id ? { ...t, isBookmarked: !t.isBookmarked } : t));
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

  const filteredTalents = talents
    .filter(t => t.aiScore >= minScore)
    .filter(t => selectedCategory === 'all' || t.category.toLowerCase() === selectedCategory)
    .filter(t => !searchQuery || t.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || t.username.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Discover Talent</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">AI-powered talent discovery</p>
        </div>
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-indigo-600" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {filteredTalents.length} talents found
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search talents by name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="aiScore">Highest AI Score</option>
            <option value="followers">Most Followers</option>
            <option value="recent">Recently Active</option>
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
              showFilters
                ? 'bg-indigo-50 border-indigo-500 text-indigo-600'
                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <AdjustmentsHorizontalIcon className="w-5 h-5" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Minimum AI Score: {minScore}
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={minScore}
                  onChange={e => setMinScore(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
              selectedCategory === cat.id
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-indigo-500'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredTalents.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">No talents found</h3>
          <p className="text-gray-500 mt-2">Try adjusting your filters or search query</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTalents.map(talent => (
            <div
              key={talent.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <Link to={`/profile/${talent.username}`} className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                      <span className="text-white font-bold text-xl">{talent.displayName.charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white hover:text-indigo-600">{talent.displayName}</h3>
                      <p className="text-sm text-gray-500">@{talent.username}</p>
                    </div>
                  </Link>
                  <button
                    onClick={() => toggleBookmark(talent.id)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    {talent.isBookmarked ? (
                      <BookmarkSolidIcon className="w-5 h-5 text-indigo-600" />
                    ) : (
                      <BookmarkIcon className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{talent.bio}</p>

                <div className="flex flex-wrap gap-1 mb-4">
                  {talent.topSkills.map((skill, i) => (
                    <span key={i} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded text-xs">
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <UserGroupIcon className="w-4 h-4" />
                      {formatNumber(talent.followers)}
                    </span>
                    <span className="flex items-center gap-1">
                      <PlayIcon className="w-4 h-4" />
                      {talent.videos}
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(talent.aiScore)}`}>
                    {talent.aiScore} AI
                  </span>
                </div>
              </div>

              <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{talent.category}</span>
                <Link
                  to={`/profile/${talent.username}`}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  View Profile →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentDiscover;

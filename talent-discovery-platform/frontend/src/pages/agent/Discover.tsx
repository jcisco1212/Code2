import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  BookmarkIcon,
  UserGroupIcon,
  PlayIcon,
  SparklesIcon,
  MapPinIcon,
  XMarkIcon
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
  location: string | null;
  age: number | null;
  gender: string | null;
  ethnicity: string | null;
  hairColor: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface Filters {
  search: string;
  category: string;
  gender: string;
  minAge: string;
  maxAge: string;
  ethnicity: string;
  hairColor: string;
  location: string;
  minScore: number;
  sortBy: 'aiScore' | 'followers' | 'recent';
}

const genderOptions = [
  { value: 'all', label: 'All Genders' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' }
];

const ethnicityOptions = [
  { value: 'all', label: 'All Ethnicities' },
  { value: 'african american', label: 'African American' },
  { value: 'asian', label: 'Asian' },
  { value: 'caucasian', label: 'Caucasian' },
  { value: 'hispanic', label: 'Hispanic/Latino' },
  { value: 'middle eastern', label: 'Middle Eastern' },
  { value: 'native american', label: 'Native American' },
  { value: 'pacific islander', label: 'Pacific Islander' },
  { value: 'mixed', label: 'Mixed/Multiracial' },
  { value: 'other', label: 'Other' }
];

const hairColorOptions = [
  { value: 'all', label: 'All Hair Colors' },
  { value: 'black', label: 'Black' },
  { value: 'brown', label: 'Brown' },
  { value: 'blonde', label: 'Blonde' },
  { value: 'red', label: 'Red' },
  { value: 'auburn', label: 'Auburn' },
  { value: 'gray', label: 'Gray' },
  { value: 'white', label: 'White' },
  { value: 'bald', label: 'Bald' },
  { value: 'other', label: 'Other' }
];

const ageRangeOptions = [
  { minAge: '', maxAge: '', label: 'Any Age' },
  { minAge: '18', maxAge: '25', label: '18-25' },
  { minAge: '26', maxAge: '35', label: '26-35' },
  { minAge: '36', maxAge: '45', label: '36-45' },
  { minAge: '46', maxAge: '55', label: '46-55' },
  { minAge: '56', maxAge: '', label: '56+' }
];

const AgentDiscover: React.FC = () => {
  const [talents, setTalents] = useState<Talent[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    category: 'all',
    gender: 'all',
    minAge: '',
    maxAge: '',
    ethnicity: 'all',
    hairColor: 'all',
    location: '',
    minScore: 0,
    sortBy: 'aiScore'
  });

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(response.data.categories || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch talents when filters change
  const fetchTalents = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.search) params.append('search', filters.search);
      if (filters.category !== 'all') params.append('category', filters.category);
      if (filters.gender !== 'all') params.append('gender', filters.gender);
      if (filters.minAge) params.append('minAge', filters.minAge);
      if (filters.maxAge) params.append('maxAge', filters.maxAge);
      if (filters.ethnicity !== 'all') params.append('ethnicity', filters.ethnicity);
      if (filters.hairColor !== 'all') params.append('hairColor', filters.hairColor);
      if (filters.location) params.append('location', filters.location);
      if (filters.minScore > 0) params.append('minScore', filters.minScore.toString());
      params.append('sortBy', filters.sortBy);
      params.append('limit', '20');

      const response = await api.get(`/agents/discover?${params.toString()}`);
      setTalents(response.data.talents || []);
      setTotalResults(response.data.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching talents:', error);
      setTalents([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchTalents();
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [fetchTalents]);

  const toggleBookmark = async (talentId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const talent = talents.find(t => t.id === talentId);
    if (!talent) return;

    try {
      if (talent.isBookmarked) {
        await api.delete(`/agents/bookmarks/${talentId}`);
      } else {
        await api.post('/agents/bookmarks', { talentId });
      }
      setTalents(prev => prev.map(t =>
        t.id === talentId ? { ...t, isBookmarked: !t.isBookmarked } : t
      ));
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
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

  const clearFilters = () => {
    setFilters({
      search: '',
      category: 'all',
      gender: 'all',
      minAge: '',
      maxAge: '',
      ethnicity: 'all',
      hairColor: 'all',
      location: '',
      minScore: 0,
      sortBy: 'aiScore'
    });
  };

  const hasActiveFilters = filters.category !== 'all' ||
    filters.gender !== 'all' ||
    filters.minAge !== '' ||
    filters.maxAge !== '' ||
    filters.ethnicity !== 'all' ||
    filters.hairColor !== 'all' ||
    filters.location !== '' ||
    filters.minScore > 0;

  const setAgeRange = (minAge: string, maxAge: string) => {
    setFilters(prev => ({ ...prev, minAge, maxAge }));
  };

  const getCurrentAgeRangeLabel = () => {
    const range = ageRangeOptions.find(
      r => r.minAge === filters.minAge && r.maxAge === filters.maxAge
    );
    return range?.label || 'Custom';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Discover Talent</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">AI-powered talent discovery with advanced filters</p>
        </div>
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-indigo-600" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {totalResults} talents found
          </span>
        </div>
      </div>

      {/* Search and Quick Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search talents by name..."
              value={filters.search}
              onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={filters.sortBy}
            onChange={e => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
            className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="aiScore">Highest AI Score</option>
            <option value="followers">Most Followers</option>
            <option value="recent">Recently Active</option>
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 text-indigo-600'
                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <AdjustmentsHorizontalIcon className="w-5 h-5" />
            Filters
            {hasActiveFilters && (
              <span className="bg-indigo-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                !
              </span>
            )}
          </button>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 dark:text-white">Advanced Filters</h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <XMarkIcon className="w-4 h-4" />
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Gender
                </label>
                <select
                  value={filters.gender}
                  onChange={e => setFilters(prev => ({ ...prev, gender: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  {genderOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Age Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Age Range
                </label>
                <select
                  value={`${filters.minAge}-${filters.maxAge}`}
                  onChange={e => {
                    const [min, max] = e.target.value.split('-');
                    setAgeRange(min || '', max || '');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  {ageRangeOptions.map((opt, idx) => (
                    <option key={idx} value={`${opt.minAge}-${opt.maxAge}`}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Ethnicity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Ethnicity
                </label>
                <select
                  value={filters.ethnicity}
                  onChange={e => setFilters(prev => ({ ...prev, ethnicity: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  {ethnicityOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Hair Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Hair Color
                </label>
                <select
                  value={filters.hairColor}
                  onChange={e => setFilters(prev => ({ ...prev, hairColor: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  {hairColorOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Location
                </label>
                <div className="relative">
                  <MapPinIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="City, State, or Country"
                    value={filters.location}
                    onChange={e => setFilters(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={e => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Minimum AI Score */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Minimum AI Score: {filters.minScore}
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.minScore}
                  onChange={e => setFilters(prev => ({ ...prev, minScore: Number(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filters.gender !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm">
              Gender: {genderOptions.find(o => o.value === filters.gender)?.label}
              <button onClick={() => setFilters(prev => ({ ...prev, gender: 'all' }))} className="hover:text-indigo-900">
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {(filters.minAge || filters.maxAge) && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm">
              Age: {getCurrentAgeRangeLabel()}
              <button onClick={() => setAgeRange('', '')} className="hover:text-indigo-900">
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {filters.ethnicity !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm">
              Ethnicity: {ethnicityOptions.find(o => o.value === filters.ethnicity)?.label}
              <button onClick={() => setFilters(prev => ({ ...prev, ethnicity: 'all' }))} className="hover:text-indigo-900">
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {filters.hairColor !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm">
              Hair: {hairColorOptions.find(o => o.value === filters.hairColor)?.label}
              <button onClick={() => setFilters(prev => ({ ...prev, hairColor: 'all' }))} className="hover:text-indigo-900">
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {filters.location && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm">
              Location: {filters.location}
              <button onClick={() => setFilters(prev => ({ ...prev, location: '' }))} className="hover:text-indigo-900">
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {filters.category !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm">
              Category: {categories.find(c => c.id === filters.category)?.name}
              <button onClick={() => setFilters(prev => ({ ...prev, category: 'all' }))} className="hover:text-indigo-900">
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {filters.minScore > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm">
              Min Score: {filters.minScore}+
              <button onClick={() => setFilters(prev => ({ ...prev, minScore: 0 }))} className="hover:text-indigo-900">
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : talents.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">No talents found</h3>
          <p className="text-gray-500 mt-2">Try adjusting your filters or search query</p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {talents.map(talent => (
            <div
              key={talent.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <Link to={`/profile/${talent.username}`} className="flex items-center gap-3">
                    {talent.avatarUrl ? (
                      <img
                        src={talent.avatarUrl}
                        alt={talent.displayName}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                        <span className="text-white font-bold text-xl">{talent.displayName.charAt(0)}</span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white hover:text-indigo-600">{talent.displayName}</h3>
                      <p className="text-sm text-gray-500">@{talent.username}</p>
                    </div>
                  </Link>
                  <button
                    onClick={(e) => toggleBookmark(talent.id, e)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    {talent.isBookmarked ? (
                      <BookmarkSolidIcon className="w-5 h-5 text-indigo-600" />
                    ) : (
                      <BookmarkIcon className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>

                {talent.bio && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{talent.bio}</p>
                )}

                {/* Talent Details */}
                <div className="flex flex-wrap gap-2 mb-3 text-xs text-gray-500 dark:text-gray-400">
                  {talent.age && (
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                      {talent.age} years old
                    </span>
                  )}
                  {talent.gender && (
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded capitalize">
                      {talent.gender}
                    </span>
                  )}
                  {talent.location && (
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded flex items-center gap-1">
                      <MapPinIcon className="w-3 h-3" />
                      {talent.location}
                    </span>
                  )}
                </div>

                {talent.topSkills && talent.topSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {talent.topSkills.map((skill, i) => (
                      <span key={i} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

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
                  {talent.aiScore > 0 && (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(talent.aiScore)}`}>
                      {talent.aiScore} AI
                    </span>
                  )}
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

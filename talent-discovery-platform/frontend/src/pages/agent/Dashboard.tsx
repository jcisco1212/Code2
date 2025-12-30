import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import {
  MagnifyingGlassIcon,
  BookmarkIcon,
  ChatBubbleLeftRightIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  EyeIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

interface TalentCard {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  category: string;
  aiScore: number;
  followers: number;
  videos?: number;
  isBookmarked: boolean;
}

interface StatData {
  total: number;
  change: number;
  label: string;
}

interface DashboardStats {
  talentsDiscovered: StatData;
  bookmarked: StatData;
  messagesSent: StatData;
  talentViews: StatData;
}

const AgentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [trendingTalents, setTrendingTalents] = useState<TalentCard[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<TalentCard[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch all dashboard data in parallel
        const [statsRes, trendingRes, recentRes] = await Promise.all([
          api.get('/agents/dashboard/stats'),
          api.get('/agents/dashboard/trending'),
          api.get('/agents/dashboard/recently-viewed')
        ]);

        setDashboardStats(statsRes.data.stats);
        setTrendingTalents(trendingRes.data.trendingTalents || []);
        setRecentlyViewed(recentRes.data.recentlyViewed || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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

  const stats = dashboardStats ? [
    {
      label: dashboardStats.talentsDiscovered.label,
      value: dashboardStats.talentsDiscovered.total,
      change: `+${dashboardStats.talentsDiscovered.change} this week`,
      icon: UserGroupIcon,
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
      iconColor: 'text-indigo-600'
    },
    {
      label: dashboardStats.bookmarked.label,
      value: dashboardStats.bookmarked.total,
      change: `+${dashboardStats.bookmarked.change} this week`,
      icon: BookmarkIcon,
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600'
    },
    {
      label: dashboardStats.messagesSent.label,
      value: dashboardStats.messagesSent.total,
      change: `+${dashboardStats.messagesSent.change} this week`,
      icon: ChatBubbleLeftRightIcon,
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600'
    },
    {
      label: dashboardStats.talentViews.label,
      value: formatNumber(dashboardStats.talentViews.total),
      change: `+${formatNumber(dashboardStats.talentViews.change)} this week`,
      icon: EyeIcon,
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600'
    },
  ] : [
    { label: 'Talents Discovered', value: 0, change: '+0 this week', icon: UserGroupIcon, bgColor: 'bg-indigo-100 dark:bg-indigo-900/30', iconColor: 'text-indigo-600' },
    { label: 'Bookmarked', value: 0, change: '+0 this week', icon: BookmarkIcon, bgColor: 'bg-purple-100 dark:bg-purple-900/30', iconColor: 'text-purple-600' },
    { label: 'Messages Sent', value: 0, change: '+0 this week', icon: ChatBubbleLeftRightIcon, bgColor: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600' },
    { label: 'Talent Views', value: 0, change: '+0 this week', icon: EyeIcon, bgColor: 'bg-green-100 dark:bg-green-900/30', iconColor: 'text-green-600' },
  ];

  const bookmarkCount = dashboardStats?.bookmarked.total || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.firstName || 'Agent'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Discover and connect with rising talents
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                <p className="text-xs text-green-600 mt-1">{stat.change}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link
          to="/agent/discover"
          className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-white hover:from-indigo-600 hover:to-purple-700 transition-all"
        >
          <MagnifyingGlassIcon className="w-8 h-8" />
          <div>
            <h3 className="font-semibold">Discover Talent</h3>
            <p className="text-sm text-indigo-100">AI-powered search</p>
          </div>
        </Link>
        <Link
          to="/agent/bookmarks"
          className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-500 transition-colors"
        >
          <BookmarkIcon className="w-8 h-8 text-indigo-600" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">My Bookmarks</h3>
            <p className="text-sm text-gray-500">{bookmarkCount} saved talents</p>
          </div>
        </Link>
        <Link
          to="/agent/messages"
          className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-500 transition-colors"
        >
          <ChatBubbleLeftRightIcon className="w-8 h-8 text-indigo-600" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Messages</h3>
            <p className="text-sm text-gray-500">View conversations</p>
          </div>
        </Link>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ArrowTrendingUpIcon className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Trending Talents</h2>
          </div>
          <Link to="/agent/discover" className="text-sm text-indigo-600 hover:text-indigo-700">
            View all
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : trendingTalents.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
            <ArrowTrendingUpIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No trending talents yet</p>
            <p className="text-sm text-gray-400 mt-1">Check back soon for AI-scored rising talent</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {trendingTalents.map(talent => (
              <Link
                key={talent.id}
                to={`/profile/${talent.username}`}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  {talent.avatarUrl ? (
                    <img
                      src={talent.avatarUrl}
                      alt={talent.displayName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                      <span className="text-white font-bold">{talent.displayName.charAt(0)}</span>
                    </div>
                  )}
                  {talent.aiScore > 0 && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(talent.aiScore)}`}>
                      {talent.aiScore} AI
                    </span>
                  )}
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white">{talent.displayName}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">@{talent.username}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <UserGroupIcon className="w-3 h-3" />
                    {formatNumber(talent.followers)}
                  </span>
                  {talent.videos !== undefined && (
                    <span className="flex items-center gap-1">
                      <PlayIcon className="w-3 h-3" />
                      {talent.videos} videos
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <span className="inline-block px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300">
                    {talent.category}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <EyeIcon className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recently Viewed</h2>
        </div>

        {recentlyViewed.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
            <EyeIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No recently viewed profiles</p>
            <p className="text-sm text-gray-400 mt-1">Profiles you view will appear here</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            {recentlyViewed.map((talent, index) => (
              <Link
                key={talent.id}
                to={`/profile/${talent.username}`}
                className={`flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                  index !== recentlyViewed.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  {talent.avatarUrl ? (
                    <img
                      src={talent.avatarUrl}
                      alt={talent.displayName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{talent.displayName.charAt(0)}</span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{talent.displayName}</h3>
                    <p className="text-sm text-gray-500">@{talent.username} · {talent.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {talent.aiScore > 0 && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(talent.aiScore)}`}>
                      {talent.aiScore} AI
                    </span>
                  )}
                  <span className="text-sm text-gray-500 hidden sm:block">{formatNumber(talent.followers)} followers</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentDashboard;

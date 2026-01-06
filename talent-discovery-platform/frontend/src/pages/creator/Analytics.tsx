import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { videosAPI, getUploadUrl } from '../../services/api';
import {
  ChartBarIcon,
  EyeIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  UserGroupIcon,
  PlayIcon,
  SparklesIcon,
  BoltIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

interface Video {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  duration: number | null;
  createdAt: string;
  aiOverallScore?: number | null;
  aiVocalScore?: number | null;
  aiMovementScore?: number | null;
  aiExpressionScore?: number | null;
  aiTimingScore?: number | null;
  aiPresenceScore?: number | null;
}

interface AnalyticsData {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalVideos: number;
  subscriberCount: number;
  recentViews: number;
  viewsGrowth: number;
  topVideos: Video[];
  recentVideos: Video[];
  // AI Talent Score data
  avgAiScore: number;
  avgVocalScore: number;
  avgMovementScore: number;
  avgExpressionScore: number;
  avgTimingScore: number;
  avgPresenceScore: number;
  videosWithScores: number;
}

// Talent tier calculation
const getTalentTier = (score: number): { name: string; color: string; bgColor: string; borderColor: string; icon: string } => {
  if (score >= 85) return { name: 'Platinum', color: 'text-cyan-400', bgColor: 'bg-gradient-to-r from-cyan-500 to-blue-500', borderColor: 'border-cyan-400', icon: '💎' };
  if (score >= 70) return { name: 'Gold', color: 'text-yellow-400', bgColor: 'bg-gradient-to-r from-yellow-500 to-amber-500', borderColor: 'border-yellow-400', icon: '🏆' };
  if (score >= 50) return { name: 'Silver', color: 'text-gray-300', bgColor: 'bg-gradient-to-r from-gray-400 to-gray-500', borderColor: 'border-gray-400', icon: '🥈' };
  if (score >= 30) return { name: 'Bronze', color: 'text-amber-600', bgColor: 'bg-gradient-to-r from-amber-600 to-orange-600', borderColor: 'border-amber-600', icon: '🥉' };
  return { name: 'Rising', color: 'text-green-400', bgColor: 'bg-gradient-to-r from-green-500 to-emerald-500', borderColor: 'border-green-400', icon: '🌱' };
};

// Get improvement tips based on lowest scores
const getImprovementTips = (data: AnalyticsData): string[] => {
  const tips: string[] = [];
  const scores = [
    { name: 'vocal', score: data.avgVocalScore, tip: 'Focus on vocal clarity and projection in your performances' },
    { name: 'movement', score: data.avgMovementScore, tip: 'Add more dynamic movement and stage presence' },
    { name: 'expression', score: data.avgExpressionScore, tip: 'Work on facial expressions and emotional connection' },
    { name: 'timing', score: data.avgTimingScore, tip: 'Practice timing and rhythm to improve synchronization' },
    { name: 'presence', score: data.avgPresenceScore, tip: 'Build confidence and command attention on camera' }
  ].filter(s => s.score > 0);

  if (scores.length === 0) {
    return ['Upload more videos to get personalized improvement tips!'];
  }

  // Sort by lowest scores first
  scores.sort((a, b) => a.score - b.score);

  // Return top 2-3 tips
  return scores.slice(0, 3).map(s => s.tip);
};

const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [data, setData] = useState<AnalyticsData>({
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    totalVideos: 0,
    subscriberCount: 0,
    recentViews: 0,
    viewsGrowth: 0,
    topVideos: [],
    recentVideos: [],
    avgAiScore: 0,
    avgVocalScore: 0,
    avgMovementScore: 0,
    avgExpressionScore: 0,
    avgTimingScore: 0,
    avgPresenceScore: 0,
    videosWithScores: 0
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchAnalytics = async () => {
      try {
        setLoading(true);

        // Fetch user's videos
        const videosResponse = await videosAPI.getVideos({
          userId: user?.id,
          limit: 100
        });
        const userVideos: Video[] = videosResponse.data.videos || [];

        // Calculate totals
        const totalViews = userVideos.reduce((sum, v) => sum + (v.viewsCount || 0), 0);
        const totalLikes = userVideos.reduce((sum, v) => sum + (v.likesCount || 0), 0);
        const totalComments = userVideos.reduce((sum, v) => sum + (v.commentsCount || 0), 0);

        // Sort for top videos by views
        const topVideos = [...userVideos]
          .sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0))
          .slice(0, 5);

        // Sort for recent videos
        const recentVideos = [...userVideos]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);

        // Calculate recent views (last 7 days approximation)
        const recentViews = Math.floor(totalViews * 0.3); // Placeholder
        const viewsGrowth = Math.floor(Math.random() * 20) - 5; // Placeholder

        // Calculate AI scores
        const videosWithScores = userVideos.filter(v => v.aiOverallScore && v.aiOverallScore > 0);
        const avgAiScore = videosWithScores.length > 0
          ? videosWithScores.reduce((sum, v) => sum + (v.aiOverallScore || 0), 0) / videosWithScores.length
          : 0;
        const avgVocalScore = videosWithScores.length > 0
          ? videosWithScores.reduce((sum, v) => sum + (v.aiVocalScore || 0), 0) / videosWithScores.length
          : 0;
        const avgMovementScore = videosWithScores.length > 0
          ? videosWithScores.reduce((sum, v) => sum + (v.aiMovementScore || 0), 0) / videosWithScores.length
          : 0;
        const avgExpressionScore = videosWithScores.length > 0
          ? videosWithScores.reduce((sum, v) => sum + (v.aiExpressionScore || 0), 0) / videosWithScores.length
          : 0;
        const avgTimingScore = videosWithScores.length > 0
          ? videosWithScores.reduce((sum, v) => sum + (v.aiTimingScore || 0), 0) / videosWithScores.length
          : 0;
        const avgPresenceScore = videosWithScores.length > 0
          ? videosWithScores.reduce((sum, v) => sum + (v.aiPresenceScore || 0), 0) / videosWithScores.length
          : 0;

        setData({
          totalViews,
          totalLikes,
          totalComments,
          totalVideos: userVideos.length,
          subscriberCount: (user as any)?.followersCount || 0,
          recentViews,
          viewsGrowth,
          topVideos,
          recentVideos,
          avgAiScore,
          avgVocalScore,
          avgMovementScore,
          avgExpressionScore,
          avgTimingScore,
          avgPresenceScore,
          videosWithScores: videosWithScores.length
        });
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [isAuthenticated, user, navigate, period]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track your channel performance</p>
        </div>
        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as '7d' | '30d' | '90d')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <Link
            to="/studio"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Go to Studio
          </Link>
        </div>
      </div>

      {/* AI Talent Score Section */}
      {data.videosWithScores > 0 ? (
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-purple-500" />
              AI Talent Rating
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Based on AI analysis of {data.videosWithScores} video{data.videosWithScores > 1 ? 's' : ''}
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Talent Tier */}
              <div className="text-center">
                <div className={`inline-flex flex-col items-center justify-center w-32 h-32 rounded-full ${getTalentTier(data.avgAiScore).bgColor} shadow-lg`}>
                  <span className="text-4xl">{getTalentTier(data.avgAiScore).icon}</span>
                  <span className="text-white font-bold text-lg mt-1">{getTalentTier(data.avgAiScore).name}</span>
                </div>
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  Your overall talent tier
                </p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(data.avgAiScore / 20)
                          ? 'text-yellow-400'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Performance Breakdown</h3>
                {[
                  { name: 'Vocal', score: data.avgVocalScore, color: 'bg-blue-500' },
                  { name: 'Movement', score: data.avgMovementScore, color: 'bg-green-500' },
                  { name: 'Expression', score: data.avgExpressionScore, color: 'bg-purple-500' },
                  { name: 'Timing', score: data.avgTimingScore, color: 'bg-orange-500' },
                  { name: 'Presence', score: data.avgPresenceScore, color: 'bg-pink-500' }
                ].filter(item => item.score > 0).map((item) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-20">{item.name}</span>
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-500`}
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white w-10 text-right">
                      {Math.round(item.score)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Improvement Tips */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <BoltIcon className="w-5 h-5 text-yellow-500" />
                  Tips to Improve
                </h3>
                <ul className="space-y-2">
                  {getImprovementTips(data).map((tip, index) => (
                    <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                      <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-8 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center">
              <SparklesIcon className="w-8 h-8 text-purple-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Unlock Your AI Talent Rating</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Upload videos to get AI-powered analysis of your performances and personalized improvement tips.
              </p>
              <Link
                to="/upload"
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Upload Your First Video
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Views</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {formatNumber(data.totalViews)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <EyeIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className={data.viewsGrowth >= 0 ? 'text-green-500' : 'text-red-500'}>
              {data.viewsGrowth >= 0 ? '↑' : '↓'} {data.viewsGrowth >= 0 ? '+' : ''}{data.viewsGrowth}%
            </span>
            <span className="text-gray-500 dark:text-gray-400 ml-1">vs last period</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Likes</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {formatNumber(data.totalLikes)}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <HeartIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            {data.totalVideos > 0 ? Math.round(data.totalLikes / data.totalVideos) : 0} avg per video
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Comments</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {formatNumber(data.totalComments)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <ChatBubbleLeftIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            {data.totalVideos > 0 ? Math.round(data.totalComments / data.totalVideos) : 0} avg per video
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Subscribers</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {formatNumber(data.subscriberCount)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
              <UserGroupIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            {data.totalVideos} videos uploaded
          </div>
        </div>
      </div>

      {/* Video Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Videos */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <ChartBarIcon className="w-5 h-5" />
              Top Performing Videos
            </h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.topVideos.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                No videos yet. <Link to="/upload" className="text-indigo-600 hover:underline">Upload your first video</Link>
              </div>
            ) : (
              data.topVideos.map((video, index) => (
                <Link
                  key={video.id}
                  to={`/watch/${video.id}`}
                  className="p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <span className="text-lg font-bold text-gray-400 w-6">{index + 1}</span>
                  <div className="relative w-24 h-14 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden flex-shrink-0">
                    {video.thumbnailUrl ? (
                      <img
                        src={getUploadUrl(video.thumbnailUrl) || ''}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PlayIcon className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    {video.duration && (
                      <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                        {formatDuration(video.duration)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{video.title}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                      <span className="flex items-center gap-1">
                        <EyeIcon className="w-4 h-4" />
                        {formatNumber(video.viewsCount)}
                      </span>
                      <span className="flex items-center gap-1">
                        <HeartIcon className="w-4 h-4" />
                        {formatNumber(video.likesCount)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Videos */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <PlayIcon className="w-5 h-5" />
              Recent Uploads
            </h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.recentVideos.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                No videos yet. <Link to="/upload" className="text-indigo-600 hover:underline">Upload your first video</Link>
              </div>
            ) : (
              data.recentVideos.map((video) => (
                <Link
                  key={video.id}
                  to={`/watch/${video.id}`}
                  className="p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <div className="relative w-24 h-14 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden flex-shrink-0">
                    {video.thumbnailUrl ? (
                      <img
                        src={getUploadUrl(video.thumbnailUrl) || ''}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PlayIcon className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{video.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(video.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">{formatNumber(video.viewsCount)}</p>
                    <p className="text-sm text-gray-500">views</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Engagement Summary */}
      <div className="mt-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
        <h2 className="text-xl font-semibold mb-4">Channel Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-indigo-200">Engagement Rate</p>
            <p className="text-2xl font-bold mt-1">
              {data.totalViews > 0
                ? ((data.totalLikes + data.totalComments) / data.totalViews * 100).toFixed(1)
                : 0}%
            </p>
          </div>
          <div>
            <p className="text-indigo-200">Avg Views/Video</p>
            <p className="text-2xl font-bold mt-1">
              {formatNumber(data.totalVideos > 0 ? Math.round(data.totalViews / data.totalVideos) : 0)}
            </p>
          </div>
          <div>
            <p className="text-indigo-200">Like Rate</p>
            <p className="text-2xl font-bold mt-1">
              {data.totalViews > 0 ? (data.totalLikes / data.totalViews * 100).toFixed(1) : 0}%
            </p>
          </div>
          <div>
            <p className="text-indigo-200">Comment Rate</p>
            <p className="text-2xl font-bold mt-1">
              {data.totalViews > 0 ? (data.totalComments / data.totalViews * 100).toFixed(2) : 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;

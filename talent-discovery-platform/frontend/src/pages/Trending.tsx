import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchTrendingVideos } from '../store/slices/videosSlice';
import VideoCard from '../components/video/VideoCard';
import { FireIcon, SparklesIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const Trending: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { trendingVideos, isLoading } = useSelector((state: RootState) => state.videos);
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  useEffect(() => {
    dispatch(fetchTrendingVideos(24));
  }, [dispatch, filter]);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
      {/* Header Section - Glass Card */}
      <div className="relative overflow-hidden rounded-3xl mb-10
                      bg-gradient-to-r from-red-500/90 via-orange-500/90 to-pink-500/90
                      shadow-xl">
        {/* Background effects */}
        <div className="absolute inset-0 bg-aurora-mesh-dark opacity-30" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/20 rounded-full blur-3xl" />

        <div className="relative z-10 p-8 lg:p-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm
                            flex items-center justify-center shadow-lg">
              <FireIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white">
                Trending Now
              </h1>
              <p className="text-white/80 mt-1">
                Discover what's hot right now
              </p>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex flex-wrap gap-2 mt-6">
            {[
              { key: 'all', label: 'All Time' },
              { key: 'today', label: 'Today' },
              { key: 'week', label: 'This Week' },
              { key: 'month', label: 'This Month' }
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key as typeof filter)}
                className={`px-5 py-2.5 rounded-full font-medium transition-all duration-300
                          ${filter === item.key
                            ? 'bg-white text-red-600 shadow-lg'
                            : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
                          }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { icon: FireIcon, label: 'Trending Videos', value: trendingVideos.length.toString(), color: 'from-red-500 to-orange-500' },
          { icon: SparklesIcon, label: 'Rising Stars', value: '12', color: 'from-primary-500 to-secondary-500' },
          { icon: ChartBarIcon, label: 'Total Views Today', value: '1.2M', color: 'from-green-500 to-emerald-500' },
          { icon: FireIcon, label: 'Active Creators', value: '856', color: 'from-purple-500 to-pink-500' }
        ].map((stat, i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-2xl
                       bg-white/60 dark:bg-white/5
                       backdrop-blur-md
                       border border-white/50 dark:border-white/10
                       p-5 shadow-lg"
          >
            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.color} opacity-20 rounded-full blur-2xl`} />
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} mb-3`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Videos Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-video bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl mb-3" />
              <div className="h-4 bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-xl mb-2" />
              <div className="h-3 bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-xl w-2/3" />
            </div>
          ))}
        </div>
      ) : trendingVideos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {trendingVideos.map((video: any, index: number) => (
            <div key={video.id} className="relative">
              {/* Rank badge for top 3 */}
              {index < 3 && (
                <div className={`absolute -top-2 -left-2 z-10 w-8 h-8 rounded-full flex items-center justify-center
                               font-bold text-sm shadow-lg
                               ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                                 index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                                 'bg-gradient-to-br from-amber-600 to-amber-800 text-white'}`}>
                  #{index + 1}
                </div>
              )}
              <VideoCard video={video} featured={index < 3} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl
                          bg-gradient-to-br from-red-500/20 to-orange-500/20
                          backdrop-blur-sm mb-6">
            <FireIcon className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            No trending videos yet
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Be the first to create viral content and get featured here!
          </p>
        </div>
      )}
    </div>
  );
};

export default Trending;

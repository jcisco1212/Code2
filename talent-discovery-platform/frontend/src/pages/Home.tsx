import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchTrendingVideos, fetchFeaturedVideos } from '../store/slices/videosSlice';
import VideoCard from '../components/video/VideoCard';
import { FireIcon, SparklesIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const Home: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { trendingVideos, featuredVideos, isLoading } = useSelector(
    (state: RootState) => state.videos
  );

  useEffect(() => {
    dispatch(fetchTrendingVideos(12));
    dispatch(fetchFeaturedVideos(6));
  }, [dispatch]);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
      {/* Hero Section */}
      <section className="mb-12 rounded-2xl bg-gradient-primary p-8 lg:p-12 text-white">
        <div className="max-w-2xl">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">
            Showcase Your Talent to the World
          </h1>
          <p className="text-lg opacity-90 mb-6">
            Join thousands of singers, actors, dancers, and comedians who are getting
            discovered by entertainment agents through AI-powered talent ranking.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/register"
              className="px-6 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Start Creating
            </Link>
            <Link
              to="/trending"
              className="px-6 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Explore Talents
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Videos */}
      {featuredVideos.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-6 h-6 text-yellow-500" />
              <h2 className="text-2xl font-bold">Featured</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredVideos.slice(0, 6).map((video: any) => (
              <VideoCard key={video.id} video={video} featured />
            ))}
          </div>
        </section>
      )}

      {/* Trending Videos */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <FireIcon className="w-6 h-6 text-red-500" />
            <h2 className="text-2xl font-bold">Trending</h2>
          </div>
          <Link
            to="/trending"
            className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700"
          >
            See all <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-lg aspect-video mb-3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingVideos.slice(0, 12).map((video: any) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </section>

      {/* Categories */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Browse by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { name: 'Singers', slug: 'singer', color: 'from-pink-500 to-rose-500', icon: '🎤' },
            { name: 'Actors', slug: 'actor', color: 'from-purple-500 to-indigo-500', icon: '🎭' },
            { name: 'Dancers', slug: 'dancer', color: 'from-blue-500 to-cyan-500', icon: '💃' },
            { name: 'Comedians', slug: 'comedian', color: 'from-yellow-500 to-orange-500', icon: '😂' },
            { name: 'Voice Over', slug: 'voice-over', color: 'from-green-500 to-teal-500', icon: '🎙️' }
          ].map((category) => (
            <Link
              key={category.slug}
              to={`/category/${category.slug}`}
              className={`relative overflow-hidden rounded-xl p-6 bg-gradient-to-br ${category.color} text-white hover:scale-105 transition-transform`}
            >
              <div className="text-3xl mb-2">{category.icon}</div>
              <div className="font-semibold">{category.name}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA for Agents */}
      <section className="rounded-2xl bg-gray-900 dark:bg-gray-800 p-8 lg:p-12 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Are You an Entertainment Agent?</h2>
          <p className="text-gray-300 mb-6">
            Discover rising talents with our AI-powered scouting tools. Get access to
            performance analytics, trend reports, and personalized talent recommendations.
          </p>
          <Link
            to="/register?role=agent"
            className="inline-block px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg font-semibold hover:from-indigo-600 hover:to-purple-600 transition-colors"
          >
            Join as an Agent
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;

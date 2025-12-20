import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchTrendingVideos, fetchFeaturedVideos } from '../store/slices/videosSlice';
import VideoCard from '../components/video/VideoCard';
import { FireIcon, SparklesIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { categoriesAPI } from '../services/api';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  isActive: boolean;
}

// Default gradient colors for categories without a color set
const defaultColors = [
  'from-pink-500 to-rose-500',
  'from-purple-500 to-indigo-500',
  'from-blue-500 to-cyan-500',
  'from-yellow-500 to-orange-500',
  'from-green-500 to-teal-500',
  'from-red-500 to-pink-500',
  'from-emerald-500 to-green-500',
  'from-violet-500 to-purple-500',
  'from-indigo-500 to-blue-500',
  'from-gray-500 to-slate-500'
];

// Default icons for common categories
const defaultIcons: Record<string, string> = {
  singing: '🎤',
  acting: '🎭',
  dancing: '💃',
  comedy: '😂',
  music: '🎵',
  modeling: '📸',
  sports: '⚽',
  art: '🎨',
  magic: '🪄',
  'solo-artists': '🎤',
  bands: '🎸',
  other: '✨'
};

const Home: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { trendingVideos, featuredVideos, isLoading } = useSelector(
    (state: RootState) => state.videos
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    dispatch(fetchTrendingVideos(12));
    dispatch(fetchFeaturedVideos(6));

    // Fetch categories from database
    const fetchCategories = async () => {
      try {
        const response = await categoriesAPI.getCategories();
        setCategories(response.data.categories || []);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        // Fallback to empty - categories section won't show
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, [dispatch]);

  // Get color for category (use stored color or default based on index)
  const getCategoryColor = (category: Category, index: number) => {
    if (category.color) {
      // If color is a hex code, convert to gradient
      if (category.color.startsWith('#')) {
        return `from-[${category.color}] to-[${category.color}]`;
      }
      return category.color;
    }
    return defaultColors[index % defaultColors.length];
  };

  // Get icon for category
  const getCategoryIcon = (category: Category) => {
    if (category.icon) return category.icon;
    return defaultIcons[category.slug] || '📁';
  };

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

      {/* Categories - Now fetched from database */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Browse by Category</h2>
        {categoriesLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl p-6 bg-gray-200 dark:bg-gray-700 h-24" />
            ))}
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((category, index) => (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                className={`relative overflow-hidden rounded-xl p-6 bg-gradient-to-br ${getCategoryColor(category, index)} text-white hover:scale-105 transition-transform`}
              >
                <div className="text-3xl mb-2">{getCategoryIcon(category)}</div>
                <div className="font-semibold">{category.name}</div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No categories available yet.</p>
          </div>
        )}
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

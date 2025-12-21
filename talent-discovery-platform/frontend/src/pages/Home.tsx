import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchTrendingVideos, fetchFeaturedVideos } from '../store/slices/videosSlice';
import VideoCard from '../components/video/VideoCard';
import { FireIcon, SparklesIcon, ArrowRightIcon, PlayIcon } from '@heroicons/react/24/outline';
import { categoriesAPI } from '../services/api';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  iconUrl: string | null;
  color: string | null;
  isActive: boolean;
}

// Default gradient colors for categories without a color set
const defaultColors = [
  'from-primary-500 to-secondary-500',
  'from-secondary-500 to-accent-500',
  'from-accent-500 to-primary-500',
  'from-cyan-500 to-primary-500',
  'from-primary-500 to-pink-500',
  'from-violet-500 to-accent-500',
  'from-emerald-500 to-cyan-500',
  'from-amber-500 to-accent-500',
  'from-rose-500 to-primary-500',
  'from-indigo-500 to-violet-500'
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
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, [dispatch]);

  // Get color for category (use stored color or default based on index)
  const getCategoryColor = (category: Category, index: number) => {
    if (category.color) {
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
      {/* Hero Section - Aurora Glass Style */}
      <section className="mb-16 relative overflow-hidden rounded-3xl">
        {/* Background with gradient mesh */}
        <div className="absolute inset-0 bg-gradient-primary opacity-90" />
        <div className="absolute inset-0 bg-aurora-mesh-dark opacity-50" />

        {/* Content */}
        <div className="relative z-10 p-8 lg:p-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white/90 text-sm font-medium mb-6">
              <SparklesIcon className="w-4 h-4" />
              AI-Powered Talent Discovery
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Showcase Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-cyan-300">Talent</span> to the World
            </h1>
            <p className="text-lg text-white/80 mb-8 leading-relaxed">
              Join thousands of singers, actors, dancers, and comedians who are getting
              discovered by entertainment agents through AI-powered talent ranking.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/register"
                className="group px-8 py-4 bg-white text-primary-600 rounded-full font-semibold
                         shadow-lg hover:shadow-xl transition-all duration-300
                         hover:-translate-y-1 flex items-center gap-2"
              >
                <PlayIcon className="w-5 h-5" />
                Start Creating
              </Link>
              <Link
                to="/trending"
                className="px-8 py-4 border-2 border-white/50 text-white rounded-full font-semibold
                         hover:bg-white/10 hover:border-white transition-all duration-300
                         backdrop-blur-sm"
              >
                Explore Talents
              </Link>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-10 right-10 w-32 h-32 bg-accent-500/30 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl" />
        </div>
      </section>

      {/* Featured Videos */}
      {featuredVideos.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                <SparklesIcon className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Featured</h2>
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
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white">
              <FireIcon className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Trending</h2>
          </div>
          <Link
            to="/trending"
            className="flex items-center gap-2 px-4 py-2 rounded-full
                     text-primary-600 dark:text-primary-400
                     hover:bg-primary-500/10 transition-colors font-medium"
          >
            See all <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200/50 dark:bg-white/10 rounded-2xl aspect-video mb-3 backdrop-blur-sm" />
                <div className="h-4 bg-gray-200/50 dark:bg-white/10 rounded-full mb-2" />
                <div className="h-3 bg-gray-200/50 dark:bg-white/10 rounded-full w-2/3" />
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

      {/* Categories - Glass Cards */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Browse by Category</h2>
        </div>
        {categoriesLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl p-6 bg-gray-200/50 dark:bg-white/10 h-28 backdrop-blur-sm" />
            ))}
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((category, index) => (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                className={`group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br ${getCategoryColor(category, index)}
                           text-white shadow-lg hover:shadow-xl
                           hover:scale-105 hover:-translate-y-1
                           transition-all duration-300`}
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/10" />

                {category.iconUrl ? (
                  <img
                    src={category.iconUrl}
                    alt={category.name}
                    className="w-12 h-12 object-cover rounded-lg mb-3"
                  />
                ) : (
                  <div className="text-4xl mb-3">{getCategoryIcon(category)}</div>
                )}
                <div className="font-semibold relative z-10">{category.name}</div>

                {/* Decorative gradient overlay */}
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 card">
            <p className="text-gray-500 dark:text-gray-400">No categories available yet.</p>
          </div>
        )}
      </section>

      {/* CTA for Agents - Glass Card */}
      <section className="relative overflow-hidden rounded-3xl">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-aurora dark:from-aurora to-primary-900 dark:to-primary-900" />
        <div className="absolute inset-0 bg-aurora-mesh-dark opacity-30" />

        {/* Content */}
        <div className="relative z-10 p-8 lg:p-16">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium mb-6">
              <SparklesIcon className="w-4 h-4" />
              For Industry Professionals
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Are You an Entertainment Agent?
            </h2>
            <p className="text-white/70 mb-8 text-lg leading-relaxed max-w-2xl mx-auto">
              Discover rising talents with our AI-powered scouting tools. Get access to
              performance analytics, trend reports, and personalized talent recommendations.
            </p>
            <Link
              to="/register?role=agent"
              className="inline-flex items-center gap-2 px-8 py-4
                       bg-gradient-primary text-white rounded-full font-semibold
                       shadow-aurora-lg hover:shadow-aurora
                       transition-all duration-300 hover:-translate-y-1"
            >
              Join as an Agent
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-1/4 left-10 w-32 h-32 bg-primary-500/30 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-10 w-48 h-48 bg-accent-500/20 rounded-full blur-3xl" />
        </div>
      </section>
    </div>
  );
};

export default Home;

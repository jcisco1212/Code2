import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { categoriesAPI, videosAPI } from '../services/api';
import VideoCard from '../components/video/VideoCard';
import { ArrowUpTrayIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  iconUrl: string | null;
  color: string | null;
}

interface Video {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  viewsCount: number;
  likesCount: number;
  createdAt: string;
  user?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

const CategoryPage: React.FC = () => {
  const { categorySlug: slug } = useParams<{ categorySlug: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVideos, setTotalVideos] = useState(0);

  useEffect(() => {
    const fetchCategoryAndVideos = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch category details
        const categoryResponse = await categoriesAPI.getCategoryBySlug(slug);
        const categoryData = categoryResponse.data.category;
        setCategory(categoryData);

        // Fetch videos for this category
        const videosResponse = await videosAPI.getByCategory(categoryData.id, {
          page,
          limit: 12,
          sortBy: 'createdAt',
          sortOrder: 'DESC'
        });

        setVideos(videosResponse.data.videos || []);
        setTotalPages(videosResponse.data.pagination?.totalPages || 1);
        setTotalVideos(videosResponse.data.pagination?.total || 0);
      } catch (err: any) {
        console.error('Failed to fetch category:', err);
        setError(err.response?.data?.error?.message || 'Category not found');
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryAndVideos();
  }, [slug, page]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
        <div className="animate-pulse">
          <div className="h-12 bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl w-1/3 mb-4" />
          <div className="h-6 bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-xl w-2/3 mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-video bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl
                          bg-gradient-to-br from-red-500/20 to-orange-500/20
                          backdrop-blur-sm mb-6">
            <span className="text-4xl">😕</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Category Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'This category does not exist or has been removed.'}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3
                     bg-gradient-to-r from-primary-600 to-accent-600
                     text-white rounded-full font-medium
                     shadow-lg hover:shadow-aurora
                     transition-all duration-300 hover:-translate-y-0.5"
          >
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
      {/* Category Header - Glass Card */}
      <div className="relative overflow-hidden rounded-3xl mb-10
                      bg-white/60 dark:bg-white/5
                      backdrop-blur-xl
                      border border-white/50 dark:border-white/10
                      shadow-lg p-8">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-accent-500/10" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-3">
            {category.icon ? (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500
                              flex items-center justify-center shadow-aurora">
                <span className="text-3xl">{category.icon}</span>
              </div>
            ) : category.iconUrl ? (
              <img
                src={category.iconUrl}
                alt={category.name}
                className="w-16 h-16 rounded-2xl object-cover shadow-aurora"
              />
            ) : null}
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                {category.name}
              </h1>
              <p className="text-sm text-primary-600 dark:text-primary-400 font-medium mt-1">
                {totalVideos} {totalVideos === 1 ? 'video' : 'videos'}
              </p>
            </div>
          </div>
          {category.description && (
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mt-4 leading-relaxed">
              {category.description}
            </p>
          )}
        </div>
      </div>

      {/* Videos Grid */}
      {videos.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>

          {/* Pagination - Glass Style */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-12">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                         bg-white/60 dark:bg-white/10 backdrop-blur-sm
                         border border-white/50 dark:border-white/10
                         text-gray-700 dark:text-gray-300
                         hover:bg-white/80 dark:hover:bg-white/20
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-300"
              >
                <ChevronLeftIcon className="w-4 h-4" />
                Previous
              </button>
              <div className="flex items-center gap-1 px-4">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={i}
                      onClick={() => setPage(pageNum)}
                      className={`w-10 h-10 rounded-xl font-medium transition-all duration-300
                                ${page === pageNum
                                  ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-aurora'
                                  : 'bg-white/40 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-white/10'
                                }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 5 && (
                  <span className="px-2 text-gray-500">...</span>
                )}
              </div>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                         bg-white/60 dark:bg-white/10 backdrop-blur-sm
                         border border-white/50 dark:border-white/10
                         text-gray-700 dark:text-gray-300
                         hover:bg-white/80 dark:hover:bg-white/20
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-300"
              >
                Next
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl
                          bg-gradient-to-br from-primary-500/20 to-accent-500/20
                          backdrop-blur-sm mb-6">
            <span className="text-5xl">🎬</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            No videos yet
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            Be the first to showcase your talent in this category!
          </p>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-8 py-4
                     bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600
                     text-white rounded-full font-semibold
                     shadow-lg hover:shadow-aurora
                     transition-all duration-300 hover:-translate-y-0.5"
          >
            <ArrowUpTrayIcon className="w-5 h-5" />
            Upload Video
          </Link>
        </div>
      )}
    </div>
  );
};

export default CategoryPage;

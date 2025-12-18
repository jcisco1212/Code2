import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { categoriesAPI, videosAPI } from '../services/api';
import VideoCard from '../components/video/VideoCard';

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
  const { slug } = useParams<{ slug: string }>();
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-2/3 mb-8"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-video bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Category Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error || 'This category does not exist or has been removed.'}</p>
          <Link to="/" className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Category Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          {category.icon && (
            <span className="text-3xl">{category.icon}</span>
          )}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {category.name}
          </h1>
        </div>
        {category.description && (
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
            {category.description}
          </p>
        )}
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
          {totalVideos} {totalVideos === 1 ? 'video' : 'videos'}
        </p>
      </div>

      {/* Videos Grid */}
      {videos.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-gray-600 dark:text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <span className="text-6xl block mb-4">🎬</span>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No videos yet
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Be the first to upload a video in this category!
          </p>
          <Link
            to="/creator/upload"
            className="inline-block mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Upload Video
          </Link>
        </div>
      )}
    </div>
  );
};

export default CategoryPage;

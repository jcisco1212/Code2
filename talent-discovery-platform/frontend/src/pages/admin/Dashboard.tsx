import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  UsersIcon,
  FolderIcon,
  FilmIcon,
  ExclamationCircleIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  SparklesIcon,
  CpuChipIcon,
  ArrowTrendingUpIcon,
  MegaphoneIcon
} from '@heroicons/react/24/outline';

interface Stats {
  totalUsers: number;
  totalVideos: number;
  pendingReports: number;
  pendingVideos: number;
  newUsersToday: number;
  newVideosToday: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/stats');
        setStats(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const adminLinks = [
    {
      to: '/admin/users',
      label: 'User Management',
      icon: UsersIcon,
      description: 'Manage users, reset passwords, change roles',
      color: 'from-blue-500 to-blue-600'
    },
    {
      to: '/admin/categories',
      label: 'Categories',
      icon: FolderIcon,
      description: 'Add, edit, or remove video categories',
      color: 'from-amber-500 to-amber-600'
    },
    {
      to: '/admin/moderation',
      label: 'Video Moderation',
      icon: ShieldCheckIcon,
      description: 'Review and moderate uploaded videos',
      color: 'from-emerald-500 to-emerald-600'
    },
    {
      to: '/admin/complaints',
      label: 'Reports & Complaints',
      icon: ExclamationCircleIcon,
      description: 'Handle user reports and complaints',
      color: 'from-red-500 to-red-600'
    },
    {
      to: '/admin/reports',
      label: 'User Reports',
      icon: ChartBarIcon,
      description: 'Generate and export user analytics',
      color: 'from-purple-500 to-purple-600'
    },
    {
      to: '/admin/user-analytics',
      label: 'User Analytics',
      icon: ArrowTrendingUpIcon,
      description: 'Track user growth, retention & geography',
      color: 'from-teal-500 to-teal-600'
    },
    {
      to: '/admin/ai-moderation',
      label: 'AI Moderation',
      icon: CpuChipIcon,
      description: 'Configure AI content moderation settings',
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      to: '/admin/broadcast',
      label: 'Broadcast Messages',
      icon: MegaphoneIcon,
      description: 'Send notifications to users by role or individually',
      color: 'from-pink-500 to-pink-600'
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Platform management and moderation</p>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-2xl h-24" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-xl mb-8">
          {error}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="relative overflow-hidden bg-white dark:bg-white/5 p-5 rounded-2xl shadow-lg border-l-4 border-blue-500">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full blur-2xl" />
            <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
            <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">Total Users</div>
          </div>
          <div className="relative overflow-hidden bg-white dark:bg-white/5 p-5 rounded-2xl shadow-lg border-l-4 border-green-500">
            <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-full blur-2xl" />
            <div className="text-2xl font-bold text-green-600">{stats.totalVideos}</div>
            <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">Total Videos</div>
          </div>
          <div className="relative overflow-hidden bg-white dark:bg-white/5 p-5 rounded-2xl shadow-lg border-l-4 border-yellow-500">
            <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-500/10 rounded-full blur-2xl" />
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingVideos}</div>
            <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">Pending Videos</div>
          </div>
          <div className="relative overflow-hidden bg-white dark:bg-white/5 p-5 rounded-2xl shadow-lg border-l-4 border-red-500">
            <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-full blur-2xl" />
            <div className="text-2xl font-bold text-red-600">{stats.pendingReports}</div>
            <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">Pending Reports</div>
          </div>
          <div className="relative overflow-hidden bg-white dark:bg-white/5 p-5 rounded-2xl shadow-lg border-l-4 border-purple-500">
            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full blur-2xl" />
            <div className="text-2xl font-bold text-purple-600">{stats.newUsersToday}</div>
            <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">New Users Today</div>
          </div>
          <div className="relative overflow-hidden bg-white dark:bg-white/5 p-5 rounded-2xl shadow-lg border-l-4 border-indigo-500">
            <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-full blur-2xl" />
            <div className="text-2xl font-bold text-indigo-600">{stats.newVideosToday}</div>
            <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">New Videos Today</div>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Management</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {adminLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="group relative overflow-hidden bg-white dark:bg-white/5 p-6 rounded-2xl shadow-lg
                     hover:shadow-xl transition-all duration-300 hover:-translate-y-1
                     border border-gray-100 dark:border-white/10"
          >
            {/* Gradient background on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${link.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${link.color} mb-4 shadow-lg`}>
              <link.icon className="w-6 h-6 text-white" />
            </div>

            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {link.label}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{link.description}</p>

            {/* Arrow indicator */}
            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions Section */}
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-10 mb-4">Quick Actions</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/admin/moderation?status=pending"
          className="flex items-center gap-3 p-4 bg-amber-500/10 dark:bg-amber-500/20 rounded-xl
                   border border-amber-500/20 hover:border-amber-500/40 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
            <FilmIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">Review Pending</div>
            <div className="text-sm text-amber-600 dark:text-amber-400">{stats?.pendingVideos || 0} videos waiting</div>
          </div>
        </Link>

        <Link
          to="/admin/complaints?status=pending"
          className="flex items-center gap-3 p-4 bg-red-500/10 dark:bg-red-500/20 rounded-xl
                   border border-red-500/20 hover:border-red-500/40 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center">
            <ExclamationCircleIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">Handle Reports</div>
            <div className="text-sm text-red-600 dark:text-red-400">{stats?.pendingReports || 0} reports pending</div>
          </div>
        </Link>

        <Link
          to="/admin/verify-agents"
          className="flex items-center gap-3 p-4 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl
                   border border-blue-500/20 hover:border-blue-500/40 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
            <ShieldCheckIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">Verify Agents</div>
            <div className="text-sm text-blue-600 dark:text-blue-400">Review agent applications</div>
          </div>
        </Link>

        <Link
          to="/admin/reports"
          className="flex items-center gap-3 p-4 bg-purple-500/10 dark:bg-purple-500/20 rounded-xl
                   border border-purple-500/20 hover:border-purple-500/40 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
            <ChartBarIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">Export Reports</div>
            <div className="text-sm text-purple-600 dark:text-purple-400">Download user analytics</div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;

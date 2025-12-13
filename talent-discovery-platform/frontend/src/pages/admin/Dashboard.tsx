import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

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
    { to: '/admin/users', label: 'User Management', icon: '👥', description: 'Manage users, reset passwords, change roles' },
    { to: '/admin/categories', label: 'Categories', icon: '📁', description: 'Add, edit, or remove video categories' },
    { to: '/admin/videos', label: 'Video Moderation', icon: '🎬', description: 'Review and moderate uploaded videos' },
    { to: '/admin/reports', label: 'Reports', icon: '🚨', description: 'Handle user reports and complaints' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
      <p className="text-gray-600 mb-8">Platform management and moderation</p>

      {/* Stats Cards */}
      {loading ? (
        <div className="text-center py-8">Loading stats...</div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-8">{error}</div>
      ) : stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
            <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <div className="text-2xl font-bold text-green-600">{stats.totalVideos}</div>
            <div className="text-sm text-gray-600">Total Videos</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingVideos}</div>
            <div className="text-sm text-gray-600">Pending Videos</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
            <div className="text-2xl font-bold text-red-600">{stats.pendingReports}</div>
            <div className="text-sm text-gray-600">Pending Reports</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
            <div className="text-2xl font-bold text-purple-600">{stats.newUsersToday}</div>
            <div className="text-sm text-gray-600">New Users Today</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-indigo-500">
            <div className="text-2xl font-bold text-indigo-600">{stats.newVideosToday}</div>
            <div className="text-sm text-gray-600">New Videos Today</div>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <h2 className="text-xl font-semibold mb-4">Management</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {adminLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200"
          >
            <div className="text-3xl mb-2">{link.icon}</div>
            <h3 className="font-semibold text-lg mb-1">{link.label}</h3>
            <p className="text-sm text-gray-600">{link.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;

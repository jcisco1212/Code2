import React, { useState, useEffect } from 'react';
import {
  MegaphoneIcon,
  UserGroupIcon,
  UserIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { broadcastAPI, getUploadUrl } from '../../services/api';

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  avatarUrl: string | null;
}

interface RoleStat {
  role: string;
  count: string;
}

const Broadcast: React.FC = () => {
  const [targetType, setTargetType] = useState<'all' | 'role' | 'individual'>('all');
  const [targetRole, setTargetRole] = useState<string>('');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // User search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState<{ totalUsers: number; byRole: RoleStat[] } | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await broadcastAPI.getStats();
      setStats(response.data);
    } catch (err) {
      console.error('Failed to load broadcast stats:', err);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await broadcastAPI.getUsers({ search: query, limit: 10 });
      setSearchResults(response.data.users.filter(
        (u: User) => !selectedUsers.find(s => s.id === u.id)
      ));
    } catch (err) {
      console.error('Failed to search users:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (targetType === 'individual') {
        searchUsers(searchQuery);
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, targetType]);

  const addUser = (user: User) => {
    setSelectedUsers(prev => [...prev, user]);
    setSearchResults(prev => prev.filter(u => u.id !== user.id));
    setSearchQuery('');
  };

  const removeUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(u => u.id !== userId));
  };

  const getTargetCount = (): number => {
    if (targetType === 'all') {
      return stats?.totalUsers || 0;
    }
    if (targetType === 'role' && targetRole) {
      const roleStat = stats?.byRole.find(r => r.role === targetRole);
      return roleStat ? parseInt(roleStat.count) : 0;
    }
    if (targetType === 'individual') {
      return selectedUsers.length;
    }
    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!title.trim() || !message.trim()) {
      setError('Title and message are required');
      return;
    }

    if (targetType === 'role' && !targetRole) {
      setError('Please select a role');
      return;
    }

    if (targetType === 'individual' && selectedUsers.length === 0) {
      setError('Please select at least one user');
      return;
    }

    setLoading(true);
    try {
      const data: any = {
        title: title.trim(),
        message: message.trim(),
        targetType
      };

      if (targetType === 'role') {
        data.targetRole = targetRole;
      }

      if (targetType === 'individual') {
        data.targetUserIds = selectedUsers.map(u => u.id);
      }

      const response = await broadcastAPI.sendBroadcast(data);
      setSuccess(`Message sent successfully to ${response.data.data.recipientCount} users!`);

      // Reset form
      setTitle('');
      setMessage('');
      setSelectedUsers([]);
      setTargetRole('');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to send broadcast message');
    } finally {
      setLoading(false);
    }
  };

  const roleLabels: Record<string, string> = {
    user: 'Users',
    creator: 'Creators',
    agent: 'Agents',
    admin: 'Admins',
    super_admin: 'Super Admins'
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
              <MegaphoneIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Broadcast Message
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Send notifications to users based on account type or individually
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</p>
            </div>
            {stats.byRole.slice(0, 3).map((stat) => (
              <div key={stat.role} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{roleLabels[stat.role] || stat.role}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.count}</p>
              </div>
            ))}
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Target Selection */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Select Recipients
            </h2>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <button
                type="button"
                onClick={() => setTargetType('all')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  targetType === 'all'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <UserGroupIcon className={`w-6 h-6 mx-auto mb-2 ${
                  targetType === 'all' ? 'text-primary-600' : 'text-gray-400'
                }`} />
                <p className={`text-sm font-medium ${
                  targetType === 'all' ? 'text-primary-600' : 'text-gray-600 dark:text-gray-400'
                }`}>All Users</p>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('role')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  targetType === 'role'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <UserGroupIcon className={`w-6 h-6 mx-auto mb-2 ${
                  targetType === 'role' ? 'text-primary-600' : 'text-gray-400'
                }`} />
                <p className={`text-sm font-medium ${
                  targetType === 'role' ? 'text-primary-600' : 'text-gray-600 dark:text-gray-400'
                }`}>By Role</p>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('individual')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  targetType === 'individual'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <UserIcon className={`w-6 h-6 mx-auto mb-2 ${
                  targetType === 'individual' ? 'text-primary-600' : 'text-gray-400'
                }`} />
                <p className={`text-sm font-medium ${
                  targetType === 'individual' ? 'text-primary-600' : 'text-gray-600 dark:text-gray-400'
                }`}>Individual</p>
              </button>
            </div>

            {/* Role Selection */}
            {targetType === 'role' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Role
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Choose a role...</option>
                  <option value="user">Users ({stats?.byRole.find(r => r.role === 'user')?.count || 0})</option>
                  <option value="creator">Creators ({stats?.byRole.find(r => r.role === 'creator')?.count || 0})</option>
                  <option value="agent">Agents ({stats?.byRole.find(r => r.role === 'agent')?.count || 0})</option>
                  <option value="admin">Admins ({stats?.byRole.find(r => r.role === 'admin')?.count || 0})</option>
                  <option value="super_admin">Super Admins ({stats?.byRole.find(r => r.role === 'super_admin')?.count || 0})</option>
                </select>
              </div>
            )}

            {/* Individual User Selection */}
            {targetType === 'individual' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search Users
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by username, email, or name..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-2 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 max-h-48 overflow-y-auto">
                    {searchResults.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => addUser(user)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        {user.avatarUrl ? (
                          <img
                            src={getUploadUrl(user.avatarUrl) || ''}
                            alt={user.username}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-600">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            @{user.username}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {user.email} · {user.role}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected Users */}
                {selectedUsers.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      Selected ({selectedUsers.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-2 px-3 py-1.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full"
                        >
                          <span className="text-sm">@{user.username}</span>
                          <button
                            type="button"
                            onClick={() => removeUser(user.id)}
                            className="hover:text-primary-900 dark:hover:text-primary-100"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Target Count */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>{getTargetCount()}</strong> user(s) will receive this message
              </p>
            </div>
          </div>

          {/* Message Content */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Message Content
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter notification title..."
                  maxLength={255}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">{title.length}/255</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your message..."
                  rows={5}
                  maxLength={5000}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
                <p className="mt-1 text-xs text-gray-500">{message.length}/5000</p>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="mx-6 mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
              <ExclamationCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {success && (
            <div className="mx-6 mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3">
              <CheckIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
              <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
            </div>
          )}

          {/* Submit */}
          <div className="px-6 pb-6">
            <button
              type="submit"
              disabled={loading || getTargetCount() === 0}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <MegaphoneIcon className="w-5 h-5" />
                  Send Broadcast
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Broadcast;

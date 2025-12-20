import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  username: string;
  email: string;
  role: string;
  gender: string | null;
  dateOfBirth: string | null;
  age: number | null;
  ethnicity: string | null;
  city: string;
  state: string;
  location: string | null;
  artistType: string | null;
  genre: string | null;
  talentCategories: string[];
  isActive: boolean;
  isVerified: boolean;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

interface Summary {
  totalUsers: number;
  newUsersLast30Days: number;
  activeUsers: number;
  inactiveUsers: number;
  verifiedEmails: number;
  unverifiedEmails: number;
  byRole: { role: string; count: string }[];
  byGender: { gender: string; count: string }[];
  byEthnicity: { ethnicity: string; count: string }[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const ethnicityOptions = [
  'American Indian or Alaska Native',
  'Asian',
  'Black or African American',
  'Hispanic or Latino',
  'Native Hawaiian or Pacific Islander',
  'White',
  'Two or More Races',
  'Prefer not to say',
  'Other'
];

const roleOptions = ['user', 'creator', 'agent', 'admin', 'super_admin'];
const genderOptions = ['male', 'female', 'other', 'prefer_not_to_say'];

const AdminReports: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  // Filters
  const [filters, setFilters] = useState({
    role: '',
    gender: '',
    ethnicity: '',
    minAge: '',
    maxAge: '',
    city: '',
    state: '',
    startDate: '',
    endDate: '',
    search: ''
  });

  // Fetch summary on mount
  useEffect(() => {
    fetchSummary();
  }, []);

  // Fetch users when filters or pagination change
  useEffect(() => {
    fetchUsers();
  }, [pagination.page, filters]);

  const fetchSummary = async () => {
    try {
      const response = await api.get('/admin/reports/users/summary');
      setSummary(response.data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await api.get(`/admin/reports/users?${params.toString()}`);
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      params.append('format', format);

      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await api.get(`/admin/reports/users/export?${params.toString()}`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `user-report-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      role: '',
      gender: '',
      ethnicity: '',
      minAge: '',
      maxAge: '',
      city: '',
      state: '',
      startDate: '',
      endDate: '',
      search: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="max-w-full mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Reports</h1>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <button
            onClick={() => handleExport('excel')}
            disabled={exporting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {exporting ? 'Exporting...' : 'Export Excel'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalUsers}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">New (30 days)</p>
            <p className="text-2xl font-bold text-green-600">{summary.newUsersLast30Days}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
            <p className="text-2xl font-bold text-blue-600">{summary.activeUsers}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">Inactive</p>
            <p className="text-2xl font-bold text-red-600">{summary.inactiveUsers}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">Verified Email</p>
            <p className="text-2xl font-bold text-green-600">{summary.verifiedEmails}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">Unverified</p>
            <p className="text-2xl font-bold text-yellow-600">{summary.unverifiedEmails}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full px-4 py-3 flex justify-between items-center text-left"
        >
          <span className="font-medium text-gray-900 dark:text-white">Filters</span>
          <span className="text-gray-500">{showFilters ? '▲' : '▼'}</span>
        </button>

        {showFilters && (
          <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Name, email, username..."
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                <select
                  name="role"
                  value={filters.role}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                >
                  <option value="">All Roles</option>
                  {roleOptions.map(role => (
                    <option key={role} value={role}>{role.replace('_', ' ').toUpperCase()}</option>
                  ))}
                </select>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
                <select
                  name="gender"
                  value={filters.gender}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                >
                  <option value="">All Genders</option>
                  {genderOptions.map(g => (
                    <option key={g} value={g}>{g.replace('_', ' ').charAt(0).toUpperCase() + g.replace('_', ' ').slice(1)}</option>
                  ))}
                </select>
              </div>

              {/* Ethnicity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ethnicity</label>
                <select
                  name="ethnicity"
                  value={filters.ethnicity}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                >
                  <option value="">All Ethnicities</option>
                  {ethnicityOptions.map(e => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>

              {/* Min Age */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Age</label>
                <input
                  type="number"
                  name="minAge"
                  value={filters.minAge}
                  onChange={handleFilterChange}
                  placeholder="Min"
                  min="13"
                  max="120"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                />
              </div>

              {/* Max Age */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Age</label>
                <input
                  type="number"
                  name="maxAge"
                  value={filters.maxAge}
                  onChange={handleFilterChange}
                  placeholder="Max"
                  min="13"
                  max="120"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={filters.city}
                  onChange={handleFilterChange}
                  placeholder="City"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                />
              </div>

              {/* State */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
                <input
                  type="text"
                  name="state"
                  value={filters.state}
                  onChange={handleFilterChange}
                  placeholder="State"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Registered After</label>
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Registered Before</label>
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Showing {users.length} of {pagination.total} users
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Gender</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">DOB</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Age</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ethnicity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">City</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">State</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Registered</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                    No users found matching the filters.
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{user.fullName || '-'}</div>
                        <div className="text-xs text-gray-500">@{user.username}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{user.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'agent' ? 'bg-blue-100 text-blue-800' :
                        user.role === 'creator' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300 capitalize">
                      {user.gender?.replace('_', ' ') || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {formatDate(user.dateOfBirth)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {user.age || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {user.ethnicity || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {user.city || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {user.state || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {formatDate(user.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
              className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReports;

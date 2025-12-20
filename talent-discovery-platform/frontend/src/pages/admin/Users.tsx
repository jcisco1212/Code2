import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { PlusIcon } from '@heroicons/react/24/outline';

interface User {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  emailVerified: boolean;
  gender: string | null;
  location: string | null;
  createdAt: string;
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

const AdminUsers: React.FC = () => {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'edit' | 'resetPassword' | 'delete' | 'create'>('edit');
  const [newPassword, setNewPassword] = useState('');
  const [editRole, setEditRole] = useState('');

  // Create user form
  const [createForm, setCreateForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    role: 'creator',
    gender: '',
    dateOfBirth: '',
    ethnicity: '',
    location: ''
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;

      const response = await api.get('/admin/users', { params });
      setUsers(response.data.users);
      setTotalPages(response.data.pagination.pages);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const openModal = (user: User | null, action: 'edit' | 'resetPassword' | 'delete' | 'create') => {
    setSelectedUser(user);
    setModalAction(action);
    if (user) {
      setEditRole(user.role);
    }
    setNewPassword('');
    if (action === 'create') {
      setCreateForm({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
        role: 'creator',
        gender: '',
        dateOfBirth: '',
        ethnicity: '',
        location: ''
      });
    }
    setShowModal(true);
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await api.put(`/admin/users/${user.id}/status`, { isActive: !user.isActive });
      toast.success(`User ${user.isActive ? 'disabled' : 'enabled'} successfully`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to update user status');
    }
  };

  const handleRoleChange = async () => {
    if (!selectedUser) return;
    try {
      await api.put(`/admin/users/${selectedUser.id}/role`, { role: editRole });
      toast.success('User role updated successfully');
      setShowModal(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to update role');
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) return;
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    try {
      await api.put(`/admin/users/${selectedUser.id}/reset-password`, { password: newPassword });
      toast.success('Password reset successfully');
      setShowModal(false);
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to reset password');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      await api.delete(`/admin/users/${selectedUser.id}`);
      toast.success('User deleted successfully');
      setShowModal(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete user');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.firstName || !createForm.lastName || !createForm.username || !createForm.email || !createForm.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (createForm.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    try {
      await api.post('/admin/users', {
        ...createForm,
        dateOfBirth: createForm.dateOfBirth || undefined,
        gender: createForm.gender || undefined,
        ethnicity: createForm.ethnicity || undefined,
        location: createForm.location || undefined
      });
      toast.success('User created successfully');
      setShowModal(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to create user');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-red-100 text-red-800';
      case 'creator': return 'bg-indigo-100 text-indigo-800';
      case 'agent': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600">Manage users, roles, and permissions</p>
        </div>
        <div className="flex gap-4 items-center">
          <button
            onClick={() => openModal(null, 'create')}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            <PlusIcon className="w-5 h-5" />
            Create User
          </button>
          <Link to="/admin" className="text-indigo-600 hover:text-indigo-800">
            &larr; Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search by email or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] p-2 border rounded-lg"
          />
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="p-2 border rounded-lg"
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="creator">Creator</option>
            <option value="agent">Agent</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="p-2 border rounded-lg"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
            Search
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-8">Loading users...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{user.displayName || user.username}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    <div className="text-xs text-gray-400">@{user.username}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${getRoleBadgeColor(user.role)}`}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Disabled'}
                    </span>
                    {user.emailVerified && (
                      <span className="ml-1 text-green-500" title="Email Verified">✓</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => openModal(user, 'edit')}
                      className="text-indigo-600 hover:text-indigo-900 text-sm"
                    >
                      Edit Role
                    </button>
                    <button
                      onClick={() => openModal(user, 'resetPassword')}
                      className="text-yellow-600 hover:text-yellow-900 text-sm"
                    >
                      Reset Password
                    </button>
                    <button
                      onClick={() => handleToggleStatus(user)}
                      className={`text-sm ${user.isActive ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}`}
                    >
                      {user.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => openModal(user, 'delete')}
                      className="text-red-600 hover:text-red-900 text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 flex justify-between items-center">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            {modalAction === 'create' && (
              <>
                <h2 className="text-xl font-bold mb-4">Create New User</h2>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                      <input
                        type="text"
                        value={createForm.firstName}
                        onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                        className="w-full p-2 border rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                      <input
                        type="text"
                        value={createForm.lastName}
                        onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                        className="w-full p-2 border rounded-lg"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                    <input
                      type="text"
                      value={createForm.username}
                      onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                    <input
                      type="password"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                      placeholder="Min 8 characters"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                    <select
                      value={createForm.role}
                      onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="user">User</option>
                      <option value="creator">Creator</option>
                      <option value="agent">Agent</option>
                      {isSuperAdmin && <option value="admin">Admin</option>}
                      {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                    </select>
                    {(createForm.role === 'admin' || createForm.role === 'super_admin') && (
                      <p className="text-xs text-orange-600 mt-1">
                        Warning: This will grant administrative privileges
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                      <select
                        value={createForm.gender}
                        onChange={(e) => setCreateForm({ ...createForm, gender: e.target.value })}
                        className="w-full p-2 border rounded-lg"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={createForm.dateOfBirth}
                        onChange={(e) => setCreateForm({ ...createForm, dateOfBirth: e.target.value })}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ethnicity</label>
                    <select
                      value={createForm.ethnicity}
                      onChange={(e) => setCreateForm({ ...createForm, ethnicity: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="">Select ethnicity</option>
                      {ethnicityOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={createForm.location}
                      onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                      placeholder="City, State"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                      Create User
                    </button>
                  </div>
                </form>
              </>
            )}

            {modalAction === 'edit' && selectedUser && (
              <>
                <h2 className="text-xl font-bold mb-4">Edit User Role</h2>
                <p className="text-gray-600 mb-4">User: {selectedUser.email}</p>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full p-2 border rounded-lg mb-4"
                >
                  <option value="user">User</option>
                  <option value="creator">Creator</option>
                  <option value="agent">Agent</option>
                  {isSuperAdmin && <option value="admin">Admin</option>}
                  {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                </select>
                {!isSuperAdmin && (editRole === 'admin' || editRole === 'super_admin') && (
                  <p className="text-xs text-red-600 mb-4">Only Super Admins can assign admin roles</p>
                )}
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                  <button onClick={handleRoleChange} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Save</button>
                </div>
              </>
            )}

            {modalAction === 'resetPassword' && selectedUser && (
              <>
                <h2 className="text-xl font-bold mb-4">Reset Password</h2>
                <p className="text-gray-600 mb-4">User: {selectedUser.email}</p>
                <input
                  type="password"
                  placeholder="New password (min 8 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2 border rounded-lg mb-4"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                  <button onClick={handleResetPassword} className="px-4 py-2 bg-yellow-600 text-white rounded-lg">Reset Password</button>
                </div>
              </>
            )}

            {modalAction === 'delete' && selectedUser && (
              <>
                <h2 className="text-xl font-bold mb-4 text-red-600">Delete User</h2>
                <p className="text-gray-600 mb-4">Are you sure you want to delete <strong>{selectedUser.email}</strong>? This action cannot be undone.</p>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                  <button onClick={handleDeleteUser} className="px-4 py-2 bg-red-600 text-white rounded-lg">Delete User</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;

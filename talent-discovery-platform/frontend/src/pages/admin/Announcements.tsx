import React, { useState, useEffect } from 'react';
import { announcementsAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  target: 'all' | 'creators' | 'agents' | 'admins';
  isActive: boolean;
  isPinned: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

const typeOptions = [
  { value: 'info', label: 'Info', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { value: 'success', label: 'Success', color: 'bg-green-100 text-green-700 border-green-300' },
  { value: 'warning', label: 'Warning', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  { value: 'error', label: 'Error', color: 'bg-red-100 text-red-700 border-red-300' }
];

const targetOptions = [
  { value: 'all', label: 'All Users' },
  { value: 'creators', label: 'Creators Only' },
  { value: 'agents', label: 'Agents Only' },
  { value: 'admins', label: 'Admins Only' }
];

interface FormData {
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  target: 'all' | 'creators' | 'agents' | 'admins';
  isPinned: boolean;
  startsAt: string;
  expiresAt: string;
}

const AdminAnnouncements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    content: '',
    type: 'info',
    target: 'all',
    isPinned: false,
    startsAt: '',
    expiresAt: ''
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await announcementsAPI.getAll();
      setAnnouncements(response.data.announcements || []);
    } catch (err) {
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'info',
      target: 'all',
      isPinned: false,
      startsAt: '',
      expiresAt: ''
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await announcementsAPI.create({
        title: formData.title,
        content: formData.content,
        type: formData.type,
        target: formData.target,
        isPinned: formData.isPinned,
        startsAt: formData.startsAt || undefined,
        expiresAt: formData.expiresAt || undefined
      });
      setAnnouncements(prev => [response.data.announcement, ...prev]);
      setShowCreate(false);
      resetForm();
      toast.success('Announcement created');
    } catch (err) {
      toast.error('Failed to create announcement');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      const response = await announcementsAPI.update(editing, {
        title: formData.title,
        content: formData.content,
        type: formData.type,
        target: formData.target,
        isPinned: formData.isPinned,
        startsAt: formData.startsAt || undefined,
        expiresAt: formData.expiresAt || undefined
      });
      setAnnouncements(prev => prev.map(a => a.id === editing ? response.data.announcement : a));
      setEditing(null);
      resetForm();
      toast.success('Announcement updated');
    } catch (err) {
      toast.error('Failed to update announcement');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await announcementsAPI.toggleActive(id, !isActive);
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isActive: !isActive } : a));
      toast.success(isActive ? 'Announcement deactivated' : 'Announcement activated');
    } catch (err) {
      toast.error('Failed to update announcement');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await announcementsAPI.delete(id);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      toast.success('Announcement deleted');
    } catch (err) {
      toast.error('Failed to delete announcement');
    }
  };

  const startEdit = (announcement: Announcement) => {
    setEditing(announcement.id);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      target: announcement.target,
      isPinned: announcement.isPinned,
      startsAt: announcement.startsAt ? announcement.startsAt.split('T')[0] : '',
      expiresAt: announcement.expiresAt ? announcement.expiresAt.split('T')[0] : ''
    });
    setShowCreate(false);
  };

  const getTypeStyle = (type: string) => {
    const opt = typeOptions.find(o => o.value === type);
    return opt?.color || typeOptions[0].color;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const AnnouncementForm = ({ onSubmit, isEdit }: { onSubmit: (e: React.FormEvent) => void; isEdit: boolean }) => (
    <form onSubmit={onSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        {isEdit ? 'Edit Announcement' : 'Create Announcement'}
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content *</label>
          <textarea
            value={formData.content}
            onChange={e => setFormData(p => ({ ...p, content: e.target.value }))}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            rows={4}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={e => setFormData(p => ({ ...p, type: e.target.value as any }))}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              {typeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Audience</label>
            <select
              value={formData.target}
              onChange={e => setFormData(p => ({ ...p, target: e.target.value as any }))}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              {targetOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Starts At</label>
            <input
              type="date"
              value={formData.startsAt}
              onChange={e => setFormData(p => ({ ...p, startsAt: e.target.value }))}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expires At</label>
            <input
              type="date"
              value={formData.expiresAt}
              onChange={e => setFormData(p => ({ ...p, expiresAt: e.target.value }))}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.isPinned}
            onChange={e => setFormData(p => ({ ...p, isPinned: e.target.checked }))}
            className="rounded"
          />
          <span className="text-gray-700 dark:text-gray-300">Pin to top</span>
        </label>
        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={() => { isEdit ? setEditing(null) : setShowCreate(false); resetForm(); }}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            {isEdit ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </form>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Announcements</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage platform-wide announcements</p>
        </div>
        {!showCreate && !editing && (
          <button
            onClick={() => { setShowCreate(true); resetForm(); }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            + New Announcement
          </button>
        )}
      </div>

      {showCreate && <AnnouncementForm onSubmit={handleCreate} isEdit={false} />}
      {editing && <AnnouncementForm onSubmit={handleUpdate} isEdit={true} />}

      {announcements.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
          <div className="text-5xl mb-4">📢</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No announcements yet</h2>
          <p className="text-gray-500 dark:text-gray-400">Create your first announcement to notify users</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map(announcement => (
            <div
              key={announcement.id}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border-l-4 ${getTypeStyle(announcement.type).replace('bg-', 'border-').split(' ')[0]} ${!announcement.isActive ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{announcement.title}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded ${getTypeStyle(announcement.type)}`}>
                      {announcement.type}
                    </span>
                    {announcement.isPinned && (
                      <span className="px-2 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded">Pinned</span>
                    )}
                    {!announcement.isActive && (
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">Inactive</span>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{announcement.content}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span>Target: {targetOptions.find(o => o.value === announcement.target)?.label}</span>
                    <span>Starts: {formatDate(announcement.startsAt)}</span>
                    <span>Expires: {formatDate(announcement.expiresAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleToggleActive(announcement.id, announcement.isActive)}
                    className={`px-3 py-1 text-sm rounded ${announcement.isActive ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                  >
                    {announcement.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => startEdit(announcement)}
                    className="px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(announcement.id)}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminAnnouncements;

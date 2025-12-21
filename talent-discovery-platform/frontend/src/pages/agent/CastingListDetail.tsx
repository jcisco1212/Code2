import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { castingListsAPI, getUploadUrl } from '../../services/api';
import toast from 'react-hot-toast';

interface Talent {
  id: string;
  talentId: string;
  status: string;
  notes: string | null;
  addedAt: string;
  talent: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
    followerCount: number;
  };
}

interface CastingList {
  id: string;
  name: string;
  description: string | null;
  projectName: string | null;
  deadline: string | null;
  talentCount: number;
  createdAt: string;
  talents: Talent[];
}

const statusOptions = [
  { value: 'considering', label: 'Considering', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'shortlisted', label: 'Shortlisted', color: 'bg-green-100 text-green-700' },
  { value: 'contacted', label: 'Contacted', color: 'bg-blue-100 text-blue-700' },
  { value: 'auditioned', label: 'Auditioned', color: 'bg-purple-100 text-purple-700' },
  { value: 'selected', label: 'Selected', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-700' }
];

const CastingListDetail: React.FC = () => {
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();
  const [list, setList] = useState<CastingList | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingTalent, setEditingTalent] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '', projectName: '', deadline: '' });

  useEffect(() => {
    if (listId) {
      fetchList();
    }
  }, [listId]);

  const fetchList = async () => {
    try {
      const response = await castingListsAPI.getList(listId!);
      setList(response.data.castingList);
      setEditForm({
        name: response.data.castingList.name,
        description: response.data.castingList.description || '',
        projectName: response.data.castingList.projectName || '',
        deadline: response.data.castingList.deadline ? response.data.castingList.deadline.split('T')[0] : ''
      });
    } catch (err) {
      toast.error('Failed to load casting list');
      navigate('/agent/casting-lists');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await castingListsAPI.updateList(listId!, {
        name: editForm.name,
        description: editForm.description || undefined,
        projectName: editForm.projectName || undefined,
        deadline: editForm.deadline || undefined
      });
      setList(prev => prev ? { ...prev, ...response.data.castingList } : null);
      setEditing(false);
      toast.success('List updated');
    } catch (err) {
      toast.error('Failed to update list');
    }
  };

  const handleStatusChange = async (talentId: string, status: string) => {
    try {
      await castingListsAPI.updateTalentStatus(listId!, talentId, status);
      setList(prev => prev ? {
        ...prev,
        talents: prev.talents.map(t =>
          t.talentId === talentId ? { ...t, status } : t
        )
      } : null);
      toast.success('Status updated');
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleNotesUpdate = async (talentId: string) => {
    try {
      await castingListsAPI.updateTalentNotes(listId!, talentId, editNotes);
      setList(prev => prev ? {
        ...prev,
        talents: prev.talents.map(t =>
          t.talentId === talentId ? { ...t, notes: editNotes } : t
        )
      } : null);
      setEditingTalent(null);
      toast.success('Notes saved');
    } catch (err) {
      toast.error('Failed to save notes');
    }
  };

  const handleRemoveTalent = async (talentId: string) => {
    if (!window.confirm('Remove this talent from the list?')) return;
    try {
      await castingListsAPI.removeTalent(listId!, talentId);
      setList(prev => prev ? {
        ...prev,
        talents: prev.talents.filter(t => t.talentId !== talentId),
        talentCount: prev.talentCount - 1
      } : null);
      toast.success('Talent removed');
    } catch (err) {
      toast.error('Failed to remove talent');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this casting list? This action cannot be undone.')) return;
    try {
      await castingListsAPI.deleteList(listId!);
      toast.success('Casting list deleted');
      navigate('/agent/casting-lists');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusStyle = (status: string) => {
    const opt = statusOptions.find(o => o.value === status);
    return opt?.color || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Casting list not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
        {editing ? (
          <form onSubmit={handleUpdate} className="space-y-4">
            <input
              type="text"
              value={editForm.name}
              onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
              className="text-2xl font-bold w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                value={editForm.projectName}
                onChange={e => setEditForm(p => ({ ...p, projectName: e.target.value }))}
                placeholder="Project Name"
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
              <input
                type="date"
                value={editForm.deadline}
                onChange={e => setEditForm(p => ({ ...p, deadline: e.target.value }))}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
            <textarea
              value={editForm.description}
              onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Description"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              rows={2}
            />
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Save
              </button>
              <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{list.name}</h1>
              {list.projectName && (
                <p className="text-indigo-600 dark:text-indigo-400 mt-1">Project: {list.projectName}</p>
              )}
              {list.description && (
                <p className="text-gray-600 dark:text-gray-400 mt-2">{list.description}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <span>{list.talentCount} talent{list.talentCount !== 1 ? 's' : ''}</span>
                {list.deadline && (
                  <span>Deadline: {formatDate(list.deadline)}</span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Talents List */}
      {list.talents.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
          <div className="text-5xl mb-4">🎭</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No talent added yet</h2>
          <p className="text-gray-500 dark:text-gray-400">Browse talent profiles and add them to this list</p>
          <Link to="/agent/discover" className="inline-block mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            Discover Talent
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {list.talents.map(item => (
            <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
              <div className="flex items-start gap-4">
                <Link to={`/profile/${item.talent.username}`}>
                  <img
                    src={item.talent.avatarUrl ? getUploadUrl(item.talent.avatarUrl) : '/default-avatar.png'}
                    alt={item.talent.displayName}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link to={`/profile/${item.talent.username}`} className="font-medium text-gray-900 dark:text-white hover:text-indigo-600">
                        {item.talent.displayName}
                      </Link>
                      <p className="text-sm text-gray-500">@{item.talent.username}</p>
                    </div>
                    <select
                      value={item.status}
                      onChange={e => handleStatusChange(item.talentId, e.target.value)}
                      className={`text-sm px-2 py-1 rounded ${getStatusStyle(item.status)} border-0 cursor-pointer`}
                    >
                      {statusOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  {item.talent.bio && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{item.talent.bio}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Added {formatDate(item.addedAt)}
                  </p>
                </div>
              </div>

              {/* Notes Section */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                {editingTalent === item.talentId ? (
                  <div className="space-y-2">
                    <textarea
                      value={editNotes}
                      onChange={e => setEditNotes(e.target.value)}
                      className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      rows={2}
                      placeholder="Add notes about this talent..."
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleNotesUpdate(item.talentId)}
                        className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingTalent(null)}
                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    {item.notes ? (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.notes}</p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No notes</p>
                    )}
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => { setEditingTalent(item.talentId); setEditNotes(item.notes || ''); }}
                        className="text-sm text-indigo-600 hover:text-indigo-700"
                      >
                        {item.notes ? 'Edit' : 'Add Note'}
                      </button>
                      <button
                        onClick={() => handleRemoveTalent(item.talentId)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Back Link */}
      <div className="mt-6">
        <Link to="/agent/casting-lists" className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Casting Lists
        </Link>
      </div>
    </div>
  );
};

export default CastingListDetail;

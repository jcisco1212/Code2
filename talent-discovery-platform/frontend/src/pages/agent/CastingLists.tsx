import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { castingListsAPI, getUploadUrl } from '../../services/api';
import toast from 'react-hot-toast';

interface CastingList {
  id: string;
  name: string;
  description: string | null;
  projectName: string | null;
  deadline: string | null;
  talentCount: number;
  createdAt: string;
}

const CastingLists: React.FC = () => {
  const navigate = useNavigate();
  const [lists, setLists] = useState<CastingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    projectName: '',
    deadline: ''
  });

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      const response = await castingListsAPI.getLists();
      setLists(response.data.castingLists || []);
    } catch (err) {
      toast.error('Failed to load casting lists');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await castingListsAPI.createList({
        name: formData.name,
        description: formData.description || undefined,
        projectName: formData.projectName || undefined,
        deadline: formData.deadline || undefined
      });
      setLists(prev => [response.data.castingList, ...prev]);
      setShowCreate(false);
      setFormData({ name: '', description: '', projectName: '', deadline: '' });
      toast.success('Casting list created');
    } catch (err) {
      toast.error('Failed to create casting list');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this casting list?')) return;
    try {
      await castingListsAPI.deleteList(id);
      setLists(prev => prev.filter(l => l.id !== id));
      toast.success('Casting list deleted');
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

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Casting Lists</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Organize talent for your projects</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          + New List
        </button>
      </div>

      {lists.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No casting lists yet</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Create your first casting list to start organizing talent</p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Create Casting List
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lists.map(list => (
            <div key={list.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{list.name}</h3>
                    {list.projectName && (
                      <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-1">Project: {list.projectName}</p>
                    )}
                  </div>
                  <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded text-sm font-medium">
                    {list.talentCount} talent{list.talentCount !== 1 ? 's' : ''}
                  </span>
                </div>

                {list.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-3 line-clamp-2">{list.description}</p>
                )}

                {list.deadline && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                    Deadline: <span className="font-medium">{formatDate(list.deadline)}</span>
                  </p>
                )}

                <div className="flex gap-2 mt-4">
                  <Link
                    to={`/agent/casting-lists/${list.id}`}
                    className="flex-1 text-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                  >
                    View List
                  </Link>
                  <button
                    onClick={() => handleDelete(list.id)}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create Casting List</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">List Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Lead Actor Candidates"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Name</label>
                <input
                  type="text"
                  value={formData.projectName}
                  onChange={e => setFormData(p => ({ ...p, projectName: e.target.value }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Summer Music Video"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  rows={3}
                  placeholder="Notes about this casting..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deadline</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={e => setFormData(p => ({ ...p, deadline: e.target.value }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Create List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CastingLists;

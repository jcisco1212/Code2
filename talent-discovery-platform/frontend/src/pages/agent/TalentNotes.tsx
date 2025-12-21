import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { castingListsAPI, getUploadUrl } from '../../services/api';
import toast from 'react-hot-toast';

interface TalentNote {
  id: string;
  talentId: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  talent: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

const TalentNotes: React.FC = () => {
  const { talentId } = useParams<{ talentId: string }>();
  const [notes, setNotes] = useState<TalentNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedTalent, setSelectedTalent] = useState<any>(null);

  useEffect(() => {
    fetchNotes();
  }, [talentId]);

  const fetchNotes = async () => {
    try {
      const response = await castingListsAPI.getNotes(talentId);
      setNotes(response.data.notes || []);
      if (talentId && response.data.notes?.length > 0) {
        setSelectedTalent(response.data.notes[0].talent);
      }
    } catch (err) {
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !talentId || saving) return;

    setSaving(true);
    try {
      const response = await castingListsAPI.createNote(talentId, newNote.trim());
      setNotes(prev => [response.data.note, ...prev]);
      setNewNote('');
      toast.success('Note added');
    } catch (err) {
      toast.error('Failed to add note');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editContent.trim() || saving) return;

    setSaving(true);
    try {
      const response = await castingListsAPI.updateNote(noteId, editContent.trim());
      setNotes(prev => prev.map(n => n.id === noteId ? response.data.note : n));
      setEditingNote(null);
      toast.success('Note updated');
    } catch (err) {
      toast.error('Failed to update note');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await castingListsAPI.deleteNote(noteId);
      setNotes(prev => prev.filter(n => n.id !== noteId));
      toast.success('Note deleted');
    } catch (err) {
      toast.error('Failed to delete note');
    }
  };

  const handleTogglePin = async (noteId: string, isPinned: boolean) => {
    try {
      await castingListsAPI.togglePinNote(noteId, !isPinned);
      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, isPinned: !isPinned } : n));
    } catch (err) {
      toast.error('Failed to update note');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Group notes by talent if viewing all notes
  const groupedNotes = talentId ? null : notes.reduce((acc, note) => {
    const key = note.talentId;
    if (!acc[key]) {
      acc[key] = { talent: note.talent, notes: [] };
    }
    acc[key].notes.push(note);
    return acc;
  }, {} as Record<string, { talent: any; notes: TalentNote[] }>);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Specific talent view
  if (talentId) {
    const sortedNotes = [...notes].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        {selectedTalent && (
          <div className="flex items-center gap-4 mb-6">
            <Link to={`/profile/${selectedTalent.username}`}>
              <img
                src={selectedTalent.avatarUrl ? getUploadUrl(selectedTalent.avatarUrl) : '/default-avatar.png'}
                alt={selectedTalent.displayName}
                className="w-16 h-16 rounded-full object-cover"
              />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Notes on {selectedTalent.displayName}
              </h1>
              <Link to={`/profile/${selectedTalent.username}`} className="text-gray-500 hover:text-indigo-600">
                @{selectedTalent.username}
              </Link>
            </div>
          </div>
        )}

        {/* Add Note Form */}
        <form onSubmit={handleCreateNote} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
          <textarea
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            placeholder="Add a private note about this talent..."
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            rows={3}
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={!newNote.trim() || saving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Add Note'}
            </button>
          </div>
        </form>

        {/* Notes List */}
        {sortedNotes.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
            <div className="text-5xl mb-4">📝</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No notes yet</h2>
            <p className="text-gray-500 dark:text-gray-400">Add your first private note about this talent</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedNotes.map(note => (
              <div key={note.id} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 ${note.isPinned ? 'ring-2 ring-indigo-500' : ''}`}>
                {editingNote === note.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      rows={3}
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleUpdateNote(note.id)}
                        disabled={saving}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingNote(null)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {note.isPinned && (
                          <span className="text-indigo-600">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
                            </svg>
                          </span>
                        )}
                        <span className="text-sm text-gray-500">{formatDate(note.createdAt)}</span>
                        {note.updatedAt !== note.createdAt && (
                          <span className="text-xs text-gray-400">(edited)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTogglePin(note.id, note.isPinned)}
                          className="text-gray-400 hover:text-indigo-600"
                          title={note.isPinned ? 'Unpin' : 'Pin'}
                        >
                          <svg className="w-5 h-5" fill={note.isPinned ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => { setEditingNote(note.id); setEditContent(note.content); }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-gray-900 dark:text-white whitespace-pre-wrap">{note.content}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Back Link */}
        <div className="mt-6">
          <Link to="/agent/notes" className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            All Notes
          </Link>
        </div>
      </div>
    );
  }

  // All notes overview
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Talent Notes</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Your private notes on talent profiles</p>
      </div>

      {Object.keys(groupedNotes || {}).length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
          <div className="text-5xl mb-4">📝</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No notes yet</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Start adding private notes on talent profiles</p>
          <Link to="/agent/discover" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            Discover Talent
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(groupedNotes!).map(([tid, data]) => (
            <Link
              key={tid}
              to={`/agent/notes/${tid}`}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={data.talent.avatarUrl ? getUploadUrl(data.talent.avatarUrl) : '/default-avatar.png'}
                  alt={data.talent.displayName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{data.talent.displayName}</h3>
                  <p className="text-sm text-gray-500">@{data.talent.username}</p>
                </div>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {data.notes.length} note{data.notes.length !== 1 ? 's' : ''}
              </div>
              {data.notes[0] && (
                <p className="mt-2 text-sm text-gray-500 line-clamp-2">{data.notes[0].content}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default TalentNotes;

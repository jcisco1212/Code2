import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { historyAPI, playlistsAPI, getUploadUrl } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Video {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  viewsCount: number;
  duration: number | null;
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

interface HistoryItem {
  id: string;
  watchedAt: string;
  video: Video;
}

interface Playlist {
  id: string;
  title: string;
  description: string | null;
  visibility: string;
  videoCount: number;
  thumbnailUrl: string | null;
  createdAt: string;
}

const Library: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'history' | 'saved' | 'playlists'>('history');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [saved, setSaved] = useState<Video[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylist, setNewPlaylist] = useState({ title: '', description: '', visibility: 'public' });

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'history') {
        const response = await historyAPI.getHistory({ limit: 50 });
        setHistory(response.data.history || []);
      } else if (activeTab === 'saved') {
        const response = await historyAPI.getSaved({ limit: 50 });
        setSaved(response.data.videos || []);
      } else if (activeTab === 'playlists') {
        const response = await playlistsAPI.getPlaylists();
        setPlaylists(response.data.playlists || []);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Clear all watch history?')) return;
    try {
      await historyAPI.clearHistory();
      setHistory([]);
      toast.success('History cleared');
    } catch (err) {
      toast.error('Failed to clear history');
    }
  };

  const handleRemoveFromHistory = async (videoId: string) => {
    try {
      await historyAPI.removeFromHistory(videoId);
      setHistory(prev => prev.filter(h => h.video.id !== videoId));
    } catch (err) {
      toast.error('Failed to remove');
    }
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await playlistsAPI.createPlaylist({
        name: newPlaylist.title,
        description: newPlaylist.description || undefined,
        isPublic: newPlaylist.visibility === 'public'
      });
      setPlaylists(prev => [response.data.playlist, ...prev]);
      setShowCreatePlaylist(false);
      setNewPlaylist({ title: '', description: '', visibility: 'public' });
      toast.success('Playlist created');
    } catch (err) {
      toast.error('Failed to create playlist');
    }
  };

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Sign in to view your library</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Your watch history, saved videos, and playlists will appear here.</p>
        <Link to="/login" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Library</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
        {(['history', 'saved', 'playlists'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-1 font-medium transition-colors ${
              activeTab === tab
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab === 'history' ? 'Watch History' : tab === 'saved' ? 'Saved Videos' : 'Playlists'}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          {/* Watch History */}
          {activeTab === 'history' && (
            <div>
              {history.length > 0 && (
                <div className="flex justify-end mb-4">
                  <button
                    onClick={handleClearHistory}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Clear All History
                  </button>
                </div>
              )}
              {history.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">📺</div>
                  <p className="text-gray-500 dark:text-gray-400">No watch history yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map(item => (
                    <div key={item.id} className="flex gap-4 bg-white dark:bg-gray-800 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <Link to={`/watch/${item.video.id}`} className="flex-shrink-0">
                        <div className="relative w-40 aspect-video rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                          {item.video.thumbnailUrl ? (
                            <img src={getUploadUrl(item.video.thumbnailUrl) || ''} alt={item.video.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">🎬</div>
                          )}
                          {item.video.duration && (
                            <span className="absolute bottom-1 right-1 bg-black/75 text-white text-xs px-1 rounded">
                              {formatDuration(item.video.duration)}
                            </span>
                          )}
                        </div>
                      </Link>
                      <div className="flex-grow">
                        <Link to={`/watch/${item.video.id}`}>
                          <h3 className="font-medium text-gray-900 dark:text-white hover:text-indigo-600">{item.video.title}</h3>
                        </Link>
                        <Link to={`/profile/${item.video.user.username}`} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700">
                          {item.video.user.firstName} {item.video.user.lastName}
                        </Link>
                        <p className="text-xs text-gray-400 mt-1">{formatNumber(item.video.viewsCount)} views</p>
                      </div>
                      <button
                        onClick={() => handleRemoveFromHistory(item.video.id)}
                        className="text-gray-400 hover:text-red-500"
                        title="Remove from history"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Saved Videos */}
          {activeTab === 'saved' && (
            <div>
              {saved.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">🔖</div>
                  <p className="text-gray-500 dark:text-gray-400">No saved videos yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {saved.map(video => (
                    <Link key={video.id} to={`/watch/${video.id}`} className="group">
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                        {video.thumbnailUrl ? (
                          <img src={getUploadUrl(video.thumbnailUrl) || ''} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">🎬</div>
                        )}
                        {video.duration && (
                          <span className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-1 rounded">
                            {formatDuration(video.duration)}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-2 font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-indigo-600">{video.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{video.user.firstName} {video.user.lastName}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Playlists */}
          {activeTab === 'playlists' && (
            <div>
              <button
                onClick={() => setShowCreatePlaylist(true)}
                className="mb-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                + Create Playlist
              </button>

              {playlists.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">📁</div>
                  <p className="text-gray-500 dark:text-gray-400">No playlists yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {playlists.map(playlist => (
                    <Link key={playlist.id} to={`/playlist/${playlist.id}`} className="group">
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600">
                        {playlist.thumbnailUrl ? (
                          <img src={playlist.thumbnailUrl} alt={playlist.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white text-4xl">📁</div>
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-end p-4">
                          <div>
                            <span className="text-white font-medium">{playlist.videoCount} videos</span>
                          </div>
                        </div>
                      </div>
                      <h3 className="mt-2 font-medium text-gray-900 dark:text-white group-hover:text-indigo-600">{playlist.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{playlist.visibility}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Create Playlist Modal */}
      {showCreatePlaylist && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create Playlist</h2>
            <form onSubmit={handleCreatePlaylist} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  value={newPlaylist.title}
                  onChange={e => setNewPlaylist(p => ({ ...p, title: e.target.value }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={newPlaylist.description}
                  onChange={e => setNewPlaylist(p => ({ ...p, description: e.target.value }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Visibility</label>
                <select
                  value={newPlaylist.visibility}
                  onChange={e => setNewPlaylist(p => ({ ...p, visibility: e.target.value }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreatePlaylist(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Library;

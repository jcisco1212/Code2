import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { playlistsAPI, getUploadUrl } from '../services/api';
import toast from 'react-hot-toast';

interface PlaylistVideo {
  id: string;
  videoId: string;
  position: number;
  addedAt: string;
  video: {
    id: string;
    title: string;
    thumbnailUrl: string | null;
    duration: number;
    viewCount: number;
    createdAt: string;
    user: {
      id: string;
      username: string;
      displayName: string;
      avatarUrl: string | null;
    };
  };
}

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  videoCount: number;
  createdAt: string;
  updatedAt: string;
  videos: PlaylistVideo[];
}

const PlaylistDetail: React.FC = () => {
  const { playlistId } = useParams<{ playlistId: string }>();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '', isPublic: true });

  useEffect(() => {
    if (playlistId) {
      fetchPlaylist();
    }
  }, [playlistId]);

  const fetchPlaylist = async () => {
    try {
      const response = await playlistsAPI.getPlaylist(playlistId!);
      setPlaylist(response.data.playlist);
      setEditForm({
        name: response.data.playlist.name,
        description: response.data.playlist.description || '',
        isPublic: response.data.playlist.isPublic
      });
    } catch (err) {
      toast.error('Failed to load playlist');
      navigate('/library/playlists');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await playlistsAPI.updatePlaylist(playlistId!, {
        name: editForm.name,
        description: editForm.description || undefined,
        isPublic: editForm.isPublic
      });
      setPlaylist(prev => prev ? { ...prev, ...response.data.playlist } : null);
      setEditing(false);
      toast.success('Playlist updated');
    } catch (err) {
      toast.error('Failed to update playlist');
    }
  };

  const handleRemoveVideo = async (videoId: string) => {
    try {
      await playlistsAPI.removeFromPlaylist(playlistId!, videoId);
      setPlaylist(prev => prev ? {
        ...prev,
        videos: prev.videos.filter(v => v.videoId !== videoId),
        videoCount: prev.videoCount - 1
      } : null);
      toast.success('Video removed from playlist');
    } catch (err) {
      toast.error('Failed to remove video');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this playlist? This action cannot be undone.')) return;
    try {
      await playlistsAPI.deletePlaylist(playlistId!);
      toast.success('Playlist deleted');
      navigate('/library/playlists');
    } catch (err) {
      toast.error('Failed to delete playlist');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Playlist not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {editing ? (
              <form onSubmit={handleUpdate} className="space-y-4">
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                  className="text-2xl font-bold w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  required
                />
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  rows={2}
                  placeholder="Description (optional)"
                />
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editForm.isPublic}
                    onChange={e => setEditForm(p => ({ ...p, isPublic: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Public playlist</span>
                </label>
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
              <>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{playlist.name}</h1>
                  <span className={`px-2 py-0.5 text-xs rounded ${playlist.isPublic ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {playlist.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>
                {playlist.description && (
                  <p className="text-gray-600 dark:text-gray-400 mb-2">{playlist.description}</p>
                )}
                <p className="text-sm text-gray-500">{playlist.videoCount} video{playlist.videoCount !== 1 ? 's' : ''}</p>
              </>
            )}
          </div>
          {!editing && (
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
          )}
        </div>
      </div>

      {/* Videos List */}
      {playlist.videos.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
          <div className="text-5xl mb-4">📹</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No videos yet</h2>
          <p className="text-gray-500 dark:text-gray-400">Add videos to this playlist from the video watch page</p>
        </div>
      ) : (
        <div className="space-y-3">
          {playlist.videos.map((item, index) => (
            <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden flex">
              <div className="flex items-center px-4 text-gray-400 font-medium">
                {index + 1}
              </div>
              <Link to={`/watch/${item.videoId}`} className="flex-shrink-0">
                <div className="relative w-40 h-24">
                  <img
                    src={item.video.thumbnailUrl ? getUploadUrl(item.video.thumbnailUrl) : '/placeholder-video.jpg'}
                    alt={item.video.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                    {formatDuration(item.video.duration)}
                  </span>
                </div>
              </Link>
              <div className="flex-1 p-4">
                <Link to={`/watch/${item.videoId}`} className="hover:text-indigo-600">
                  <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2">{item.video.title}</h3>
                </Link>
                <Link to={`/profile/${item.video.user.username}`} className="text-sm text-gray-500 hover:text-indigo-600">
                  {item.video.user.displayName}
                </Link>
                <p className="text-sm text-gray-400">{formatViews(item.video.viewCount)} views</p>
              </div>
              <div className="flex items-center px-4">
                <button
                  onClick={() => handleRemoveVideo(item.videoId)}
                  className="p-2 text-gray-400 hover:text-red-500"
                  title="Remove from playlist"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Back Link */}
      <div className="mt-6">
        <Link to="/library/playlists" className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Playlists
        </Link>
      </div>
    </div>
  );
};

export default PlaylistDetail;

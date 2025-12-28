import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { watchPartiesAPI, getUploadUrl } from '../services/api';
import toast from 'react-hot-toast';
import {
  TvIcon,
  PlayIcon,
  PauseIcon,
  UsersIcon,
  ClockIcon,
  LinkIcon,
  PlusIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import { TvIcon as TvSolidIcon } from '@heroicons/react/24/solid';

interface Video {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  duration: number | null;
}

interface WatchParty {
  id: string;
  title: string;
  description: string | null;
  inviteCode: string;
  status: 'waiting' | 'playing' | 'paused' | 'ended';
  isPrivate: boolean;
  maxParticipants: number;
  scheduledAt: string | null;
  createdAt: string;
  host: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  video: Video;
  participants?: Array<{
    user: {
      id: string;
      username: string;
      avatarUrl: string | null;
    };
  }>;
}

const WatchParties: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [activeParties, setActiveParties] = useState<WatchParty[]>([]);
  const [myParties, setMyParties] = useState<WatchParty[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'my'>('active');
  const [inviteCode, setInviteCode] = useState('');
  const [joiningCode, setJoiningCode] = useState(false);

  useEffect(() => {
    fetchParties();
  }, [isAuthenticated]);

  const fetchParties = async () => {
    try {
      setLoading(true);
      const [activeRes, myRes] = await Promise.all([
        watchPartiesAPI.getActive({ limit: 20 }),
        isAuthenticated ? watchPartiesAPI.getMyParties('all') : Promise.resolve({ data: { parties: [] } })
      ]);
      setActiveParties(activeRes.data.parties || []);
      setMyParties(myRes.data.parties || []);
    } catch (err) {
      console.error('Failed to fetch watch parties:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinByCode = async () => {
    if (!inviteCode.trim()) {
      toast.error('Please enter an invite code');
      return;
    }

    try {
      setJoiningCode(true);
      const response = await watchPartiesAPI.getByInvite(inviteCode.toUpperCase());
      if (response.data.party) {
        navigate(`/watch-party/${response.data.party.id}`);
      }
    } catch (err) {
      toast.error('Invalid invite code');
    } finally {
      setJoiningCode(false);
    }
  };

  const handleJoinParty = async (partyId: string) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to join a watch party');
      navigate('/login');
      return;
    }

    try {
      await watchPartiesAPI.joinParty(partyId);
      navigate(`/watch-party/${partyId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to join party');
    }
  };

  const formatTime = (seconds: number | null) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting':
        return <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs font-medium">Waiting</span>;
      case 'playing':
        return <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs font-medium flex items-center gap-1"><PlayIcon className="w-3 h-3" /> Playing</span>;
      case 'paused':
        return <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded text-xs font-medium flex items-center gap-1"><PauseIcon className="w-3 h-3" /> Paused</span>;
      default:
        return null;
    }
  };

  const parties = tab === 'active' ? activeParties : myParties;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <TvSolidIcon className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-2xl font-bold text-white">Watch Parties</h1>
            <p className="text-gray-400">Watch videos together in real-time</p>
          </div>
        </div>
        {isAuthenticated && (
          <Link
            to="/watch-party/create"
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Create Party</span>
          </Link>
        )}
      </div>

      {/* Join by Code */}
      <div className="bg-[#282828] rounded-xl p-4 mb-8 border border-[#404040]">
        <div className="flex items-center gap-4">
          <LinkIcon className="w-6 h-6 text-gray-400" />
          <div className="flex-1">
            <input
              type="text"
              placeholder="Enter invite code to join..."
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="w-full bg-transparent text-white placeholder:text-gray-500 focus:outline-none text-lg"
              maxLength={8}
            />
          </div>
          <button
            onClick={handleJoinByCode}
            disabled={joiningCode || !inviteCode.trim()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-full transition-colors font-medium"
          >
            {joiningCode ? 'Joining...' : 'Join'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 mb-6 border-b border-[#333333]">
        <button
          onClick={() => setTab('active')}
          className={`pb-3 px-1 text-sm font-medium transition-colors flex items-center gap-2 ${
            tab === 'active'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <TvIcon className="w-4 h-4" />
          Active Parties
        </button>
        {isAuthenticated && (
          <button
            onClick={() => setTab('my')}
            className={`pb-3 px-1 text-sm font-medium transition-colors flex items-center gap-2 ${
              tab === 'my'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <UsersIcon className="w-4 h-4" />
            My Parties
          </button>
        )}
      </div>

      {/* Parties Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-[#282828] rounded-xl overflow-hidden animate-pulse">
              <div className="aspect-video bg-[#404040]" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-[#404040] rounded w-3/4" />
                <div className="h-3 bg-[#404040] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : parties.length === 0 ? (
        <div className="text-center py-16">
          <TvIcon className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            {tab === 'my' ? 'No Parties Yet' : 'No Active Parties'}
          </h3>
          <p className="text-gray-400 mb-6">
            {tab === 'my'
              ? 'Create a watch party to watch videos with friends!'
              : 'Be the first to host a watch party!'}
          </p>
          {isAuthenticated && (
            <Link
              to="/watch-party/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-full"
            >
              <PlusIcon className="w-5 h-5" />
              Create Your First Party
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {parties.map(party => (
            <div
              key={party.id}
              className="bg-[#282828] rounded-xl overflow-hidden group cursor-pointer hover:bg-[#333333] transition-colors border border-[#404040]"
              onClick={() => handleJoinParty(party.id)}
            >
              {/* Video Thumbnail */}
              <div className="aspect-video relative">
                {party.video.thumbnailUrl ? (
                  <img
                    src={getUploadUrl(party.video.thumbnailUrl) || ''}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <TvIcon className="w-12 h-12 text-gray-600" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="px-4 py-2 bg-blue-600 rounded-full text-white font-medium flex items-center gap-2">
                    <UsersIcon className="w-5 h-5" />
                    Join Party
                  </div>
                </div>
                {/* Status Badge */}
                <div className="absolute top-2 left-2">
                  {getStatusBadge(party.status)}
                </div>
                {/* Private Badge */}
                {party.isPrivate && (
                  <div className="absolute top-2 right-2 bg-black/70 p-1.5 rounded">
                    <LockClosedIcon className="w-4 h-4 text-gray-400" />
                  </div>
                )}
                {/* Duration */}
                <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-xs text-white">
                  {formatTime(party.video.duration)}
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="text-white font-medium mb-1 line-clamp-1">{party.title}</h3>
                <p className="text-gray-400 text-sm mb-3 line-clamp-1">{party.video.title}</p>

                <div className="flex items-center justify-between">
                  {/* Host */}
                  <div className="flex items-center gap-2">
                    {party.host.avatarUrl ? (
                      <img
                        src={getUploadUrl(party.host.avatarUrl) || ''}
                        alt=""
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                        <span className="text-[10px] text-white">
                          {party.host.firstName?.charAt(0)}
                        </span>
                      </div>
                    )}
                    <span className="text-gray-400 text-sm">@{party.host.username}</span>
                  </div>

                  {/* Participants */}
                  <div className="flex items-center gap-1 text-gray-400 text-sm">
                    <UsersIcon className="w-4 h-4" />
                    <span>{party.participants?.length || 0}/{party.maxParticipants}</span>
                  </div>
                </div>

                {/* Invite Code */}
                <div className="mt-3 pt-3 border-t border-[#404040] flex items-center justify-between">
                  <span className="text-xs text-gray-500">Invite Code</span>
                  <code className="px-2 py-1 bg-[#1a1a1a] rounded text-blue-400 text-xs font-mono">
                    {party.inviteCode}
                  </code>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* How Watch Parties Work */}
      <div className="mt-12 bg-[#1a1a1a] rounded-xl p-6 border border-[#333333]">
        <h2 className="text-lg font-semibold text-white mb-4">How Watch Parties Work</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-blue-600/20 rounded-xl flex items-center justify-center">
              <PlusIcon className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="font-medium text-white mb-1">Create a Party</h3>
            <p className="text-sm text-gray-400">
              Pick a video and set up your watch party
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-blue-600/20 rounded-xl flex items-center justify-center">
              <LinkIcon className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="font-medium text-white mb-1">Share the Code</h3>
            <p className="text-sm text-gray-400">
              Send the invite code to your friends
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-blue-600/20 rounded-xl flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="font-medium text-white mb-1">Everyone Joins</h3>
            <p className="text-sm text-gray-400">
              Friends join using the invite code
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-blue-600/20 rounded-xl flex items-center justify-center">
              <PlayIcon className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="font-medium text-white mb-1">Watch Together</h3>
            <p className="text-sm text-gray-400">
              Video syncs for everyone in the party
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchParties;

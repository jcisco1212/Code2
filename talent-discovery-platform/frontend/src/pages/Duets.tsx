import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { duetsAPI, getUploadUrl } from '../services/api';
import DuetPlayer from '../components/video/DuetPlayer';
import { UsersIcon, FireIcon, PlayIcon, EyeIcon } from '@heroicons/react/24/outline';
import { UsersIcon as UsersSolidIcon } from '@heroicons/react/24/solid';

interface Video {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  hlsUrl: string | null;
  duration: number | null;
  viewsCount: number;
  user?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

interface Duet {
  id: string;
  layout: 'side_by_side' | 'top_bottom' | 'picture_in_picture' | 'green_screen';
  audioMix: 'both' | 'original' | 'response';
  originalVolume: number;
  responseVolume: number;
  syncOffset: number;
  viewsCount: number;
  likesCount: number;
  createdAt: string;
  originalVideo: Video;
  responseVideo: Video;
  creator: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

const Duets: React.FC = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [trendingDuets, setTrendingDuets] = useState<Duet[]>([]);
  const [myDuets, setMyDuets] = useState<Duet[]>([]);
  const [selectedDuet, setSelectedDuet] = useState<Duet | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'trending' | 'my'>('trending');

  useEffect(() => {
    fetchDuets();
  }, [isAuthenticated]);

  const fetchDuets = async () => {
    try {
      setLoading(true);
      const [trendingRes, myRes] = await Promise.all([
        duetsAPI.getTrending(20),
        isAuthenticated ? duetsAPI.getMyDuets({ limit: 20 }) : Promise.resolve({ data: { duets: [] } })
      ]);
      setTrendingDuets(trendingRes.data.duets || []);
      setMyDuets(myRes.data.duets || []);
    } catch (err) {
      console.error('Failed to fetch duets:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatViews = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const duets = tab === 'trending' ? trendingDuets : myDuets;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <UsersSolidIcon className="w-8 h-8 text-purple-500" />
          <div>
            <h1 className="text-2xl font-bold text-white">Duets & Collabs</h1>
            <p className="text-gray-400">Create split-screen videos with other creators</p>
          </div>
        </div>
        {isAuthenticated && (
          <Link
            to="/upload?mode=duet"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full transition-all"
          >
            <UsersIcon className="w-5 h-5" />
            <span>Create Duet</span>
          </Link>
        )}
      </div>

      {/* Selected Duet Player */}
      {selectedDuet && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Now Playing</h2>
            <button
              onClick={() => setSelectedDuet(null)}
              className="text-gray-400 hover:text-white text-sm"
            >
              Close
            </button>
          </div>
          <DuetPlayer
            originalVideo={selectedDuet.originalVideo}
            responseVideo={selectedDuet.responseVideo}
            layout={selectedDuet.layout}
            audioMix={selectedDuet.audioMix}
            originalVolume={selectedDuet.originalVolume}
            responseVolume={selectedDuet.responseVolume}
            syncOffset={selectedDuet.syncOffset}
          />
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to={`/profile/${selectedDuet.originalVideo.user?.username}`}
                className="flex items-center gap-2"
              >
                {selectedDuet.originalVideo.user?.avatarUrl ? (
                  <img
                    src={getUploadUrl(selectedDuet.originalVideo.user.avatarUrl) || ''}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                    <span className="text-xs text-white">
                      {selectedDuet.originalVideo.user?.firstName?.charAt(0)}
                    </span>
                  </div>
                )}
                <span className="text-white text-sm">@{selectedDuet.originalVideo.user?.username}</span>
              </Link>
              <span className="text-gray-500">+</span>
              <Link
                to={`/profile/${selectedDuet.creator.username}`}
                className="flex items-center gap-2"
              >
                {selectedDuet.creator.avatarUrl ? (
                  <img
                    src={getUploadUrl(selectedDuet.creator.avatarUrl) || ''}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                    <span className="text-xs text-white">
                      {selectedDuet.creator.firstName?.charAt(0)}
                    </span>
                  </div>
                )}
                <span className="text-white text-sm">@{selectedDuet.creator.username}</span>
              </Link>
            </div>
            <div className="flex items-center gap-1 text-gray-400 text-sm">
              <EyeIcon className="w-4 h-4" />
              <span>{formatViews(selectedDuet.viewsCount)} views</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-4 mb-6 border-b border-[#333333]">
        <button
          onClick={() => setTab('trending')}
          className={`pb-3 px-1 text-sm font-medium transition-colors flex items-center gap-2 ${
            tab === 'trending'
              ? 'text-white border-b-2 border-red-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <FireIcon className="w-4 h-4" />
          Trending Duets
        </button>
        {isAuthenticated && (
          <button
            onClick={() => setTab('my')}
            className={`pb-3 px-1 text-sm font-medium transition-colors flex items-center gap-2 ${
              tab === 'my'
                ? 'text-white border-b-2 border-red-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <UsersIcon className="w-4 h-4" />
            My Duets
          </button>
        )}
      </div>

      {/* Duets Grid */}
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
      ) : duets.length === 0 ? (
        <div className="text-center py-16">
          <UsersIcon className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            {tab === 'my' ? 'No Duets Yet' : 'No Duets Found'}
          </h3>
          <p className="text-gray-400 mb-6">
            {tab === 'my'
              ? 'Create your first duet by responding to another creator\'s video!'
              : 'Be the first to create a duet and start collaborating!'}
          </p>
          {isAuthenticated && (
            <Link
              to="/upload?mode=duet"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full"
            >
              <UsersIcon className="w-5 h-5" />
              Create Your First Duet
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {duets.map(duet => (
            <div
              key={duet.id}
              className="bg-[#282828] rounded-xl overflow-hidden group cursor-pointer hover:bg-[#333333] transition-colors border border-[#404040]"
              onClick={() => setSelectedDuet(duet)}
            >
              {/* Split Thumbnail Preview */}
              <div className="aspect-video relative flex">
                {/* Left half - Original */}
                <div className="w-1/2 h-full relative overflow-hidden">
                  {duet.originalVideo.thumbnailUrl ? (
                    <img
                      src={getUploadUrl(duet.originalVideo.thumbnailUrl) || ''}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-800" />
                  )}
                </div>
                {/* Center divider */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/50 z-10" />
                {/* Right half - Response */}
                <div className="w-1/2 h-full relative overflow-hidden">
                  {duet.responseVideo.thumbnailUrl ? (
                    <img
                      src={getUploadUrl(duet.responseVideo.thumbnailUrl) || ''}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-800" />
                  )}
                </div>
                {/* Play overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <PlayIcon className="w-7 h-7 text-white ml-1" />
                  </div>
                </div>
                {/* Duet badge */}
                <div className="absolute top-2 left-2 bg-gradient-to-r from-purple-600 to-pink-600 px-2 py-0.5 rounded text-xs font-medium text-white">
                  Duet
                </div>
                {/* Views */}
                <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-0.5 rounded text-xs text-white flex items-center gap-1">
                  <EyeIcon className="w-3 h-3" />
                  {formatViews(duet.viewsCount)}
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  {/* Original creator avatar */}
                  {duet.originalVideo.user?.avatarUrl ? (
                    <img
                      src={getUploadUrl(duet.originalVideo.user.avatarUrl) || ''}
                      alt=""
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
                      <span className="text-[10px] text-white">
                        {duet.originalVideo.user?.firstName?.charAt(0)}
                      </span>
                    </div>
                  )}
                  <span className="text-gray-400 text-xs">+</span>
                  {/* Response creator avatar */}
                  {duet.creator.avatarUrl ? (
                    <img
                      src={getUploadUrl(duet.creator.avatarUrl) || ''}
                      alt=""
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-pink-600 flex items-center justify-center">
                      <span className="text-[10px] text-white">
                        {duet.creator.firstName?.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <h3 className="text-white font-medium text-sm line-clamp-1 mb-1">
                  {duet.originalVideo.title}
                </h3>
                <p className="text-gray-400 text-xs">
                  @{duet.originalVideo.user?.username} + @{duet.creator.username}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* How Duets Work */}
      <div className="mt-12 bg-[#1a1a1a] rounded-xl p-6 border border-[#333333]">
        <h2 className="text-lg font-semibold text-white mb-4">How Duets Work</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-purple-600/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">1</span>
            </div>
            <h3 className="font-medium text-white mb-1">Find a Video</h3>
            <p className="text-sm text-gray-400">
              Browse videos and click the "Duet" button on any video you want to collaborate with
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-purple-600/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">2</span>
            </div>
            <h3 className="font-medium text-white mb-1">Record Your Response</h3>
            <p className="text-sm text-gray-400">
              Upload your video response that will play alongside the original
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-purple-600/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">3</span>
            </div>
            <h3 className="font-medium text-white mb-1">Customize & Share</h3>
            <p className="text-sm text-gray-400">
              Choose your layout, sync the audio, and share your duet with the world
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Duets;

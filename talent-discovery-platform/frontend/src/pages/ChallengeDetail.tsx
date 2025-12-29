import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { challengesAPI, videosAPI, getUploadUrl } from '../services/api';
import { ClockIcon, UserGroupIcon, CheckCircleIcon, PlayIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon, HeartIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

interface Challenge {
  id: string;
  title: string;
  description: string;
  rules: string | null;
  hashtag: string;
  coverImageUrl: string | null;
  prize: string | null;
  prizeAmount: number | null;
  status: string;
  startDate: string;
  endDate: string;
  votingEndDate: string | null;
  minDuration: number | null;
  maxDuration: number | null;
  maxEntries: number | null;
  entriesCount: number;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  creator?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  winner?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

interface Entry {
  id: string;
  votesCount: number;
  rank: number | null;
  video: {
    id: string;
    title: string;
    thumbnailUrl: string | null;
    duration: number | null;
    viewsCount: number;
  };
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

interface UserVideo {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  duration: number | null;
}

const ChallengeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [leaderboard, setLeaderboard] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [myEntry, setMyEntry] = useState<Entry | null>(null);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [userVideos, setUserVideos] = useState<UserVideo[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<'votes' | 'recent'>('votes');

  useEffect(() => {
    if (id) {
      fetchChallenge();
      fetchEntries();
      fetchLeaderboard();
      if (isAuthenticated) {
        fetchMyEntry();
        fetchMyVote();
      }
    }
  }, [id, isAuthenticated]);

  useEffect(() => {
    fetchEntries();
  }, [sortBy]);

  const fetchChallenge = async () => {
    try {
      setLoading(true);
      const response = await challengesAPI.getChallenge(id!);
      setChallenge(response.data.challenge);
    } catch (err) {
      console.error('Failed to fetch challenge:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEntries = async () => {
    try {
      const response = await challengesAPI.getEntries(id!, { sort: sortBy, limit: 50 });
      setEntries(response.data.entries || []);
    } catch (err) {
      console.error('Failed to fetch entries:', err);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await challengesAPI.getLeaderboard(id!, 10);
      setLeaderboard(response.data.leaderboard || []);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    }
  };

  const fetchMyEntry = async () => {
    try {
      const response = await challengesAPI.getMyEntry(id!);
      setMyEntry(response.data.entry);
    } catch (err) {
      // User hasn't entered
    }
  };

  const fetchMyVote = async () => {
    try {
      const response = await challengesAPI.getMyVote(id!);
      setMyVote(response.data.vote?.entryId || null);
    } catch (err) {
      // No vote
    }
  };

  const fetchUserVideos = async () => {
    try {
      const response = await videosAPI.getUserVideos(user?.id!, { limit: 50 });
      setUserVideos(response.data.videos || []);
    } catch (err) {
      console.error('Failed to fetch user videos:', err);
    }
  };

  const handleOpenSubmitModal = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to enter challenges');
      return;
    }
    fetchUserVideos();
    setShowSubmitModal(true);
  };

  const handleSubmitEntry = async () => {
    if (!selectedVideoId) {
      toast.error('Please select a video');
      return;
    }

    setSubmitting(true);
    try {
      await challengesAPI.submitEntry(id!, selectedVideoId);
      toast.success('Entry submitted successfully!');
      setShowSubmitModal(false);
      fetchMyEntry();
      fetchEntries();
      fetchChallenge();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to submit entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (entryId: string) => {
    if (!isAuthenticated) {
      toast.error('Please log in to vote');
      return;
    }

    try {
      const response = await challengesAPI.vote(id!, entryId);
      if (response.data.voted) {
        setMyVote(entryId);
        toast.success('Vote recorded!');
      } else {
        setMyVote(null);
        toast.success('Vote removed');
      }
      fetchEntries();
      fetchLeaderboard();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to vote');
    }
  };

  const getTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days} days, ${hours} hours`;
    if (hours > 0) return `${hours} hours, ${minutes} minutes`;
    return `${minutes} minutes`;
  };

  const isActive = () => {
    if (!challenge) return false;
    const now = new Date();
    return challenge.status === 'active' && now >= new Date(challenge.startDate) && now <= new Date(challenge.endDate);
  };

  const isVoting = () => {
    if (!challenge) return false;
    const now = new Date();
    return challenge.status === 'voting' ||
      (challenge.status === 'active' && now > new Date(challenge.endDate) &&
       (!challenge.votingEndDate || now <= new Date(challenge.votingEndDate)));
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-[#404040] rounded w-1/3 mb-4" />
          <div className="h-4 bg-[#404040] rounded w-2/3 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-[#404040] rounded-xl" />
              ))}
            </div>
            <div className="h-64 bg-[#404040] rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <StarIcon className="w-16 h-16 mx-auto text-gray-600 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Challenge Not Found</h2>
        <Link to="/challenges" className="text-red-500 hover:text-red-400">
          Back to Challenges
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <Link to="/challenges" className="text-gray-400 hover:text-white text-sm mb-4 inline-block">
          &larr; Back to Challenges
        </Link>

        <div className="flex flex-col md:flex-row gap-6 items-start">
          {challenge.coverImageUrl && (
            <img
              src={getUploadUrl(challenge.coverImageUrl) || ''}
              alt={challenge.title}
              className="w-full md:w-64 h-40 object-cover rounded-xl"
            />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-red-500 font-semibold text-lg">#{challenge.hashtag}</span>
              {isActive() && (
                <span className="px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-full">Active</span>
              )}
              {isVoting() && (
                <span className="px-2 py-1 text-xs font-medium bg-yellow-500/20 text-yellow-400 rounded-full">Voting Open</span>
              )}
              {challenge.status === 'completed' && (
                <span className="px-2 py-1 text-xs font-medium bg-gray-500/20 text-gray-400 rounded-full">Completed</span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">{challenge.title}</h1>
            <p className="text-gray-400 mb-4">{challenge.description}</p>

            <div className="flex flex-wrap items-center gap-4 text-sm">
              {challenge.prize && (
                <div className="flex items-center gap-1 text-yellow-400">
                  <StarSolidIcon className="w-5 h-5" />
                  <span className="font-semibold">{challenge.prize}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-gray-400">
                <UserGroupIcon className="w-5 h-5" />
                <span>{challenge.entriesCount} entries</span>
              </div>
              <div className="flex items-center gap-1 text-gray-400">
                <ClockIcon className="w-5 h-5" />
                <span>{isActive() ? getTimeRemaining(challenge.endDate) + ' to enter' : isVoting() && challenge.votingEndDate ? getTimeRemaining(challenge.votingEndDate) + ' to vote' : 'Ended'}</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="w-full md:w-auto">
            {isActive() && !myEntry && (
              <button
                onClick={handleOpenSubmitModal}
                className="w-full md:w-auto px-6 py-3 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 transition-colors"
              >
                Enter Challenge
              </button>
            )}
            {myEntry && (
              <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5" />
                <span>You've entered!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rules */}
      {challenge.rules && (
        <div className="bg-[#282828] rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-3">Rules</h2>
          <div className="text-gray-400 whitespace-pre-wrap">{challenge.rules}</div>
          {(challenge.minDuration || challenge.maxDuration) && (
            <div className="mt-4 pt-4 border-t border-[#404040] text-sm text-gray-500">
              Video duration: {challenge.minDuration ? `Min ${challenge.minDuration}s` : ''} {challenge.minDuration && challenge.maxDuration ? ' - ' : ''} {challenge.maxDuration ? `Max ${challenge.maxDuration}s` : ''}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Entries */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Entries</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy('votes')}
                className={`px-3 py-1 rounded-full text-sm ${sortBy === 'votes' ? 'bg-red-600 text-white' : 'bg-[#404040] text-gray-300'}`}
              >
                Top Votes
              </button>
              <button
                onClick={() => setSortBy('recent')}
                className={`px-3 py-1 rounded-full text-sm ${sortBy === 'recent' ? 'bg-red-600 text-white' : 'bg-[#404040] text-gray-300'}`}
              >
                Recent
              </button>
            </div>
          </div>

          {entries.length === 0 ? (
            <div className="bg-[#282828] rounded-xl p-8 text-center">
              <PlayIcon className="w-12 h-12 mx-auto text-gray-600 mb-3" />
              <p className="text-gray-400">No entries yet. Be the first to enter!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`bg-[#282828] rounded-xl overflow-hidden border ${myVote === entry.id ? 'border-red-500' : 'border-[#404040]'}`}
                >
                  <div className="flex gap-4 p-4">
                    {/* Rank */}
                    <div className="flex-shrink-0 w-8 text-center">
                      {index < 3 ? (
                        <span className={`text-2xl font-bold ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : 'text-amber-600'}`}>
                          {index + 1}
                        </span>
                      ) : (
                        <span className="text-gray-500">{index + 1}</span>
                      )}
                    </div>

                    {/* Video Thumbnail */}
                    <Link to={`/watch/${entry.video.id}`} className="flex-shrink-0 relative">
                      {entry.video.thumbnailUrl ? (
                        <img
                          src={getUploadUrl(entry.video.thumbnailUrl) || ''}
                          alt={entry.video.title}
                          className="w-32 h-20 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-32 h-20 bg-[#404040] rounded-lg flex items-center justify-center">
                          <PlayIcon className="w-8 h-8 text-gray-600" />
                        </div>
                      )}
                      {entry.video.duration && (
                        <span className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/80 text-white text-xs rounded">
                          {formatDuration(entry.video.duration)}
                        </span>
                      )}
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link to={`/watch/${entry.video.id}`} className="block">
                        <h3 className="font-medium text-white hover:text-red-400 line-clamp-1">
                          {entry.video.title}
                        </h3>
                      </Link>
                      <Link to={`/profile/${entry.user.username}`} className="flex items-center gap-2 mt-1">
                        {entry.user.avatarUrl ? (
                          <img
                            src={getUploadUrl(entry.user.avatarUrl) || ''}
                            alt={entry.user.username}
                            className="w-5 h-5 rounded-full"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                        )}
                        <span className="text-sm text-gray-400 hover:text-white">
                          {entry.user.firstName} {entry.user.lastName}
                        </span>
                      </Link>
                    </div>

                    {/* Vote */}
                    <div className="flex flex-col items-center justify-center">
                      <button
                        onClick={() => handleVote(entry.id)}
                        disabled={!isVoting() && !isActive()}
                        className={`p-2 rounded-full transition-colors ${
                          myVote === entry.id
                            ? 'bg-red-600 text-white'
                            : 'bg-[#404040] text-gray-400 hover:bg-red-600/20 hover:text-red-400'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <HeartIcon className="w-5 h-5" />
                      </button>
                      <span className="text-sm font-semibold text-white mt-1">{entry.votesCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar - Leaderboard */}
        <div>
          <div className="bg-[#282828] rounded-xl p-6 sticky top-4">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <StarSolidIcon className="w-5 h-5 text-yellow-400" />
              Leaderboard
            </h2>
            {leaderboard.length === 0 ? (
              <p className="text-gray-400 text-sm">No entries yet</p>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((entry, index) => (
                  <div key={entry.id} className="flex items-center gap-3">
                    <span className={`w-6 text-center font-bold ${
                      index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-amber-600' : 'text-gray-500'
                    }`}>
                      {index + 1}
                    </span>
                    <Link to={`/profile/${entry.user.username}`} className="flex items-center gap-2 flex-1 min-w-0">
                      {entry.user.avatarUrl ? (
                        <img
                          src={getUploadUrl(entry.user.avatarUrl) || ''}
                          alt={entry.user.username}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                      )}
                      <span className="text-sm text-white truncate">
                        {entry.user.firstName} {entry.user.lastName}
                      </span>
                    </Link>
                    <span className="text-sm font-semibold text-red-400">{entry.votesCount}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit Entry Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowSubmitModal(false)}>
          <div className="bg-[#282828] rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[#404040]">
              <h2 className="text-xl font-bold text-white">Select a Video to Enter</h2>
              <p className="text-gray-400 text-sm mt-1">Choose one of your videos for #{challenge.hashtag}</p>
            </div>
            <div className="p-4 overflow-y-auto max-h-[50vh]">
              {userVideos.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">You haven't uploaded any videos yet</p>
                  <Link to="/upload" className="text-red-500 hover:text-red-400">
                    Upload a video
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {userVideos.map((video) => (
                    <button
                      key={video.id}
                      onClick={() => setSelectedVideoId(video.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                        selectedVideoId === video.id
                          ? 'bg-red-600/20 border-2 border-red-500'
                          : 'bg-[#404040] hover:bg-[#505050] border-2 border-transparent'
                      }`}
                    >
                      {video.thumbnailUrl ? (
                        <img
                          src={getUploadUrl(video.thumbnailUrl) || ''}
                          alt={video.title}
                          className="w-20 h-12 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-20 h-12 bg-[#606060] rounded-lg flex items-center justify-center">
                          <PlayIcon className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 text-left">
                        <p className="text-white font-medium line-clamp-1">{video.title}</p>
                        {video.duration && (
                          <p className="text-gray-400 text-sm">{formatDuration(video.duration)}</p>
                        )}
                      </div>
                      {selectedVideoId === video.id && (
                        <CheckCircleIcon className="w-6 h-6 text-red-500" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-[#404040] flex gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 px-4 py-2 bg-[#404040] text-white rounded-full hover:bg-[#505050]"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitEntry}
                disabled={!selectedVideoId || submitting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallengeDetail;

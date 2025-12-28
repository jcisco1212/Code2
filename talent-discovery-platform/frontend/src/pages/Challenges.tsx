import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { challengesAPI, getUploadUrl } from '../services/api';
import { TrophyIcon, ClockIcon, UserGroupIcon, FireIcon } from '@heroicons/react/24/outline';
import { TrophyIcon as TrophySolidIcon } from '@heroicons/react/24/solid';

interface Challenge {
  id: string;
  title: string;
  description: string;
  hashtag: string;
  coverImageUrl: string | null;
  prize: string | null;
  prizeAmount: number | null;
  status: string;
  startDate: string;
  endDate: string;
  votingEndDate: string | null;
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
}

const Challenges: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [featuredChallenges, setFeaturedChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'voting' | 'completed'>('all');

  useEffect(() => {
    fetchChallenges();
    fetchFeatured();
  }, [filter]);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 20 };
      if (filter !== 'all') params.status = filter;
      const response = await challengesAPI.getChallenges(params);
      setChallenges(response.data.challenges || []);
    } catch (err) {
      console.error('Failed to fetch challenges:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeatured = async () => {
    try {
      const response = await challengesAPI.getFeatured();
      setFeaturedChallenges(response.data.challenges || []);
    } catch (err) {
      console.error('Failed to fetch featured challenges:', err);
    }
  };

  const getTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h left`;
    return 'Ending soon';
  };

  const getStatusBadge = (status: string, endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const isEnded = now > end;

    if (status === 'active' && !isEnded) {
      return <span className="px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-full">Active</span>;
    }
    if (status === 'voting' || (status === 'active' && isEnded)) {
      return <span className="px-2 py-1 text-xs font-medium bg-yellow-500/20 text-yellow-400 rounded-full">Voting</span>;
    }
    if (status === 'completed') {
      return <span className="px-2 py-1 text-xs font-medium bg-gray-500/20 text-gray-400 rounded-full">Completed</span>;
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <TrophySolidIcon className="w-8 h-8 text-yellow-500" />
        <div>
          <h1 className="text-2xl font-bold text-white">Challenges</h1>
          <p className="text-gray-400">Compete, create, and win prizes</p>
        </div>
      </div>

      {/* Featured Challenges */}
      {featuredChallenges.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FireIcon className="w-5 h-5 text-orange-500" />
            Featured Challenges
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredChallenges.slice(0, 3).map((challenge) => (
              <Link
                key={challenge.id}
                to={`/challenges/${challenge.id}`}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600/20 to-purple-600/20 border border-red-500/30 hover:border-red-500/50 transition-all"
              >
                {challenge.coverImageUrl && (
                  <div className="absolute inset-0 opacity-30">
                    <img
                      src={getUploadUrl(challenge.coverImageUrl) || ''}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="relative p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-red-400 font-medium">#{challenge.hashtag}</span>
                    {getStatusBadge(challenge.status, challenge.endDate)}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-red-400 transition-colors">
                    {challenge.title}
                  </h3>
                  <p className="text-gray-400 text-sm line-clamp-2 mb-4">{challenge.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-gray-400">
                      <UserGroupIcon className="w-4 h-4" />
                      <span>{challenge.entriesCount} entries</span>
                    </div>
                    {challenge.prize && (
                      <div className="flex items-center gap-1 text-yellow-400">
                        <TrophyIcon className="w-4 h-4" />
                        <span>{challenge.prize}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-red-400 text-sm">
                    <ClockIcon className="w-4 h-4" />
                    <span>{getTimeRemaining(challenge.endDate)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6">
        {(['all', 'active', 'voting', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-red-600 text-white'
                : 'bg-[#282828] text-gray-300 hover:bg-[#383838]'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Challenges Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-[#282828] rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-[#404040] rounded w-1/3 mb-3" />
              <div className="h-6 bg-[#404040] rounded w-3/4 mb-2" />
              <div className="h-4 bg-[#404040] rounded w-full mb-4" />
              <div className="h-4 bg-[#404040] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : challenges.length === 0 ? (
        <div className="text-center py-16">
          <TrophyIcon className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Challenges Found</h3>
          <p className="text-gray-400">Check back soon for new challenges!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges.map((challenge) => (
            <Link
              key={challenge.id}
              to={`/challenges/${challenge.id}`}
              className="group bg-[#282828] rounded-xl overflow-hidden hover:bg-[#333333] transition-colors border border-[#404040]"
            >
              {challenge.coverImageUrl ? (
                <div className="aspect-video relative">
                  <img
                    src={getUploadUrl(challenge.coverImageUrl) || ''}
                    alt={challenge.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <span className="text-red-400 font-medium">#{challenge.hashtag}</span>
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-red-600/30 to-purple-600/30 flex items-center justify-center">
                  <TrophyIcon className="w-16 h-16 text-gray-600" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-white group-hover:text-red-400 transition-colors line-clamp-1">
                    {challenge.title}
                  </h3>
                  {getStatusBadge(challenge.status, challenge.endDate)}
                </div>
                <p className="text-gray-400 text-sm line-clamp-2 mb-3">{challenge.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-gray-400">
                      <UserGroupIcon className="w-4 h-4" />
                      <span>{challenge.entriesCount}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400">
                      <ClockIcon className="w-4 h-4" />
                      <span>{getTimeRemaining(challenge.endDate)}</span>
                    </div>
                  </div>
                  {challenge.prize && (
                    <div className="text-yellow-400 font-medium">
                      {challenge.prize}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Challenges;

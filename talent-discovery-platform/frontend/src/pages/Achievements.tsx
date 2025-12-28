import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { achievementsAPI } from '../services/api';
import { TrophyIcon, SparklesIcon, StarIcon, FireIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { TrophyIcon as TrophySolidIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: string;
  requirement: number;
  requirementType: string;
  xpReward: number;
}

interface UserAchievement {
  id: string;
  achievementId: string;
  earnedAt: string | null;
  progress: number;
  isDisplayed: boolean;
  achievement: Achievement;
}

const CATEGORY_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  uploads: { label: 'Uploads', icon: <SparklesIcon className="w-5 h-5" />, color: 'text-blue-400' },
  views: { label: 'Views', icon: <FireIcon className="w-5 h-5" />, color: 'text-orange-400' },
  engagement: { label: 'Engagement', icon: <StarIcon className="w-5 h-5" />, color: 'text-yellow-400' },
  social: { label: 'Social', icon: <TrophyIcon className="w-5 h-5" />, color: 'text-purple-400' },
  special: { label: 'Special', icon: <CheckBadgeIcon className="w-5 h-5" />, color: 'text-red-400' }
};

const RARITY_STYLES: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  common: { bg: 'bg-gray-700/50', border: 'border-gray-600', text: 'text-gray-300', glow: '' },
  uncommon: { bg: 'bg-green-900/30', border: 'border-green-600', text: 'text-green-400', glow: '' },
  rare: { bg: 'bg-blue-900/30', border: 'border-blue-500', text: 'text-blue-400', glow: 'shadow-blue-500/20' },
  epic: { bg: 'bg-purple-900/30', border: 'border-purple-500', text: 'text-purple-400', glow: 'shadow-purple-500/30' },
  legendary: { bg: 'bg-yellow-900/30', border: 'border-yellow-500', text: 'text-yellow-400', glow: 'shadow-yellow-500/40 shadow-lg' }
};

const ICON_MAP: Record<string, string> = {
  rocket: '🚀',
  film: '🎬',
  star: '⭐',
  crown: '👑',
  eye: '👁️',
  fire: '🔥',
  lightning: '⚡',
  globe: '🌍',
  heart: '❤️',
  heartFire: '💖',
  users: '👥',
  userPlus: '👤',
  megaphone: '📢',
  share: '🔗',
  sparkles: '✨',
  medal: '🏅',
  trophy: '🏆',
  gem: '💎',
  verified: '✅',
  calendar: '📅'
};

const Achievements: React.FC = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [myAchievements, setMyAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showEarnedOnly, setShowEarnedOnly] = useState(false);

  useEffect(() => {
    fetchAchievements();
  }, [isAuthenticated]);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const [allRes, myRes] = await Promise.all([
        achievementsAPI.getAll(),
        isAuthenticated ? achievementsAPI.getMyAchievements() : Promise.resolve({ data: { achievements: [] } })
      ]);
      setAllAchievements(allRes.data.achievements || []);
      setMyAchievements(myRes.data.achievements || []);
    } catch (err) {
      console.error('Failed to fetch achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleDisplay = async (userAchievementId: string, currentDisplay: boolean) => {
    try {
      await achievementsAPI.toggleDisplay(userAchievementId, !currentDisplay);
      setMyAchievements(prev =>
        prev.map(ua =>
          ua.id === userAchievementId ? { ...ua, isDisplayed: !currentDisplay } : ua
        )
      );
    } catch (err) {
      console.error('Failed to toggle display:', err);
    }
  };

  const getMyAchievementData = (achievementId: string) => {
    return myAchievements.find(ua => ua.achievementId === achievementId);
  };

  const categories = ['all', ...Object.keys(CATEGORY_LABELS)];

  const filteredAchievements = allAchievements.filter(achievement => {
    if (selectedCategory !== 'all' && achievement.category !== selectedCategory) return false;
    if (showEarnedOnly) {
      const myData = getMyAchievementData(achievement.id);
      if (!myData?.earnedAt) return false;
    }
    return true;
  });

  const earnedCount = myAchievements.filter(ua => ua.earnedAt).length;
  const totalXP = myAchievements
    .filter(ua => ua.earnedAt)
    .reduce((sum, ua) => sum + (ua.achievement?.xpReward || 0), 0);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-[#282828] rounded w-1/4 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="h-32 bg-[#282828] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <TrophySolidIcon className="w-8 h-8 text-yellow-500" />
          <div>
            <h1 className="text-2xl font-bold text-white">Achievements</h1>
            <p className="text-gray-400">Unlock badges and earn XP</p>
          </div>
        </div>
        {isAuthenticated && (
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{earnedCount}</div>
              <div className="text-sm text-gray-400">Earned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{totalXP}</div>
              <div className="text-sm text-gray-400">Total XP</div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                selectedCategory === cat
                  ? 'bg-red-600 text-white'
                  : 'bg-[#282828] text-gray-300 hover:bg-[#383838]'
              }`}
            >
              {cat !== 'all' && CATEGORY_LABELS[cat]?.icon}
              {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]?.label}
            </button>
          ))}
        </div>
        {isAuthenticated && (
          <button
            onClick={() => setShowEarnedOnly(!showEarnedOnly)}
            className={`ml-auto px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              showEarnedOnly
                ? 'bg-green-600 text-white'
                : 'bg-[#282828] text-gray-300 hover:bg-[#383838]'
            }`}
          >
            Earned Only
          </button>
        )}
      </div>

      {/* Achievements Grid */}
      {filteredAchievements.length === 0 ? (
        <div className="text-center py-16">
          <TrophyIcon className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Achievements Found</h3>
          <p className="text-gray-400">
            {showEarnedOnly ? 'Start creating to earn your first achievement!' : 'Check back soon for new achievements!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map(achievement => {
            const myData = getMyAchievementData(achievement.id);
            const isEarned = !!myData?.earnedAt;
            const progress = myData?.progress || 0;
            const progressPercent = Math.min((progress / achievement.requirement) * 100, 100);
            const rarityStyle = RARITY_STYLES[achievement.rarity] || RARITY_STYLES.common;
            const icon = ICON_MAP[achievement.icon] || '🏆';

            return (
              <div
                key={achievement.id}
                className={`relative p-4 rounded-xl border transition-all ${
                  isEarned
                    ? `${rarityStyle.bg} ${rarityStyle.border} ${rarityStyle.glow}`
                    : 'bg-[#1a1a1a] border-[#333333] opacity-70'
                }`}
              >
                {/* Rarity Badge */}
                <div className={`absolute top-3 right-3 px-2 py-0.5 rounded text-xs font-medium ${rarityStyle.text} ${rarityStyle.bg}`}>
                  {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
                </div>

                {/* Icon & Title */}
                <div className="flex items-start gap-3 mb-3">
                  <div className={`text-3xl ${!isEarned ? 'grayscale opacity-50' : ''}`}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold ${isEarned ? 'text-white' : 'text-gray-400'}`}>
                      {achievement.name}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{achievement.description}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                {isAuthenticated && !isEarned && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-gray-400">{progress}/{achievement.requirement}</span>
                    </div>
                    <div className="h-2 bg-[#333333] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${CATEGORY_LABELS[achievement.category]?.color || 'text-gray-400'}`}>
                      {CATEGORY_LABELS[achievement.category]?.label || achievement.category}
                    </span>
                    <span className="text-yellow-500 text-sm">+{achievement.xpReward} XP</span>
                  </div>
                  {isEarned ? (
                    <button
                      onClick={() => toggleDisplay(myData.id, myData.isDisplayed)}
                      className={`text-xs px-2 py-1 rounded transition-colors ${
                        myData.isDisplayed
                          ? 'bg-green-600/20 text-green-400'
                          : 'bg-[#333333] text-gray-400 hover:bg-[#404040]'
                      }`}
                    >
                      {myData.isDisplayed ? 'Displayed' : 'Show on Profile'}
                    </button>
                  ) : (
                    <LockClosedIcon className="w-4 h-4 text-gray-500" />
                  )}
                </div>

                {/* Earned Date */}
                {isEarned && myData?.earnedAt && (
                  <div className="mt-2 text-xs text-gray-500">
                    Earned {new Date(myData.earnedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* How Achievements Work */}
      <div className="mt-12 bg-[#1a1a1a] rounded-xl p-6 border border-[#333333]">
        <h2 className="text-lg font-semibold text-white mb-4">How Achievements Work</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="flex items-start gap-3">
            <SparklesIcon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-white">Create Content</div>
              <div className="text-gray-400">Upload videos and engage with the community to earn achievements</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <TrophyIcon className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-white">Unlock Badges</div>
              <div className="text-gray-400">Complete requirements to unlock special badges for your profile</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <StarIcon className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-white">Earn XP</div>
              <div className="text-gray-400">Each achievement rewards XP points to boost your creator level</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <FireIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-white">Display Badges</div>
              <div className="text-gray-400">Choose which achievements to showcase on your public profile</div>
            </div>
          </div>
        </div>
      </div>

      {/* Rarity Legend */}
      <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
        <span className="text-gray-400">Rarity:</span>
        {Object.entries(RARITY_STYLES).map(([rarity, style]) => (
          <span key={rarity} className={`px-2 py-1 rounded ${style.bg} ${style.text} border ${style.border}`}>
            {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
          </span>
        ))}
      </div>
    </div>
  );
};

export default Achievements;

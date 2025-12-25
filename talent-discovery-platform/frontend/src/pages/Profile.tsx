import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { usersAPI, socialAPI, getUploadUrl } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface SocialLinks {
  website?: string;
  imdb?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
  linkedin?: string;
  spotify?: string;
  soundcloud?: string;
  agency?: string;
}

interface UserProfile {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  role: string;
  isVerified: boolean;
  followersCount: number;
  followingCount: number;
  videoCount: number;
  isFollowing: boolean;
  createdAt: string;
  location?: string;
  socialLinks?: SocialLinks;
  photoGallery?: string[];
  age?: number | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  ethnicity?: string | null;
  isOwnProfile?: boolean;
}

interface Video {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  viewsCount: number;
  likesCount: number;
  duration: number | null;
  createdAt: string;
}

const Profile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [videosLoading, setVideosLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'videos' | 'about'>('videos');

  const isOwnProfile = currentUser?.id === profile?.id;

  useEffect(() => {
    if (username) {
      fetchProfile();
    }
  }, [username]);

  useEffect(() => {
    if (profile?.id) {
      fetchVideos();
    }
  }, [profile?.id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getUser(username!);
      setProfile(response.data.user);
      setFollowing(response.data.user.isFollowing);
    } catch (err: any) {
      toast.error('Failed to load profile');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchVideos = async () => {
    if (!profile?.id) return;
    try {
      setVideosLoading(true);
      const response = await usersAPI.getUserVideos(profile.id, { limit: 12 });
      setVideos(response.data.videos || []);
    } catch (err) {
      console.error('Failed to load videos:', err);
    } finally {
      setVideosLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to follow');
      navigate('/login');
      return;
    }

    if (followLoading) return; // Prevent double-clicks

    setFollowLoading(true);
    try {
      if (following) {
        await socialAPI.unfollow(profile!.id);
        setFollowing(false);
        setProfile(prev => prev ? { ...prev, followersCount: prev.followersCount - 1 } : null);
        toast.success('Unfollowed');
      } else {
        await socialAPI.follow(profile!.id);
        setFollowing(true);
        setProfile(prev => prev ? { ...prev, followersCount: prev.followersCount + 1 } : null);
        toast.success('Following');
      }
    } catch (err: any) {
      console.error('Follow error:', err);
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || 'Action failed');
    } finally {
      setFollowLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile not found</h1>
          <Link to="/" className="text-indigo-600 hover:underline mt-4 block">Go home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Banner Section */}
      <div className="relative">
        {/* Banner Image */}
        <div className="h-64 md:h-80 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 relative overflow-hidden">
          {profile.bannerUrl ? (
            <img
              src={profile.bannerUrl}
              alt="Banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 opacity-30">
              <div className="absolute inset-0" style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
              }}></div>
            </div>
          )}
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        </div>

        {/* Profile Info Overlay */}
        <div className="max-w-6xl mx-auto px-4">
          <div className="relative -mt-24 md:-mt-32 pb-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-end gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0 -mt-20 md:-mt-24">
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white dark:border-gray-800 shadow-lg overflow-hidden bg-gradient-to-br from-indigo-400 to-purple-500">
                    {profile.avatarUrl ? (
                      <img
                        src={getUploadUrl(profile.avatarUrl) || ''}
                        alt={profile.displayName || profile.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-4xl md:text-5xl font-bold">
                        {(profile.displayName || profile.username).charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Profile Details */}
                <div className="flex-grow">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                          {profile.displayName || profile.username}
                        </h1>
                        {profile.isVerified && (
                          <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                            Verified
                          </span>
                        )}
                        {profile.role === 'creator' && (
                          <span className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full text-xs font-semibold">
                            Creator
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 mt-1">@{profile.username}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      {isOwnProfile ? (
                        <Link
                          to="/settings"
                          className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          Edit Profile
                        </Link>
                      ) : (
                        <>
                          <button
                            onClick={handleFollow}
                            disabled={followLoading}
                            className={`px-6 py-2.5 rounded-full font-medium transition-colors disabled:opacity-50 ${
                              following
                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }`}
                          >
                            {followLoading ? 'Loading...' : following ? 'Following' : 'Follow'}
                          </button>
                          <button
                            onClick={() => navigate(`/messages?user=${profile.id}`)}
                            className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          >
                            Message
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-6 mt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(profile.videoCount)}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Videos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(profile.followersCount)}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Followers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(profile.followingCount)}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Following</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {profile.bio && (
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{profile.bio}</p>
                </div>
              )}

              {/* Photo Gallery */}
              {profile.photoGallery && profile.photoGallery.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Photos & Headshots</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {profile.photoGallery.map((photo: string, index: number) => (
                      <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 cursor-pointer hover:opacity-90 transition-opacity">
                        <img
                          src={getUploadUrl(photo) || ''}
                          alt=""
                          className="w-full h-full object-cover"
                          onClick={() => window.open(getUploadUrl(photo) || '', '_blank')}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-2xl font-bold">${index + 1}</div>`;
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Personal Information */}
              {(profile.age || profile.dateOfBirth || profile.gender || profile.ethnicity || profile.location) && (
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Personal Info</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {profile.age && (
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="text-xl font-bold text-gray-900 dark:text-white">{profile.age}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Age</div>
                      </div>
                    )}
                    {profile.dateOfBirth && (
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {new Date(profile.dateOfBirth).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Birthday</div>
                      </div>
                    )}
                    {profile.gender && (
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                          {profile.gender.replace(/_/g, ' ')}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Gender</div>
                      </div>
                    )}
                    {profile.ethnicity && (
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{profile.ethnicity}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Ethnicity</div>
                      </div>
                    )}
                    {profile.location && (
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg col-span-2 md:col-span-1">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{profile.location}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Location</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Member Since */}
              <div className="mt-4 text-sm text-gray-400 dark:text-gray-500">
                Member since {formatDate(profile.createdAt)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex gap-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('videos')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'videos'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                Videos
              </button>
              <button
                onClick={() => setActiveTab('about')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'about'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                About
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'videos' && (
              <div>
                {videosLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
                  </div>
                ) : videos.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎬</div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">No videos yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                      {isOwnProfile
                        ? "You haven't uploaded any videos yet"
                        : "This creator hasn't uploaded any videos yet"}
                    </p>
                    {isOwnProfile && (
                      <Link
                        to="/upload"
                        className="mt-4 inline-block px-6 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"
                      >
                        Upload Your First Video
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {videos.map(video => (
                      <Link
                        key={video.id}
                        to={`/video/${video.id}`}
                        className="group"
                      >
                        <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden relative">
                          {video.thumbnailUrl ? (
                            <img
                              src={video.thumbnailUrl}
                              alt={video.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700">
                              <span className="text-4xl">🎥</span>
                            </div>
                          )}
                          {video.duration && (
                            <span className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                              {formatDuration(video.duration)}
                            </span>
                          )}
                        </div>
                        <h3 className="mt-2 font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 transition-colors">
                          {video.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                          <span>{formatNumber(video.viewsCount)} views</span>
                          <span>-</span>
                          <span>{formatNumber(video.likesCount)} likes</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'about' && (
              <div className="max-w-3xl">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">About</h3>

                {/* Bio Section */}
                <div className="mb-8">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Bio</h4>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {profile.bio || 'No bio yet.'}
                  </p>
                </div>

                {/* Photo Gallery */}
                {profile.photoGallery && profile.photoGallery.length > 0 && (
                  <div className="mb-8">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Photo Gallery</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {profile.photoGallery.map((photo: string, index: number) => (
                        <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                          <img
                            src={getUploadUrl(photo) || ''}
                            alt={`${profile.displayName || profile.username} photo ${index + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                            onClick={() => window.open(getUploadUrl(photo) || '', '_blank')}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Details Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Details</h4>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                        <span className="text-gray-400">📅</span>
                        Joined {formatDate(profile.createdAt)}
                      </li>
                      <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                        <span className="text-gray-400">🎭</span>
                        {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                      </li>
                      {profile.isVerified && (
                        <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                          <span className="text-blue-500">✓</span>
                          Verified Account
                        </li>
                      )}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Stats</h4>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                        <span className="text-gray-400">🎬</span>
                        {profile.videoCount} videos uploaded
                      </li>
                      <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                        <span className="text-gray-400">👥</span>
                        {formatNumber(profile.followersCount)} followers
                      </li>
                      <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                        <span className="text-gray-400">👤</span>
                        Following {formatNumber(profile.followingCount)} creators
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Social Links Section */}
                {profile.socialLinks && Object.values(profile.socialLinks).some(v => v) && (
                  <div className="mt-8">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">Links & Profiles</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {profile.socialLinks.website && (
                        <a
                          href={profile.socialLinks.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          <span className="text-xl">🌐</span>
                          <span className="text-gray-700 dark:text-gray-200 font-medium">Website</span>
                        </a>
                      )}
                      {profile.socialLinks.imdb && (
                        <a
                          href={profile.socialLinks.imdb}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/50 transition-colors"
                        >
                          <span className="text-xl">🎬</span>
                          <span className="text-gray-700 dark:text-gray-200 font-medium">IMDB</span>
                        </a>
                      )}
                      {profile.socialLinks.instagram && (
                        <a
                          href={profile.socialLinks.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-pink-50 dark:bg-pink-900/30 rounded-lg hover:bg-pink-100 dark:hover:bg-pink-900/50 transition-colors"
                        >
                          <span className="text-xl">📷</span>
                          <span className="text-gray-700 dark:text-gray-200 font-medium">Instagram</span>
                        </a>
                      )}
                      {profile.socialLinks.twitter && (
                        <a
                          href={profile.socialLinks.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                        >
                          <span className="text-xl">𝕏</span>
                          <span className="text-gray-700 dark:text-gray-200 font-medium">Twitter / X</span>
                        </a>
                      )}
                      {profile.socialLinks.tiktok && (
                        <a
                          href={profile.socialLinks.tiktok}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          <span className="text-xl">🎵</span>
                          <span className="text-gray-700 dark:text-gray-200 font-medium">TikTok</span>
                        </a>
                      )}
                      {profile.socialLinks.youtube && (
                        <a
                          href={profile.socialLinks.youtube}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                        >
                          <span className="text-xl">▶️</span>
                          <span className="text-gray-700 dark:text-gray-200 font-medium">YouTube</span>
                        </a>
                      )}
                      {profile.socialLinks.linkedin && (
                        <a
                          href={profile.socialLinks.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                        >
                          <span className="text-xl">💼</span>
                          <span className="text-gray-700 dark:text-gray-200 font-medium">LinkedIn</span>
                        </a>
                      )}
                      {profile.socialLinks.spotify && (
                        <a
                          href={profile.socialLinks.spotify}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
                        >
                          <span className="text-xl">🎧</span>
                          <span className="text-gray-700 dark:text-gray-200 font-medium">Spotify</span>
                        </a>
                      )}
                      {profile.socialLinks.soundcloud && (
                        <a
                          href={profile.socialLinks.soundcloud}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors"
                        >
                          <span className="text-xl">☁️</span>
                          <span className="text-gray-700 dark:text-gray-200 font-medium">SoundCloud</span>
                        </a>
                      )}
                      {profile.socialLinks.agency && (
                        <a
                          href={profile.socialLinks.agency}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
                        >
                          <span className="text-xl">🏢</span>
                          <span className="text-gray-700 dark:text-gray-200 font-medium">Agency / Management</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Contact Section for Creators */}
                {profile.role === 'creator' && !isOwnProfile && (
                  <div className="mt-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Interested in working together?</h4>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Reach out to {profile.displayName || profile.username} for collaboration opportunities.
                    </p>
                    <button
                      onClick={() => navigate(`/messages?user=${profile.id}`)}
                      className="px-6 py-2.5 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition-colors"
                    >
                      Send Message
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spacer at bottom */}
      <div className="h-12"></div>
    </div>
  );
};

export default Profile;

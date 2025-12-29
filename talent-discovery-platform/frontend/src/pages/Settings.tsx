import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { profileAPI, uploadAPI, blocksAPI, twoFactorAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  UserCircleIcon,
  KeyIcon,
  BellIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  CameraIcon,
  LinkIcon,
  NoSymbolIcon,
  LockClosedIcon,
  XMarkIcon,
  PhotoIcon,
  TrashIcon,
  PlusIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import { getUploadUrl } from '../services/api';

type SettingsTab = 'profile' | 'photos' | 'account' | 'notifications' | 'privacy' | 'appearance' | 'links' | 'security' | 'blocked';

// Helper to normalize URLs - adds https:// if missing
const normalizeUrl = (url: string): string => {
  if (!url || url.trim() === '') return '';
  const trimmed = url.trim();
  // If it already has a protocol, return as-is
  if (trimmed.match(/^https?:\/\//i)) return trimmed;
  // Otherwise, prepend https://
  return `https://${trimmed}`;
};

const validTabs: SettingsTab[] = ['profile', 'photos', 'account', 'notifications', 'privacy', 'appearance', 'links', 'security', 'blocked'];

const Settings: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get tab from URL or default to 'profile'
  const tabFromUrl = searchParams.get('tab') as SettingsTab | null;
  const initialTab = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : 'profile';
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Update URL when tab changes
  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Keep tab state in sync with URL (e.g., when navigating back/forward)
  useEffect(() => {
    const tabParam = searchParams.get('tab') as SettingsTab | null;
    if (tabParam && validTabs.includes(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    displayName: '',
    bio: '',
    location: '',
    website: '',
    dateOfBirth: '',
    gender: '',
    ethnicity: ''
  });

  // Account form state
  const [accountForm, setAccountForm] = useState({
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNewFollower: true,
    emailComments: true,
    emailLikes: false,
    emailMessages: true,
    pushNewFollower: true,
    pushComments: true,
    pushLikes: true,
    pushMessages: true
  });

  // Privacy settings
  const [privacy, setPrivacy] = useState({
    profilePublic: true,
    showEmail: false,
    allowMessages: true,
    showActivity: true,
    // Personal info visibility
    showAge: true,
    showDateOfBirth: false,
    showEthnicity: true,
    showLocation: true,
    showGender: true
  });

  // Social links
  const [socialLinks, setSocialLinks] = useState({
    website: '',
    imdb: '',
    instagram: '',
    twitter: '',
    tiktok: '',
    youtube: '',
    linkedin: '',
    spotify: '',
    soundcloud: '',
    agency: ''
  });

  // 2FA state
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFASetup, setTwoFASetup] = useState<{ qrCode: string; secret: string } | null>(null);
  const [twoFAToken, setTwoFAToken] = useState('');
  const [twoFAPassword, setTwoFAPassword] = useState('');
  const [settingUp2FA, setSettingUp2FA] = useState(false);

  // Blocked/muted users state
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [mutedUsers, setMutedUsers] = useState<any[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);

  // Photo gallery state (up to 4 headshots)
  const [photoGallery, setPhotoGallery] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        displayName: user.displayName || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
        gender: user.gender || '',
        ethnicity: user.ethnicity || ''
      });
      setAccountForm(prev => ({
        ...prev,
        email: user.email || ''
      }));
      // Initialize social links from user data
      if (user.socialLinks) {
        setSocialLinks({
          website: user.socialLinks.website || '',
          imdb: user.socialLinks.imdb || '',
          instagram: user.socialLinks.instagram || '',
          twitter: user.socialLinks.twitter || '',
          tiktok: user.socialLinks.tiktok || '',
          youtube: user.socialLinks.youtube || '',
          linkedin: user.socialLinks.linkedin || '',
          spotify: user.socialLinks.spotify || '',
          soundcloud: user.socialLinks.soundcloud || '',
          agency: user.socialLinks.agency || ''
        });
      }
      // Set 2FA status
      setTwoFAEnabled(user.twoFactorEnabled || false);
      // Initialize photo gallery
      setPhotoGallery(user.photoGallery || []);
      // Initialize privacy settings
      if (user.privacySettings) {
        setPrivacy(prev => ({
          ...prev,
          // Main privacy settings
          profilePublic: user.privacySettings?.profilePublic ?? true,
          showEmail: user.privacySettings?.showEmail ?? false,
          allowMessages: user.privacySettings?.allowMessages ?? true,
          showActivity: user.privacySettings?.showActivity ?? true,
          // Personal info visibility settings
          showAge: user.privacySettings?.showAge ?? true,
          showDateOfBirth: user.privacySettings?.showDateOfBirth ?? false,
          showEthnicity: user.privacySettings?.showEthnicity ?? true,
          showLocation: user.privacySettings?.showLocation ?? true,
          showGender: user.privacySettings?.showGender ?? true
        }));
      }
      // Initialize notification settings
      if (user.notificationSettings) {
        setNotifications({
          emailNewFollower: user.notificationSettings.emailNewFollower ?? true,
          emailComments: user.notificationSettings.emailComments ?? true,
          emailLikes: user.notificationSettings.emailLikes ?? false,
          emailMessages: user.notificationSettings.emailMessages ?? true,
          pushNewFollower: user.notificationSettings.pushNewFollower ?? true,
          pushComments: user.notificationSettings.pushComments ?? true,
          pushLikes: user.notificationSettings.pushLikes ?? true,
          pushMessages: user.notificationSettings.pushMessages ?? true
        });
      }
    }
  }, [user]);

  // Load blocked/muted users when tab is active
  useEffect(() => {
    if (activeTab === 'blocked') {
      loadBlockedUsers();
    }
  }, [activeTab]);

  const loadBlockedUsers = async () => {
    setLoadingBlocked(true);
    try {
      const [blockedRes, mutedRes] = await Promise.all([
        blocksAPI.getBlockedUsers(),
        blocksAPI.getMutedUsers()
      ]);
      setBlockedUsers(blockedRes.data.blocked || []);
      setMutedUsers(mutedRes.data.muted || []);
    } catch (err) {
      console.error('Failed to load blocked users');
    } finally {
      setLoadingBlocked(false);
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      await blocksAPI.unblockUser(userId);
      setBlockedUsers(prev => prev.filter(b => b.user.id !== userId));
      toast.success('User unblocked');
    } catch (err) {
      toast.error('Failed to unblock user');
    }
  };

  const handleUnmute = async (userId: string) => {
    try {
      await blocksAPI.unmuteUser(userId);
      setMutedUsers(prev => prev.filter(m => m.user.id !== userId));
      toast.success('User unmuted');
    } catch (err) {
      toast.error('Failed to unmute user');
    }
  };

  const handleEnable2FA = async () => {
    setSettingUp2FA(true);
    try {
      const response = await twoFactorAPI.enable();
      setTwoFASetup({
        qrCode: response.data.qrCode,
        secret: response.data.secret
      });
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to enable 2FA');
    } finally {
      setSettingUp2FA(false);
    }
  };

  const handleConfirm2FA = async () => {
    if (!twoFAToken || twoFAToken.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }
    setSaving(true);
    try {
      await twoFactorAPI.confirm(twoFAToken);
      setTwoFAEnabled(true);
      setTwoFASetup(null);
      setTwoFAToken('');
      toast.success('2FA enabled successfully');
      if (refreshUser) await refreshUser();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Invalid code');
    } finally {
      setSaving(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!twoFAPassword || !twoFAToken || twoFAToken.length !== 6) {
      toast.error('Please enter your password and 6-digit code');
      return;
    }
    setSaving(true);
    try {
      await twoFactorAPI.disable(twoFAPassword, twoFAToken);
      setTwoFAEnabled(false);
      setTwoFAPassword('');
      setTwoFAToken('');
      toast.success('2FA disabled');
      if (refreshUser) await refreshUser();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to disable 2FA');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please use JPG, PNG, or WebP.');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 5MB.');
      return;
    }

    setUploadingAvatar(true);
    try {
      // Upload the image - this also updates the user's avatarUrl
      await uploadAPI.directProfileImageUpload(file);

      // Refresh user data to show new avatar
      if (refreshUser) {
        await refreshUser();
      }

      toast.success('Profile picture updated!');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to upload profile picture');
    } finally {
      setUploadingAvatar(false);
      // Reset the input so the same file can be selected again
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please use JPG, PNG, or WebP.');
      return;
    }

    // Validate file size (10MB max for banners)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10MB.');
      return;
    }

    setUploadingBanner(true);
    try {
      // Upload the banner image - this also updates the user's bannerUrl
      await uploadAPI.directBannerImageUpload(file);

      // Refresh user data to show new banner
      if (refreshUser) {
        await refreshUser();
      }

      toast.success('Profile banner updated!');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to upload banner');
    } finally {
      setUploadingBanner(false);
      // Reset the input so the same file can be selected again
      if (bannerInputRef.current) {
        bannerInputRef.current.value = '';
      }
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Don't send username in profile update - it has its own endpoint
      const { username, ...profileData } = profileForm;
      // Normalize website URL and prepare data
      const dataToSend = {
        ...profileData,
        website: normalizeUrl(profileData.website),
        dateOfBirth: profileData.dateOfBirth || undefined,
        gender: profileData.gender || undefined,
        ethnicity: profileData.ethnicity || undefined
      };
      await profileAPI.updateProfile(dataToSend);
      toast.success('Profile updated successfully');
      if (refreshUser) await refreshUser();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (accountForm.newPassword !== accountForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (accountForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setSaving(true);
    try {
      await profileAPI.changePassword({
        currentPassword: accountForm.currentPassword,
        newPassword: accountForm.newPassword
      });
      setAccountForm(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      toast.success('Password changed successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationsSave = async () => {
    setSaving(true);
    try {
      await profileAPI.updateNotificationSettings(notifications);
      toast.success('Notification settings saved');
    } catch (err: any) {
      toast.error('Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePrivacySave = async () => {
    setSaving(true);
    try {
      await profileAPI.updatePrivacySettings(privacy);
      toast.success('Privacy settings saved');
    } catch (err: any) {
      toast.error('Failed to save privacy settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSocialLinksSave = async () => {
    setSaving(true);
    try {
      // Normalize all URLs before saving
      const normalizedLinks = {
        website: normalizeUrl(socialLinks.website),
        imdb: normalizeUrl(socialLinks.imdb),
        instagram: normalizeUrl(socialLinks.instagram),
        twitter: normalizeUrl(socialLinks.twitter),
        tiktok: normalizeUrl(socialLinks.tiktok),
        youtube: normalizeUrl(socialLinks.youtube),
        linkedin: normalizeUrl(socialLinks.linkedin),
        spotify: normalizeUrl(socialLinks.spotify),
        soundcloud: normalizeUrl(socialLinks.soundcloud),
        agency: normalizeUrl(socialLinks.agency)
      };
      await profileAPI.updateSocialLinks(normalizedLinks);
      toast.success('Social links saved');
    } catch (err: any) {
      toast.error('Failed to save social links');
    } finally {
      setSaving(false);
    }
  };

  // Photo gallery functions
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (photoGallery.length >= 4) {
      toast.error('Maximum 4 photos allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo must be less than 5MB');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG, or WebP images allowed');
      return;
    }

    setUploadingPhoto(true);
    try {
      // Use gallery-specific upload that does NOT update avatar
      const uploadResponse = await uploadAPI.directGalleryImageUpload(file);
      const imageUrl = uploadResponse.data.url;

      const newGallery = [...photoGallery, imageUrl];
      await profileAPI.updateProfile({ photoGallery: newGallery });
      setPhotoGallery(newGallery);
      toast.success('Photo added to gallery');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) {
        photoInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = async (index: number) => {
    try {
      const newGallery = photoGallery.filter((_, i) => i !== index);
      await profileAPI.updateProfile({ photoGallery: newGallery });
      setPhotoGallery(newGallery);
      toast.success('Photo removed');
    } catch (err) {
      toast.error('Failed to remove photo');
    }
  };

  const tabs = [
    { id: 'profile' as SettingsTab, name: 'Profile', icon: UserCircleIcon },
    { id: 'photos' as SettingsTab, name: 'Photo Gallery', icon: PhotoIcon },
    { id: 'links' as SettingsTab, name: 'Social Links', icon: LinkIcon },
    { id: 'account' as SettingsTab, name: 'Account', icon: KeyIcon },
    { id: 'security' as SettingsTab, name: 'Security', icon: LockClosedIcon },
    { id: 'notifications' as SettingsTab, name: 'Notifications', icon: BellIcon },
    { id: 'privacy' as SettingsTab, name: 'Privacy', icon: ShieldCheckIcon },
    { id: 'blocked' as SettingsTab, name: 'Blocked Users', icon: NoSymbolIcon },
    { id: 'appearance' as SettingsTab, name: 'Appearance', icon: PaintBrushIcon }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header with title and back link */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <Link
          to="/"
          className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <HomeIcon className="w-5 h-5" />
          <span>Back to Homepage</span>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile Information</h2>

                {/* Avatar Section */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center overflow-hidden">
                      {uploadingAvatar ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                      ) : (user?.profileImageUrl || user?.avatarUrl) ? (
                        <img src={getUploadUrl(user?.profileImageUrl || user?.avatarUrl) || ''} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl text-white font-bold">
                          {(user?.displayName || user?.username || 'U').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute bottom-0 right-0 p-1.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50"
                    >
                      <CameraIcon className="w-4 h-4" />
                    </button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Profile Photo</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">JPG, PNG or WebP. Max 5MB.</p>
                  </div>
                </div>

                {/* Banner Section */}
                <div className="border-t dark:border-gray-700 pt-6">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Profile Banner</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Add a custom banner image to your profile. Recommended size: 1920x400 pixels.
                  </p>
                  <div className="relative w-full h-32 rounded-lg overflow-hidden bg-gradient-to-r from-indigo-400 to-purple-500">
                    {uploadingBanner ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                      </div>
                    ) : user?.bannerUrl ? (
                      <img
                        src={getUploadUrl(user.bannerUrl) || ''}
                        alt="Profile Banner"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white/80 text-sm">No banner image set</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => bannerInputRef.current?.click()}
                      disabled={uploadingBanner}
                      className="absolute bottom-2 right-2 flex items-center gap-2 px-3 py-1.5 bg-black/50 hover:bg-black/70 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                    >
                      <CameraIcon className="w-4 h-4" />
                      {user?.bannerUrl ? 'Change Banner' : 'Add Banner'}
                    </button>
                    <input
                      ref={bannerInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleBannerUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.firstName}
                      onChange={e => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.lastName}
                      onChange={e => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.displayName}
                    onChange={e => setProfileForm(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder="How you want to be known"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Username
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400">
                      @
                    </span>
                    <input
                      type="text"
                      value={profileForm.username}
                      onChange={e => setProfileForm(prev => ({ ...prev, username: e.target.value }))}
                      className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-r-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={profileForm.bio}
                    onChange={e => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                    rows={4}
                    maxLength={500}
                    placeholder="Tell people about yourself..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">{profileForm.bio.length}/500 characters</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={profileForm.location}
                      onChange={e => setProfileForm(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="City, Country"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Website
                    </label>
                    <input
                      type="text"
                      value={profileForm.website}
                      onChange={e => setProfileForm(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="yourwebsite.com"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Personal Information Section */}
                <div className="border-t dark:border-gray-700 pt-6">
                  <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">Personal Information</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    This information helps agents and casting directors find you. You can control visibility in Privacy settings.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={profileForm.dateOfBirth}
                        onChange={e => setProfileForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Gender
                      </label>
                      <select
                        value={profileForm.gender}
                        onChange={e => setProfileForm(prev => ({ ...prev, gender: e.target.value }))}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Ethnicity
                      </label>
                      <input
                        type="text"
                        value={profileForm.ethnicity}
                        onChange={e => setProfileForm(prev => ({ ...prev, ethnicity: e.target.value }))}
                        placeholder="e.g., Caucasian, African American, Asian"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            )}

            {/* Photo Gallery Tab */}
            {activeTab === 'photos' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Photo Gallery</h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                    Add up to 4 professional headshots or photos to showcase on your profile. These help agents and collaborators see your range.
                  </p>
                </div>

                {/* Photo Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {photoGallery.map((photo, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 group">
                      <img
                        src={getUploadUrl(photo) || ''}
                        alt={`Gallery photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                        title="Remove photo"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 text-white text-xs rounded">
                        Photo {index + 1}
                      </div>
                    </div>
                  ))}

                  {/* Add Photo Button */}
                  {photoGallery.length < 4 && (
                    <button
                      onClick={() => photoInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-400 flex flex-col items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {uploadingPhoto ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent"></div>
                      ) : (
                        <>
                          <PlusIcon className="w-8 h-8 text-gray-400" />
                          <span className="text-sm text-gray-500 dark:text-gray-400">Add Photo</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Empty Placeholders */}
                  {Array.from({ length: Math.max(0, 3 - photoGallery.length) }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="aspect-square rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center"
                    >
                      <PhotoIcon className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                    </div>
                  ))}
                </div>

                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Photo Guidelines</h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Use high-quality professional headshots</li>
                    <li>• Show different looks, expressions, or styles</li>
                    <li>• JPG, PNG, or WebP format (max 5MB each)</li>
                    <li>• Square or portrait orientation works best</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Email Address</h2>
                  <div className="flex items-center gap-4">
                    <input
                      type="email"
                      value={accountForm.email}
                      onChange={e => setAccountForm(prev => ({ ...prev, email: e.target.value }))}
                      className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                    <button className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                      Update
                    </button>
                  </div>
                </div>

                <div className="border-t dark:border-gray-700 pt-8">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Change Password</h2>
                  <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={accountForm.currentPassword}
                        onChange={e => setAccountForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={accountForm.newPassword}
                        onChange={e => setAccountForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={accountForm.confirmPassword}
                        onChange={e => setAccountForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      {saving ? 'Changing...' : 'Change Password'}
                    </button>
                  </form>
                </div>

                <div className="border-t dark:border-gray-700 pt-8">
                  <h2 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <button className="px-6 py-2.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
                    Delete Account
                  </button>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notification Preferences</h2>

                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">Email Notifications</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'emailNewFollower', label: 'New followers' },
                      { key: 'emailComments', label: 'Comments on your videos' },
                      { key: 'emailLikes', label: 'Likes on your videos' },
                      { key: 'emailMessages', label: 'Direct messages' }
                    ].map(item => (
                      <label key={item.key} className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
                        <input
                          type="checkbox"
                          checked={notifications[item.key as keyof typeof notifications]}
                          onChange={e => setNotifications(prev => ({ ...prev, [item.key]: e.target.checked }))}
                          className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="border-t dark:border-gray-700 pt-6">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">Push Notifications</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'pushNewFollower', label: 'New followers' },
                      { key: 'pushComments', label: 'Comments on your videos' },
                      { key: 'pushLikes', label: 'Likes on your videos' },
                      { key: 'pushMessages', label: 'Direct messages' }
                    ].map(item => (
                      <label key={item.key} className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
                        <input
                          type="checkbox"
                          checked={notifications[item.key as keyof typeof notifications]}
                          onChange={e => setNotifications(prev => ({ ...prev, [item.key]: e.target.checked }))}
                          className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleNotificationsSave}
                  disabled={saving}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Privacy Settings</h2>

                <div className="space-y-4">
                  {[
                    { key: 'profilePublic', label: 'Public Profile', description: 'Allow anyone to view your profile' },
                    { key: 'showEmail', label: 'Show Email', description: 'Display your email on your profile' },
                    { key: 'allowMessages', label: 'Allow Messages', description: 'Let others send you direct messages' },
                    { key: 'showActivity', label: 'Show Activity', description: 'Display your recent activity on your profile' }
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{item.label}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={privacy[item.key as keyof typeof privacy]}
                        onChange={e => setPrivacy(prev => ({ ...prev, [item.key]: e.target.checked }))}
                        className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                    </div>
                  ))}
                </div>

                {/* Personal Info Visibility Section */}
                <div className="border-t dark:border-gray-700 pt-6">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Personal Information Visibility</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Control what personal information is visible to others on your profile
                  </p>
                  <div className="space-y-4">
                    {[
                      { key: 'showAge', label: 'Show Age', description: 'Display your age on your profile (calculated from date of birth)' },
                      { key: 'showDateOfBirth', label: 'Show Date of Birth', description: 'Display your full date of birth on your profile' },
                      { key: 'showGender', label: 'Show Gender', description: 'Display your gender on your profile' },
                      { key: 'showEthnicity', label: 'Show Ethnicity', description: 'Display your ethnicity on your profile' },
                      { key: 'showLocation', label: 'Show Location', description: 'Display your location on your profile' }
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{item.label}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={privacy[item.key as keyof typeof privacy]}
                          onChange={e => setPrivacy(prev => ({ ...prev, [item.key]: e.target.checked }))}
                          className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handlePrivacySave}
                  disabled={saving}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appearance</h2>

                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">Theme</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { value: 'light', label: 'Light', icon: '☀️' },
                      { value: 'dark', label: 'Dark', icon: '🌙' },
                      { value: 'system', label: 'System', icon: '💻' }
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => setTheme(option.value as 'light' | 'dark' | 'system')}
                        className={`p-4 rounded-xl border-2 transition-colors ${
                          theme === option.value
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="text-3xl mb-2">{option.icon}</div>
                        <div className={`font-medium ${theme === option.value ? 'text-indigo-600' : 'text-gray-900 dark:text-white'}`}>
                          {option.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Social Links Tab */}
            {activeTab === 'links' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Social Links & Profiles</h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                    Add links to your professional profiles and social media accounts. These will be displayed on your public profile.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Personal Website */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Personal Website
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🌐</span>
                      <input
                        type="text"
                        value={socialLinks.website}
                        onChange={e => setSocialLinks(prev => ({ ...prev, website: e.target.value }))}
                        placeholder="yourwebsite.com"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* IMDB */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      IMDB
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🎬</span>
                      <input
                        type="text"
                        value={socialLinks.imdb}
                        onChange={e => setSocialLinks(prev => ({ ...prev, imdb: e.target.value }))}
                        placeholder="imdb.com/name/..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Instagram */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Instagram
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">📷</span>
                      <input
                        type="text"
                        value={socialLinks.instagram}
                        onChange={e => setSocialLinks(prev => ({ ...prev, instagram: e.target.value }))}
                        placeholder="instagram.com/username"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Twitter / X */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Twitter / X
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">𝕏</span>
                      <input
                        type="text"
                        value={socialLinks.twitter}
                        onChange={e => setSocialLinks(prev => ({ ...prev, twitter: e.target.value }))}
                        placeholder="twitter.com/username"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* TikTok */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      TikTok
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🎵</span>
                      <input
                        type="text"
                        value={socialLinks.tiktok}
                        onChange={e => setSocialLinks(prev => ({ ...prev, tiktok: e.target.value }))}
                        placeholder="tiktok.com/@username"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* YouTube */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      YouTube
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">▶️</span>
                      <input
                        type="text"
                        value={socialLinks.youtube}
                        onChange={e => setSocialLinks(prev => ({ ...prev, youtube: e.target.value }))}
                        placeholder="youtube.com/@channel"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* LinkedIn */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      LinkedIn
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">💼</span>
                      <input
                        type="text"
                        value={socialLinks.linkedin}
                        onChange={e => setSocialLinks(prev => ({ ...prev, linkedin: e.target.value }))}
                        placeholder="linkedin.com/in/username"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Spotify */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Spotify
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🎧</span>
                      <input
                        type="text"
                        value={socialLinks.spotify}
                        onChange={e => setSocialLinks(prev => ({ ...prev, spotify: e.target.value }))}
                        placeholder="open.spotify.com/artist/..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* SoundCloud */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      SoundCloud
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">☁️</span>
                      <input
                        type="text"
                        value={socialLinks.soundcloud}
                        onChange={e => setSocialLinks(prev => ({ ...prev, soundcloud: e.target.value }))}
                        placeholder="soundcloud.com/username"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Agency / Management */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Agency / Management
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🏢</span>
                      <input
                        type="text"
                        value={socialLinks.agency}
                        onChange={e => setSocialLinks(prev => ({ ...prev, agency: e.target.value }))}
                        placeholder="agency-website.com/talent/you"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSocialLinksSave}
                  disabled={saving}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Social Links'}
                </button>
              </div>
            )}

            {/* Security Tab - 2FA */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Two-Factor Authentication</h2>

                {!twoFAEnabled && !twoFASetup && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                        <LockClosedIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white mb-1">Add Extra Security</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                          Two-factor authentication adds an extra layer of security to your account.
                          You'll need to enter a code from your authenticator app when signing in.
                        </p>
                        <button
                          onClick={handleEnable2FA}
                          disabled={settingUp2FA}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                          {settingUp2FA ? 'Setting up...' : 'Enable 2FA'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {twoFASetup && (
                  <div className="space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                      <p className="text-blue-800 dark:text-blue-200 text-sm">
                        Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.),
                        then enter the 6-digit code to confirm.
                      </p>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 bg-white rounded-xl shadow-sm">
                        <img src={twoFASetup.qrCode} alt="2FA QR Code" className="w-48 h-48" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Or enter this code manually:</p>
                        <code className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded font-mono text-sm">
                          {twoFASetup.secret}
                        </code>
                      </div>
                    </div>

                    <div className="max-w-xs mx-auto">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Enter 6-digit code
                      </label>
                      <input
                        type="text"
                        value={twoFAToken}
                        onChange={e => setTwoFAToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        maxLength={6}
                        className="w-full p-3 text-center text-2xl tracking-widest border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      />
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => { setTwoFASetup(null); setTwoFAToken(''); }}
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleConfirm2FA}
                          disabled={saving || twoFAToken.length !== 6}
                          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {saving ? 'Verifying...' : 'Confirm'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {twoFAEnabled && !twoFASetup && (
                  <div className="space-y-6">
                    <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl p-4">
                      <div className="flex items-center gap-2">
                        <ShieldCheckIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <span className="text-green-800 dark:text-green-200 font-medium">2FA is enabled</span>
                      </div>
                      <p className="text-green-700 dark:text-green-300 text-sm mt-1">
                        Your account is protected with two-factor authentication.
                      </p>
                    </div>

                    <div className="border-t dark:border-gray-700 pt-6">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-4">Disable Two-Factor Authentication</h3>
                      <div className="max-w-md space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Current Password
                          </label>
                          <input
                            type="password"
                            value={twoFAPassword}
                            onChange={e => setTwoFAPassword(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Authenticator Code
                          </label>
                          <input
                            type="text"
                            value={twoFAToken}
                            onChange={e => setTwoFAToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            maxLength={6}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <button
                          onClick={handleDisable2FA}
                          disabled={saving}
                          className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                          {saving ? 'Disabling...' : 'Disable 2FA'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Blocked Users Tab */}
            {activeTab === 'blocked' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Blocked & Muted Users</h2>

                {loadingBlocked ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
                  </div>
                ) : (
                  <>
                    {/* Blocked Users */}
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                        Blocked Users ({blockedUsers.length})
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Blocked users cannot see your profile, videos, or send you messages.
                      </p>
                      {blockedUsers.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                          <NoSymbolIcon className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                          <p className="text-gray-500 dark:text-gray-400">No blocked users</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {blockedUsers.map(block => (
                            <div key={block.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <img
                                  src={block.user?.avatarUrl ? getUploadUrl(block.user.avatarUrl) || '/default-avatar.png' : '/default-avatar.png'}
                                  alt={block.user?.displayName || 'User'}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">{block.user?.displayName || 'Unknown'}</p>
                                  <p className="text-sm text-gray-500">@{block.user?.username || 'unknown'}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleUnblock(block.user?.id)}
                                className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              >
                                Unblock
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Muted Users */}
                    <div className="border-t dark:border-gray-700 pt-6">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                        Muted Users ({mutedUsers.length})
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Muted users' content is hidden from your feed, but they can still see your profile.
                      </p>
                      {mutedUsers.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                          <NoSymbolIcon className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                          <p className="text-gray-500 dark:text-gray-400">No muted users</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {mutedUsers.map(mute => (
                            <div key={mute.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <img
                                  src={mute.user?.avatarUrl ? getUploadUrl(mute.user.avatarUrl) || '/default-avatar.png' : '/default-avatar.png'}
                                  alt={mute.user?.displayName || 'User'}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">{mute.user?.displayName || 'Unknown'}</p>
                                  <p className="text-sm text-gray-500">@{mute.user?.username || 'unknown'}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleUnmute(mute.user?.id)}
                                className="px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                              >
                                Unmute
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

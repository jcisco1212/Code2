import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { profileAPI, uploadAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  UserCircleIcon,
  KeyIcon,
  BellIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  CameraIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import { getUploadUrl } from '../services/api';

type SettingsTab = 'profile' | 'account' | 'notifications' | 'privacy' | 'appearance' | 'links';

const Settings: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    displayName: '',
    bio: '',
    location: '',
    website: ''
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
    showActivity: true
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

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        displayName: user.displayName || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || ''
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
    }
  }, [user]);

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

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Don't send username in profile update - it has its own endpoint
      const { username, ...profileData } = profileForm;
      await profileAPI.updateProfile(profileData);
      toast.success('Profile updated successfully');
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
      await profileAPI.updateSocialLinks(socialLinks);
      toast.success('Social links saved');
    } catch (err: any) {
      toast.error('Failed to save social links');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile' as SettingsTab, name: 'Profile', icon: UserCircleIcon },
    { id: 'links' as SettingsTab, name: 'Social Links', icon: LinkIcon },
    { id: 'account' as SettingsTab, name: 'Account', icon: KeyIcon },
    { id: 'notifications' as SettingsTab, name: 'Notifications', icon: BellIcon },
    { id: 'privacy' as SettingsTab, name: 'Privacy', icon: ShieldCheckIcon },
    { id: 'appearance' as SettingsTab, name: 'Appearance', icon: PaintBrushIcon }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Settings</h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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
                      type="url"
                      value={profileForm.website}
                      onChange={e => setProfileForm(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://yourwebsite.com"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
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
                        type="url"
                        value={socialLinks.website}
                        onChange={e => setSocialLinks(prev => ({ ...prev, website: e.target.value }))}
                        placeholder="https://yourwebsite.com"
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
                        type="url"
                        value={socialLinks.imdb}
                        onChange={e => setSocialLinks(prev => ({ ...prev, imdb: e.target.value }))}
                        placeholder="https://imdb.com/name/..."
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
                        type="url"
                        value={socialLinks.instagram}
                        onChange={e => setSocialLinks(prev => ({ ...prev, instagram: e.target.value }))}
                        placeholder="https://instagram.com/username"
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
                        type="url"
                        value={socialLinks.twitter}
                        onChange={e => setSocialLinks(prev => ({ ...prev, twitter: e.target.value }))}
                        placeholder="https://twitter.com/username"
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
                        type="url"
                        value={socialLinks.tiktok}
                        onChange={e => setSocialLinks(prev => ({ ...prev, tiktok: e.target.value }))}
                        placeholder="https://tiktok.com/@username"
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
                        type="url"
                        value={socialLinks.youtube}
                        onChange={e => setSocialLinks(prev => ({ ...prev, youtube: e.target.value }))}
                        placeholder="https://youtube.com/@channel"
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
                        type="url"
                        value={socialLinks.linkedin}
                        onChange={e => setSocialLinks(prev => ({ ...prev, linkedin: e.target.value }))}
                        placeholder="https://linkedin.com/in/username"
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
                        type="url"
                        value={socialLinks.spotify}
                        onChange={e => setSocialLinks(prev => ({ ...prev, spotify: e.target.value }))}
                        placeholder="https://open.spotify.com/artist/..."
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
                        type="url"
                        value={socialLinks.soundcloud}
                        onChange={e => setSocialLinks(prev => ({ ...prev, soundcloud: e.target.value }))}
                        placeholder="https://soundcloud.com/username"
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
                        type="url"
                        value={socialLinks.agency}
                        onChange={e => setSocialLinks(prev => ({ ...prev, agency: e.target.value }))}
                        placeholder="https://agency-website.com/talent/you"
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

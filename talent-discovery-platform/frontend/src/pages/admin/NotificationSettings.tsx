import React, { useState, useEffect } from 'react';
import {
  BellIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  MoonIcon,
  ClockIcon,
  CheckIcon,
  XMarkIcon,
  UserGroupIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { adminNotificationSettingsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface NotificationSettings {
  id: string;
  userId: string;
  industryPopupEnabled: boolean;
  industryPushEnabled: boolean;
  industrySmsEnabled: boolean;
  industryEmailEnabled: boolean;
  agentSignupNotify: boolean;
  agentVerifiedNotify: boolean;
  promoterSignupNotify: boolean;
  managerSignupNotify: boolean;
  castingDirectorSignupNotify: boolean;
  producerSignupNotify: boolean;
  industryContactNotify: boolean;
  smsPhoneNumber: string | null;
  smsVerified: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  quietHoursTimezone: string | null;
  digestEnabled: boolean;
  digestFrequency: 'hourly' | 'daily' | 'weekly' | null;
}

const NotificationSettings: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await adminNotificationSettingsAPI.getSettings();
      setSettings(response.data.settings);
      if (response.data.settings.smsPhoneNumber) {
        setPhoneNumber(response.data.settings.smsPhoneNumber);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    if (!settings) return;

    setSaving(true);
    try {
      await adminNotificationSettingsAPI.updateSettings({ [key]: value });
      setSettings(prev => prev ? { ...prev, [key]: value } : null);
      toast.success('Settings updated');
    } catch (error) {
      console.error('Failed to update setting:', error);
      toast.error('Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestVerification = async () => {
    if (!phoneNumber) {
      toast.error('Please enter a phone number');
      return;
    }

    setSendingCode(true);
    try {
      const response = await adminNotificationSettingsAPI.requestPhoneVerification(phoneNumber);
      setPhoneNumber(response.data.formattedNumber || phoneNumber);
      setShowVerification(true);
      toast.success('Verification code sent!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send verification code');
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyPhone = async () => {
    if (!verificationCode) {
      toast.error('Please enter the verification code');
      return;
    }

    setVerifying(true);
    try {
      await adminNotificationSettingsAPI.verifyPhone(verificationCode);
      setSettings(prev => prev ? {
        ...prev,
        smsPhoneNumber: phoneNumber,
        smsVerified: true
      } : null);
      setShowVerification(false);
      setVerificationCode('');
      toast.success('Phone number verified!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Invalid verification code');
    } finally {
      setVerifying(false);
    }
  };

  const handleRemovePhone = async () => {
    try {
      await adminNotificationSettingsAPI.removePhone();
      setSettings(prev => prev ? {
        ...prev,
        smsPhoneNumber: null,
        smsVerified: false,
        industrySmsEnabled: false
      } : null);
      setPhoneNumber('');
      toast.success('Phone number removed');
    } catch (error) {
      toast.error('Failed to remove phone number');
    }
  };

  const ToggleSwitch: React.FC<{
    enabled: boolean;
    onChange: (value: boolean) => void;
    disabled?: boolean;
  }> = ({ enabled, onChange, disabled }) => (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-purple-600' : 'bg-gray-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Notification Settings</h1>
          <p className="text-gray-400">
            Configure how you receive notifications about industry activity
          </p>
        </div>

        {/* Delivery Methods */}
        <div className="bg-[#1f1f1f] rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BellIcon className="w-5 h-5 text-purple-400" />
            Delivery Methods
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            Choose how you want to be notified about entertainment industry activity
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#282828] rounded-lg">
              <div className="flex items-center gap-3">
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="font-medium">Popup Notifications</p>
                  <p className="text-sm text-gray-400">Show real-time popups in the admin dashboard</p>
                </div>
              </div>
              <ToggleSwitch
                enabled={settings?.industryPopupEnabled ?? true}
                onChange={(v) => updateSetting('industryPopupEnabled', v)}
              />
            </div>

            {/* Push Notifications - Hidden for now
            <div className="flex items-center justify-between p-4 bg-[#282828] rounded-lg">
              <div className="flex items-center gap-3">
                <BellIcon className="w-5 h-5 text-green-400" />
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-gray-400">Receive browser push notifications</p>
                </div>
              </div>
              <ToggleSwitch
                enabled={settings?.industryPushEnabled ?? true}
                onChange={(v) => updateSetting('industryPushEnabled', v)}
              />
            </div>
            */}

            <div className="flex items-center justify-between p-4 bg-[#282828] rounded-lg">
              <div className="flex items-center gap-3">
                <EnvelopeIcon className="w-5 h-5 text-yellow-400" />
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-gray-400">Receive email notifications</p>
                </div>
              </div>
              <ToggleSwitch
                enabled={settings?.industryEmailEnabled ?? true}
                onChange={(v) => updateSetting('industryEmailEnabled', v)}
              />
            </div>

            {/* SMS Notifications - Hidden for now
            <div className="flex items-center justify-between p-4 bg-[#282828] rounded-lg">
              <div className="flex items-center gap-3">
                <DevicePhoneMobileIcon className="w-5 h-5 text-red-400" />
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-gray-400">
                    {settings?.smsVerified
                      ? `Text notifications to ${settings.smsPhoneNumber}`
                      : 'Verify your phone number to enable'}
                  </p>
                </div>
              </div>
              <ToggleSwitch
                enabled={settings?.industrySmsEnabled ?? false}
                onChange={(v) => updateSetting('industrySmsEnabled', v)}
                disabled={!settings?.smsVerified}
              />
            </div>
            */}
          </div>
        </div>

        {/* Phone Verification / SMS Setup - Hidden for now
        <div className="bg-[#1f1f1f] rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <DevicePhoneMobileIcon className="w-5 h-5 text-purple-400" />
            SMS Setup
          </h2>

          {settings?.smsVerified ? (
            <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckIcon className="w-5 h-5 text-green-400" />
                <div>
                  <p className="font-medium text-green-400">Phone Verified</p>
                  <p className="text-sm text-gray-400">{settings.smsPhoneNumber}</p>
                </div>
              </div>
              <button
                onClick={handleRemovePhone}
                className="px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
              >
                Remove
              </button>
            </div>
          ) : showVerification ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">
                Enter the 6-digit code sent to {phoneNumber}
              </p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="flex-1 px-4 py-2 bg-[#282828] border border-[#404040] rounded-lg text-white text-center text-2xl tracking-widest"
                  maxLength={6}
                />
                <button
                  onClick={handleVerifyPhone}
                  disabled={verifying || verificationCode.length !== 6}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  {verifying ? 'Verifying...' : 'Verify'}
                </button>
              </div>
              <button
                onClick={() => {
                  setShowVerification(false);
                  setVerificationCode('');
                }}
                className="text-sm text-gray-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">
                Add your phone number to receive SMS notifications for urgent industry events
              </p>
              <div className="flex gap-3">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="flex-1 px-4 py-2 bg-[#282828] border border-[#404040] rounded-lg text-white focus:border-purple-500 focus:outline-none"
                />
                <button
                  onClick={handleRequestVerification}
                  disabled={sendingCode || !phoneNumber}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  {sendingCode ? 'Sending...' : 'Verify'}
                </button>
              </div>
            </div>
          )}
        </div>
        */}

        {/* Event Types */}
        <div className="bg-[#1f1f1f] rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <UserGroupIcon className="w-5 h-5 text-purple-400" />
            Event Types
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            Choose which industry events you want to be notified about
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'agentSignupNotify', label: 'Agent Signups', desc: 'New talent agents joining' },
              { key: 'agentVerifiedNotify', label: 'Agent Verifications', desc: 'Agents getting verified' },
              { key: 'promoterSignupNotify', label: 'Promoter Signups', desc: 'Event promoters joining' },
              { key: 'managerSignupNotify', label: 'Manager Signups', desc: 'Talent managers joining' },
              { key: 'castingDirectorSignupNotify', label: 'Casting Directors', desc: 'Casting directors joining' },
              { key: 'producerSignupNotify', label: 'Producer Signups', desc: 'Producers joining' },
              { key: 'industryContactNotify', label: 'Industry Inquiries', desc: 'Contact form submissions' }
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between p-3 bg-[#282828] rounded-lg">
                <div>
                  <p className="font-medium text-sm">{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
                <ToggleSwitch
                  enabled={(settings as any)?.[key] ?? true}
                  onChange={(v) => updateSetting(key, v)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="bg-[#1f1f1f] rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MoonIcon className="w-5 h-5 text-purple-400" />
            Quiet Hours
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            Pause notifications during specific hours
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#282828] rounded-lg">
              <div className="flex items-center gap-3">
                <ClockIcon className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="font-medium">Enable Quiet Hours</p>
                  <p className="text-sm text-gray-400">Pause notifications during set times</p>
                </div>
              </div>
              <ToggleSwitch
                enabled={settings?.quietHoursEnabled ?? false}
                onChange={(v) => updateSetting('quietHoursEnabled', v)}
              />
            </div>

            {settings?.quietHoursEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-[#282828] rounded-lg">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Start Time</label>
                  <input
                    type="time"
                    value={settings.quietHoursStart || '22:00'}
                    onChange={(e) => updateSetting('quietHoursStart', e.target.value)}
                    className="w-full px-3 py-2 bg-[#1f1f1f] border border-[#404040] rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">End Time</label>
                  <input
                    type="time"
                    value={settings.quietHoursEnd || '08:00'}
                    onChange={(e) => updateSetting('quietHoursEnd', e.target.value)}
                    className="w-full px-3 py-2 bg-[#1f1f1f] border border-[#404040] rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Timezone</label>
                  <select
                    value={settings.quietHoursTimezone || 'America/New_York'}
                    onChange={(e) => updateSetting('quietHoursTimezone', e.target.value)}
                    className="w-full px-3 py-2 bg-[#1f1f1f] border border-[#404040] rounded-lg text-white"
                  >
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Digest Settings */}
        <div className="bg-[#1f1f1f] rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <EnvelopeIcon className="w-5 h-5 text-purple-400" />
            Email Digest
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            Receive a summary of industry activity instead of individual notifications
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#282828] rounded-lg">
              <div>
                <p className="font-medium">Enable Digest</p>
                <p className="text-sm text-gray-400">Get a bundled summary instead of individual emails</p>
              </div>
              <ToggleSwitch
                enabled={settings?.digestEnabled ?? false}
                onChange={(v) => updateSetting('digestEnabled', v)}
              />
            </div>

            {settings?.digestEnabled && (
              <div className="p-4 bg-[#282828] rounded-lg">
                <label className="block text-sm text-gray-400 mb-2">Frequency</label>
                <div className="flex gap-3">
                  {['hourly', 'daily', 'weekly'].map((freq) => (
                    <button
                      key={freq}
                      onClick={() => updateSetting('digestFrequency', freq)}
                      className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                        settings.digestFrequency === freq
                          ? 'bg-purple-600 text-white'
                          : 'bg-[#1f1f1f] text-gray-400 hover:bg-[#333]'
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Super Admin Section */}
        {isSuperAdmin && (
          <div className="mt-8 p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />
              <h2 className="text-xl font-semibold text-yellow-400">Super Admin Controls</h2>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              As a super admin, you can manage notification settings for all administrators.
            </p>
            <a
              href="/admin/manage-admin-notifications"
              className="inline-block px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-colors"
            >
              Manage All Admin Settings
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationSettings;

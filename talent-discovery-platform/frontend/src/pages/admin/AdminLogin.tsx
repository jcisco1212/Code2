import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShieldCheckIcon, UserIcon, LockClosedIcon, KeyIcon } from '@heroicons/react/24/outline';
import { adminAuthAPI } from '../../services/api';

const AdminLogin: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await adminAuthAPI.login(identifier, password);
      const data = response.data;

      if (data.requires2FA) {
        // 2FA required - show 2FA input
        setRequires2FA(true);
        setTempToken(data.tempToken);
        toast.success('Please enter your 2FA code');
      } else {
        // No 2FA - store admin tokens and redirect
        localStorage.setItem('adminAccessToken', data.accessToken);
        localStorage.setItem('adminRefreshToken', data.refreshToken);
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        toast.success('Welcome to Admin Portal');
        navigate('/admin');
      }
    } catch (error: any) {
      console.error('Admin login error:', error);
      const message = error.response?.data?.error?.message || 'Invalid credentials';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!twoFactorCode || twoFactorCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const response = await adminAuthAPI.verify2FA(tempToken, twoFactorCode);
      const data = response.data;

      // Store admin tokens and redirect
      localStorage.setItem('adminAccessToken', data.accessToken);
      localStorage.setItem('adminRefreshToken', data.refreshToken);
      localStorage.setItem('adminUser', JSON.stringify(data.user));
      toast.success('Welcome to Admin Portal');
      navigate('/admin');
    } catch (error: any) {
      console.error('2FA verification error:', error);
      const message = error.response?.data?.error?.message || 'Invalid 2FA code';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setRequires2FA(false);
    setTempToken('');
    setTwoFactorCode('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4 py-12">
      {/* Background pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
      </div>

      <div className="w-full max-w-md relative">
        {/* Card */}
        <div className="relative overflow-hidden rounded-2xl
                        bg-gray-800/80 backdrop-blur-xl
                        border border-gray-700/50
                        shadow-2xl
                        p-8">

          {/* Red accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-red-500 to-orange-500" />

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl
                            bg-gradient-to-br from-red-600 to-red-700
                            shadow-lg shadow-red-500/25 mb-4">
              <ShieldCheckIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Admin Portal
            </h1>
            <p className="text-gray-400 text-sm">
              {requires2FA ? 'Enter your authentication code' : 'Secure administrative access'}
            </p>
          </div>

          {!requires2FA ? (
            // Login Form
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="identifier" className="block text-sm font-medium text-gray-300 mb-2">
                  Email or Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <UserIcon className="w-5 h-5 text-gray-500" />
                  </div>
                  <input
                    id="identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full pl-12 pr-4 py-3 rounded-lg
                             bg-gray-900/50 border border-gray-600
                             text-white placeholder:text-gray-500
                             focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500
                             transition-all"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <LockClosedIcon className="w-5 h-5 text-gray-500" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-12 pr-4 py-3 rounded-lg
                             bg-gray-900/50 border border-gray-600
                             text-white placeholder:text-gray-500
                             focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500
                             transition-all"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg font-semibold text-white
                         bg-gradient-to-r from-red-600 to-red-700
                         hover:from-red-500 hover:to-red-600
                         shadow-lg shadow-red-500/25
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Authenticating...
                  </span>
                ) : 'Sign In'}
              </button>
            </form>
          ) : (
            // 2FA Form
            <form onSubmit={handleVerify2FA} className="space-y-5">
              <div>
                <label htmlFor="twoFactorCode" className="block text-sm font-medium text-gray-300 mb-2">
                  Authentication Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <KeyIcon className="w-5 h-5 text-gray-500" />
                  </div>
                  <input
                    id="twoFactorCode"
                    type="text"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full pl-12 pr-4 py-3 rounded-lg
                             bg-gray-900/50 border border-gray-600
                             text-white text-center text-2xl tracking-[0.5em] font-mono
                             placeholder:text-gray-500 placeholder:tracking-[0.5em]
                             focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500
                             transition-all"
                    required
                    autoComplete="one-time-code"
                    autoFocus
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || twoFactorCode.length !== 6}
                className="w-full py-3 rounded-lg font-semibold text-white
                         bg-gradient-to-r from-red-600 to-red-700
                         hover:from-red-500 hover:to-red-600
                         shadow-lg shadow-red-500/25
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Verifying...
                  </span>
                ) : 'Verify & Continue'}
              </button>

              <button
                type="button"
                onClick={handleBack}
                className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Back to login
              </button>
            </form>
          )}

          {/* Security notice */}
          <div className="mt-8 pt-6 border-t border-gray-700/50">
            <p className="text-xs text-gray-500 text-center">
              This is a restricted area. All login attempts are logged and monitored.
            </p>
          </div>
        </div>

        {/* Bottom text */}
        <p className="mt-4 text-center text-xs text-gray-600">
          Not an administrator?{' '}
          <a href="/login" className="text-gray-400 hover:text-white transition-colors">
            Return to main site
          </a>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;

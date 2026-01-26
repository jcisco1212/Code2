import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setTokens, getCurrentUser } from '../../store/slices/authSlice';
import { AppDispatch } from '../../store';
import toast from 'react-hot-toast';
import { SparklesIcon } from '@heroicons/react/24/outline';

const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    const handleCallback = async () => {
      const accessToken = searchParams.get('accessToken');
      const refreshToken = searchParams.get('refreshToken');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        toast.error('Google sign-in failed. Please try again.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      if (accessToken && refreshToken) {
        try {
          // Store tokens in Redux and localStorage
          dispatch(setTokens({ accessToken, refreshToken }));

          // Fetch user data
          await dispatch(getCurrentUser());

          setStatus('success');
          toast.success('Welcome!');

          // Redirect to home after a brief moment
          setTimeout(() => navigate('/'), 500);
        } catch (err) {
          setStatus('error');
          toast.error('Failed to complete sign-in. Please try again.');
          setTimeout(() => navigate('/login'), 2000);
        }
      } else {
        setStatus('error');
        toast.error('Invalid authentication response.');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, dispatch]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="relative overflow-hidden rounded-3xl
                        bg-white/70 dark:bg-white/5
                        backdrop-blur-xl
                        border border-white/50 dark:border-white/10
                        shadow-xl dark:shadow-2xl
                        p-8 text-center">

          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500" />

          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl
                          bg-gradient-to-br from-primary-500 to-accent-500
                          shadow-aurora mb-6">
            <SparklesIcon className="w-8 h-8 text-white" />
          </div>

          {status === 'processing' && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Signing you in...
              </h1>
              <div className="flex justify-center mb-4">
                <svg className="animate-spin h-8 w-8 text-primary-500" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Please wait while we complete your sign-in...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Success!
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Redirecting you to the app...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
                Sign-in Failed
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Redirecting you back to login...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OAuthCallback;

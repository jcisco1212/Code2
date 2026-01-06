import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const COOKIE_CONSENT_KEY = 'cookie_consent';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

const CookieConsent: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always required
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay before showing banner
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    } else {
      // Load saved preferences
      try {
        const savedPrefs = JSON.parse(consent);
        setPreferences(savedPrefs);
        // Enable analytics if accepted
        if (savedPrefs.analytics) {
          enableAnalytics();
        }
      } catch {
        setShowBanner(true);
      }
    }
  }, []);

  const enableAnalytics = () => {
    // This will enable Google Analytics if the gtag is loaded
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: 'granted'
      });
    }
  };

  const disableAnalytics = () => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: 'denied'
      });
    }
  };

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(allAccepted));
    setPreferences(allAccepted);
    enableAnalytics();
    setShowBanner(false);
  };

  const handleRejectAll = () => {
    const onlyNecessary: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(onlyNecessary));
    setPreferences(onlyNecessary);
    disableAnalytics();
    setShowBanner(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(preferences));
    if (preferences.analytics) {
      enableAnalytics();
    } else {
      disableAnalytics();
    }
    setShowBanner(false);
    setShowSettings(false);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9998]"
        onClick={() => {}} // Prevent closing on backdrop click
      />

      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {!showSettings ? (
            // Main Banner
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="text-3xl">🍪</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    We value your privacy
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm leading-relaxed">
                    We use cookies to enhance your browsing experience, analyze site traffic, and personalize content.
                    By clicking "Accept All", you consent to our use of cookies. Read our{' '}
                    <Link to="/privacy" className="text-primary-600 dark:text-primary-400 hover:underline">
                      Privacy Policy
                    </Link>
                    {' '}for more information.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-4 justify-end">
                <button
                  onClick={() => setShowSettings(true)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Cookie Settings
                </button>
                <button
                  onClick={handleRejectAll}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Reject All
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="px-6 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                >
                  Accept All
                </button>
              </div>
            </div>
          ) : (
            // Settings Panel
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Cookie Preferences
                </h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Necessary Cookies */}
                <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">Essential Cookies</span>
                      <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                        Required
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      These cookies are necessary for the website to function properly. They enable core functionality such as security, authentication, and accessibility.
                    </p>
                  </div>
                  <div className="ml-4">
                    <div className="w-12 h-6 bg-green-500 rounded-full relative">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <span className="font-medium text-gray-900 dark:text-white">Analytics Cookies</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      These cookies help us understand how visitors interact with our website by collecting anonymous information about page visits, traffic sources, and user behavior.
                    </p>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => setPreferences(p => ({ ...p, analytics: !p.analytics }))}
                      className={`w-12 h-6 rounded-full relative transition-colors ${
                        preferences.analytics ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          preferences.analytics ? 'right-1' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Marketing Cookies */}
                <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <span className="font-medium text-gray-900 dark:text-white">Marketing Cookies</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      These cookies are used to deliver advertisements more relevant to you and your interests. They may also be used to limit the number of times you see an ad.
                    </p>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => setPreferences(p => ({ ...p, marketing: !p.marketing }))}
                      className={`w-12 h-6 rounded-full relative transition-colors ${
                        preferences.marketing ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          preferences.marketing ? 'right-1' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePreferences}
                  className="px-6 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CookieConsent;

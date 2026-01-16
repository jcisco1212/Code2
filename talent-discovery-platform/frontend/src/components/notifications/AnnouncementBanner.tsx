import React, { useState, useEffect } from 'react';
import { XMarkIcon, MegaphoneIcon, ExclamationCircleIcon, CheckCircleIcon, XCircleIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { announcementsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  target: 'all' | 'creators' | 'agents' | 'admins';
  isPinned: boolean;
  startsAt: string | null;
  expiresAt: string | null;
}

const AnnouncementBanner: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('dismissedAnnouncements');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        console.log('Fetching active announcements...');
        const response = await announcementsAPI.getActive();
        console.log('Announcements API response:', response.data);
        const activeAnnouncements = response.data.announcements || [];

        // Filter by target audience
        const filteredAnnouncements = activeAnnouncements.filter((a: Announcement) => {
          if (a.target === 'all') return true;
          if (!isAuthenticated || !user) return false;
          if (a.target === 'creators' && user.role === 'creator') return true;
          if (a.target === 'agents' && (user.role === 'agent' || user.role === 'admin' || user.role === 'super_admin')) return true;
          if (a.target === 'admins' && (user.role === 'admin' || user.role === 'super_admin' || user.role === 'moderator')) return true;
          return false;
        });

        console.log('Filtered announcements:', filteredAnnouncements);
        console.log('Dismissed IDs:', dismissedIds);
        setAnnouncements(filteredAnnouncements);
      } catch (error) {
        console.error('Failed to load announcements:', error);
      }
    };

    fetchAnnouncements();
    // Refresh every 5 minutes
    const interval = setInterval(fetchAnnouncements, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user, dismissedIds]);

  // Filter out dismissed announcements
  const visibleAnnouncements = announcements.filter(a => !dismissedIds.includes(a.id));

  // Sort: pinned first, then by date
  const sortedAnnouncements = [...visibleAnnouncements].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  const currentAnnouncement = sortedAnnouncements[currentIndex];

  if (sortedAnnouncements.length === 0 || !currentAnnouncement) {
    return null;
  }

  const handleDismiss = () => {
    const newDismissed = [...dismissedIds, currentAnnouncement.id];
    setDismissedIds(newDismissed);
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(newDismissed));
    setCurrentIndex(0);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : sortedAnnouncements.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < sortedAnnouncements.length - 1 ? prev + 1 : 0));
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'info':
        return {
          bg: 'bg-blue-600',
          icon: <MegaphoneIcon className="w-5 h-5" />,
          text: 'text-white'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-500',
          icon: <ExclamationCircleIcon className="w-5 h-5" />,
          text: 'text-black'
        };
      case 'success':
        return {
          bg: 'bg-green-600',
          icon: <CheckCircleIcon className="w-5 h-5" />,
          text: 'text-white'
        };
      case 'error':
        return {
          bg: 'bg-red-600',
          icon: <XCircleIcon className="w-5 h-5" />,
          text: 'text-white'
        };
      default:
        return {
          bg: 'bg-blue-600',
          icon: <MegaphoneIcon className="w-5 h-5" />,
          text: 'text-white'
        };
    }
  };

  const styles = getTypeStyles(currentAnnouncement.type);

  return (
    <div className={`${styles.bg} ${styles.text} py-2 px-4`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Navigation for multiple announcements */}
        {sortedAnnouncements.length > 1 && (
          <button
            onClick={handlePrev}
            className="p-1 hover:bg-black/20 rounded transition-colors"
            aria-label="Previous announcement"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
        )}

        {/* Content */}
        <div className="flex-1 flex items-center justify-center gap-3 text-center">
          <span className="flex-shrink-0">{styles.icon}</span>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="font-semibold">{currentAnnouncement.title}</span>
            <span className="hidden sm:inline">-</span>
            <span className="text-sm opacity-90">{currentAnnouncement.content}</span>
          </div>
          {currentAnnouncement.isPinned && (
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded">Pinned</span>
          )}
        </div>

        {/* Navigation for multiple announcements */}
        {sortedAnnouncements.length > 1 && (
          <button
            onClick={handleNext}
            className="p-1 hover:bg-black/20 rounded transition-colors"
            aria-label="Next announcement"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        )}

        {/* Counter for multiple announcements */}
        {sortedAnnouncements.length > 1 && (
          <span className="text-xs opacity-75 hidden sm:block">
            {currentIndex + 1}/{sortedAnnouncements.length}
          </span>
        )}

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-black/20 rounded transition-colors flex-shrink-0"
          aria-label="Dismiss announcement"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default AnnouncementBanner;

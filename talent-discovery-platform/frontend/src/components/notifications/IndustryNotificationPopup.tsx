import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon, UserPlusIcon, CheckBadgeIcon, BriefcaseIcon, FilmIcon, MegaphoneIcon } from '@heroicons/react/24/outline';
import { useSocket } from '../../contexts/SocketContext';
import { industryNotificationsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface IndustryNotification {
  id: string;
  eventType: string;
  title: string;
  message: string;
  data: Record<string, any>;
  createdAt: string;
  industryUser?: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    agentCompanyName: string | null;
    agentType: string | null;
  };
}

const IndustryNotificationPopup: React.FC = () => {
  const { user } = useAuth();
  const { industryNotifications, removeIndustryNotification, clearIndustryNotifications } = useSocket();
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const [loadedNotifications, setLoadedNotifications] = useState<IndustryNotification[]>([]);

  // Only show for admins
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    if (!isAdmin) return;

    // Load pending notifications on mount
    const loadPending = async () => {
      try {
        const response = await industryNotificationsAPI.getPending();
        setLoadedNotifications(response.data.notifications || []);
      } catch (error) {
        console.error('Failed to load pending notifications:', error);
      }
    };

    loadPending();
  }, [isAdmin]);

  // Combine loaded and real-time notifications
  const allNotifications = [...industryNotifications, ...loadedNotifications.filter(
    ln => !industryNotifications.find(in2 => in2.id === ln.id)
  )];

  const displayNotifications = showAll ? allNotifications : allNotifications.slice(0, 3);

  if (!isAdmin || allNotifications.length === 0) {
    return null;
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'agent_signup':
        return <UserPlusIcon className="w-5 h-5 text-blue-400" />;
      case 'agent_verified':
        return <CheckBadgeIcon className="w-5 h-5 text-green-400" />;
      case 'promoter_signup':
        return <MegaphoneIcon className="w-5 h-5 text-purple-400" />;
      case 'manager_signup':
        return <BriefcaseIcon className="w-5 h-5 text-orange-400" />;
      case 'casting_director_signup':
      case 'producer_signup':
        return <FilmIcon className="w-5 h-5 text-red-400" />;
      default:
        return <UserPlusIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getEventLabel = (eventType: string) => {
    switch (eventType) {
      case 'agent_signup':
        return 'New Agent';
      case 'agent_verified':
        return 'Verified';
      case 'promoter_signup':
        return 'New Promoter';
      case 'manager_signup':
        return 'New Manager';
      case 'casting_director_signup':
        return 'New Casting Director';
      case 'producer_signup':
        return 'New Producer';
      default:
        return 'Industry';
    }
  };

  const handleDismiss = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await industryNotificationsAPI.dismiss(id);
      removeIndustryNotification(id);
      setLoadedNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  };

  const handleDismissAll = async () => {
    try {
      await industryNotificationsAPI.dismissAll();
      clearIndustryNotifications();
      setLoadedNotifications([]);
    } catch (error) {
      console.error('Failed to dismiss all notifications:', error);
    }
  };

  const handleClick = async (notification: IndustryNotification) => {
    try {
      await industryNotificationsAPI.markAsViewed(notification.id);
      removeIndustryNotification(notification.id);
      setLoadedNotifications(prev => prev.filter(n => n.id !== notification.id));

      // Navigate based on event type
      if (notification.eventType.includes('agent')) {
        navigate('/admin/verify-agents');
      } else {
        navigate('/admin/users');
      }
    } catch (error) {
      console.error('Failed to mark as viewed:', error);
    }
  };

  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full">
      <div className="bg-[#1f1f1f] border border-[#404040] rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-[#404040]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <h3 className="font-semibold text-white text-sm">Industry Activity</h3>
            <span className="px-2 py-0.5 text-xs bg-purple-500/30 text-purple-300 rounded-full">
              {allNotifications.length}
            </span>
          </div>
          <button
            onClick={handleDismissAll}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Dismiss All
          </button>
        </div>

        {/* Notifications List */}
        <div className="max-h-80 overflow-y-auto">
          {displayNotifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleClick(notification)}
              className="flex items-start gap-3 p-3 hover:bg-white/5 cursor-pointer transition-colors border-b border-[#404040] last:border-b-0"
            >
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-[#282828] rounded-full">
                {getEventIcon(notification.eventType)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 bg-[#404040] text-gray-300 rounded">
                    {getEventLabel(notification.eventType)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTimeAgo(notification.createdAt)}
                  </span>
                </div>
                <p className="text-sm font-medium text-white mt-1 truncate">
                  {notification.title}
                </p>
                <p className="text-xs text-gray-400 line-clamp-2">
                  {notification.message}
                </p>
                {notification.data?.company && (
                  <p className="text-xs text-purple-400 mt-1">
                    {notification.data.company}
                  </p>
                )}
              </div>
              <button
                onClick={(e) => handleDismiss(notification.id, e)}
                className="flex-shrink-0 p-1 text-gray-500 hover:text-white transition-colors"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        {allNotifications.length > 3 && (
          <div className="px-4 py-2 border-t border-[#404040] bg-[#1a1a1a]">
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full text-sm text-center text-purple-400 hover:text-purple-300 transition-colors"
            >
              {showAll ? 'Show Less' : `Show ${allNotifications.length - 3} More`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default IndustryNotificationPopup;

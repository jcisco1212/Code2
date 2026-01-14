import React, { useEffect, useState } from 'react';
import { XMarkIcon, MegaphoneIcon, ExclamationCircleIcon, SparklesIcon, WrenchScrewdriverIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { useSocket } from '../../contexts/SocketContext';
import { broadcastNotificationsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface BroadcastNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  imageUrl?: string;
  priority: string;
  dismissible: boolean;
  requireAcknowledge: boolean;
  surveyData?: Record<string, any>;
  createdAt: string;
}

const BroadcastPopup: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { broadcastNotifications, removeBroadcastNotification } = useSocket();
  const [loadedBroadcasts, setLoadedBroadcasts] = useState<BroadcastNotification[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!isAuthenticated) return;

    // Load active broadcasts on mount
    const loadActive = async () => {
      try {
        const response = await broadcastNotificationsAPI.getActive();
        setLoadedBroadcasts(response.data.broadcasts || []);
      } catch (error) {
        console.error('Failed to load active broadcasts:', error);
      }
    };

    loadActive();
  }, [isAuthenticated]);

  // Combine loaded and real-time broadcasts
  const allBroadcasts = [...broadcastNotifications, ...loadedBroadcasts.filter(
    lb => !broadcastNotifications.find(bn => bn.id === lb.id)
  )];

  // Sort by priority (urgent first)
  const sortedBroadcasts = allBroadcasts.sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
    return (priorityOrder[a.priority as keyof typeof priorityOrder] || 2) -
           (priorityOrder[b.priority as keyof typeof priorityOrder] || 2);
  });

  const currentBroadcast = sortedBroadcasts[currentIndex];

  if (!isAuthenticated || sortedBroadcasts.length === 0 || !currentBroadcast) {
    return null;
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return <MegaphoneIcon className="w-6 h-6" />;
      case 'urgent':
      case 'system_alert':
        return <ExclamationCircleIcon className="w-6 h-6" />;
      case 'feature_update':
        return <SparklesIcon className="w-6 h-6" />;
      case 'maintenance':
        return <WrenchScrewdriverIcon className="w-6 h-6" />;
      case 'survey':
        return <ClipboardDocumentListIcon className="w-6 h-6" />;
      default:
        return <MegaphoneIcon className="w-6 h-6" />;
    }
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return {
          bg: 'bg-gradient-to-br from-red-900/90 to-red-800/90',
          border: 'border-red-500/50',
          icon: 'text-red-400',
          badge: 'bg-red-500 text-white'
        };
      case 'high':
        return {
          bg: 'bg-gradient-to-br from-orange-900/90 to-orange-800/90',
          border: 'border-orange-500/50',
          icon: 'text-orange-400',
          badge: 'bg-orange-500 text-white'
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-[#1f1f1f] to-[#282828]',
          border: 'border-[#404040]',
          icon: 'text-purple-400',
          badge: 'bg-purple-500 text-white'
        };
    }
  };

  const styles = getPriorityStyles(currentBroadcast.priority);

  const handleDismiss = async () => {
    try {
      await broadcastNotificationsAPI.dismiss(currentBroadcast.id);
      removeBroadcastNotification(currentBroadcast.id);
      setLoadedBroadcasts(prev => prev.filter(b => b.id !== currentBroadcast.id));
      setCurrentIndex(0);
    } catch (error) {
      console.error('Failed to dismiss broadcast:', error);
    }
  };

  const handleAcknowledge = async () => {
    try {
      const response = currentBroadcast.surveyData ? surveyAnswers : undefined;
      await broadcastNotificationsAPI.acknowledge(currentBroadcast.id, response);
      removeBroadcastNotification(currentBroadcast.id);
      setLoadedBroadcasts(prev => prev.filter(b => b.id !== currentBroadcast.id));
      setSurveyAnswers({});
      setCurrentIndex(0);
    } catch (error) {
      console.error('Failed to acknowledge broadcast:', error);
    }
  };

  const handleAction = () => {
    if (currentBroadcast.actionUrl) {
      window.open(currentBroadcast.actionUrl, '_blank');
    }
    handleDismiss();
  };

  const handleNext = () => {
    if (currentIndex < sortedBroadcasts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`relative max-w-lg w-full ${styles.bg} border ${styles.border} rounded-2xl shadow-2xl overflow-hidden`}>
        {/* Close button (if dismissible) */}
        {currentBroadcast.dismissible && (
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1 text-gray-400 hover:text-white transition-colors z-10"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        )}

        {/* Image (if provided) */}
        {currentBroadcast.imageUrl && (
          <div className="relative w-full h-40 overflow-hidden">
            <img
              src={currentBroadcast.imageUrl}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center ${styles.icon} bg-black/30 rounded-xl`}>
              {getTypeIcon(currentBroadcast.type)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 text-xs font-medium ${styles.badge} rounded`}>
                  {currentBroadcast.type.replace('_', ' ').toUpperCase()}
                </span>
                {currentBroadcast.priority === 'urgent' && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-red-600 text-white rounded animate-pulse">
                    URGENT
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-white">
                {currentBroadcast.title}
              </h2>
            </div>
          </div>

          {/* Message */}
          <p className="text-gray-300 leading-relaxed mb-6">
            {currentBroadcast.message}
          </p>

          {/* Survey (if provided) */}
          {currentBroadcast.surveyData && (
            <div className="mb-6 p-4 bg-black/30 rounded-xl">
              <h4 className="text-sm font-medium text-gray-400 mb-3">Quick Survey</h4>
              {currentBroadcast.surveyData.questions?.map((question: any, index: number) => (
                <div key={index} className="mb-4 last:mb-0">
                  <label className="block text-sm text-white mb-2">{question.text}</label>
                  {question.type === 'rating' && (
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(rating => (
                        <button
                          key={rating}
                          onClick={() => setSurveyAnswers(prev => ({ ...prev, [question.id]: rating }))}
                          className={`w-10 h-10 rounded-lg border transition-colors ${
                            surveyAnswers[question.id] === rating
                              ? 'bg-purple-500 border-purple-400 text-white'
                              : 'border-gray-600 text-gray-400 hover:border-gray-500'
                          }`}
                        >
                          {rating}
                        </button>
                      ))}
                    </div>
                  )}
                  {question.type === 'choice' && (
                    <div className="flex flex-wrap gap-2">
                      {question.options?.map((option: string) => (
                        <button
                          key={option}
                          onClick={() => setSurveyAnswers(prev => ({ ...prev, [question.id]: option }))}
                          className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                            surveyAnswers[question.id] === option
                              ? 'bg-purple-500 border-purple-400 text-white'
                              : 'border-gray-600 text-gray-400 hover:border-gray-500'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            {currentBroadcast.requireAcknowledge ? (
              <button
                onClick={handleAcknowledge}
                className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl transition-colors"
              >
                I Understand
              </button>
            ) : (
              <>
                {currentBroadcast.actionUrl && (
                  <button
                    onClick={handleAction}
                    className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl transition-colors"
                  >
                    {currentBroadcast.actionText || 'Learn More'}
                  </button>
                )}
                {currentBroadcast.dismissible && (
                  <button
                    onClick={handleDismiss}
                    className="py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors"
                  >
                    {currentBroadcast.actionUrl ? 'Skip' : 'Got It'}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Pagination (if multiple broadcasts) */}
          {sortedBroadcasts.length > 1 && (
            <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-700">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="text-sm text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">
                {currentIndex + 1} of {sortedBroadcasts.length}
              </span>
              <button
                onClick={handleNext}
                disabled={currentIndex === sortedBroadcasts.length - 1}
                className="text-sm text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BroadcastPopup;

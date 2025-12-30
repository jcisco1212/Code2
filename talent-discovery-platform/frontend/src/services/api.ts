import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { store } from '../store';
import { setTokens, clearAuth } from '../store/slices/authSlice';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api/v1';
export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';

// Helper to get full URL for uploaded files
export const getUploadUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (path.startsWith('http')) return path; // Already absolute URL
  return `${BACKEND_URL}${path}`;
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: AxiosResponse) => void;
  reject: (error: AxiosError) => void;
  config: AxiosRequestConfig;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token && prom.config.headers) {
      prom.config.headers.Authorization = `Bearer ${token}`;
      api(prom.config).then(prom.resolve).catch(prom.reject);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        store.dispatch(clearAuth());
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        store.dispatch(setTokens({ accessToken, refreshToken: newRefreshToken }));

        processQueue(null, accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        store.dispatch(clearAuth());
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Helper functions for specific API calls
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: any) =>
    api.post('/auth/register', data),
  logout: () =>
    api.post('/auth/logout'),
  getCurrentUser: () =>
    api.get('/auth/me'),
  verify2FA: (userId: string, token: string) =>
    api.post('/auth/verify-2fa', { userId, token }),
  enable2FA: () =>
    api.post('/auth/2fa/enable'),
  confirm2FA: (token: string) =>
    api.post('/auth/2fa/confirm', { token }),
  disable2FA: (password: string, token: string) =>
    api.post('/auth/2fa/disable', { password, token }),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
  verifyEmail: (token: string) =>
    api.get(`/auth/verify-email?token=${token}`)
};

export const videosAPI = {
  getVideos: (params?: any) =>
    api.get('/videos', { params }),
  getVideo: (id: string) =>
    api.get(`/videos/${id}`),
  getTrending: (limit?: number) =>
    api.get('/videos/trending', { params: { limit } }),
  getFeatured: (limit?: number) =>
    api.get('/videos/featured', { params: { limit } }),
  getByCategory: (categoryId: string, params?: any) =>
    api.get(`/videos/category/${categoryId}`, { params }),
  search: (q: string, params?: any) =>
    api.get('/videos/search', { params: { q, ...params } }),
  createVideo: (data: any) =>
    api.post('/videos', data),
  updateVideo: (id: string, data: any) =>
    api.put(`/videos/${id}`, data),
  deleteVideo: (id: string) =>
    api.delete(`/videos/${id}`),
  recordView: (id: string, data: any) =>
    api.post(`/videos/${id}/view`, data),
  getStreamUrl: (id: string) =>
    api.get(`/videos/${id}/stream`),
  getAnalytics: (id: string) =>
    api.get(`/videos/${id}/analytics`),
  getAIAnalysis: (id: string) =>
    api.get(`/videos/${id}/ai-analysis`),
  likeVideo: (id: string) =>
    api.post(`/likes/video/${id}`, { type: 'like' }),
  unlikeVideo: (id: string) =>
    api.post(`/likes/video/${id}`, { type: 'like' }),
  getUserVideos: (userId: string, params?: any) =>
    api.get(`/videos/user/${userId}`, { params })
};

export const clipsAPI = {
  getClips: (params?: any) =>
    api.get('/clips', { params }),
  getTrending: (limit?: number) =>
    api.get('/clips/trending', { params: { limit } }),
  getByUser: (userId: string, params?: any) =>
    api.get(`/clips/user/${userId}`, { params })
};

export const uploadAPI = {
  getVideoPresignedUrl: (videoId: string, contentType: string, fileSize: number) =>
    api.post('/upload/video/presign', { videoId, contentType, fileSize }),
  completeVideoUpload: (videoId: string) =>
    api.post('/upload/video/complete', { videoId }),
  getProfileImagePresignedUrl: (contentType: string, fileSize: number) =>
    api.post('/upload/profile-image/presign', { contentType, fileSize }),
  getThumbnailPresignedUrl: (videoId: string, contentType: string, fileSize: number) =>
    api.post('/upload/thumbnail/presign', { videoId, contentType, fileSize }),
  // Direct upload for development without S3
  directVideoUpload: (videoId: string, file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('videoId', videoId);
    formData.append('video', file);
    return api.post('/upload/video/direct', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          onProgress(progress);
        }
      }
    });
  },
  // Direct profile image upload for development without S3
  directProfileImageUpload: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload/profile-image/direct', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  // Direct gallery image upload - does NOT update avatar
  directGalleryImageUpload: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload/gallery-image/direct', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  // Direct banner image upload for profile banners
  directBannerImageUpload: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload/banner-image/direct', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

export const usersAPI = {
  getUser: (identifier: string) =>
    api.get(`/users/${identifier}`),
  getUserVideos: (userId: string, params?: any) =>
    api.get(`/users/${userId}/videos`, { params }),
  getFollowers: (userId: string, params?: any) =>
    api.get(`/users/${userId}/followers`, { params }),
  getFollowing: (userId: string, params?: any) =>
    api.get(`/users/${userId}/following`, { params }),
  search: (q: string, params?: any) =>
    api.get('/users', { params: { q, ...params } })
};

export const profileAPI = {
  updateProfile: (data: any) =>
    api.put('/profiles/me', data),
  updateProfileImage: (profileImageUrl: string) =>
    api.put('/profiles/me/image', { profileImageUrl }),
  updateUsername: (username: string) =>
    api.put('/profiles/me/username', { username }),
  upgradeToCreator: () =>
    api.post('/profiles/me/upgrade-creator'),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/change-password', data),
  updateNotificationSettings: (settings: any) =>
    api.put('/profiles/me/notifications', { settings }),
  updatePrivacySettings: (settings: any) =>
    api.put('/profiles/me/privacy', { settings }),
  updateSocialLinks: (socialLinks: any) =>
    api.put('/profiles/me/social-links', { socialLinks }),
  updateEmbedLinks: (embedLinks: any) =>
    api.put('/profiles/me/embed-links', { embedLinks }),
  updateBannerSettings: (bannerSettings: any) =>
    api.put('/profiles/me/banner-settings', { bannerSettings })
};

export const socialAPI = {
  follow: (userId: string) =>
    api.post(`/follows/${userId}`),
  unfollow: (userId: string) =>
    api.delete(`/follows/${userId}`),
  checkFollowing: (userId: string) =>
    api.get(`/follows/check/${userId}`),
  likeVideo: (videoId: string, type?: string) =>
    api.post(`/likes/video/${videoId}`, { type }),
  likeComment: (commentId: string) =>
    api.post(`/likes/comment/${commentId}`)
};

export const commentsAPI = {
  getComments: (videoId: string, params?: any) =>
    api.get(`/comments/video/${videoId}`, { params }),
  getReplies: (commentId: string, params?: any) =>
    api.get(`/comments/${commentId}/replies`, { params }),
  createComment: (data: any) =>
    api.post('/comments', data),
  updateComment: (id: string, content: string) =>
    api.put(`/comments/${id}`, { content }),
  deleteComment: (id: string) =>
    api.delete(`/comments/${id}`),
  pinComment: (id: string) =>
    api.post(`/comments/${id}/pin`)
};

export const categoriesAPI = {
  getCategories: (params?: any) =>
    api.get('/categories', { params }),
  getCategory: (id: string) =>
    api.get(`/categories/${id}`),
  getCategoryBySlug: (slug: string) =>
    api.get(`/categories/by-slug/${slug}`)
};

export const analyticsAPI = {
  getDashboard: (period?: string) =>
    api.get('/analytics/dashboard', { params: { period } }),
  getEngagement: (period?: string) =>
    api.get('/analytics/engagement', { params: { period } }),
  getAudience: () =>
    api.get('/analytics/audience'),
  getAIInsights: () =>
    api.get('/analytics/ai-insights')
};

export const agentAPI = {
  discover: (params?: any) =>
    api.get('/agents/discover', { params }),
  getRecommended: (limit?: number) =>
    api.get('/agents/recommended', { params: { limit } }),
  getRising: (params?: any) =>
    api.get('/agents/rising', { params }),
  addBookmark: (data: any) =>
    api.post('/agents/bookmarks', data),
  getBookmarks: (params?: any) =>
    api.get('/agents/bookmarks', { params }),
  removeBookmark: (talentId: string) =>
    api.delete(`/agents/bookmarks/${talentId}`),
  sendMessage: (talentId: string, content: string) =>
    api.post('/agents/message', { talentId, content }),
  getTalentLists: () =>
    api.get('/agents/talent-lists'),
  getTrends: (period?: string) =>
    api.get('/agents/trends', { params: { period } })
};

export const notificationsAPI = {
  getNotifications: (params?: any) =>
    api.get('/notifications', { params }),
  markAsRead: (id: string) =>
    api.put(`/notifications/${id}/read`),
  markAllAsRead: () =>
    api.put('/notifications/read-all'),
  getUnreadCount: () =>
    api.get('/notifications/unread-count'),
  deleteNotification: (id: string) =>
    api.delete(`/notifications/${id}`)
};

export const messagesAPI = {
  getConversations: () =>
    api.get('/messages/conversations'),
  getMessages: (conversationId: string, params?: any) =>
    api.get(`/messages/conversation/${conversationId}`, { params }),
  sendMessage: (receiverId: string, content: string) =>
    api.post('/messages', { receiverId, content }),
  markAsRead: (conversationId: string) =>
    api.put(`/messages/conversation/${conversationId}/read`),
  getUnreadCount: () =>
    api.get('/messages/unread-count')
};

export const searchAPI = {
  search: (q: string, type?: string, limit?: number) =>
    api.get('/search', { params: { q, type, limit } }),
  getSuggestions: (q: string) =>
    api.get('/search/suggestions', { params: { q } }),
  getTrending: () =>
    api.get('/search/trending')
};

export const savedVideosAPI = {
  getSavedVideos: (params?: any) =>
    api.get('/saved-videos', { params }),
  saveVideo: (videoId: string) =>
    api.post(`/saved-videos/${videoId}`),
  unsaveVideo: (videoId: string) =>
    api.delete(`/saved-videos/${videoId}`),
  checkSaved: (videoId: string) =>
    api.get(`/saved-videos/check/${videoId}`)
};

export const historyAPI = {
  getHistory: (params?: any) =>
    api.get('/history', { params }),
  clearHistory: () =>
    api.delete('/history'),
  removeFromHistory: (videoId: string) =>
    api.delete(`/history/${videoId}`),
  getSaved: (params?: any) =>
    api.get('/history/saved', { params }),
  saveVideo: (videoId: string) =>
    api.post(`/history/saved/${videoId}`),
  unsaveVideo: (videoId: string) =>
    api.delete(`/history/saved/${videoId}`),
  checkSaved: (videoId: string) =>
    api.get(`/history/saved/${videoId}/check`)
};

export const playlistsAPI = {
  getPlaylists: () =>
    api.get('/playlists'),
  getUserPlaylists: (userId: string) =>
    api.get(`/playlists/user/${userId}`),
  getPlaylist: (id: string) =>
    api.get(`/playlists/${id}`),
  createPlaylist: (data: { name: string; description?: string; isPublic?: boolean }) =>
    api.post('/playlists', {
      title: data.name,
      description: data.description,
      visibility: data.isPublic ? 'public' : 'private'
    }),
  updatePlaylist: (id: string, data: any) =>
    api.put(`/playlists/${id}`, data),
  deletePlaylist: (id: string) =>
    api.delete(`/playlists/${id}`),
  addToPlaylist: (playlistId: string, videoId: string) =>
    api.post(`/playlists/${playlistId}/videos`, { videoId }),
  removeFromPlaylist: (playlistId: string, videoId: string) =>
    api.delete(`/playlists/${playlistId}/videos/${videoId}`)
};

export const castingListsAPI = {
  getLists: () =>
    api.get('/casting-lists'),
  getList: (id: string) =>
    api.get(`/casting-lists/${id}`),
  createList: (data: { name: string; description?: string; projectName?: string; deadline?: string }) =>
    api.post('/casting-lists', data),
  updateList: (id: string, data: any) =>
    api.put(`/casting-lists/${id}`, data),
  deleteList: (id: string) =>
    api.delete(`/casting-lists/${id}`),
  addTalent: (listId: string, talentId: string, data?: { notes?: string; status?: string }) =>
    api.post(`/casting-lists/${listId}/talents`, { talentId, ...data }),
  updateTalentStatus: (listId: string, talentId: string, status: string) =>
    api.put(`/casting-lists/${listId}/talents/${talentId}`, { status }),
  updateTalentNotes: (listId: string, talentId: string, notes: string) =>
    api.put(`/casting-lists/${listId}/talents/${talentId}`, { notes }),
  removeTalent: (listId: string, talentId: string) =>
    api.delete(`/casting-lists/${listId}/talents/${talentId}`),
  // Talent Notes (separate from casting lists)
  getNotes: (talentId?: string) =>
    api.get('/talent-notes', { params: { talentId } }),
  createNote: (talentId: string, content: string) =>
    api.post('/talent-notes', { talentId, content }),
  updateNote: (noteId: string, content: string) =>
    api.put(`/talent-notes/${noteId}`, { content }),
  deleteNote: (noteId: string) =>
    api.delete(`/talent-notes/${noteId}`),
  togglePinNote: (noteId: string, isPinned: boolean) =>
    api.put(`/talent-notes/${noteId}`, { isPinned })
};

export const announcementsAPI = {
  getActive: () =>
    api.get('/announcements/active'),
  getAll: () =>
    api.get('/announcements'),
  create: (data: { title: string; content: string; type?: string; target?: string; isPinned?: boolean; startsAt?: string; expiresAt?: string }) =>
    api.post('/announcements', data),
  update: (id: string, data: any) =>
    api.put(`/announcements/${id}`, data),
  toggleActive: (id: string, isActive: boolean) =>
    api.put(`/announcements/${id}`, { isActive }),
  delete: (id: string) =>
    api.delete(`/announcements/${id}`)
};

export const blocksAPI = {
  blockUser: (userId: string, reason?: string) =>
    api.post(`/blocks/block/${userId}`, { reason }),
  unblockUser: (userId: string) =>
    api.delete(`/blocks/block/${userId}`),
  muteUser: (userId: string, reason?: string) =>
    api.post(`/blocks/mute/${userId}`, { reason }),
  unmuteUser: (userId: string) =>
    api.delete(`/blocks/mute/${userId}`),
  getStatus: (userId: string) =>
    api.get(`/blocks/status/${userId}`),
  getBlockedUsers: (params?: { page?: number; limit?: number }) =>
    api.get('/blocks/blocked', { params }),
  getMutedUsers: (params?: { page?: number; limit?: number }) =>
    api.get('/blocks/muted', { params }),
  getBlockIds: () =>
    api.get('/blocks/ids')
};

export const twoFactorAPI = {
  enable: () =>
    api.post('/auth/2fa/enable'),
  confirm: (token: string) =>
    api.post('/auth/2fa/confirm', { token }),
  disable: (password: string, token: string) =>
    api.post('/auth/2fa/disable', { password, token }),
  verify: (userId: string, token: string) =>
    api.post('/auth/verify-2fa', { userId, token })
};

export const thumbnailAPI = {
  uploadDirect: (videoId: string, file: File) => {
    const formData = new FormData();
    formData.append('thumbnail', file);
    formData.append('videoId', videoId);
    return api.post('/upload/thumbnail/direct', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

export const compCardsAPI = {
  getMyCards: () =>
    api.get('/comp-cards/me'),
  getCard: (id: string) =>
    api.get(`/comp-cards/${id}`),
  getCardByToken: (token: string) =>
    api.get(`/comp-cards/share/${token}`),
  createCard: (data: any) =>
    api.post('/comp-cards', data),
  updateCard: (id: string, data: any) =>
    api.put(`/comp-cards/${id}`, data),
  deleteCard: (id: string) =>
    api.delete(`/comp-cards/${id}`),
  regenerateToken: (id: string) =>
    api.post(`/comp-cards/${id}/regenerate-token`),
  generateFromProfile: (template?: string, colorScheme?: string) =>
    api.post('/comp-cards/generate-from-profile', { template, colorScheme })
};

export const chatRoomsAPI = {
  getRooms: () =>
    api.get('/chat-rooms'),
  getRoom: (id: string) =>
    api.get(`/chat-rooms/${id}`),
  createRoom: (data: { name: string; description?: string; type?: string; isPublic?: boolean; memberIds?: string[] }) =>
    api.post('/chat-rooms', data),
  updateRoom: (id: string, data: any) =>
    api.put(`/chat-rooms/${id}`, data),
  deleteRoom: (id: string) =>
    api.delete(`/chat-rooms/${id}`),
  getMessages: (roomId: string, params?: { limit?: number; before?: string }) =>
    api.get(`/chat-rooms/${roomId}/messages`, { params }),
  sendMessage: (roomId: string, content: string, messageType?: string) =>
    api.post(`/chat-rooms/${roomId}/messages`, { content, messageType }),
  addMember: (roomId: string, memberId: string) =>
    api.post(`/chat-rooms/${roomId}/members`, { memberId }),
  removeMember: (roomId: string, memberId: string) =>
    api.delete(`/chat-rooms/${roomId}/members/${memberId}`),
  joinByInvite: (inviteCode: string) =>
    api.post(`/chat-rooms/join/${inviteCode}`),
  discoverPublic: (params?: { type?: string; search?: string; limit?: number; offset?: number }) =>
    api.get('/chat-rooms/discover/public', { params })
};

export const challengesAPI = {
  getChallenges: (params?: { status?: string; categoryId?: string; page?: number; limit?: number }) =>
    api.get('/challenges', { params }),
  getActive: () =>
    api.get('/challenges/active'),
  getFeatured: () =>
    api.get('/challenges/featured'),
  getChallenge: (id: string) =>
    api.get(`/challenges/${id}`),
  getEntries: (id: string, params?: { page?: number; limit?: number; sort?: string }) =>
    api.get(`/challenges/${id}/entries`, { params }),
  getLeaderboard: (id: string, limit?: number) =>
    api.get(`/challenges/${id}/leaderboard`, { params: { limit } }),
  createChallenge: (data: any) =>
    api.post('/challenges', data),
  updateChallenge: (id: string, data: any) =>
    api.put(`/challenges/${id}`, data),
  deleteChallenge: (id: string) =>
    api.delete(`/challenges/${id}`),
  submitEntry: (challengeId: string, videoId: string) =>
    api.post(`/challenges/${challengeId}/entries`, { videoId }),
  removeEntry: (challengeId: string, entryId: string) =>
    api.delete(`/challenges/${challengeId}/entries/${entryId}`),
  vote: (challengeId: string, entryId: string) =>
    api.post(`/challenges/${challengeId}/vote`, { entryId }),
  getMyVote: (challengeId: string) =>
    api.get(`/challenges/${challengeId}/my-vote`),
  getMyEntry: (challengeId: string) =>
    api.get(`/challenges/${challengeId}/my-entry`)
};

export const achievementsAPI = {
  getAll: () =>
    api.get('/achievements'),
  getMyAchievements: () =>
    api.get('/achievements/me'),
  getUserAchievements: (userId: string) =>
    api.get(`/achievements/user/${userId}`),
  getDisplayedAchievements: (userId: string) =>
    api.get(`/achievements/user/${userId}/displayed`),
  toggleDisplay: (achievementId: string, isDisplayed: boolean) =>
    api.put(`/achievements/${achievementId}/display`, { isDisplayed }),
  seedAchievements: () =>
    api.post('/achievements/seed')
};

export const duetsAPI = {
  getTrending: (limit?: number) =>
    api.get('/duets/trending', { params: { limit } }),
  getMyDuets: (params?: { page?: number; limit?: number }) =>
    api.get('/duets/me', { params }),
  getVideoDuets: (videoId: string, params?: { page?: number; limit?: number }) =>
    api.get(`/duets/video/${videoId}`, { params }),
  getDuet: (duetId: string) =>
    api.get(`/duets/${duetId}`),
  checkAllowed: (videoId: string) =>
    api.get(`/duets/check/${videoId}`),
  createDuet: (data: {
    originalVideoId: string;
    responseVideoId: string;
    layout?: 'side_by_side' | 'top_bottom' | 'picture_in_picture' | 'green_screen';
    audioMix?: 'both' | 'original' | 'response';
    originalVolume?: number;
    responseVolume?: number;
    syncOffset?: number;
  }) =>
    api.post('/duets', data),
  updateDuet: (duetId: string, data: any) =>
    api.put(`/duets/${duetId}`, data),
  deleteDuet: (duetId: string) =>
    api.delete(`/duets/${duetId}`)
};

export const watchPartiesAPI = {
  getActive: (params?: { page?: number; limit?: number }) =>
    api.get('/watch-parties/active', { params }),
  getMyParties: (type?: 'all' | 'hosted' | 'joined') =>
    api.get('/watch-parties/me', { params: { type } }),
  getParty: (partyId: string) =>
    api.get(`/watch-parties/${partyId}`),
  getByInvite: (inviteCode: string) =>
    api.get(`/watch-parties/invite/${inviteCode}`),
  createParty: (data: {
    videoId: string;
    title: string;
    description?: string;
    isPrivate?: boolean;
    maxParticipants?: number;
    scheduledAt?: string;
  }) =>
    api.post('/watch-parties', data),
  joinParty: (partyId: string) =>
    api.post(`/watch-parties/${partyId}/join`),
  leaveParty: (partyId: string) =>
    api.post(`/watch-parties/${partyId}/leave`),
  updateState: (partyId: string, data: { status?: string; currentTime?: number; isPlaying?: boolean }) =>
    api.put(`/watch-parties/${partyId}/state`, data),
  endParty: (partyId: string) =>
    api.post(`/watch-parties/${partyId}/end`)
};

export const featuresAPI = {
  getEnabled: () =>
    api.get('/features/enabled'),
  checkFeature: (key: string) =>
    api.get(`/features/check/${key}`),
  getAll: (category?: string) =>
    api.get('/features', { params: { category } }),
  getStats: () =>
    api.get('/features/stats'),
  toggleFeature: (flagId: string, isEnabled: boolean) =>
    api.put(`/features/${flagId}/toggle`, { isEnabled }),
  updateFeature: (flagId: string, data: any) =>
    api.put(`/features/${flagId}`, data),
  createFeature: (data: {
    key: string;
    name: string;
    description?: string;
    category?: string;
    isEnabled?: boolean;
    enabledForRoles?: string[];
    config?: Record<string, any>;
  }) =>
    api.post('/features', data),
  deleteFeature: (flagId: string) =>
    api.delete(`/features/${flagId}`),
  seedFeatures: () =>
    api.post('/features/seed'),
  bulkToggle: (flagIds: string[], isEnabled: boolean) =>
    api.put('/features/bulk-toggle', { flagIds, isEnabled })
};

export const reportsAPI = {
  createReport: (data: {
    targetId: string;
    targetType: 'video' | 'comment' | 'user';
    type: string;
    description?: string;
  }) =>
    api.post('/reports', data),
  getMyReports: (params?: { page?: number; limit?: number }) =>
    api.get('/reports/my-reports', { params })
};

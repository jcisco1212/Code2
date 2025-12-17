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
    api.post(`/likes/video/${id}`, { type: 'like' })
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
    api.put('/profiles/me/notifications', settings),
  updatePrivacySettings: (settings: any) =>
    api.put('/profiles/me/privacy', settings),
  updateSocialLinks: (socialLinks: any) =>
    api.put('/profiles/me/social-links', { socialLinks })
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
    api.get(`/categories/${id}`)
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
    api.get('/notifications/unread-count')
};

export const messagesAPI = {
  getConversations: () =>
    api.get('/messages/conversations'),
  getMessages: (conversationId: string, params?: any) =>
    api.get(`/messages/conversation/${conversationId}`, { params }),
  sendMessage: (receiverId: string, content: string) =>
    api.post('/messages', { receiverId, content }),
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

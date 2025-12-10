import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

interface Video {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  views: number;
  likes: number;
  commentCount: number;
  aiPerformanceScore: number | null;
  aiCategoryTags: string[];
  createdAt: string;
  user?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    profileImageUrl: string | null;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface VideosState {
  videos: Video[];
  trendingVideos: Video[];
  featuredVideos: Video[];
  currentVideo: Video | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const initialState: VideosState = {
  videos: [],
  trendingVideos: [],
  featuredVideos: [],
  currentVideo: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  }
};

export const fetchVideos = createAsyncThunk(
  'videos/fetchVideos',
  async (params: { page?: number; limit?: number; category?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/videos', { params });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch videos');
    }
  }
);

export const fetchTrendingVideos = createAsyncThunk(
  'videos/fetchTrending',
  async (limit: number = 20, { rejectWithValue }) => {
    try {
      const response = await api.get('/videos/trending', { params: { limit } });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch trending');
    }
  }
);

export const fetchFeaturedVideos = createAsyncThunk(
  'videos/fetchFeatured',
  async (limit: number = 10, { rejectWithValue }) => {
    try {
      const response = await api.get('/videos/featured', { params: { limit } });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch featured');
    }
  }
);

export const fetchVideo = createAsyncThunk(
  'videos/fetchVideo',
  async (videoId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/videos/${videoId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch video');
    }
  }
);

export const searchVideos = createAsyncThunk(
  'videos/search',
  async (params: { q: string; page?: number; category?: string }, { rejectWithValue }) => {
    try {
      const response = await api.get('/videos/search', { params });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Search failed');
    }
  }
);

const videosSlice = createSlice({
  name: 'videos',
  initialState,
  reducers: {
    clearVideos(state) {
      state.videos = [];
      state.pagination = { page: 1, limit: 20, total: 0, pages: 0 };
    },
    clearCurrentVideo(state) {
      state.currentVideo = null;
    },
    updateVideoLikes(state, action: PayloadAction<{ videoId: string; likes: number }>) {
      const video = state.videos.find(v => v.id === action.payload.videoId);
      if (video) video.likes = action.payload.likes;
      if (state.currentVideo?.id === action.payload.videoId) {
        state.currentVideo.likes = action.payload.likes;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVideos.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchVideos.fulfilled, (state, action) => {
        state.isLoading = false;
        state.videos = action.payload.videos;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchVideos.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchTrendingVideos.fulfilled, (state, action) => {
        state.trendingVideos = action.payload.videos;
      })
      .addCase(fetchFeaturedVideos.fulfilled, (state, action) => {
        state.featuredVideos = action.payload.videos;
      })
      .addCase(fetchVideo.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchVideo.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentVideo = action.payload.video;
      })
      .addCase(fetchVideo.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(searchVideos.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(searchVideos.fulfilled, (state, action) => {
        state.isLoading = false;
        state.videos = action.payload.videos;
        state.pagination = action.payload.pagination;
      })
      .addCase(searchVideos.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearVideos, clearCurrentVideo, updateVideoLikes } = videosSlice.actions;
export default videosSlice.reducer;

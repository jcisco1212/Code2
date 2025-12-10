import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarOpen: boolean;
  darkMode: boolean;
  uploadModalOpen: boolean;
  searchOpen: boolean;
  notificationsOpen: boolean;
}

const initialState: UIState = {
  sidebarOpen: false,
  darkMode: localStorage.getItem('darkMode') === 'true',
  uploadModalOpen: false,
  searchOpen: false,
  notificationsOpen: false
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    toggleDarkMode(state) {
      state.darkMode = !state.darkMode;
      localStorage.setItem('darkMode', String(state.darkMode));
      if (state.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    setUploadModalOpen(state, action: PayloadAction<boolean>) {
      state.uploadModalOpen = action.payload;
    },
    setSearchOpen(state, action: PayloadAction<boolean>) {
      state.searchOpen = action.payload;
    },
    setNotificationsOpen(state, action: PayloadAction<boolean>) {
      state.notificationsOpen = action.payload;
    }
  }
});

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleDarkMode,
  setUploadModalOpen,
  setSearchOpen,
  setNotificationsOpen
} = uiSlice.actions;

export default uiSlice.reducer;

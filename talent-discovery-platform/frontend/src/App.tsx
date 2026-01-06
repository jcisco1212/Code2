import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { FeatureProvider } from './contexts/FeatureContext';
import { initializeCapacitor } from './utils/capacitor';

// Layout
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AgentRoute from './components/auth/AgentRoute';
import AdminRoute from './components/auth/AdminRoute';

// Public Pages
import Home from './pages/Home';
import Watch from './pages/Watch';
import Search from './pages/Search';
import Profile from './pages/Profile';
import Category from './pages/Category';
import Trending from './pages/Trending';
import Clips from './pages/Clips';
import About from './pages/About';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Contact from './pages/Contact';
import Challenges from './pages/Challenges';
import ChallengeDetail from './pages/ChallengeDetail';
import Embed from './pages/Embed';
import Achievements from './pages/Achievements';
import Duets from './pages/Duets';
import WatchParties from './pages/WatchParties';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';

// Creator Pages
import Upload from './pages/creator/Upload';
import Studio from './pages/creator/Studio';
import Analytics from './pages/creator/Analytics';
import Settings from './pages/Settings';

// User Library Pages
import Library from './pages/Library';
import PlaylistDetail from './pages/PlaylistDetail';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import CompCard from './pages/CompCard';
import CompCards from './pages/CompCards';

// Agent Pages
import AgentDashboard from './pages/agent/Dashboard';
import AgentDiscover from './pages/agent/Discover';
import AgentBookmarks from './pages/agent/Bookmarks';
import AgentMessages from './pages/agent/Messages';
import AgentTrends from './pages/agent/Trends';
import AgentCastingLists from './pages/agent/CastingLists';
import AgentCastingListDetail from './pages/agent/CastingListDetail';
import AgentTalentNotes from './pages/agent/TalentNotes';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminVideos from './pages/admin/Videos';
import AdminReports from './pages/admin/Reports';
import AdminCategories from './pages/admin/Categories';
import AdminModeration from './pages/admin/Moderation';
import AdminComplaints from './pages/admin/Complaints';
import AdminAgentVerification from './pages/admin/AgentVerification';
import AdminAnnouncements from './pages/admin/Announcements';
import AdminAuditLogs from './pages/admin/AuditLogs';
import AdminFeatureManagement from './pages/admin/FeatureManagement';
import AdminUserAnalytics from './pages/admin/UserAnalytics';

function App() {
  // Initialize Capacitor for native platforms
  useEffect(() => {
    initializeCapacitor();
  }, []);

  return (
    <Provider store={store}>
      <ThemeProvider>
        <AuthProvider>
          <FeatureProvider>
            <BrowserRouter>
              <Toaster position="top-right" />
            <Routes>
            {/* Embed Route (no layout) */}
            <Route path="/embed/:videoId" element={<Embed />} />

            {/* Public Routes */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="watch/:videoId" element={<Watch />} />
              <Route path="search" element={<Search />} />
              <Route path="profile/:username" element={<Profile />} />
              <Route path="category/:categorySlug" element={<Category />} />
              <Route path="trending" element={<Trending />} />
              <Route path="clips" element={<Clips />} />
              <Route path="challenges" element={<Challenges />} />
              <Route path="challenges/:id" element={<ChallengeDetail />} />
              <Route path="achievements" element={<Achievements />} />
              <Route path="duets" element={<Duets />} />
              <Route path="watch-parties" element={<WatchParties />} />
              <Route path="about" element={<About />} />
              <Route path="terms" element={<Terms />} />
              <Route path="privacy" element={<Privacy />} />
              <Route path="contact" element={<Contact />} />

              {/* Auth Routes */}
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="forgot-password" element={<ForgotPassword />} />
              <Route path="reset-password" element={<ResetPassword />} />
              <Route path="verify-email" element={<VerifyEmail />} />

              {/* Protected Creator Routes */}
              <Route path="upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
              <Route path="studio" element={<ProtectedRoute><Studio /></ProtectedRoute>} />
              <Route path="analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

              {/* User Library Routes */}
              <Route path="library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
              <Route path="library/:tab" element={<ProtectedRoute><Library /></ProtectedRoute>} />
              <Route path="playlist/:playlistId" element={<ProtectedRoute><PlaylistDetail /></ProtectedRoute>} />
              <Route path="messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
              <Route path="messages/:conversationId" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
              <Route path="notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

              {/* Comp Card Routes */}
              <Route path="comp-cards" element={<ProtectedRoute><CompCards /></ProtectedRoute>} />
              <Route path="comp-card/:id" element={<CompCard />} />
              <Route path="comp-card/share/:token" element={<CompCard />} />

              {/* Agent Routes */}
              <Route path="agent" element={<AgentRoute><AgentDashboard /></AgentRoute>} />
              <Route path="agent/discover" element={<AgentRoute><AgentDiscover /></AgentRoute>} />
              <Route path="agent/bookmarks" element={<AgentRoute><AgentBookmarks /></AgentRoute>} />
              <Route path="agent/messages" element={<AgentRoute><AgentMessages /></AgentRoute>} />
              <Route path="agent/trends" element={<AgentRoute><AgentTrends /></AgentRoute>} />
              <Route path="agent/casting-lists" element={<AgentRoute><AgentCastingLists /></AgentRoute>} />
              <Route path="agent/casting-lists/:listId" element={<AgentRoute><AgentCastingListDetail /></AgentRoute>} />
              <Route path="agent/notes" element={<AgentRoute><AgentTalentNotes /></AgentRoute>} />
              <Route path="agent/notes/:talentId" element={<AgentRoute><AgentTalentNotes /></AgentRoute>} />

              {/* Admin Routes */}
              <Route path="admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
              <Route path="admin/videos" element={<AdminRoute><AdminVideos /></AdminRoute>} />
              <Route path="admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
              <Route path="admin/categories" element={<AdminRoute><AdminCategories /></AdminRoute>} />
              <Route path="admin/moderation" element={<AdminRoute><AdminModeration /></AdminRoute>} />
              <Route path="admin/complaints" element={<AdminRoute><AdminComplaints /></AdminRoute>} />
              <Route path="admin/ai-moderation" element={<AdminRoute><AdminModeration /></AdminRoute>} />
              <Route path="admin/verify-agents" element={<AdminRoute><AdminAgentVerification /></AdminRoute>} />
              <Route path="admin/announcements" element={<AdminRoute><AdminAnnouncements /></AdminRoute>} />
              <Route path="admin/audit-logs" element={<AdminRoute><AdminAuditLogs /></AdminRoute>} />
              <Route path="admin/features" element={<AdminRoute><AdminFeatureManagement /></AdminRoute>} />
              <Route path="admin/user-analytics" element={<AdminRoute><AdminUserAnalytics /></AdminRoute>} />

              {/* 404 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
            </Routes>
            </BrowserRouter>
          </FeatureProvider>
        </AuthProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;

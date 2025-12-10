import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store';
import { AuthProvider } from './contexts/AuthContext';

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
import About from './pages/About';
import Terms from './pages/Terms';
import Contact from './pages/Contact';

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

// Agent Pages
import AgentDashboard from './pages/agent/Dashboard';
import AgentDiscover from './pages/agent/Discover';
import AgentBookmarks from './pages/agent/Bookmarks';
import AgentMessages from './pages/agent/Messages';
import AgentTrends from './pages/agent/Trends';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminVideos from './pages/admin/Videos';
import AdminReports from './pages/admin/Reports';
import AdminCategories from './pages/admin/Categories';

function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="watch/:videoId" element={<Watch />} />
              <Route path="search" element={<Search />} />
              <Route path="profile/:userId" element={<Profile />} />
              <Route path="category/:categorySlug" element={<Category />} />
              <Route path="trending" element={<Trending />} />
              <Route path="about" element={<About />} />
              <Route path="terms" element={<Terms />} />
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

              {/* Agent Routes */}
              <Route path="agent" element={<AgentRoute><AgentDashboard /></AgentRoute>} />
              <Route path="agent/discover" element={<AgentRoute><AgentDiscover /></AgentRoute>} />
              <Route path="agent/bookmarks" element={<AgentRoute><AgentBookmarks /></AgentRoute>} />
              <Route path="agent/messages" element={<AgentRoute><AgentMessages /></AgentRoute>} />
              <Route path="agent/trends" element={<AgentRoute><AgentTrends /></AgentRoute>} />

              {/* Admin Routes */}
              <Route path="admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
              <Route path="admin/videos" element={<AdminRoute><AdminVideos /></AdminRoute>} />
              <Route path="admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
              <Route path="admin/categories" element={<AdminRoute><AdminCategories /></AdminRoute>} />

              {/* 404 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </Provider>
  );
}

export default App;

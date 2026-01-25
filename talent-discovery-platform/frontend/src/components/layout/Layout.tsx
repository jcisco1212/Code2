import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { messagesAPI, getUploadUrl } from '../../services/api';
import {
  HomeIcon,
  MagnifyingGlassIcon,
  FireIcon,
  UserCircleIcon,
  ArrowUpTrayIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChatBubbleLeftIcon,
  ChartBarIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  BookmarkIcon,
  ClockIcon,
  EnvelopeIcon,
  FolderIcon,
  ClipboardDocumentIcon,
  PencilIcon,
  MegaphoneIcon,
  DocumentIcon,
  FilmIcon,
  StarIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import NotificationDropdown from '../notifications/NotificationDropdown';
import AIChatbot from '../support/AIChatbot';
import CookieConsent from '../common/CookieConsent';
import AnnouncementBanner from '../notifications/AnnouncementBanner';

const Layout: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Fetch unread message count
  useEffect(() => {
    if (isAuthenticated) {
      const fetchUnreadMessages = async () => {
        try {
          const response = await messagesAPI.getUnreadCount();
          setUnreadMessages(response.data.count || 0);
        } catch (err) {
          // Silently fail
        }
      };

      fetchUnreadMessages();
      // Poll every 30 seconds
      const interval = setInterval(fetchUnreadMessages, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navigation = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'Trending', href: '/trending', icon: FireIcon },
    { name: 'Clips', href: '/clips', icon: FilmIcon },
    { name: 'Challenges', href: '/challenges', icon: FireIcon },
    { name: 'Duets', href: '/duets', icon: UsersIcon },
    { name: 'Achievements', href: '/achievements', icon: StarIcon }
  ];

  const userNavigation = isAuthenticated
    ? [
        { name: 'Upload', href: '/upload', icon: ArrowUpTrayIcon },
        { name: 'Studio', href: '/studio', icon: ChartBarIcon },
        { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
        { name: 'Library', href: '/library', icon: FolderIcon },
        { name: 'Messages', href: '/messages', icon: EnvelopeIcon }
      ]
    : [];

  const agentNavigation = (user?.role === 'agent' || user?.role === 'admin' || user?.role === 'super_admin')
    ? [
        { name: 'Agent Dashboard', href: '/agent', icon: ChartBarIcon },
        { name: 'Discover Talent', href: '/agent/discover', icon: MagnifyingGlassIcon },
        { name: 'Casting Lists', href: '/agent/casting-lists', icon: ClipboardDocumentIcon },
        { name: 'Talent Notes', href: '/agent/notes', icon: PencilIcon }
      ]
    : [];

  const adminNavigation = (user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'moderator')
    ? [
        { name: 'Admin Panel', href: '/admin', icon: Cog6ToothIcon },
        { name: 'User Analytics', href: '/admin/user-analytics', icon: ChartBarIcon },
        { name: 'Content Management', href: '/admin/content-management', icon: ClipboardDocumentIcon },
        { name: 'Marketing Analytics', href: '/admin/marketing-analytics', icon: ChartBarIcon },
        { name: 'Features', href: '/admin/features', icon: Cog6ToothIcon },
        { name: 'Announcements', href: '/admin/announcements', icon: MegaphoneIcon },
        { name: 'Audit Logs', href: '/admin/audit-logs', icon: DocumentIcon }
      ]
    : [];

  return (
    <div className="min-h-screen">
      {/* Header - Glass Effect */}
      <header className="fixed top-0 left-0 right-0 z-50 nav-glass">
        <div className="flex items-center justify-between h-32 px-4 lg:px-6">
          {/* Left: Logo & Menu Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              <Bars3Icon className="w-6 h-6 text-white" />
            </button>
            <Link to="/" className="flex items-center">
              <img
                src="/images/get-noticed-logo.png"
                alt="Get Noticed"
                className="h-40 md:h-48 w-auto object-contain"
              />
            </Link>
          </div>

          {/* Center: Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search videos, creators, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 rounded-full
                         bg-[#121212] border border-[#303030]
                         text-white placeholder:text-gray-500
                         focus:outline-none focus:border-blue-500
                         transition-all"
              />
            </div>
          </form>

          {/* Right: User Menu */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to="/upload"
                  className="hidden sm:flex items-center gap-2 px-5 py-2.5
                           bg-red-600 hover:bg-red-700 text-white rounded-full
                           transition-all duration-200"
                >
                  <ArrowUpTrayIcon className="w-5 h-5" />
                  <span className="font-medium">Upload</span>
                </Link>
                {/* Messages indicator */}
                <Link
                  to="/messages"
                  className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
                  aria-label="Messages"
                >
                  <EnvelopeIcon className="w-6 h-6 text-gray-300" />
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-xs font-bold text-white bg-red-500 rounded-full">
                      {unreadMessages > 99 ? '99+' : unreadMessages}
                    </span>
                  )}
                </Link>
                <NotificationDropdown />
                <Menu as="div" className="relative">
                  <Menu.Button className="flex items-center gap-2 p-1.5 rounded-full
                                        hover:bg-white/50 dark:hover:bg-white/10
                                        border border-transparent hover:border-white/50 dark:hover:border-white/20
                                        transition-all">
                    {(user?.profileImageUrl || user?.avatarUrl) ? (
                      <img
                        src={getUploadUrl(user.profileImageUrl || user.avatarUrl) || ''}
                        alt={user.username}
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-primary-400/50"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                        </span>
                      </div>
                    )}
                    <ChevronDownIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </Menu.Button>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-200"
                    enterFrom="transform opacity-0 scale-95 -translate-y-2"
                    enterTo="transform opacity-100 scale-100 translate-y-0"
                    leave="transition ease-in duration-150"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 mt-3 w-64 origin-top-right dropdown-glass focus:outline-none divide-y divide-[#404040] overflow-hidden">
                      <div className="px-4 py-4">
                        <p className="text-sm font-semibold text-white">{user?.firstName} {user?.lastName}</p>
                        <p className="text-sm text-gray-400">@{user?.username}</p>
                      </div>
                      <div className="py-2">
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to={`/profile/${user?.username}`}
                              className={`${active ? 'bg-white/10' : ''} flex items-center gap-3 px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 hover:text-gray-900 dark:hover:text-white transition-colors`}
                            >
                              <UserCircleIcon className="w-5 h-5" />
                              Your Profile
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to="/studio"
                              className={`${active ? 'bg-white/10' : ''} flex items-center gap-3 px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 hover:text-gray-900 dark:hover:text-white transition-colors`}
                            >
                              <ChartBarIcon className="w-5 h-5" />
                              Creator Studio
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to="/library"
                              className={`${active ? 'bg-white/10' : ''} flex items-center gap-3 px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 hover:text-gray-900 dark:hover:text-white transition-colors`}
                            >
                              <FolderIcon className="w-5 h-5" />
                              Library
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to="/messages"
                              className={`${active ? 'bg-white/10' : ''} flex items-center gap-3 px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 hover:text-gray-900 dark:hover:text-white transition-colors`}
                            >
                              <EnvelopeIcon className="w-5 h-5" />
                              Messages
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to="/settings"
                              className={`${active ? 'bg-white/10' : ''} flex items-center gap-3 px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 hover:text-gray-900 dark:hover:text-white transition-colors`}
                            >
                              <Cog6ToothIcon className="w-5 h-5" />
                              Settings
                            </Link>
                          )}
                        </Menu.Item>
                        {(user?.role === 'agent' || user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'moderator') && (
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                to="/agent"
                                className={`${active ? 'bg-white/10' : ''} flex items-center gap-3 px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 hover:text-gray-900 dark:hover:text-white transition-colors`}
                              >
                                <ChartBarIcon className="w-5 h-5" />
                                Agent Dashboard
                              </Link>
                            )}
                          </Menu.Item>
                        )}
                        {(user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'moderator') && (
                          <>
                            <Menu.Item>
                              {({ active }) => (
                                <Link
                                  to="/admin"
                                  className={`${active ? 'bg-white/10' : ''} flex items-center gap-3 px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 hover:text-gray-900 dark:hover:text-white transition-colors`}
                                >
                                  <Cog6ToothIcon className="w-5 h-5" />
                                  Admin Panel
                                </Link>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <Link
                                  to="/admin/features"
                                  className={`${active ? 'bg-white/10' : ''} flex items-center gap-3 px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 hover:text-gray-900 dark:hover:text-white transition-colors`}
                                >
                                  <Cog6ToothIcon className="w-5 h-5" />
                                  Feature Flags
                                </Link>
                              )}
                            </Menu.Item>
                          </>
                        )}
                      </div>
                      {/* Dark Mode Toggle */}
                      <div className="py-3 px-4">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Appearance</p>
                        <div className="flex items-center gap-1 bg-[#1a1a1a] rounded-xl p-1">
                          <button
                            onClick={() => setTheme('light')}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                              theme === 'light'
                                ? 'bg-[#3d3d3d] text-white shadow-sm'
                                : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            <SunIcon className="w-4 h-4" />
                            Light
                          </button>
                          <button
                            onClick={() => setTheme('dark')}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                              theme === 'dark'
                                ? 'bg-[#3d3d3d] text-white shadow-sm'
                                : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            <MoonIcon className="w-4 h-4" />
                            Dark
                          </button>
                          <button
                            onClick={() => setTheme('system')}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                              theme === 'system'
                                ? 'bg-[#3d3d3d] text-white shadow-sm'
                                : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            <ComputerDesktopIcon className="w-4 h-4" />
                            Auto
                          </button>
                        </div>
                      </div>
                      <div className="py-2">
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={handleLogout}
                              className={`${active ? 'bg-red-500/10' : ''} flex items-center gap-3 px-4 py-2.5 text-sm w-full text-red-500 hover:text-red-400 transition-colors`}
                            >
                              <ArrowRightOnRectangleIcon className="w-5 h-5" />
                              Sign out
                            </button>
                          )}
                        </Menu.Item>
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-5 py-2 text-gray-700 dark:text-gray-200
                           hover:bg-white/50 dark:hover:bg-white/10
                           rounded-full transition-colors font-medium"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 bg-gradient-primary text-white rounded-full
                           shadow-aurora hover:shadow-aurora-lg
                           transition-all duration-300 hover:-translate-y-0.5 font-medium"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Secondary nav for pages */}
        <div className="hidden lg:flex items-center gap-1 px-6 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <Link to="/about" className="px-4 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors">
            About
          </Link>
          <Link to="/terms" className="px-4 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors">
            Terms of Service
          </Link>
          <Link to="/privacy" className="px-4 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors">
            Privacy Policy
          </Link>
          <Link to="/contact" className="px-4 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors">
            Contact
          </Link>
        </div>
      </header>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-72 bg-white/95 dark:bg-aurora/95 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-white/10">
              <span className="text-xl font-bold text-gradient">Menu</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-gray-800 dark:text-gray-300" />
              </button>
            </div>
            <nav className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-80px)]">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-950 dark:text-gray-200 hover:bg-primary-500/10 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              ))}
              {userNavigation.length > 0 && (
                <>
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-white/20 to-transparent my-4" />
                  <p className="px-4 text-xs font-semibold text-gray-700 dark:text-gray-500 uppercase tracking-wider">Your Content</p>
                  {userNavigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-950 dark:text-gray-200 hover:bg-primary-500/10 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      <item.icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  ))}
                </>
              )}
              {agentNavigation.length > 0 && (
                <>
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-white/20 to-transparent my-4" />
                  <p className="px-4 text-xs font-semibold text-gray-700 dark:text-gray-500 uppercase tracking-wider">Agent Tools</p>
                  {agentNavigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-950 dark:text-gray-200 hover:bg-primary-500/10 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      <item.icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  ))}
                </>
              )}
              {adminNavigation.length > 0 && (
                <>
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-white/20 to-transparent my-4" />
                  <p className="px-4 text-xs font-semibold text-gray-700 dark:text-gray-500 uppercase tracking-wider">Admin</p>
                  {adminNavigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-950 dark:text-gray-200 hover:bg-primary-500/10 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      <item.icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  ))}
                </>
              )}
              <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-white/20 to-transparent my-4" />
              <Link to="/about" onClick={() => setSidebarOpen(false)} className="block px-4 py-2.5 text-gray-950 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg transition-colors">
                About
              </Link>
              <Link to="/terms" onClick={() => setSidebarOpen(false)} className="block px-4 py-2.5 text-gray-950 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg transition-colors">
                Terms of Service
              </Link>
              <Link to="/privacy" onClick={() => setSidebarOpen(false)} className="block px-4 py-2.5 text-gray-950 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg transition-colors">
                Privacy Policy
              </Link>
              <Link to="/contact" onClick={() => setSidebarOpen(false)} className="block px-4 py-2.5 text-gray-950 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg transition-colors">
                Contact
              </Link>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="pt-48 lg:pt-56 min-h-screen">
        {/* Announcement Banner */}
        <AnnouncementBanner />
        <Outlet />
      </main>

      {/* Footer - Glass Effect */}
      <footer className="mt-16 border-t border-[#303030] bg-[#181818]">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="mb-4">
                <img
                  src="/images/get-noticed-logo.png"
                  alt="Get Noticed"
                  className="h-48 w-auto object-contain"
                />
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Discover and showcase your talent with AI-powered insights.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Explore</h3>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li><Link to="/trending" className="hover:text-white transition-colors">Trending</Link></li>
                <li><Link to="/clips" className="hover:text-white transition-colors">Clips</Link></li>
                <li><Link to="/category/singer" className="hover:text-white transition-colors">Singers</Link></li>
                <li><Link to="/category/actor" className="hover:text-white transition-colors">Actors</Link></li>
                <li><Link to="/category/dancer" className="hover:text-white transition-colors">Dancers</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">For Agents</h3>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li><Link to="/register?role=agent" className="hover:text-white transition-colors">Join as Agent</Link></li>
                <li><Link to="/agent" className="hover:text-white transition-colors">Agent Dashboard</Link></li>
              </ul>
            </div>
          </div>

          {/* Social Media Links */}
          <div className="mt-10 pt-8 border-t border-[#303030]">
            <h3 className="font-semibold text-white mb-4 text-center">Follow Us</h3>
            <div className="flex justify-center items-center gap-4 flex-wrap">
              {/* Instagram */}
              <a
                href="https://instagram.com/getnoticed"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center hover:scale-110 transition-transform"
                aria-label="Follow us on Instagram"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>

              {/* TikTok */}
              <a
                href="https://tiktok.com/@getnoticed"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-black flex items-center justify-center hover:scale-110 transition-transform border border-gray-700"
                aria-label="Follow us on TikTok"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                </svg>
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com/@getnoticed"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center hover:scale-110 transition-transform"
                aria-label="Subscribe on YouTube"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>

              {/* Twitter/X */}
              <a
                href="https://x.com/getnoticed"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-black flex items-center justify-center hover:scale-110 transition-transform border border-gray-700"
                aria-label="Follow us on X"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>

              {/* Facebook */}
              <a
                href="https://facebook.com/getnoticed"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center hover:scale-110 transition-transform"
                aria-label="Follow us on Facebook"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>

              {/* Truth Social */}
              <a
                href="https://truthsocial.com/@getnoticed"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center hover:scale-110 transition-transform"
                aria-label="Follow us on Truth Social"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm0-8h-2V7h2v2zm4 8h-2v-4h2v4zm0-6h-2V9h2v2z"/>
                </svg>
              </a>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-[#303030] text-center">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Get-Noticed. All rights reserved.
            </p>
            <div className="mt-2 h-1 w-24 mx-auto bg-red-600 rounded-full" />
          </div>
        </div>
      </footer>

      {/* AI Support Chatbot */}
      <AIChatbot />

      {/* Cookie Consent Banner */}
      <CookieConsent />
    </div>
  );
};

export default Layout;

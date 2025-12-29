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
        { name: 'Features', href: '/admin/features', icon: Cog6ToothIcon },
        { name: 'Announcements', href: '/admin/announcements', icon: MegaphoneIcon },
        { name: 'Audit Logs', href: '/admin/audit-logs', icon: DocumentIcon }
      ]
    : [];

  return (
    <div className="min-h-screen">
      {/* Header - Glass Effect */}
      <header className="fixed top-0 left-0 right-0 z-50 nav-glass">
        <div className="flex items-center justify-between h-16 px-4 lg:px-6">
          {/* Left: Logo & Menu Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              <Bars3Icon className="w-6 h-6 text-white" />
            </button>
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">GN</span>
              </div>
              <span className="hidden sm:block text-xl font-bold text-white">
                Get-Noticed
              </span>
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
                              className={`${active ? 'bg-white/10' : ''} flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 hover:text-white transition-colors`}
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
                              className={`${active ? 'bg-white/10' : ''} flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 hover:text-white transition-colors`}
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
                              className={`${active ? 'bg-white/10' : ''} flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 hover:text-white transition-colors`}
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
                              className={`${active ? 'bg-white/10' : ''} flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 hover:text-white transition-colors`}
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
                              className={`${active ? 'bg-white/10' : ''} flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 hover:text-white transition-colors`}
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
                                className={`${active ? 'bg-white/10' : ''} flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 hover:text-white transition-colors`}
                              >
                                <ChartBarIcon className="w-5 h-5" />
                                Agent Dashboard
                              </Link>
                            )}
                          </Menu.Item>
                        )}
                        {(user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'moderator') && (
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                to="/admin"
                                className={`${active ? 'bg-white/10' : ''} flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 hover:text-white transition-colors`}
                              >
                                <Cog6ToothIcon className="w-5 h-5" />
                                Admin Panel
                              </Link>
                            )}
                          </Menu.Item>
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
        <div className="hidden lg:flex items-center gap-1 px-6 py-2 border-t border-white/50 dark:border-white/5 bg-white/30 dark:bg-white/5">
          <Link to="/about" className="px-4 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors">
            About
          </Link>
          <Link to="/terms" className="px-4 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors">
            Terms of Service
          </Link>
          <Link to="/contact" className="px-4 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors">
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
                <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
            <nav className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-80px)]">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-primary-500/10 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              ))}
              {userNavigation.length > 0 && (
                <>
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-white/20 to-transparent my-4" />
                  <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Your Content</p>
                  {userNavigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-primary-500/10 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
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
                  <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Agent Tools</p>
                  {agentNavigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-primary-500/10 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
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
                  <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</p>
                  {adminNavigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-primary-500/10 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      <item.icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  ))}
                </>
              )}
              <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-white/20 to-transparent my-4" />
              <Link to="/about" onClick={() => setSidebarOpen(false)} className="block px-4 py-2.5 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg transition-colors">
                About
              </Link>
              <Link to="/terms" onClick={() => setSidebarOpen(false)} className="block px-4 py-2.5 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg transition-colors">
                Terms of Service
              </Link>
              <Link to="/contact" onClick={() => setSidebarOpen(false)} className="block px-4 py-2.5 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg transition-colors">
                Contact
              </Link>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="pt-24 lg:pt-28 min-h-screen">
        <Outlet />
      </main>

      {/* Footer - Glass Effect */}
      <footer className="mt-16 border-t border-[#303030] bg-[#181818]">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">GN</span>
                </div>
                <h3 className="font-bold text-white">Get-Noticed</h3>
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
          <div className="mt-10 pt-8 border-t border-[#303030] text-center">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Get-Noticed. All rights reserved.
            </p>
            <div className="mt-2 h-1 w-24 mx-auto bg-red-600 rounded-full" />
          </div>
        </div>
      </footer>

      {/* AI Support Chatbot */}
      <AIChatbot />
    </div>
  );
};

export default Layout;

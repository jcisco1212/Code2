import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  HomeIcon,
  MagnifyingGlassIcon,
  FireIcon,
  UserCircleIcon,
  ArrowUpTrayIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  ChatBubbleLeftIcon,
  ChartBarIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

const Layout: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
    { name: 'Trending', href: '/trending', icon: FireIcon }
  ];

  const userNavigation = isAuthenticated
    ? [
        { name: 'Upload', href: '/upload', icon: ArrowUpTrayIcon },
        { name: 'Studio', href: '/studio', icon: ChartBarIcon },
        { name: 'Analytics', href: '/analytics', icon: ChartBarIcon }
      ]
    : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex items-center justify-between h-16 px-4 lg:px-6">
          {/* Left: Logo & Menu Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">TV</span>
              </div>
              <span className="hidden sm:block text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                TalentVault
              </span>
            </Link>
          </div>

          {/* Center: Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search videos, creators, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </form>

          {/* Right: User Menu */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/upload"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <ArrowUpTrayIcon className="w-5 h-5" />
                  <span>Upload</span>
                </Link>
                <button className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                  <BellIcon className="w-6 h-6" />
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
                </button>
                <Menu as="div" className="relative">
                  <Menu.Button className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                    {user?.profileImageUrl ? (
                      <img
                        src={user.profileImageUrl}
                        alt={user.username}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <UserCircleIcon className="w-8 h-8" />
                    )}
                    <ChevronDownIcon className="w-4 h-4" />
                  </Menu.Button>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-gray-100 dark:divide-gray-700">
                      <div className="px-4 py-3">
                        <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                        <p className="text-sm text-gray-500">@{user?.username}</p>
                      </div>
                      <div className="py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to={`/profile/${user?.id}`}
                              className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''} flex items-center gap-2 px-4 py-2 text-sm`}
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
                              className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''} flex items-center gap-2 px-4 py-2 text-sm`}
                            >
                              <ChartBarIcon className="w-5 h-5" />
                              Creator Studio
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to="/settings"
                              className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''} flex items-center gap-2 px-4 py-2 text-sm`}
                            >
                              <Cog6ToothIcon className="w-5 h-5" />
                              Settings
                            </Link>
                          )}
                        </Menu.Item>
                        {user?.role === 'agent' && (
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                to="/agent"
                                className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''} flex items-center gap-2 px-4 py-2 text-sm`}
                              >
                                <ChartBarIcon className="w-5 h-5" />
                                Agent Dashboard
                              </Link>
                            )}
                          </Menu.Item>
                        )}
                        {(user?.role === 'admin' || user?.role === 'moderator') && (
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                to="/admin"
                                className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''} flex items-center gap-2 px-4 py-2 text-sm`}
                              >
                                <Cog6ToothIcon className="w-5 h-5" />
                                Admin Panel
                              </Link>
                            )}
                          </Menu.Item>
                        )}
                      </div>
                      <div className="py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={handleLogout}
                              className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''} flex items-center gap-2 px-4 py-2 text-sm w-full text-red-600`}
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
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Secondary nav for pages */}
        <div className="hidden lg:flex items-center gap-1 px-6 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <Link to="/about" className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            About
          </Link>
          <Link to="/terms" className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            Terms of Service
          </Link>
          <Link to="/contact" className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            Contact
          </Link>
        </div>
      </header>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-800 shadow-xl">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <span className="text-xl font-bold">Menu</span>
              <button onClick={() => setSidebarOpen(false)}>
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <nav className="p-4 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              ))}
              <hr className="my-4 dark:border-gray-700" />
              <Link to="/about" onClick={() => setSidebarOpen(false)} className="block px-3 py-2 text-gray-600 dark:text-gray-400">
                About
              </Link>
              <Link to="/terms" onClick={() => setSidebarOpen(false)} className="block px-3 py-2 text-gray-600 dark:text-gray-400">
                Terms of Service
              </Link>
              <Link to="/contact" onClick={() => setSidebarOpen(false)} className="block px-3 py-2 text-gray-600 dark:text-gray-400">
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

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">TalentVault</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Discover and showcase your talent with AI-powered insights.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Explore</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link to="/trending" className="hover:text-indigo-600">Trending</Link></li>
                <li><Link to="/category/singer" className="hover:text-indigo-600">Singers</Link></li>
                <li><Link to="/category/actor" className="hover:text-indigo-600">Actors</Link></li>
                <li><Link to="/category/dancer" className="hover:text-indigo-600">Dancers</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link to="/about" className="hover:text-indigo-600">About</Link></li>
                <li><Link to="/contact" className="hover:text-indigo-600">Contact</Link></li>
                <li><Link to="/terms" className="hover:text-indigo-600">Terms</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Agents</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link to="/register?role=agent" className="hover:text-indigo-600">Join as Agent</Link></li>
                <li><Link to="/agent" className="hover:text-indigo-600">Agent Dashboard</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t dark:border-gray-700 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>&copy; {new Date().getFullYear()} TalentVault. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

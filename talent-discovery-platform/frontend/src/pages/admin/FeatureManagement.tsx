import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { featuresAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  Cog6ToothIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  TrashIcon,
  FunnelIcon,
  ArrowPathIcon,
  SparklesIcon,
  ChatBubbleLeftIcon,
  UsersIcon,
  CurrencyDollarIcon,
  CpuChipIcon,
  ShieldCheckIcon,
  BeakerIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { Switch } from '@headlessui/react';

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: string;
  isEnabled: boolean;
  enabledForRoles: string[] | null;
  enabledForUsers: string[] | null;
  config: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  updater?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
}

const CATEGORIES = [
  { value: 'all', label: 'All Categories', icon: FunnelIcon },
  { value: 'content', label: 'Content', icon: SparklesIcon },
  { value: 'social', label: 'Social', icon: ChatBubbleLeftIcon },
  { value: 'engagement', label: 'Engagement', icon: UsersIcon },
  { value: 'monetization', label: 'Monetization', icon: CurrencyDollarIcon },
  { value: 'ai', label: 'AI Features', icon: CpuChipIcon },
  { value: 'admin', label: 'Admin', icon: ShieldCheckIcon },
  { value: 'experimental', label: 'Experimental', icon: BeakerIcon }
];

const CATEGORY_COLORS: Record<string, string> = {
  content: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  social: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  engagement: 'bg-green-500/10 text-green-400 border-green-500/30',
  monetization: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  ai: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  admin: 'bg-red-500/10 text-red-400 border-red-500/30',
  experimental: 'bg-orange-500/10 text-orange-400 border-orange-500/30'
};

const FeatureManagement: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const isSuperAdmin = user?.role === 'super_admin';

  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<{ total: number; enabled: number; disabled: number } | null>(null);
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set());

  // New feature form
  const [newFeature, setNewFeature] = useState({
    key: '',
    name: '',
    description: '',
    category: 'content',
    isEnabled: true
  });

  useEffect(() => {
    fetchFeatures();
    fetchStats();
  }, [selectedCategory]);

  const fetchFeatures = async () => {
    try {
      setLoading(true);
      const response = await featuresAPI.getAll(selectedCategory);
      setFeatures(response.data.flags || []);
    } catch (err) {
      toast.error('Failed to fetch features');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await featuresAPI.getStats();
      setStats(response.data.stats);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleToggle = async (feature: FeatureFlag) => {
    try {
      await featuresAPI.toggleFeature(feature.id, !feature.isEnabled);
      setFeatures(prev =>
        prev.map(f => f.id === feature.id ? { ...f, isEnabled: !f.isEnabled } : f)
      );
      toast.success(`${feature.name} ${!feature.isEnabled ? 'enabled' : 'disabled'}`);
      fetchStats();
    } catch (err) {
      toast.error('Failed to toggle feature');
    }
  };

  const handleBulkToggle = async (enable: boolean) => {
    if (selectedFeatures.size === 0) {
      toast.error('No features selected');
      return;
    }

    try {
      await featuresAPI.bulkToggle(Array.from(selectedFeatures), enable);
      setFeatures(prev =>
        prev.map(f => selectedFeatures.has(f.id) ? { ...f, isEnabled: enable } : f)
      );
      setSelectedFeatures(new Set());
      toast.success(`${selectedFeatures.size} features ${enable ? 'enabled' : 'disabled'}`);
      fetchStats();
    } catch (err) {
      toast.error('Failed to bulk toggle features');
    }
  };

  const handleSeedFeatures = async () => {
    try {
      const response = await featuresAPI.seedFeatures();
      toast.success(response.data.message);
      fetchFeatures();
      fetchStats();
    } catch (err) {
      toast.error('Failed to seed features');
    }
  };

  const handleCreateFeature = async () => {
    if (!newFeature.key || !newFeature.name) {
      toast.error('Key and name are required');
      return;
    }

    try {
      await featuresAPI.createFeature(newFeature);
      toast.success('Feature created successfully');
      setShowCreateModal(false);
      setNewFeature({ key: '', name: '', description: '', category: 'content', isEnabled: true });
      fetchFeatures();
      fetchStats();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create feature');
    }
  };

  const handleDeleteFeature = async (featureId: string, featureName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${featureName}"?`)) return;

    try {
      await featuresAPI.deleteFeature(featureId);
      setFeatures(prev => prev.filter(f => f.id !== featureId));
      toast.success('Feature deleted');
      fetchStats();
    } catch (err) {
      toast.error('Failed to delete feature');
    }
  };

  const toggleSelectAll = () => {
    if (selectedFeatures.size === filteredFeatures.length) {
      setSelectedFeatures(new Set());
    } else {
      setSelectedFeatures(new Set(filteredFeatures.map(f => f.id)));
    }
  };

  const toggleSelect = (featureId: string) => {
    const newSet = new Set(selectedFeatures);
    if (newSet.has(featureId)) {
      newSet.delete(featureId);
    } else {
      newSet.add(featureId);
    }
    setSelectedFeatures(newSet);
  };

  const filteredFeatures = features.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Cog6ToothIcon className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-2xl font-bold text-white">Feature Management</h1>
            <p className="text-gray-400">Control platform features and experimental flags</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isSuperAdmin && (
            <>
              <button
                onClick={handleSeedFeatures}
                className="flex items-center gap-2 px-4 py-2 bg-[#282828] hover:bg-[#383838] text-gray-300 rounded-lg transition-colors"
              >
                <ArrowPathIcon className="w-5 h-5" />
                Seed Defaults
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                New Feature
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#282828] rounded-xl p-4 border border-[#404040]">
            <div className="text-3xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-gray-400">Total Features</div>
          </div>
          <div className="bg-[#282828] rounded-xl p-4 border border-[#404040]">
            <div className="text-3xl font-bold text-green-400">{stats.enabled}</div>
            <div className="text-sm text-gray-400">Enabled</div>
          </div>
          <div className="bg-[#282828] rounded-xl p-4 border border-[#404040]">
            <div className="text-3xl font-bold text-red-400">{stats.disabled}</div>
            <div className="text-sm text-gray-400">Disabled</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* Category Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#282828] text-gray-300 hover:bg-[#383838]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search features..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 bg-[#282828] border border-[#404040] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Bulk Actions */}
      {selectedFeatures.size > 0 && (
        <div className="flex items-center gap-4 mb-4 p-3 bg-blue-600/10 border border-blue-600/30 rounded-lg">
          <span className="text-blue-400 font-medium">{selectedFeatures.size} selected</span>
          <button
            onClick={() => handleBulkToggle(true)}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
          >
            Enable All
          </button>
          <button
            onClick={() => handleBulkToggle(false)}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
          >
            Disable All
          </button>
          <button
            onClick={() => setSelectedFeatures(new Set())}
            className="text-gray-400 hover:text-white text-sm"
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Features List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-[#282828] rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-6 bg-[#404040] rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#404040] rounded w-1/4" />
                  <div className="h-3 bg-[#404040] rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredFeatures.length === 0 ? (
        <div className="text-center py-16 bg-[#282828] rounded-xl border border-[#404040]">
          <Cog6ToothIcon className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Features Found</h3>
          <p className="text-gray-400 mb-6">
            {features.length === 0 ? 'Click "Seed Defaults" to add default features' : 'Try a different search term'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Select All */}
          <div className="flex items-center gap-3 px-4 py-2 bg-[#1a1a1a] rounded-lg">
            <input
              type="checkbox"
              checked={selectedFeatures.size === filteredFeatures.length && filteredFeatures.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-[#282828]"
            />
            <span className="text-sm text-gray-400">Select All</span>
          </div>

          {filteredFeatures.map(feature => (
            <div
              key={feature.id}
              className={`bg-[#282828] rounded-xl border transition-all ${
                selectedFeatures.has(feature.id) ? 'border-blue-500' : 'border-[#404040]'
              }`}
            >
              <div className="flex items-center gap-4 p-4">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedFeatures.has(feature.id)}
                  onChange={() => toggleSelect(feature.id)}
                  className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-[#282828]"
                />

                {/* Toggle Switch */}
                <Switch
                  checked={feature.isEnabled}
                  onChange={() => handleToggle(feature)}
                  className={`${
                    feature.isEnabled ? 'bg-green-600' : 'bg-gray-600'
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  <span
                    className={`${
                      feature.isEnabled ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-white">{feature.name}</h3>
                    <code className="px-2 py-0.5 bg-[#1a1a1a] rounded text-xs text-gray-400">
                      {feature.key}
                    </code>
                    <span className={`px-2 py-0.5 rounded text-xs border ${CATEGORY_COLORS[feature.category] || 'bg-gray-500/10 text-gray-400 border-gray-500/30'}`}>
                      {feature.category}
                    </span>
                  </div>
                  {feature.description && (
                    <p className="text-sm text-gray-400 line-clamp-1">{feature.description}</p>
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  {feature.isEnabled ? (
                    <span className="flex items-center gap-1 text-green-400 text-sm">
                      <CheckCircleIcon className="w-5 h-5" />
                      Enabled
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-400 text-sm">
                      <XCircleIcon className="w-5 h-5" />
                      Disabled
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpandedFeature(expandedFeature === feature.id ? null : feature.id)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-[#383838] rounded-lg transition-colors"
                  >
                    {expandedFeature === feature.id ? (
                      <ChevronUpIcon className="w-5 h-5" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5" />
                    )}
                  </button>
                  {isSuperAdmin && (
                    <button
                      onClick={() => handleDeleteFeature(feature.id, feature.name)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedFeature === feature.id && (
                <div className="border-t border-[#404040] p-4 bg-[#1a1a1a] rounded-b-xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <span className="text-gray-300 ml-2">
                        {new Date(feature.createdAt).toLocaleDateString()}
                        {feature.creator && ` by @${feature.creator.username}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Last Updated:</span>
                      <span className="text-gray-300 ml-2">
                        {new Date(feature.updatedAt).toLocaleDateString()}
                        {feature.updater && ` by @${feature.updater.username}`}
                      </span>
                    </div>
                    {feature.enabledForRoles && feature.enabledForRoles.length > 0 && (
                      <div className="md:col-span-2">
                        <span className="text-gray-500">Enabled for Roles:</span>
                        <span className="text-gray-300 ml-2">
                          {feature.enabledForRoles.join(', ')}
                        </span>
                      </div>
                    )}
                    {feature.config && (
                      <div className="md:col-span-2">
                        <span className="text-gray-500">Config:</span>
                        <pre className="mt-2 p-2 bg-[#282828] rounded text-xs text-gray-300 overflow-x-auto">
                          {JSON.stringify(feature.config, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Feature Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-[#282828] rounded-xl p-6 w-full max-w-md border border-[#404040]">
            <h2 className="text-xl font-bold text-white mb-4">Create New Feature</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Feature Key</label>
                <input
                  type="text"
                  value={newFeature.key}
                  onChange={(e) => setNewFeature({ ...newFeature, key: e.target.value.toLowerCase().replace(/[^a-z_]/g, '') })}
                  placeholder="feature_key_name"
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#404040] rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Lowercase letters and underscores only</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  value={newFeature.name}
                  onChange={(e) => setNewFeature({ ...newFeature, name: e.target.value })}
                  placeholder="Feature Name"
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#404040] rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  value={newFeature.description}
                  onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
                  placeholder="What does this feature do?"
                  rows={2}
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#404040] rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                <select
                  value={newFeature.category}
                  onChange={(e) => setNewFeature({ ...newFeature, category: e.target.value })}
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#404040] rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  {CATEGORIES.filter(c => c.value !== 'all').map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={newFeature.isEnabled}
                  onChange={(checked) => setNewFeature({ ...newFeature, isEnabled: checked })}
                  className={`${
                    newFeature.isEnabled ? 'bg-green-600' : 'bg-gray-600'
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                >
                  <span
                    className={`${
                      newFeature.isEnabled ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
                <span className="text-gray-300">Enabled by default</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFeature}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Create Feature
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeatureManagement;

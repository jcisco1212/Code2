import React, { useState, useEffect, useCallback, useRef } from 'react';
import { socialContentAPI, marketingCampaignsAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface SocialContent {
  id: string;
  title: string;
  content: string;
  platform: 'twitter' | 'facebook' | 'instagram' | 'linkedin' | 'tiktok';
  contentType: 'text' | 'image' | 'video' | 'link' | 'carousel';
  status: 'draft' | 'scheduled' | 'published' | 'failed' | 'cancelled';
  mediaUrls: string[] | null;
  linkUrl: string | null;
  hashtags: string[] | null;
  scheduledAt: string | null;
  publishedAt: string | null;
  campaignId: string | null;
  notes: string | null;
  createdAt: string;
  creator?: { id: string; username: string; email: string };
  campaign?: { id: string; name: string };
}

interface Campaign {
  id: string;
  name: string;
  status: string;
}

const platformOptions = [
  { value: 'twitter', label: 'Twitter/X', icon: '𝕏', color: 'bg-black text-white' },
  { value: 'facebook', label: 'Facebook', icon: 'f', color: 'bg-blue-600 text-white' },
  { value: 'instagram', label: 'Instagram', icon: '📷', color: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' },
  { value: 'linkedin', label: 'LinkedIn', icon: 'in', color: 'bg-blue-700 text-white' },
  { value: 'tiktok', label: 'TikTok', icon: '♪', color: 'bg-black text-white' }
];

const contentTypeOptions = [
  { value: 'text', label: 'Text Post' },
  { value: 'image', label: 'Image Post' },
  { value: 'video', label: 'Video Post' },
  { value: 'link', label: 'Link Share' },
  { value: 'carousel', label: 'Carousel' }
];

const statusOptions = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-700' },
  { value: 'scheduled', label: 'Scheduled', color: 'bg-blue-100 text-blue-700' },
  { value: 'published', label: 'Published', color: 'bg-green-100 text-green-700' },
  { value: 'failed', label: 'Failed', color: 'bg-red-100 text-red-700' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-yellow-100 text-yellow-700' }
];

interface ContentFormData {
  title: string;
  content: string;
  platform: string;
  contentType: string;
  hashtags: string;
  linkUrl: string;
  scheduledAt: string;
  scheduledTime: string;
  campaignId: string;
  notes: string;
}

interface ContentFormProps {
  initialData: ContentFormData;
  campaigns: Campaign[];
  onSubmit: (data: ContentFormData) => void;
  onCancel: () => void;
  isEdit: boolean;
}

const ContentForm: React.FC<ContentFormProps> = ({ initialData, campaigns, onSubmit, onCancel, isEdit }) => {
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;

    const form = formRef.current;
    const data: ContentFormData = {
      title: (form.elements.namedItem('title') as HTMLInputElement).value,
      content: (form.elements.namedItem('content') as HTMLTextAreaElement).value,
      platform: (form.elements.namedItem('platform') as HTMLSelectElement).value,
      contentType: (form.elements.namedItem('contentType') as HTMLSelectElement).value,
      hashtags: (form.elements.namedItem('hashtags') as HTMLInputElement).value,
      linkUrl: (form.elements.namedItem('linkUrl') as HTMLInputElement).value,
      scheduledAt: (form.elements.namedItem('scheduledAt') as HTMLInputElement).value,
      scheduledTime: (form.elements.namedItem('scheduledTime') as HTMLInputElement).value,
      campaignId: (form.elements.namedItem('campaignId') as HTMLSelectElement).value,
      notes: (form.elements.namedItem('notes') as HTMLTextAreaElement).value
    };
    onSubmit(data);
  };

  const getCharacterLimit = (platform: string) => {
    switch (platform) {
      case 'twitter': return 280;
      case 'linkedin': return 3000;
      case 'facebook': return 63206;
      case 'instagram': return 2200;
      case 'tiktok': return 2200;
      default: return 5000;
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} autoComplete="off" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        {isEdit ? 'Edit Content' : 'Create New Content'}
      </h2>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Platform *</label>
            <select
              name="platform"
              defaultValue={initialData.platform}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              required
            >
              {platformOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content Type</label>
            <select
              name="contentType"
              defaultValue={initialData.contentType}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              {contentTypeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
          <input
            type="text"
            name="title"
            autoComplete="off"
            defaultValue={initialData.title}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            placeholder="Internal title for this content"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content *</label>
          <textarea
            name="content"
            autoComplete="off"
            defaultValue={initialData.content}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            rows={5}
            placeholder="Write your social media post content here..."
            required
          />
          <p className="text-xs text-gray-500 mt-1">Character limits vary by platform (Twitter: 280, LinkedIn: 3000, etc.)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hashtags</label>
          <input
            type="text"
            name="hashtags"
            autoComplete="off"
            defaultValue={initialData.hashtags}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            placeholder="#GetNoticed #TalentDiscovery #Entertainment (comma separated)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link URL</label>
          <input
            type="url"
            name="linkUrl"
            autoComplete="off"
            defaultValue={initialData.linkUrl}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            placeholder="https://www.get-noticed.net"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Schedule Date</label>
            <input
              type="date"
              name="scheduledAt"
              defaultValue={initialData.scheduledAt}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Schedule Time</label>
            <input
              type="time"
              name="scheduledTime"
              defaultValue={initialData.scheduledTime}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Campaign</label>
          <select
            name="campaignId"
            defaultValue={initialData.campaignId}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value="">No Campaign</option>
            {campaigns.map(campaign => (
              <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Internal Notes</label>
          <textarea
            name="notes"
            autoComplete="off"
            defaultValue={initialData.notes}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            rows={2}
            placeholder="Notes for your team (not published)"
          />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            {isEdit ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </form>
  );
};

const emptyFormData: ContentFormData = {
  title: '',
  content: '',
  platform: 'twitter',
  contentType: 'text',
  hashtags: '',
  linkUrl: '',
  scheduledAt: '',
  scheduledTime: '',
  campaignId: '',
  notes: ''
};

const ContentManagement: React.FC = () => {
  const [content, setContent] = useState<SocialContent[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingContent, setEditingContent] = useState<SocialContent | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [filterPlatform, setFilterPlatform] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCampaign, setFilterCampaign] = useState('');

  useEffect(() => {
    fetchData();
  }, [filterPlatform, filterStatus, filterCampaign]);

  const fetchData = async () => {
    try {
      const [contentRes, campaignsRes] = await Promise.all([
        socialContentAPI.getAll({
          platform: filterPlatform || undefined,
          status: filterStatus || undefined,
          campaignId: filterCampaign || undefined
        }),
        marketingCampaignsAPI.getAll()
      ]);
      setContent(contentRes.data.content || []);
      setCampaigns(campaignsRes.data.campaigns || []);
    } catch (err) {
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = useCallback(async (formData: ContentFormData) => {
    try {
      let scheduledAt: string | undefined;
      if (formData.scheduledAt) {
        const dateTime = formData.scheduledTime
          ? `${formData.scheduledAt}T${formData.scheduledTime}:00`
          : `${formData.scheduledAt}T09:00:00`;
        scheduledAt = new Date(dateTime).toISOString();
      }

      const payload = {
        title: formData.title,
        content: formData.content,
        platform: formData.platform,
        contentType: formData.contentType,
        hashtags: formData.hashtags ? formData.hashtags.split(',').map(h => h.trim()) : undefined,
        linkUrl: formData.linkUrl || undefined,
        scheduledAt,
        campaignId: formData.campaignId || undefined,
        notes: formData.notes || undefined
      };

      const response = await socialContentAPI.create(payload);
      setContent(prev => [response.data.content, ...prev]);
      setShowCreate(false);
      toast.success('Content created');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to create content');
    }
  }, []);

  const handleUpdate = useCallback(async (formData: ContentFormData) => {
    if (!editingContent) return;
    try {
      let scheduledAt: string | undefined;
      if (formData.scheduledAt) {
        const dateTime = formData.scheduledTime
          ? `${formData.scheduledAt}T${formData.scheduledTime}:00`
          : `${formData.scheduledAt}T09:00:00`;
        scheduledAt = new Date(dateTime).toISOString();
      }

      const response = await socialContentAPI.update(editingContent.id, {
        title: formData.title,
        content: formData.content,
        platform: formData.platform,
        contentType: formData.contentType,
        hashtags: formData.hashtags ? formData.hashtags.split(',').map(h => h.trim()) : null,
        linkUrl: formData.linkUrl || null,
        scheduledAt,
        campaignId: formData.campaignId || null,
        notes: formData.notes || null
      });
      setContent(prev => prev.map(c => c.id === editingContent.id ? response.data.content : c));
      setEditingContent(null);
      toast.success('Content updated');
    } catch (err) {
      toast.error('Failed to update content');
    }
  }, [editingContent]);

  const handlePublish = async (id: string) => {
    try {
      await socialContentAPI.publish(id);
      setContent(prev => prev.map(c => c.id === id ? { ...c, status: 'published' as const, publishedAt: new Date().toISOString() } : c));
      toast.success('Content marked as published');
    } catch (err) {
      toast.error('Failed to publish content');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const response = await socialContentAPI.duplicate(id);
      setContent(prev => [response.data.content, ...prev]);
      toast.success('Content duplicated');
    } catch (err) {
      toast.error('Failed to duplicate content');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this content?')) return;
    try {
      await socialContentAPI.delete(id);
      setContent(prev => prev.filter(c => c.id !== id));
      toast.success('Content deleted');
    } catch (err) {
      toast.error('Failed to delete content');
    }
  };

  const getPlatformInfo = (platform: string) => {
    return platformOptions.find(p => p.value === platform) || platformOptions[0];
  };

  const getStatusStyle = (status: string) => {
    const opt = statusOptions.find(s => s.value === status);
    return opt?.color || statusOptions[0].color;
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return 'Not scheduled';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Content Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Create and schedule social media content for Get-Noticed</p>
        </div>
        {!showCreate && !editingContent && (
          <button
            onClick={() => {
              setFormKey(k => k + 1);
              setShowCreate(true);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            + New Content
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
        <div className="flex gap-4 flex-wrap">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Platform</label>
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Platforms</option>
              {platformOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Statuses</option>
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Campaign</label>
            <select
              value={filterCampaign}
              onChange={(e) => setFilterCampaign(e.target.value)}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Campaigns</option>
              {campaigns.map(campaign => (
                <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {showCreate && (
        <ContentForm
          key={`create-${formKey}`}
          initialData={emptyFormData}
          campaigns={campaigns}
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
          isEdit={false}
        />
      )}

      {editingContent && (
        <ContentForm
          key={editingContent.id}
          initialData={{
            title: editingContent.title,
            content: editingContent.content,
            platform: editingContent.platform,
            contentType: editingContent.contentType,
            hashtags: editingContent.hashtags?.join(', ') || '',
            linkUrl: editingContent.linkUrl || '',
            scheduledAt: editingContent.scheduledAt ? editingContent.scheduledAt.split('T')[0] : '',
            scheduledTime: editingContent.scheduledAt ? editingContent.scheduledAt.split('T')[1]?.substring(0, 5) : '',
            campaignId: editingContent.campaignId || '',
            notes: editingContent.notes || ''
          }}
          campaigns={campaigns}
          onSubmit={handleUpdate}
          onCancel={() => setEditingContent(null)}
          isEdit={true}
        />
      )}

      {content.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
          <div className="text-5xl mb-4">📱</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No content yet</h2>
          <p className="text-gray-500 dark:text-gray-400">Create your first social media post to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {content.map(item => {
            const platformInfo = getPlatformInfo(item.platform);
            return (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${platformInfo.color}`}>
                        {platformInfo.icon}
                      </span>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                      <span className={`px-2 py-0.5 text-xs rounded ${getStatusStyle(item.status)}`}>
                        {item.status}
                      </span>
                      {item.campaign && (
                        <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                          {item.campaign.name}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap mb-2">{item.content}</p>
                    {item.hashtags && item.hashtags.length > 0 && (
                      <div className="flex gap-1 flex-wrap mb-2">
                        {item.hashtags.map((tag, i) => (
                          <span key={i} className="text-xs text-blue-600 dark:text-blue-400">{tag.startsWith('#') ? tag : `#${tag}`}</span>
                        ))}
                      </div>
                    )}
                    {item.linkUrl && (
                      <a href={item.linkUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                        {item.linkUrl}
                      </a>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span>Scheduled: {formatDateTime(item.scheduledAt)}</span>
                      {item.publishedAt && <span>Published: {formatDateTime(item.publishedAt)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {item.status === 'draft' && (
                      <button
                        onClick={() => handlePublish(item.id)}
                        className="px-3 py-1 text-sm bg-green-100 text-green-700 hover:bg-green-200 rounded"
                      >
                        Mark Published
                      </button>
                    )}
                    <button
                      onClick={() => handleDuplicate(item.id)}
                      className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={() => {
                        setEditingContent(item);
                        setShowCreate(false);
                      }}
                      className="px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ContentManagement;

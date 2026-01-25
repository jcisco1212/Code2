import React, { useState, useEffect } from 'react';
import { marketingAnalyticsAPI, marketingCampaignsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title);

interface DashboardData {
  content: {
    total: number;
    published: number;
    scheduled: number;
    draft: number;
    byPlatform: Array<{ platform: string; count: string }>;
  };
  campaigns: {
    total: number;
    active: number;
  };
  recentActivity: Array<{
    id: string;
    title: string;
    platform: string;
    status: string;
    createdAt: string;
  }>;
  upcomingPosts: Array<{
    id: string;
    title: string;
    platform: string;
    scheduledAt: string;
  }>;
  analytics: Array<{
    metricType: string;
    total: string;
  }>;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  stats?: {
    totalContent: number;
    publishedContent: number;
  };
}

const platformColors: Record<string, string> = {
  twitter: '#000000',
  facebook: '#1877F2',
  instagram: '#E4405F',
  linkedin: '#0A66C2',
  tiktok: '#000000'
};

const platformLabels: Record<string, string> = {
  twitter: 'Twitter/X',
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok'
};

const MarketingAnalytics: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecordForm, setShowRecordForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dashboardRes, campaignsRes] = await Promise.all([
        marketingAnalyticsAPI.getDashboard(),
        marketingCampaignsAPI.getAll()
      ]);
      setDashboardData(dashboardRes.data);
      setCampaigns(campaignsRes.data.campaigns || []);
    } catch (err) {
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordMetric = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      await marketingAnalyticsAPI.recordMetric({
        platform: formData.get('platform') as string,
        metricType: formData.get('metricType') as string,
        metricValue: parseFloat(formData.get('metricValue') as string),
        campaignId: formData.get('campaignId') as string || undefined,
        recordedAt: formData.get('recordedAt') ? new Date(formData.get('recordedAt') as string).toISOString() : undefined
      });
      toast.success('Metric recorded');
      setShowRecordForm(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to record metric');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const platformChartData = {
    labels: dashboardData?.content.byPlatform.map(p => platformLabels[p.platform] || p.platform) || [],
    datasets: [{
      data: dashboardData?.content.byPlatform.map(p => parseInt(p.count)) || [],
      backgroundColor: dashboardData?.content.byPlatform.map(p => platformColors[p.platform] || '#6B7280') || [],
      borderWidth: 0
    }]
  };

  const statusChartData = {
    labels: ['Published', 'Scheduled', 'Draft'],
    datasets: [{
      data: [
        dashboardData?.content.published || 0,
        dashboardData?.content.scheduled || 0,
        dashboardData?.content.draft || 0
      ],
      backgroundColor: ['#10B981', '#3B82F6', '#6B7280'],
      borderWidth: 0
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true
        }
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Marketing Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track your social media marketing performance</p>
        </div>
        <button
          onClick={() => setShowRecordForm(!showRecordForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          + Record Metric
        </button>
      </div>

      {/* Record Metric Form */}
      {showRecordForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Record New Metric</h3>
          <form onSubmit={handleRecordMetric} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Platform *</label>
              <select name="platform" required className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
                <option value="twitter">Twitter/X</option>
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="linkedin">LinkedIn</option>
                <option value="tiktok">TikTok</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Metric Type *</label>
              <select name="metricType" required className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
                <option value="impressions">Impressions</option>
                <option value="reach">Reach</option>
                <option value="clicks">Clicks</option>
                <option value="likes">Likes</option>
                <option value="shares">Shares</option>
                <option value="comments">Comments</option>
                <option value="followers">Followers</option>
                <option value="engagement_rate">Engagement Rate</option>
                <option value="click_through_rate">Click Through Rate</option>
                <option value="conversions">Conversions</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Value *</label>
              <input
                type="number"
                name="metricValue"
                step="0.01"
                required
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
              <input
                type="date"
                name="recordedAt"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="col-span-2 md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Campaign</label>
              <select name="campaignId" className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
                <option value="">No Campaign</option>
                {campaigns.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Record
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{dashboardData?.content.total || 0}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Content</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="text-3xl font-bold text-green-600">{dashboardData?.content.published || 0}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Published</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="text-3xl font-bold text-blue-600">{dashboardData?.content.scheduled || 0}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Scheduled</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="text-3xl font-bold text-purple-600">{dashboardData?.campaigns.active || 0}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Active Campaigns</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Content by Platform</h3>
          <div className="h-64">
            {dashboardData?.content.byPlatform && dashboardData.content.byPlatform.length > 0 ? (
              <Doughnut data={platformChartData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">No platform data yet</div>
            )}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Content Status</h3>
          <div className="h-64">
            {dashboardData && (dashboardData.content.published > 0 || dashboardData.content.scheduled > 0 || dashboardData.content.draft > 0) ? (
              <Doughnut data={statusChartData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">No status data yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Campaigns Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Campaigns</h3>
        {campaigns.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No campaigns created yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Campaign</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Duration</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Content</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Published</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map(campaign => (
                  <tr key={campaign.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{campaign.name}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded ${
                        campaign.status === 'active' ? 'bg-green-100 text-green-700' :
                        campaign.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : 'N/A'} - {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'Ongoing'}
                    </td>
                    <td className="py-3 px-4 text-gray-900 dark:text-white">{campaign.stats?.totalContent || 0}</td>
                    <td className="py-3 px-4 text-green-600">{campaign.stats?.publishedContent || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Activity & Upcoming */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
          {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.recentActivity.map(item => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{item.title}</div>
                    <div className="text-sm text-gray-500">{platformLabels[item.platform] || item.platform}</div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs rounded ${
                      item.status === 'published' ? 'bg-green-100 text-green-700' :
                      item.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {item.status}
                    </span>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upcoming Posts</h3>
          {dashboardData?.upcomingPosts && dashboardData.upcomingPosts.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.upcomingPosts.map(item => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{item.title}</div>
                    <div className="text-sm text-gray-500">{platformLabels[item.platform] || item.platform}</div>
                  </div>
                  <div className="text-right text-sm text-gray-600 dark:text-gray-400">
                    {new Date(item.scheduledAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No upcoming posts scheduled</p>
          )}
        </div>
      </div>

      {/* Analytics Summary */}
      {dashboardData?.analytics && dashboardData.analytics.length > 0 && (
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Last 30 Days Analytics Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {dashboardData.analytics.map(metric => (
              <div key={metric.metricType} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {parseFloat(metric.total).toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                  {metric.metricType.replace(/_/g, ' ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketingAnalytics;

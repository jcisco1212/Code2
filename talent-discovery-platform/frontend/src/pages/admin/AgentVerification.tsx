import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  ShieldCheckIcon,
  CheckIcon,
  XMarkIcon,
  UserIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  ClockIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

interface Agent {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  username: string;
  email: string;
  agencyName: string | null;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  avatarUrl: string | null;
}

const AgentVerification: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pending' | 'verified' | 'all'>('pending');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAgents();
  }, [filter]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const params: any = { role: 'agent' };
      if (filter === 'pending') {
        // For pending, we don't send verified param to get all, then filter client-side
        // Or the backend should support verified=false
      }

      const response = await api.get('/admin/users', { params: { ...params, limit: 100 } });
      let agentList = response.data.users.filter((u: Agent) => u);

      // Client-side filtering for verification status
      if (filter === 'pending') {
        agentList = agentList.filter((a: Agent) => !a.isVerified);
      } else if (filter === 'verified') {
        agentList = agentList.filter((a: Agent) => a.isVerified);
      }

      setAgents(agentList);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (agentId: string) => {
    setProcessing(agentId);
    try {
      await api.post(`/admin/users/${agentId}/verify-agent`);
      toast.success('Agent verified successfully');
      fetchAgents();
    } catch (error: any) {
      console.error('Verification failed:', error);
      toast.error(error.response?.data?.error || 'Failed to verify agent');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (agentId: string) => {
    if (!window.confirm('Are you sure you want to reject this agent application? This will disable their account.')) {
      return;
    }

    setProcessing(agentId);
    try {
      await api.put(`/admin/users/${agentId}/status`, { isActive: false, reason: 'Agent application rejected' });
      toast.success('Agent application rejected');
      fetchAgents();
    } catch (error) {
      console.error('Rejection failed:', error);
      toast.error('Failed to reject agent');
    } finally {
      setProcessing(null);
    }
  };

  const filteredAgents = agents.filter(agent => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      agent.displayName?.toLowerCase().includes(searchLower) ||
      agent.username?.toLowerCase().includes(searchLower) ||
      agent.email?.toLowerCase().includes(searchLower) ||
      agent.agencyName?.toLowerCase().includes(searchLower)
    );
  });

  const pendingCount = agents.filter(a => !a.isVerified).length;

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Agent Verification</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Review and verify agent applications</p>
        </div>
        {pendingCount > 0 && (
          <div className="px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-xl">
            <span className="text-amber-700 dark:text-amber-400 font-medium">
              {pendingCount} pending verification{pendingCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Filter Tabs */}
        <div className="flex gap-2 bg-white dark:bg-white/5 p-1 rounded-xl">
          {[
            { value: 'pending', label: 'Pending' },
            { value: 'verified', label: 'Verified' },
            { value: 'all', label: 'All' }
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === tab.value
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or agency..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10
                     rounded-xl text-gray-900 dark:text-white placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Agents List */}
      <div className="space-y-4">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white/60 dark:bg-white/5 rounded-2xl h-32" />
          ))
        ) : filteredAgents.length === 0 ? (
          <div className="text-center py-16 bg-white/60 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10">
            <ShieldCheckIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {filter === 'pending' ? 'No pending verifications' : 'No agents found'}
            </h3>
            <p className="text-gray-500">
              {filter === 'pending'
                ? 'All agent applications have been reviewed'
                : 'Try adjusting your search or filter'}
            </p>
          </div>
        ) : (
          filteredAgents.map((agent) => (
            <div
              key={agent.id}
              className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-gray-100 dark:border-white/10
                       hover:shadow-lg transition-all"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {agent.avatarUrl ? (
                    <img
                      src={agent.avatarUrl}
                      alt={agent.displayName}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500
                                  flex items-center justify-center">
                      <UserIcon className="w-8 h-8 text-white" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                      {agent.displayName || `${agent.firstName} ${agent.lastName}`}
                    </h3>
                    <span className="text-gray-500 dark:text-gray-400">@{agent.username}</span>
                    {agent.isVerified ? (
                      <span className="px-2.5 py-1 bg-green-500/20 text-green-600 dark:text-green-400
                                     text-xs font-semibold rounded-full flex items-center gap-1">
                        <CheckIcon className="w-3 h-3" />
                        Verified
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-amber-500/20 text-amber-600 dark:text-amber-400
                                     text-xs font-semibold rounded-full">
                        Pending
                      </span>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <EnvelopeIcon className="w-4 h-4" />
                      <span className="truncate">{agent.email}</span>
                    </div>
                    {agent.agencyName && (
                      <div className="flex items-center gap-2">
                        <BuildingOfficeIcon className="w-4 h-4" />
                        <span>{agent.agencyName}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-4 h-4" />
                      <span>Applied {new Date(agent.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {!agent.isVerified && (
                  <div className="flex sm:flex-col gap-2">
                    <button
                      onClick={() => handleVerify(agent.id)}
                      disabled={processing === agent.id}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5
                               bg-green-500 text-white rounded-xl font-medium
                               hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                      {processing === agent.id ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckIcon className="w-5 h-5" />
                          Verify
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleReject(agent.id)}
                      disabled={processing === agent.id}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5
                               bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl font-medium
                               hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    >
                      <XMarkIcon className="w-5 h-5" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AgentVerification;

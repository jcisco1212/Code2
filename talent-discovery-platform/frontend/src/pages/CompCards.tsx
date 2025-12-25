import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { compCardsAPI, getUploadUrl } from '../services/api';
import {
  PlusIcon,
  UserCircleIcon,
  EyeIcon,
  ShareIcon,
  TrashIcon,
  PencilIcon,
  SparklesIcon,
  ClipboardDocumentIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

interface CompCardItem {
  id: string;
  title: string;
  tagline: string | null;
  headshots: string[];
  shareToken: string;
  isPublic: boolean;
  viewCount: number;
  template: string;
  colorScheme: string;
  createdAt: string;
  updatedAt: string;
}

const CompCards: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [compCards, setCompCards] = useState<CompCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchCompCards();
  }, [isAuthenticated, navigate]);

  const fetchCompCards = async () => {
    try {
      setLoading(true);
      const response = await compCardsAPI.getMyCards();
      setCompCards(response.data.compCards || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load comp cards');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFromProfile = async () => {
    try {
      setGenerating(true);
      const response = await compCardsAPI.generateFromProfile();
      const newCard = response.data.compCard;
      setCompCards([newCard, ...compCards]);
      navigate(`/comp-card/${newCard.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate comp card');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this comp card?')) return;

    try {
      await compCardsAPI.deleteCard(id);
      setCompCards(compCards.filter(c => c.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete comp card');
    }
  };

  const copyShareLink = (card: CompCardItem) => {
    const shareUrl = `${window.location.origin}/comp-card/share/${card.shareToken}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedId(card.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <UserCircleIcon className="w-8 h-8 text-primary-500" />
            My Comp Cards
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create and manage your digital talent resumes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateFromProfile}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-primary-500 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors disabled:opacity-50"
          >
            <SparklesIcon className="w-5 h-5" />
            {generating ? 'Generating...' : 'Auto-Generate'}
          </button>
          <Link
            to="/comp-card/new"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary-600 text-white hover:bg-primary-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Create New
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Cards Grid */}
      {compCards.length === 0 ? (
        <div className="text-center py-16">
          <UserCircleIcon className="w-20 h-20 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Comp Cards Yet
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Create your first digital comp card to share with casting directors, agents, and industry professionals.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleGenerateFromProfile}
              disabled={generating}
              className="flex items-center gap-2 px-6 py-3 rounded-full border border-primary-500 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
            >
              <SparklesIcon className="w-5 h-5" />
              Generate from Profile
            </button>
            <Link
              to="/comp-card/new"
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary-600 text-white hover:bg-primary-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Create from Scratch
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {compCards.map((card) => (
            <div
              key={card.id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              {/* Card Preview */}
              <Link to={`/comp-card/${card.id}`} className="block">
                <div className="relative h-40 bg-gradient-to-r from-primary-600 to-purple-600">
                  {card.headshots && card.headshots.length > 0 && (
                    <img
                      src={getUploadUrl(card.headshots[0]) || ''}
                      alt=""
                      className="absolute right-4 bottom-0 translate-y-1/4 w-24 h-32 object-cover rounded-lg shadow-lg border-4 border-white dark:border-gray-800"
                    />
                  )}
                  <div className="absolute top-4 left-4 right-32">
                    <h3 className="text-lg font-semibold text-white truncate">{card.title}</h3>
                    {card.tagline && (
                      <p className="text-white/80 text-sm line-clamp-2 mt-1">{card.tagline}</p>
                    )}
                  </div>
                </div>
              </Link>

              {/* Card Info */}
              <div className="p-4 pt-8">
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center gap-1">
                    <EyeIcon className="w-4 h-4" />
                    <span>{card.viewCount} views</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    card.isPublic
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {card.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Link
                    to={`/comp-card/${card.id}`}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                  >
                    <EyeIcon className="w-4 h-4" />
                    View
                  </Link>
                  <button
                    onClick={() => copyShareLink(card)}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                  >
                    {copiedId === card.id ? (
                      <CheckIcon className="w-4 h-4 text-green-500" />
                    ) : (
                      <ShareIcon className="w-4 h-4" />
                    )}
                  </button>
                  <Link
                    to={`/comp-card/${card.id}/edit`}
                    className="flex items-center justify-center px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(card.id)}
                    className="flex items-center justify-center px-3 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Section */}
      <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 border border-primary-200 dark:border-primary-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          What is a Comp Card?
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          A composite card (comp card) is a professional resume used in the entertainment industry.
          It showcases your headshots, stats, experience, and reel links all in one shareable document.
        </p>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex items-center gap-2">
            <CheckIcon className="w-4 h-4 text-green-500" />
            Share with casting directors via unique link
          </li>
          <li className="flex items-center gap-2">
            <CheckIcon className="w-4 h-4 text-green-500" />
            Export as PDF for print or email
          </li>
          <li className="flex items-center gap-2">
            <CheckIcon className="w-4 h-4 text-green-500" />
            Include your video portfolio
          </li>
          <li className="flex items-center gap-2">
            <CheckIcon className="w-4 h-4 text-green-500" />
            Track views and engagement
          </li>
        </ul>
      </div>
    </div>
  );
};

export default CompCards;

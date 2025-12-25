import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { compCardsAPI, getUploadUrl } from '../services/api';
import {
  ArrowDownTrayIcon,
  ShareIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  ClipboardIcon,
  CheckIcon,
  PlayIcon,
  MapPinIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  FilmIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  IdentificationIcon,
  SparklesIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface CompCardData {
  id: string;
  userId: string;
  title: string;
  tagline: string | null;
  headshots: string[];
  stats: {
    height?: string;
    weight?: string;
    eyeColor?: string;
    hairColor?: string;
    shoeSize?: string;
    vocalRange?: string;
    instruments?: string[];
    languages?: string[];
    accents?: string[];
    specialSkills?: string[];
  } | null;
  experience: Array<{
    title: string;
    role: string;
    year?: string;
    director?: string;
    production?: string;
  }>;
  training: Array<{
    institution: string;
    degree?: string;
    field: string;
    year?: string;
  }>;
  featuredVideoIds: string[];
  featuredVideos?: Array<{
    id: string;
    title: string;
    thumbnailUrl: string;
    duration: number;
    viewsCount: number;
  }>;
  unionMemberships: string[];
  representation: string | null;
  shareToken: string;
  isPublic: boolean;
  template: string;
  colorScheme: string;
  viewCount: number;
  user: {
    id: string;
    username: string;
    displayName: string;
    firstName: string;
    lastName: string;
    avatarUrl: string;
    location: string;
    bio: string;
    socialLinks: any;
    talentCategories: string[];
  };
  createdAt: string;
  updatedAt: string;
}

const CompCard: React.FC = () => {
  const { id, token } = useParams<{ id?: string; token?: string }>();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [compCard, setCompCard] = useState<CompCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedHeadshot, setSelectedHeadshot] = useState(0);

  useEffect(() => {
    const fetchCompCard = async () => {
      try {
        setLoading(true);
        let response;
        if (token) {
          response = await compCardsAPI.getCardByToken(token);
        } else if (id) {
          response = await compCardsAPI.getCard(id);
        }
        setCompCard(response?.data.compCard);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load comp card');
      } finally {
        setLoading(false);
      }
    };

    if (id || token) {
      fetchCompCard();
    }
  }, [id, token]);

  const copyShareLink = () => {
    if (compCard) {
      const shareUrl = `${window.location.origin}/comp-card/share/${compCard.shareToken}`;
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isOwner = currentUser?.id === compCard?.userId;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error || !compCard) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <IdentificationIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {error || 'Comp Card Not Found'}
          </h2>
          <Link to="/" className="text-primary-600 hover:text-primary-700">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <EyeIcon className="w-4 h-4" />
          <span>{compCard.viewCount} views</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={copyShareLink}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {copied ? (
              <>
                <CheckIcon className="w-5 h-5 text-green-500" />
                <span className="text-green-500">Copied!</span>
              </>
            ) : (
              <>
                <ShareIcon className="w-5 h-5" />
                <span>Share</span>
              </>
            )}
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary-600 text-white hover:bg-primary-700 transition-colors"
            onClick={() => window.print()}
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            <span>Export PDF</span>
          </button>
          {isOwner && (
            <Link
              to={`/comp-card/${compCard.id}/edit`}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-primary-500 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
            >
              <PencilIcon className="w-5 h-5" />
              <span>Edit</span>
            </Link>
          )}
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden print:shadow-none">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-primary-600 to-purple-600 p-8 text-white">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Headshots */}
            <div className="flex-shrink-0">
              <div className="w-48 h-64 rounded-xl overflow-hidden shadow-2xl bg-white/10">
                {compCard.headshots && compCard.headshots.length > 0 ? (
                  <img
                    src={getUploadUrl(compCard.headshots[selectedHeadshot]) || ''}
                    alt="Headshot"
                    className="w-full h-full object-cover"
                  />
                ) : compCard.user?.avatarUrl ? (
                  <img
                    src={getUploadUrl(compCard.user.avatarUrl) || ''}
                    alt={compCard.user.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/50">
                    <IdentificationIcon className="w-20 h-20" />
                  </div>
                )}
              </div>
              {compCard.headshots && compCard.headshots.length > 1 && (
                <div className="flex gap-2 mt-3 justify-center">
                  {compCard.headshots.slice(0, 4).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedHeadshot(idx)}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        idx === selectedHeadshot ? 'bg-white' : 'bg-white/40 hover:bg-white/60'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">
                {compCard.user?.displayName || `${compCard.user?.firstName} ${compCard.user?.lastName}`}
              </h1>
              {compCard.tagline && (
                <p className="text-lg text-white/90 mb-4">{compCard.tagline}</p>
              )}

              {compCard.user?.location && (
                <div className="flex items-center gap-2 mb-2 text-white/80">
                  <MapPinIcon className="w-5 h-5" />
                  <span>{compCard.user.location}</span>
                </div>
              )}

              {compCard.representation && (
                <div className="flex items-center gap-2 mb-4 text-white/80">
                  <BriefcaseIcon className="w-5 h-5" />
                  <span>Rep: {compCard.representation}</span>
                </div>
              )}

              {/* Talent Categories */}
              {compCard.user?.talentCategories && compCard.user.talentCategories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {compCard.user.talentCategories.map((cat, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full bg-white/20 text-sm font-medium"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              )}

              {/* Union Memberships */}
              {compCard.unionMemberships && compCard.unionMemberships.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {compCard.unionMemberships.map((union, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full bg-white/10 border border-white/30 text-sm"
                    >
                      {union}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="p-8 space-y-8">
          {/* Stats */}
          {compCard.stats && Object.keys(compCard.stats).length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <SparklesIcon className="w-6 h-6 text-primary-500" />
                Physical Stats & Skills
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {compCard.stats.height && (
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Height</p>
                    <p className="font-medium text-gray-900 dark:text-white">{compCard.stats.height}</p>
                  </div>
                )}
                {compCard.stats.weight && (
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Weight</p>
                    <p className="font-medium text-gray-900 dark:text-white">{compCard.stats.weight}</p>
                  </div>
                )}
                {compCard.stats.eyeColor && (
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Eyes</p>
                    <p className="font-medium text-gray-900 dark:text-white">{compCard.stats.eyeColor}</p>
                  </div>
                )}
                {compCard.stats.hairColor && (
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Hair</p>
                    <p className="font-medium text-gray-900 dark:text-white">{compCard.stats.hairColor}</p>
                  </div>
                )}
                {compCard.stats.vocalRange && (
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Vocal Range</p>
                    <p className="font-medium text-gray-900 dark:text-white">{compCard.stats.vocalRange}</p>
                  </div>
                )}
              </div>

              {/* Languages & Skills */}
              <div className="mt-4 space-y-3">
                {compCard.stats.languages && compCard.stats.languages.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Languages: </span>
                    <span className="text-gray-900 dark:text-white">
                      {compCard.stats.languages.join(', ')}
                    </span>
                  </div>
                )}
                {compCard.stats.accents && compCard.stats.accents.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Accents: </span>
                    <span className="text-gray-900 dark:text-white">
                      {compCard.stats.accents.join(', ')}
                    </span>
                  </div>
                )}
                {compCard.stats.instruments && compCard.stats.instruments.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Instruments: </span>
                    <span className="text-gray-900 dark:text-white">
                      {compCard.stats.instruments.join(', ')}
                    </span>
                  </div>
                )}
                {compCard.stats.specialSkills && compCard.stats.specialSkills.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Special Skills: </span>
                    <span className="text-gray-900 dark:text-white">
                      {compCard.stats.specialSkills.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Experience */}
          {compCard.experience && compCard.experience.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FilmIcon className="w-6 h-6 text-primary-500" />
                Experience
              </h2>
              <div className="space-y-3">
                {compCard.experience.map((exp, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 flex justify-between items-start"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{exp.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{exp.role}</p>
                      {exp.director && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">Dir: {exp.director}</p>
                      )}
                      {exp.production && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{exp.production}</p>
                      )}
                    </div>
                    {exp.year && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">{exp.year}</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Training */}
          {compCard.training && compCard.training.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <AcademicCapIcon className="w-6 h-6 text-primary-500" />
                Training
              </h2>
              <div className="space-y-3">
                {compCard.training.map((train, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 flex justify-between items-start"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{train.institution}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{train.field}</p>
                      {train.degree && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{train.degree}</p>
                      )}
                    </div>
                    {train.year && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">{train.year}</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Featured Videos */}
          {compCard.featuredVideos && compCard.featuredVideos.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <PlayIcon className="w-6 h-6 text-primary-500" />
                Featured Work
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {compCard.featuredVideos.map((video) => (
                  <Link
                    key={video.id}
                    to={`/watch/${video.id}`}
                    className="group relative aspect-video rounded-xl overflow-hidden bg-gray-900"
                  >
                    {video.thumbnailUrl ? (
                      <img
                        src={getUploadUrl(video.thumbnailUrl) || ''}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-800">
                        <PlayIcon className="w-12 h-12 text-gray-600" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-sm font-medium line-clamp-2">{video.title}</p>
                        <div className="flex items-center gap-2 text-xs text-white/70 mt-1">
                          <span>{video.viewsCount.toLocaleString()} views</span>
                          {video.duration && <span>{formatDuration(video.duration)}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <PlayIcon className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Contact Info */}
          <section className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              <Link
                to={`/profile/${compCard.user?.username}`}
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
              >
                <GlobeAltIcon className="w-5 h-5" />
                View Full Profile
              </Link>
              {isAuthenticated && !isOwner && (
                <Link
                  to={`/messages?user=${compCard.userId}`}
                  className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
                >
                  <EnvelopeIcon className="w-5 h-5" />
                  Contact
                </Link>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          .print\\:shadow-none { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
};

export default CompCard;

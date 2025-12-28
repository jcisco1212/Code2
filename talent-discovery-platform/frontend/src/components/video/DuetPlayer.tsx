import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUploadUrl } from '../../services/api';
import {
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArrowsPointingOutIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/solid';

interface Video {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  hlsUrl: string | null;
  duration: number | null;
  user?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

interface DuetPlayerProps {
  originalVideo: Video;
  responseVideo: Video;
  layout: 'side_by_side' | 'top_bottom' | 'picture_in_picture' | 'green_screen';
  audioMix: 'both' | 'original' | 'response';
  originalVolume: number;
  responseVolume: number;
  syncOffset: number;
  onLayoutChange?: (layout: string) => void;
}

const DuetPlayer: React.FC<DuetPlayerProps> = ({
  originalVideo,
  responseVideo,
  layout,
  audioMix,
  originalVolume,
  responseVolume,
  syncOffset
}) => {
  const originalRef = useRef<HTMLVideoElement>(null);
  const responseRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentLayout, setCurrentLayout] = useState(layout);

  // Sync playback
  useEffect(() => {
    const original = originalRef.current;
    const response = responseRef.current;

    if (!original || !response) return;

    const syncVideos = () => {
      if (Math.abs(original.currentTime - (response.currentTime + syncOffset / 1000)) > 0.3) {
        response.currentTime = original.currentTime - syncOffset / 1000;
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(original.currentTime);
      syncVideos();
    };

    const handleLoadedMetadata = () => {
      setDuration(Math.max(original.duration || 0, response.duration || 0));
    };

    original.addEventListener('timeupdate', handleTimeUpdate);
    original.addEventListener('loadedmetadata', handleLoadedMetadata);
    response.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      original.removeEventListener('timeupdate', handleTimeUpdate);
      original.removeEventListener('loadedmetadata', handleLoadedMetadata);
      response.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [syncOffset]);

  // Set volumes based on audioMix
  useEffect(() => {
    const original = originalRef.current;
    const response = responseRef.current;

    if (!original || !response) return;

    switch (audioMix) {
      case 'original':
        original.volume = originalVolume / 100;
        response.volume = 0;
        break;
      case 'response':
        original.volume = 0;
        response.volume = responseVolume / 100;
        break;
      case 'both':
      default:
        original.volume = originalVolume / 100;
        response.volume = responseVolume / 100;
        break;
    }
  }, [audioMix, originalVolume, responseVolume]);

  const togglePlay = () => {
    const original = originalRef.current;
    const response = responseRef.current;

    if (!original || !response) return;

    if (isPlaying) {
      original.pause();
      response.pause();
    } else {
      original.play();
      response.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const original = originalRef.current;
    const response = responseRef.current;

    if (!original || !response) return;

    original.muted = !isMuted;
    response.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const original = originalRef.current;
    const response = responseRef.current;
    const time = parseFloat(e.target.value);

    if (!original || !response) return;

    original.currentTime = time;
    response.currentTime = time - syncOffset / 1000;
    setCurrentTime(time);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getLayoutClasses = () => {
    switch (currentLayout) {
      case 'side_by_side':
        return 'flex flex-row';
      case 'top_bottom':
        return 'flex flex-col';
      case 'picture_in_picture':
        return 'relative';
      default:
        return 'flex flex-row';
    }
  };

  const getVideoClasses = (isOriginal: boolean) => {
    switch (currentLayout) {
      case 'side_by_side':
        return 'w-1/2 h-full object-cover';
      case 'top_bottom':
        return 'w-full h-1/2 object-cover';
      case 'picture_in_picture':
        return isOriginal
          ? 'w-full h-full object-cover'
          : 'absolute bottom-4 right-4 w-1/3 h-1/3 object-cover rounded-lg shadow-lg border-2 border-white/20';
      default:
        return 'w-1/2 h-full object-cover';
    }
  };

  const originalUrl = originalVideo.hlsUrl ? getUploadUrl(originalVideo.hlsUrl) : null;
  const responseUrl = responseVideo.hlsUrl ? getUploadUrl(responseVideo.hlsUrl) : null;

  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-xl overflow-hidden group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => !showSettings && setShowControls(false)}
    >
      {/* Video Container */}
      <div className={`aspect-video ${getLayoutClasses()}`}>
        {/* Original Video */}
        <div className={`relative ${currentLayout === 'picture_in_picture' ? 'w-full h-full' : ''}`}>
          {originalUrl ? (
            <video
              ref={originalRef}
              src={originalUrl}
              className={getVideoClasses(true)}
              poster={originalVideo.thumbnailUrl ? getUploadUrl(originalVideo.thumbnailUrl) || undefined : undefined}
              playsInline
            />
          ) : (
            <div className="w-full h-full bg-gray-900 flex items-center justify-center">
              <p className="text-gray-500">Video unavailable</p>
            </div>
          )}
          {/* Original Creator Label */}
          {currentLayout !== 'picture_in_picture' && (
            <Link
              to={`/profile/${originalVideo.user?.username}`}
              className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-xs text-white flex items-center gap-1 hover:bg-black/90 transition-colors"
            >
              <span className="font-medium">@{originalVideo.user?.username}</span>
              <span className="text-gray-400">Original</span>
            </Link>
          )}
        </div>

        {/* Response Video */}
        <div className={currentLayout === 'picture_in_picture' ? '' : 'relative'}>
          {responseUrl ? (
            <video
              ref={responseRef}
              src={responseUrl}
              className={getVideoClasses(false)}
              poster={responseVideo.thumbnailUrl ? getUploadUrl(responseVideo.thumbnailUrl) || undefined : undefined}
              playsInline
            />
          ) : (
            <div className={`${getVideoClasses(false)} bg-gray-900 flex items-center justify-center`}>
              <p className="text-gray-500 text-sm">Video unavailable</p>
            </div>
          )}
          {/* Response Creator Label */}
          <Link
            to={`/profile/${responseVideo.user?.username}`}
            className={`absolute ${
              currentLayout === 'picture_in_picture' ? 'bottom-2 right-2' : 'bottom-2 left-2'
            } bg-black/70 px-2 py-1 rounded text-xs text-white flex items-center gap-1 hover:bg-black/90 transition-colors`}
          >
            <span className="font-medium">@{responseVideo.user?.username}</span>
            <span className="text-gray-400">Duet</span>
          </Link>
        </div>
      </div>

      {/* Divider Line */}
      {currentLayout === 'side_by_side' && (
        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/30 pointer-events-none" />
      )}
      {currentLayout === 'top_bottom' && (
        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-white/30 pointer-events-none" />
      )}

      {/* Controls Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Center Play Button */}
        <button
          onClick={togglePlay}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
        >
          {isPlaying ? (
            <PauseIcon className="w-8 h-8 text-white" />
          ) : (
            <PlayIcon className="w-8 h-8 text-white ml-1" />
          )}
        </button>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {/* Progress Bar */}
          <div className="mb-3">
            <input
              type="range"
              min={0}
              max={duration}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-500"
            />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={togglePlay} className="text-white hover:text-gray-300 transition-colors">
                {isPlaying ? (
                  <PauseIcon className="w-6 h-6" />
                ) : (
                  <PlayIcon className="w-6 h-6" />
                )}
              </button>
              <button onClick={toggleMute} className="text-white hover:text-gray-300 transition-colors">
                {isMuted ? (
                  <SpeakerXMarkIcon className="w-6 h-6" />
                ) : (
                  <SpeakerWaveIcon className="w-6 h-6" />
                )}
              </button>
              <span className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Layout Settings */}
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  <Cog6ToothIcon className="w-6 h-6" />
                </button>
                {showSettings && (
                  <div className="absolute bottom-full right-0 mb-2 bg-[#282828] rounded-lg shadow-lg p-3 min-w-[180px]">
                    <p className="text-xs text-gray-400 mb-2">Layout</p>
                    <div className="space-y-1">
                      {[
                        { value: 'side_by_side', label: 'Side by Side' },
                        { value: 'top_bottom', label: 'Top & Bottom' },
                        { value: 'picture_in_picture', label: 'Picture in Picture' }
                      ].map(option => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setCurrentLayout(option.value as any);
                            setShowSettings(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                            currentLayout === option.value
                              ? 'bg-red-600 text-white'
                              : 'text-gray-300 hover:bg-[#383838]'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button onClick={toggleFullscreen} className="text-white hover:text-gray-300 transition-colors">
                <ArrowsPointingOutIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Duet Badge */}
      <div className="absolute top-3 left-3 bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-1 rounded-full text-xs font-medium text-white flex items-center gap-1">
        <span>Duet</span>
      </div>
    </div>
  );
};

export default DuetPlayer;

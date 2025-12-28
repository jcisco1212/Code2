import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { videosAPI, getUploadUrl } from '../services/api';

interface Video {
  id: string;
  title: string;
  hlsUrl: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  user?: {
    username: string;
    firstName: string;
    lastName: string;
  };
}

const Embed: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const fetchVideo = async () => {
      if (!videoId) return;
      try {
        setLoading(true);
        const response = await videosAPI.getVideo(videoId);
        setVideo(response.data.video);
      } catch (err: any) {
        setError('Video not available');
      } finally {
        setLoading(false);
      }
    };
    fetchVideo();
  }, [videoId]);

  if (loading) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="w-full h-full bg-black flex flex-col items-center justify-center text-white">
        <p className="mb-2">Video unavailable</p>
        <a
          href="https://get-noticed.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-red-500 text-sm hover:text-red-400"
        >
          Visit Get-Noticed
        </a>
      </div>
    );
  }

  const videoUrl = video.hlsUrl ? getUploadUrl(video.hlsUrl) : null;

  return (
    <div className="relative w-full h-full bg-black">
      {/* Video Player */}
      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          className="w-full h-full"
          poster={video.thumbnailUrl ? getUploadUrl(video.thumbnailUrl) || undefined : undefined}
        >
          Your browser does not support the video tag.
        </video>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-gray-400">Video processing...</p>
        </div>
      )}

      {/* Branding Watermark */}
      <a
        href={`${window.location.origin}/watch/${videoId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-12 right-3 bg-black/70 hover:bg-black/90 px-2 py-1 rounded text-xs text-white flex items-center gap-1.5 transition-colors"
        style={{ zIndex: 10 }}
      >
        <div className="w-4 h-4 bg-red-600 rounded flex items-center justify-center">
          <span className="text-[8px] font-bold">GN</span>
        </div>
        <span>Watch on Get-Noticed</span>
      </a>
    </div>
  );
};

export default Embed;

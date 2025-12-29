import React, { useState } from 'react';
import { XMarkIcon, ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface EmbedModalProps {
  videoId: string;
  videoTitle: string;
  onClose: () => void;
}

const EmbedModal: React.FC<EmbedModalProps> = ({ videoId, videoTitle, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [size, setSize] = useState<'small' | 'medium' | 'large' | 'responsive'>('responsive');

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return { width: 400, height: 225 };
      case 'medium':
        return { width: 640, height: 360 };
      case 'large':
        return { width: 854, height: 480 };
      case 'responsive':
        return { width: '100%', height: 'auto', aspectRatio: '16/9' };
    }
  };

  const baseUrl = window.location.origin;
  const embedUrl = `${baseUrl}/embed/${videoId}`;

  const generateEmbedCode = () => {
    const sizeStyle = getSizeStyle();
    if (size === 'responsive') {
      return `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%;">
  <iframe
    src="${embedUrl}"
    style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"
    allowfullscreen
    title="${videoTitle}"
  ></iframe>
</div>`;
    }
    return `<iframe
  src="${embedUrl}"
  width="${sizeStyle.width}"
  height="${sizeStyle.height}"
  frameborder="0"
  allowfullscreen
  title="${videoTitle}"
></iframe>`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateEmbedCode());
    setCopied(true);
    toast.success('Embed code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#282828] rounded-2xl max-w-xl w-full overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#404040]">
          <h2 className="text-lg font-semibold text-white">Embed Video</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Size Options */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Video Size</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'responsive', label: 'Responsive' },
                { value: 'small', label: '400x225' },
                { value: 'medium', label: '640x360' },
                { value: 'large', label: '854x480' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSize(option.value as any)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    size === option.value
                      ? 'bg-red-600 text-white'
                      : 'bg-[#404040] text-gray-300 hover:bg-[#505050]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Preview</label>
            <div className="bg-[#1a1a1a] rounded-lg p-4 overflow-hidden">
              {size === 'responsive' ? (
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <div className="absolute inset-0 bg-black rounded flex items-center justify-center">
                    <span className="text-gray-500 text-sm">Responsive (16:9)</span>
                  </div>
                </div>
              ) : (
                <div
                  className="bg-black rounded flex items-center justify-center mx-auto"
                  style={{
                    width: Math.min(getSizeStyle().width as number, 400),
                    height: Math.min((getSizeStyle().height as number) * (400 / (getSizeStyle().width as number)), 225)
                  }}
                >
                  <span className="text-gray-500 text-xs">
                    {getSizeStyle().width}x{getSizeStyle().height}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Embed Code */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Embed Code</label>
            <div className="relative">
              <pre className="bg-[#1a1a1a] rounded-lg p-3 text-xs text-gray-300 overflow-x-auto max-h-32">
                {generateEmbedCode()}
              </pre>
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-2 bg-[#404040] hover:bg-[#505050] rounded-lg transition-colors"
              >
                {copied ? (
                  <CheckIcon className="w-4 h-4 text-green-400" />
                ) : (
                  <ClipboardDocumentIcon className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Direct URL */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Direct Embed URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={embedUrl}
                readOnly
                className="flex-1 bg-[#1a1a1a] rounded-lg px-3 py-2 text-sm text-gray-300 border border-[#404040]"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(embedUrl);
                  toast.success('URL copied!');
                }}
                className="px-3 py-2 bg-[#404040] hover:bg-[#505050] rounded-lg transition-colors"
              >
                <ClipboardDocumentIcon className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#404040]">
          <p className="text-xs text-gray-500">
            By embedding, you agree to our terms of service. The embedded player includes Get-Noticed branding.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmbedModal;

import React from 'react';
import { PinItem, ImageQuality } from '../types';
import { getPinImageUrl, getProxiedImageUrl } from '../utils/downloader';
import { X, Download, ExternalLink, ChevronLeft, ChevronRight, Share2 } from 'lucide-react';

interface ImageLightboxModalProps {
  pin: PinItem | null;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  quality: ImageQuality;
  onDownloadSingle: (pin: PinItem) => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  pin,
  onClose,
  onNext,
  onPrev,
  hasPrev,
  hasNext,
  quality,
  onDownloadSingle
}) => {
  if (!pin) return null;

  const rawUrl = getPinImageUrl(pin, quality);
  const proxiedUrl = getProxiedImageUrl(rawUrl);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between p-3 sm:p-6 text-white animate-fadeIn">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3 max-w-xl mx-auto w-full z-10">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold">
            {quality.toUpperCase()}
          </span>
          <span className="text-xs text-slate-300 font-medium line-clamp-1">
            {pin.title || '画像プレビュー'}
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white transition active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Image View & Navigation */}
      <div className="relative flex-1 flex items-center justify-center my-2 max-w-2xl mx-auto w-full overflow-hidden">
        {/* Prev Button */}
        {hasPrev && (
          <button
            onClick={onPrev}
            className="absolute left-2 z-20 p-2.5 rounded-full bg-black/50 hover:bg-rose-600 text-white transition backdrop-blur-md active:scale-90"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Next Button */}
        {hasNext && (
          <button
            onClick={onNext}
            className="absolute right-2 z-20 p-2.5 rounded-full bg-black/50 hover:bg-rose-600 text-white transition backdrop-blur-md active:scale-90"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        <img
          src={proxiedUrl}
          alt={pin.title || 'Pin preview'}
          className="max-h-[72vh] max-w-full object-contain rounded-xl shadow-2xl"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src !== pin.thumbnailUrl) {
              target.src = pin.thumbnailUrl;
            }
          }}
        />
      </div>

      {/* Bottom Info & Action Bar */}
      <div className="max-w-xl mx-auto w-full space-y-3 bg-slate-900/80 p-3 sm:p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white line-clamp-1">
              {pin.title || 'Pinterest Pin'}
            </h3>
            {pin.description && (
              <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                {pin.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {pin.link && (
              <a
                href={pin.link}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="Pinterestで開く"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            <button
              onClick={() => onDownloadSingle(pin)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition"
            >
              <Download className="w-4 h-4" />
              <span>この画像を保存</span>
            </button>
          </div>
        </div>

        {/* Tip for Mobile Users */}
        <div className="text-[11px] text-slate-400 text-center border-t border-slate-800/80 pt-2">
          💡 スマホで保存できない場合は画像を長押しして「写真に追加」または「画像を保存」をタップ
        </div>
      </div>
    </div>
  );
};

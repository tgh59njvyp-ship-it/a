import React from 'react';
import { PinItem, ImageQuality } from '../types';
import { getPinImageUrl, getProxiedImageUrl } from '../utils/downloader';
import { Check, Maximize2, Download, ExternalLink } from 'lucide-react';

interface PinGridProps {
  pins: PinItem[];
  selectedPinIds: Set<string>;
  onTogglePinSelect: (pinId: string) => void;
  onOpenLightbox: (pin: PinItem) => void;
  onDownloadSingle: (pin: PinItem) => void;
  quality: ImageQuality;
}

export const PinGrid: React.FC<PinGridProps> = ({
  pins,
  selectedPinIds,
  onTogglePinSelect,
  onOpenLightbox,
  onDownloadSingle,
  quality
}) => {
  if (pins.length === 0) {
    return (
      <div className="max-w-xl mx-auto p-12 text-center text-slate-400">
        <p className="text-sm">条件に一致する画像が見つかりませんでした。</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-3 sm:p-4 pb-28">
      {/* 2-Column Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
        {pins.map((pin, index) => {
          const isSelected = selectedPinIds.has(pin.id);
          const rawDisplayUrl = getPinImageUrl(pin, quality);
          const proxiedUrl = getProxiedImageUrl(rawDisplayUrl);

          return (
            <div
              key={pin.id || index}
              className={`group relative rounded-2xl overflow-hidden bg-slate-900 border transition-all duration-200 ${
                isSelected
                  ? 'border-rose-500 ring-2 ring-rose-500/50 shadow-lg shadow-rose-950/30'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Image Container */}
              <div
                onClick={() => onTogglePinSelect(pin.id)}
                className="relative aspect-[3/4] bg-slate-800 overflow-hidden cursor-pointer"
              >
                <img
                  src={proxiedUrl}
                  alt={pin.title || `Pin ${index + 1}`}
                  loading="lazy"
                  className={`w-full h-full object-cover transition duration-300 ${
                    isSelected ? 'scale-105 brightness-95' : 'group-hover:scale-105'
                  }`}
                  onError={(e) => {
                    // Fallback if proxy fails or image link broken
                    const target = e.target as HTMLImageElement;
                    if (target.src !== pin.thumbnailUrl) {
                      target.src = pin.thumbnailUrl || pin.mediumUrl;
                    }
                  }}
                />

                {/* Selection Overlay Indicator */}
                <div className="absolute top-2.5 left-2.5 z-10">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all shadow-md ${
                      isSelected
                        ? 'bg-rose-600 border-rose-400 text-white scale-110'
                        : 'bg-black/40 backdrop-blur-sm border-white/60 text-transparent hover:border-white'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </div>

                {/* HD Quality Badge */}
                {quality === 'original' && (
                  <div className="absolute top-2.5 right-2.5 z-10 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-[9px] font-bold text-amber-300 border border-amber-500/30">
                    HD
                  </div>
                )}

                {/* Gradient Bottom Overlay */}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none"></div>

                {/* Quick Action Overlay (Bottom Right) */}
                <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1">
                  {/* Lightbox Trigger */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenLightbox(pin);
                    }}
                    title="拡大表示"
                    className="p-1.5 rounded-lg bg-black/60 backdrop-blur-md text-slate-200 hover:text-white hover:bg-rose-600 transition active:scale-90"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Single Download */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownloadSingle(pin);
                    }}
                    title="単体保存"
                    className="p-1.5 rounded-lg bg-black/60 backdrop-blur-md text-slate-200 hover:text-white hover:bg-rose-600 transition active:scale-90"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Pin Info Footer */}
              <div className="p-2.5 bg-slate-900/90 text-left">
                <p className="text-xs font-semibold text-slate-200 line-clamp-1">
                  {pin.title || `Pin #${index + 1}`}
                </p>
                {pin.link && (
                  <a
                    href={pin.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-[10px] text-slate-400 hover:text-rose-400 inline-flex items-center gap-0.5 mt-0.5 transition"
                  >
                    <span>Pinterestで開く</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

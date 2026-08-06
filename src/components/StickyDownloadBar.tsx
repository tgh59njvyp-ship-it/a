import React from 'react';
import { Download, Copy, FolderDown, Check } from 'lucide-react';

interface StickyDownloadBarProps {
  selectedCount: number;
  totalCount: number;
  onDownloadZip: () => void;
  onDownloadSequential: () => void;
  onCopyUrls: () => void;
  isDownloadingZip: boolean;
  isSequentialDownloading: boolean;
  copySuccess: boolean;
  progressText?: string;
}

export const StickyDownloadBar: React.FC<StickyDownloadBarProps> = ({
  selectedCount,
  totalCount,
  onDownloadZip,
  onDownloadSequential,
  onCopyUrls,
  isDownloadingZip,
  isSequentialDownloading,
  copySuccess,
  progressText
}) => {
  const isBusy = isDownloadingZip || isSequentialDownloading;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 p-3 pb-safe sm:p-4 text-white shadow-2xl">
      <div className="max-w-xl mx-auto space-y-2">

        {/* Progress indicator banner if busy */}
        {isBusy && progressText && (
          <div className="bg-rose-950/80 border border-rose-800/80 rounded-xl px-3 py-1.5 text-xs text-rose-200 flex items-center justify-between animate-pulse">
            <span className="flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              {progressText}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          {/* Item count counter */}
          <div className="shrink-0 bg-slate-800/90 border border-slate-700/80 px-3 py-2 rounded-xl text-center">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">選択数</div>
            <div className="text-sm font-extrabold text-rose-400">
              {selectedCount} <span className="text-[10px] text-slate-400 font-normal">/ {totalCount}</span>
            </div>
          </div>

          {/* Main Action Button: ZIP Batch Download */}
          <button
            type="button"
            disabled={selectedCount === 0 || isBusy}
            onClick={onDownloadZip}
            className="flex-1 bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold py-3 px-4 rounded-xl shadow-lg shadow-rose-950/60 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 active:scale-[0.98] text-sm"
          >
            {isDownloadingZip ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>ZIP作成中...</span>
              </>
            ) : (
              <>
                <FolderDown className="w-4.5 h-4.5 text-rose-100" />
                <span>ZIPで一括保存</span>
              </>
            )}
          </button>

          {/* Secondary Action: Sequential Individual Downloads */}
          <button
            type="button"
            disabled={selectedCount === 0 || isBusy}
            onClick={onDownloadSequential}
            title="選択画像を1枚ずつ保存"
            className="shrink-0 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold p-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center active:scale-95"
          >
            {isSequentialDownloading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Download className="w-4.5 h-4.5 text-rose-400" />
            )}
          </button>

          {/* Copy URLs button */}
          <button
            type="button"
            disabled={selectedCount === 0 || isBusy}
            onClick={onCopyUrls}
            title="選択画像のURLをまとめてコピー"
            className="shrink-0 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold p-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center active:scale-95"
          >
            {copySuccess ? (
              <Check className="w-4.5 h-4.5 text-emerald-400" />
            ) : (
              <Copy className="w-4.5 h-4.5 text-slate-300" />
            )}
          </button>
        </div>

        {/* Mobile advice subtitle */}
        <div className="text-[10px] text-center text-slate-400 font-medium">
          ※ iPhone (iOS) の場合はZIP保存後、「ファイル」アプリまたは長押しで写真保存できます
        </div>

      </div>
    </div>
  );
};

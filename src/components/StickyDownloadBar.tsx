import React from 'react';
import { Download, Copy, FolderDown, Check, Smartphone } from 'lucide-react';

interface StickyDownloadBarProps {
  selectedCount: number;
  totalCount: number;
  onDownloadZip: () => void;
  onOpenPhotosModal: () => void;
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
  onOpenPhotosModal,
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

        <div className="grid grid-cols-2 gap-2">
          {/* Primary Action 1: Apple Photos Save Mode */}
          <button
            type="button"
            disabled={selectedCount === 0 || isBusy}
            onClick={onOpenPhotosModal}
            className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-extrabold py-2.5 px-3 rounded-xl shadow-lg shadow-rose-950/50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-1.5 active:scale-[0.98] text-xs sm:text-sm"
          >
            <Smartphone className="w-4 h-4 text-rose-100" />
            <span>写真アプリに保存</span>
          </button>

          {/* Primary Action 2: ZIP Batch Download */}
          <button
            type="button"
            disabled={selectedCount === 0 || isBusy}
            onClick={onDownloadZip}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-extrabold py-2.5 px-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-1.5 active:scale-[0.98] text-xs sm:text-sm"
          >
            {isDownloadingZip ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>ZIP作成中...</span>
              </>
            ) : (
              <>
                <FolderDown className="w-4 h-4 text-rose-400" />
                <span>一括ZIP保存</span>
              </>
            )}
          </button>
        </div>

        {/* Sub Controls row */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <span>選択数:</span>
            <span className="text-rose-400 font-bold text-xs">{selectedCount}</span>
            <span>/ {totalCount}枚</span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Sequential Individual Downloads */}
            <button
              type="button"
              disabled={selectedCount === 0 || isBusy}
              onClick={onDownloadSequential}
              className="bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-semibold px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs disabled:opacity-40 transition flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5 text-rose-400" />
              <span>1枚ずつ保存</span>
            </button>

            {/* Copy URLs button */}
            <button
              type="button"
              disabled={selectedCount === 0 || isBusy}
              onClick={onCopyUrls}
              className="bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-semibold px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs disabled:opacity-40 transition flex items-center gap-1"
            >
              {copySuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">コピー完了</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>URLコピー</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};


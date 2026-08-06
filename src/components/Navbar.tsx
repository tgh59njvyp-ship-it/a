import React from 'react';
import { Download, HelpCircle, History, Smartphone, Monitor } from 'lucide-react';

interface NavbarProps {
  onOpenGuide: () => void;
  onOpenHistory: () => void;
  historyCount: number;
  isMobilePreviewMode: boolean;
  onTogglePreviewMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenGuide,
  onOpenHistory,
  historyCount,
  isMobilePreviewMode,
  onTogglePreviewMode
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-md">
      <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center shadow-lg shadow-rose-900/30">
            <Download className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-sm tracking-tight">PinBatch</h1>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                スマホ対応
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Pinterestボード一括保存</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Desktop/Mobile Container Toggle (useful when viewing on wide screens) */}
          <button
            onClick={onTogglePreviewMode}
            title={isMobilePreviewMode ? '画面をフル表示' : 'スマホ枠表示'}
            className="p-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition active:scale-95 text-xs flex items-center gap-1"
          >
            {isMobilePreviewMode ? (
              <Monitor className="w-4 h-4 text-rose-400" />
            ) : (
              <Smartphone className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* History button */}
          <button
            onClick={onOpenHistory}
            className="relative p-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition active:scale-95"
            title="検索履歴"
          >
            <History className="w-4 h-4" />
            {historyCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-900"></span>
            )}
          </button>

          {/* Help / Guide */}
          <button
            onClick={onOpenGuide}
            className="p-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition active:scale-95 flex items-center gap-1 text-xs font-medium"
            title="使い方・保存ガイド"
          >
            <HelpCircle className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">使い方</span>
          </button>
        </div>
      </div>
    </header>
  );
};

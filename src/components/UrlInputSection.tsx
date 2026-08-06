import React, { useState } from 'react';
import { Clipboard, Sparkles, ArrowRight, X, Link as LinkIcon, CheckCircle2 } from 'lucide-react';
import { PRESET_BOARDS } from '../data/presetBoards';

interface UrlInputSectionProps {
  url: string;
  setUrl: (url: string) => void;
  onFetch: (targetUrl?: string) => void;
  isLoading: boolean;
  onSelectPreset: (presetId: string) => void;
}

export const UrlInputSection: React.FC<UrlInputSectionProps> = ({
  url,
  setUrl,
  onFetch,
  isLoading,
  onSelectPreset
}) => {
  const [pasteSuccess, setPasteSuccess] = useState(false);

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setUrl(text);
          setPasteSuccess(true);
          setTimeout(() => setPasteSuccess(false), 2000);
        }
      }
    } catch (err) {
      console.log('Clipboard paste error:', err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onFetch();
    }
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800 p-4 sm:p-5 text-white">
      <div className="max-w-xl mx-auto space-y-4">

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Pinterest ボードまたはPinのURLを入力
          </label>

          <div className="relative flex items-center">
            <div className="absolute left-3.5 text-slate-400">
              <LinkIcon className="w-4 h-4" />
            </div>

            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.pinterest.jp/user/board/ または pin.it/..."
              className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl pl-10 pr-20 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition shadow-inner"
            />

            <div className="absolute right-2 flex items-center gap-1">
              {url ? (
                <button
                  type="button"
                  onClick={() => setUrl('')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-700/70 text-slate-200 hover:bg-slate-700 text-xs font-medium flex items-center gap-1 transition active:scale-95"
                >
                  {pasteSuccess ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">貼付完了</span>
                    </>
                  ) : (
                    <>
                      <Clipboard className="w-3.5 h-3.5 text-rose-400" />
                      <span>貼付</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="w-full bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-rose-950/50 hover:from-rose-500 hover:to-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span className="text-sm">ボード画像を取得中...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-rose-200" />
                <span className="text-sm">画像を一括取得する</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Preset Sample Boards Section for fast mobile testing */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> ワンタップでお試しサンプル
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {PRESET_BOARDS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setUrl(preset.url);
                  onSelectPreset(preset.id);
                }}
                className="shrink-0 group flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-xl p-1.5 pr-3 text-left transition active:scale-95"
              >
                <img
                  src={preset.coverImage}
                  alt={preset.title}
                  className="w-7 h-7 rounded-lg object-cover bg-slate-700"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-rose-300 transition">
                    {preset.title}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {preset.pins.length}枚の画像
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

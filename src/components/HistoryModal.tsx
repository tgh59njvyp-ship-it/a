import React from 'react';
import { SearchHistoryItem } from '../types';
import { X, Trash2, History, ExternalLink, ArrowRight } from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: SearchHistoryItem[];
  onSelectHistory: (item: SearchHistoryItem) => void;
  onClearHistory: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onSelectHistory,
  onClearHistory
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto text-white shadow-2xl p-5 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
              <History className="w-5 h-5" />
            </span>
            <h2 className="font-bold text-base">最近取得したボード履歴</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* History List */}
        {history.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            取得履歴はまだありません。
          </div>
        ) : (
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectHistory(item);
                  onClose();
                }}
                className="group flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 cursor-pointer transition active:scale-[0.98]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {item.coverImage ? (
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      className="w-10 h-10 rounded-lg object-cover bg-slate-700 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-slate-700 shrink-0 flex items-center justify-center text-rose-400 font-bold text-xs">
                      PIN
                    </div>
                  )}

                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-slate-200 group-hover:text-rose-300 truncate transition">
                      {item.title}
                    </h3>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{item.pinCount}枚の画像</span>
                      <span>•</span>
                      <span>{new Date(item.timestamp).toLocaleDateString('ja-JP')}</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 text-slate-400 group-hover:text-rose-400 transition">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        {history.length > 0 && (
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={onClearHistory}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>履歴をクリア</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
            >
              閉じる
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

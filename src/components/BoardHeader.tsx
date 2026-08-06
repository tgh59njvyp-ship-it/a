import React from 'react';
import { BoardData, ImageQuality } from '../types';
import { CheckSquare, Square, Layers, Search, Sliders } from 'lucide-react';

interface BoardHeaderProps {
  board: BoardData;
  quality: ImageQuality;
  onQualityChange: (q: ImageQuality) => void;
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  filterText: string;
  onFilterChange: (text: string) => void;
}

export const BoardHeader: React.FC<BoardHeaderProps> = ({
  board,
  quality,
  onQualityChange,
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  filterText,
  onFilterChange
}) => {
  const isAllSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <div className="bg-slate-900/60 border-b border-slate-800 p-4 text-white">
      <div className="max-w-xl mx-auto space-y-3.5">

        {/* Board Title & Summary */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-rose-500/20 text-rose-400">
                <Layers className="w-4 h-4" />
              </span>
              <h2 className="font-bold text-base text-white line-clamp-1">
                {board.title}
              </h2>
            </div>
            {board.description && (
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                {board.description}
              </p>
            )}
          </div>

          <div className="shrink-0 text-right bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700/60">
            <span className="text-xs font-bold text-rose-400">{totalCount}</span>
            <span className="text-[10px] text-slate-400 ml-1">枚検出</span>
          </div>
        </div>

        {/* Quality selector tabs */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-rose-400" />
              保存画質設定:
            </span>
            <span className="text-rose-300 font-semibold">
              {quality === 'original' && '最高画質 (オリジナルHD)'}
              {quality === 'high' && '標準画質 (736px)'}
              {quality === 'medium' && '軽量 (236px)'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 bg-slate-800/90 p-1 rounded-xl border border-slate-700/80">
            <button
              type="button"
              onClick={() => onQualityChange('original')}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition ${
                quality === 'original'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              オリジナル (HD)
            </button>
            <button
              type="button"
              onClick={() => onQualityChange('high')}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition ${
                quality === 'high'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              標準 (736px)
            </button>
            <button
              type="button"
              onClick={() => onQualityChange('medium')}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition ${
                quality === 'medium'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              軽量 (236px)
            </button>
          </div>
        </div>

        {/* Filter & Batch selection bar */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {/* Quick Filter */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => onFilterChange(e.target.value)}
              placeholder="画像タイトルで絞り込み..."
              className="w-full bg-slate-800/80 border border-slate-700/60 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          {/* Select / Deselect All Toggle */}
          <button
            type="button"
            onClick={isAllSelected ? onDeselectAll : onSelectAll}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition active:scale-95"
          >
            {isAllSelected ? (
              <>
                <Square className="w-3.5 h-3.5 text-slate-400" />
                <span>選択解除</span>
              </>
            ) : (
              <>
                <CheckSquare className="w-3.5 h-3.5 text-rose-400" />
                <span>全選択 ({totalCount})</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

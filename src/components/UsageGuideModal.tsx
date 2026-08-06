import React from 'react';
import { X, Smartphone, CheckCircle, FolderDown, Copy, HelpCircle } from 'lucide-react';

interface UsageGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UsageGuideModal: React.FC<UsageGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto text-white shadow-2xl p-5 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
              <HelpCircle className="w-5 h-5" />
            </span>
            <h2 className="font-bold text-base">スマホでの使い方＆保存ガイド</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step 1: Copy URL */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[11px] font-black">1</span>
            PinterestボードのURLをコピー
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
            Pinterestアプリまたはブラウザでボードを開き、画面右上の「共有ボタン (📤)」→「リンクをコピー」をタップします。
          </p>
        </div>

        {/* Step 2: Paste & Fetch */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[11px] font-black">2</span>
            「貼付」ボタンをタップして取得
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
            当サイトの入力欄にある「貼付」ボタンを押し、「画像を一括取得する」をタップするとボード内のPin画像が自動で一覧表示されます。
          </p>
        </div>

        {/* Step 3: Mobile Download Instructions */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[11px] font-black">3</span>
            スマホ端末別の保存方法
          </h3>

          <div className="space-y-2">
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
              <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-1">
                <Smartphone className="w-3.5 h-3.5 text-rose-400" />
                iPhone (iOS Safari) の場合
              </div>
              <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                <li>「ZIPで一括保存」を押すとiOS標準の「ファイル」アプリにダウンロードされます。</li>
                <li>ファイルアプリ内でZIPをタップすると自動でフォルダ解凍され、写真をまとめて写真アプリに保存できます。</li>
                <li>単体画像は拡大画面で画像を長押し→「“写真”に追加」でも保存可能です。</li>
              </ul>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
              <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-1">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                Android (Chrome) の場合
              </div>
              <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                <li>「ZIPで一括保存」を押すと「ダウンロード」フォルダにZIPファイルが直接保存されます。</li>
                <li>ファイル管理アプリ（Files by Google等）で簡単に展開できます。</li>
              </ul>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-amber-950/40 border border-amber-800/50 p-3 rounded-xl text-xs text-amber-200 space-y-1">
          <div className="font-bold flex items-center gap-1">
            ⚠️ 注意点・よくある質問
          </div>
          <p className="text-[11px] leading-normal text-amber-300/90">
            非公開（シークレット）のボードは画像を取得できません。必ず「公開設定」のボードURLをご利用ください。
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl transition text-xs"
        >
          閉じる
        </button>

      </div>
    </div>
  );
};

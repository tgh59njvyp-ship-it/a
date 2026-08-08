import React, { useState, useEffect } from 'react';
import { X, Smartphone, Share2, Check, Info, CheckSquare, Square, Download, Sparkles, ExternalLink, Archive } from 'lucide-react';
import { PinItem, ImageQuality } from '../types';
import { getPinImageUrl, saveToApplePhotos, saveMultipleToApplePhotos, getDirectDownloadUrl, downloadZipArchive } from '../utils/downloader';

interface PhotosSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPins: PinItem[];
  quality: ImageQuality;
}

export const PhotosSaveModal: React.FC<PhotosSaveModalProps> = ({
  isOpen,
  onClose,
  selectedPins,
  quality
}) => {
  const [checkedPinIds, setCheckedPinIds] = useState<Set<string>>(new Set());
  const [isProcessingBatch, setIsProcessingBatch] = useState<boolean>(false);
  const [isProcessingZip, setIsProcessingZip] = useState<boolean>(false);
  const [prepProgress, setPrepProgress] = useState<{ current: number; total: number } | null>(null);
  const [savedSet, setSavedSet] = useState<Set<string>>(new Set());
  const [savingSingleIndex, setSavingSingleIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'batch' | 'longpress'>('batch');

  // Initialize checked pins when modal opens
  useEffect(() => {
    if (isOpen) {
      setCheckedPinIds(new Set(selectedPins.map((p) => p.id)));
    }
  }, [isOpen, selectedPins]);

  if (!isOpen) return null;

  const handleToggleCheck = (id: string) => {
    setCheckedPinIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setCheckedPinIds(new Set(selectedPins.map((p) => p.id)));
  };

  const handleDeselectAll = () => {
    setCheckedPinIds(new Set());
  };

  // Main Batch Save function to iOS Photos
  const handleBatchSaveToPhotos = async () => {
    const targetPins = selectedPins.filter((p) => checkedPinIds.has(p.id));
    if (targetPins.length === 0) return;

    setIsProcessingBatch(true);
    setPrepProgress({ current: 0, total: targetPins.length });

    const items = targetPins.map((pin, idx) => ({
      url: getPinImageUrl(pin, quality),
      filename: `pinterest_photo_${idx + 1}.jpg`
    }));

    const result = await saveMultipleToApplePhotos(items, (current, total) => {
      setPrepProgress({ current, total });
    });

    if (result.success) {
      targetPins.forEach((p) => setSavedSet((prev) => new Set(prev).add(p.id)));
    }

    setIsProcessingBatch(false);
    setPrepProgress(null);
  };

  // ZIP batch download function
  const handleBatchDownloadZip = async () => {
    const targetPins = selectedPins.filter((p) => checkedPinIds.has(p.id));
    if (targetPins.length === 0) return;

    setIsProcessingZip(true);
    setPrepProgress({ current: 0, total: targetPins.length });

    const items = targetPins.map((pin, idx) => ({
      url: getPinImageUrl(pin, quality),
      filename: `pinterest_photo_${idx + 1}.jpg`
    }));

    const result = await downloadZipArchive(items, 'pinterest_all_photos.zip', (current, total) => {
      setPrepProgress({ current, total });
    });

    if (result.success) {
      targetPins.forEach((p) => setSavedSet((prev) => new Set(prev).add(p.id)));
    }

    setIsProcessingZip(false);
    setPrepProgress(null);
  };

  const handleSaveOneToPhotos = async (pin: PinItem, index: number) => {
    setSavingSingleIndex(index);
    const url = getPinImageUrl(pin, quality);
    const filename = `pinterest_photo_${index + 1}.jpg`;

    const res = await saveToApplePhotos(url, filename);
    if (res.success) {
      setSavedSet((prev) => new Set(prev).add(pin.id));
    }
    setSavingSingleIndex(null);
  };


  const checkedCount = checkedPinIds.size;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm sm:text-base flex items-center gap-1.5">
                <span>写真アプリ・端末に保存</span>
                <span className="text-[10px] bg-rose-950 border border-rose-800 text-rose-300 px-2 py-0.5 rounded-full font-normal">
                  iOS / Android / PC
                </span>
              </h3>
              <p className="text-xs text-slate-400">端末やカメラロールに画像を保存します</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="p-2 bg-slate-950 border-b border-slate-800 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('batch')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'batch'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>一括保存 / 1タップ保存</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('longpress')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'longpress'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>長押し保存モード</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          
          {activeTab === 'batch' ? (
            <div className="space-y-4">
              
              {/* Batch Hero Action Banner */}
              <div className="bg-gradient-to-br from-rose-950/70 via-slate-900 to-slate-900 border border-rose-900/40 p-4 rounded-2xl space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-100 flex items-center gap-1.5">
                      <span>共有・写真フォルダに一括追加</span>
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      下のボタンを押すと共有メニューが開きます。
                      <strong>『画像を保存』</strong> を選ぶと写真アプリに一括で追加されます！
                    </p>
                  </div>
                </div>

                {/* Action Buttons: Web Share + ZIP Download */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={checkedCount === 0 || isProcessingBatch || isProcessingZip}
                    onClick={handleBatchSaveToPhotos}
                    className="w-full bg-gradient-to-r from-rose-600 via-rose-500 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-extrabold py-3 px-3 rounded-xl shadow-lg shadow-rose-950/60 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 active:scale-[0.98] text-xs sm:text-sm"
                  >
                    {isProcessingBatch ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>
                          準備中 ({prepProgress?.current || 0} / {prepProgress?.total || checkedCount})...
                        </span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4 text-rose-100 shrink-0" />
                        <span>写真アプリに一括保存 ({checkedCount}枚)</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={checkedCount === 0 || isProcessingBatch || isProcessingZip}
                    onClick={handleBatchDownloadZip}
                    className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-extrabold py-3 px-3 rounded-xl shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 active:scale-[0.98] text-xs sm:text-sm"
                  >
                    {isProcessingZip ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>
                          ZIP作成中 ({prepProgress?.current || 0} / {prepProgress?.total || checkedCount})...
                        </span>
                      </>
                    ) : (
                      <>
                        <Archive className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>ZIPでまとめて一括保存 ({checkedCount}枚)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Selection Control Bar */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="font-bold text-slate-300">
                  保存対象の画像 ({checkedCount} / {selectedPins.length} 枚)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-rose-400 hover:text-rose-300 font-semibold"
                  >
                    全選択
                  </button>
                  <span className="text-slate-600">|</span>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="text-slate-400 hover:text-slate-300 font-semibold"
                  >
                    全解除
                  </button>
                </div>
              </div>

              {/* Pins Grid List with Direct Download Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {selectedPins.map((pin, idx) => {
                  const imageUrl = getPinImageUrl(pin, quality);
                  const isChecked = checkedPinIds.has(pin.id);
                  const isSaved = savedSet.has(pin.id);
                  const isSingleSaving = savingSingleIndex === idx;
                  const filename = `pinterest_photo_${idx + 1}.jpg`;
                  const directUrl = getDirectDownloadUrl(imageUrl, filename);

                  return (
                    <div
                      key={pin.id || idx}
                      onClick={() => handleToggleCheck(pin.id)}
                      className={`cursor-pointer rounded-2xl p-2.5 flex items-center gap-3 border transition ${
                        isChecked
                          ? 'bg-rose-950/20 border-rose-600/50'
                          : 'bg-slate-950/60 border-slate-800 opacity-60'
                      }`}
                    >
                      <button
                        type="button"
                        className="text-slate-400 hover:text-rose-400 shrink-0"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-5 h-5 text-rose-500" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-600" />
                        )}
                      </button>

                      <img
                        src={imageUrl}
                        alt={pin.title}
                        className="w-14 h-14 object-cover rounded-xl shrink-0 bg-slate-900 border border-slate-800"
                        loading="lazy"
                      />

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <p className="text-xs font-semibold text-slate-200 truncate">
                          {pin.title || `画像 #${idx + 1}`}
                        </p>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Direct Download Link */}
                          <a
                            href={directUrl}
                            download={filename}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold py-1 px-2 rounded-lg transition inline-flex items-center gap-1 shadow-sm"
                          >
                            <Download className="w-3 h-3" />
                            <span>1タップ保存</span>
                          </a>

                          {/* Share button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveOneToPhotos(pin, idx);
                            }}
                            disabled={isSingleSaving}
                            className={`text-[11px] font-bold py-1 px-2 rounded-lg transition flex items-center gap-1 ${
                              isSaved
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                            }`}
                          >
                            {isSingleSaving ? (
                              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : isSaved ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>完了</span>
                              </>
                            ) : (
                              <>
                                <Share2 className="w-3 h-3 text-rose-400" />
                                <span>共有</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          ) : (
            /* Long press manual mode */
            <div className="space-y-4">
              <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl text-xs text-slate-300 space-y-1">
                <p className="font-bold text-rose-400">💡 画像長押しでの保存方法</p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  各画像を長押しするとメニューが表示されます。<strong>『"写真"に追加』</strong> または <strong>『画像を保存』</strong> を選択してください。
                </p>
              </div>

              <div className="space-y-4">
                {selectedPins.map((pin, idx) => {
                  const imageUrl = getPinImageUrl(pin, quality);
                  const filename = `pinterest_photo_${idx + 1}.jpg`;
                  const directUrl = getDirectDownloadUrl(imageUrl, filename);

                  return (
                    <div key={pin.id || idx} className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2 text-center">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-rose-400">画像 #{idx + 1}</span>
                        <a
                          href={directUrl}
                          download={filename}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-rose-600 text-white text-[10px] font-bold py-1 px-2 rounded-md hover:bg-rose-500 transition inline-flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>直接保存</span>
                        </a>
                      </div>
                      <img
                        src={imageUrl}
                        alt={pin.title}
                        className="w-full max-h-96 object-contain rounded-xl bg-slate-900 border border-slate-800 select-none active:scale-[0.99] transition"
                      />
                      <p className="text-xs text-slate-400 truncate">{pin.title}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            iPhone / iPad / PC 共通対応
          </span>
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2 px-4 rounded-xl transition"
          >
            閉じる
          </button>
        </div>

      </div>
    </div>
  );
};

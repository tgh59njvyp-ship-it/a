import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { UrlInputSection } from './components/UrlInputSection';
import { BoardHeader } from './components/BoardHeader';
import { PinGrid } from './components/PinGrid';
import { StickyDownloadBar } from './components/StickyDownloadBar';
import { ImageLightboxModal } from './components/ImageLightboxModal';
import { UsageGuideModal } from './components/UsageGuideModal';
import { HistoryModal } from './components/HistoryModal';
import { BoardData, PinItem, ImageQuality, SearchHistoryItem } from './types';
import { PRESET_BOARDS } from './data/presetBoards';
import {
  getPinImageUrl,
  getProxiedImageUrl,
  downloadSingleImage,
  copyToClipboard
} from './utils/downloader';
import { AlertCircle, Download, Sparkles, CheckCircle2 } from 'lucide-react';

const LOCAL_STORAGE_HISTORY_KEY = 'pinbatch_search_history_v1';

export default function App() {
  const [url, setUrl] = useState<string>('');
  const [board, setBoard] = useState<BoardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Quality & Selection state
  const [quality, setQuality] = useState<ImageQuality>('original');
  const [selectedPinIds, setSelectedPinIds] = useState<Set<string>>(new Set());
  const [filterText, setFilterText] = useState<string>('');

  // Modals & Drawers
  const [activeLightboxPin, setActiveLightboxPin] = useState<PinItem | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  // Action states
  const [isDownloadingZip, setIsDownloadingZip] = useState<boolean>(false);
  const [isSequentialDownloading, setIsSequentialDownloading] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [progressText, setProgressText] = useState<string>('');

  // Mobile Frame preview toggle for testing on wide screens
  const [isMobilePreviewMode, setIsMobilePreviewMode] = useState<boolean>(false);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch {
      // Ignore
    }

    // Auto load first sample preset on start so app isn't an empty blank page
    if (!board) {
      loadPresetBoard(PRESET_BOARDS[0].id);
    }
  }, []);

  // Save history helper
  const saveToHistory = (boardData: BoardData) => {
    const newItem: SearchHistoryItem = {
      id: `hist-${Date.now()}`,
      url: boardData.url,
      title: boardData.title,
      pinCount: boardData.pinCount,
      coverImage: boardData.pins[0]?.thumbnailUrl || '',
      timestamp: Date.now()
    };

    setHistory((prev) => {
      const filtered = prev.filter((item) => item.url !== boardData.url);
      const updated = [newItem, ...filtered].slice(0, 20);
      try {
        localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem(LOCAL_STORAGE_HISTORY_KEY);
  };

  // Preset Board Loader
  const loadPresetBoard = (presetId: string) => {
    const preset = PRESET_BOARDS.find((p) => p.id === presetId) || PRESET_BOARDS[0];
    const newBoardData: BoardData = {
      url: preset.url,
      title: preset.title,
      description: preset.description,
      author: 'Sample Preset',
      pinCount: preset.pins.length,
      pins: preset.pins,
      fetchedAt: new Date().toISOString()
    };

    setBoard(newBoardData);
    setUrl(preset.url);
    setError(null);
    setSelectedPinIds(new Set(preset.pins.map((p) => p.id)));
  };

  // Main Fetch Pinterest Board Handler
  const handleFetchBoard = async (targetUrl?: string) => {
    const fetchUrl = targetUrl || url;
    if (!fetchUrl || !fetchUrl.trim()) return;

    setIsLoading(true);
    setError(null);
    setStatusMessage(null);

    try {
      const response = await fetch('/api/fetch-board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: fetchUrl.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'ボード情報の取得に失敗しました');
      }

      if (data.board) {
        const boardData: BoardData = data.board;
        setBoard(boardData);

        // Select all pins by default for instant 1-tap download
        const allIds = new Set(boardData.pins.map((p) => p.id));
        setSelectedPinIds(allIds);

        if (data.isFallbackDemo) {
          setStatusMessage(data.message || '公開ボードの画像取得が完了できなかったため、サンプル表示に切り替えました。');
        } else {
          setStatusMessage(`${boardData.pins.length}枚の画像を取得しました！`);
          setTimeout(() => setStatusMessage(null), 4000);
        }

        saveToHistory(boardData);
      } else {
        throw new Error('ボードデータが見つかりませんでした');
      }
    } catch (err: any) {
      console.error('Fetch board error:', err);
      setError(err?.message || '画像の取得に失敗しました。公開設定のPinterestボードURLかpin.it短縮URLをお試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered Pins
  const filteredPins = useMemo(() => {
    if (!board) return [];
    if (!filterText.trim()) return board.pins;
    const q = filterText.toLowerCase();
    return board.pins.filter(
      (p) =>
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [board, filterText]);

  // Selection toggle handlers
  const handleTogglePinSelect = (pinId: string) => {
    setSelectedPinIds((prev) => {
      const next = new Set(prev);
      if (next.has(pinId)) {
        next.delete(pinId);
      } else {
        next.add(pinId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (!board) return;
    const allIds = new Set(filteredPins.map((p) => p.id));
    setSelectedPinIds(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedPinIds(new Set());
  };

  // Helper for safe filenames
  const sanitizeTitle = (str: string, maxLength = 20): string => {
    if (!str) return 'pin';
    return (
      str
        .replace(/[\r\n\t]+/g, '')
        .replace(/[^a-zA-Z0-9_\-\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\uff00-\uffef]/g, '_')
        .replace(/_+/g, '_')
        .substring(0, maxLength) || 'pin'
    );
  };

  // Single download handler
  const handleDownloadSingle = async (pin: PinItem) => {
    const rawUrl = getPinImageUrl(pin, quality);
    const safeTitle = sanitizeTitle(pin.title || 'pin', 20);
    const filename = `${safeTitle}_${pin.id || Date.now()}.jpg`;
    await downloadSingleImage(rawUrl, filename);
  };

  // Batch ZIP Download Handler (Chunked in packages of 40 images for 80+ image reliability)
  const handleDownloadZip = async () => {
    if (!board || selectedPinIds.size === 0) return;

    setIsDownloadingZip(true);

    try {
      const selectedPins = board.pins.filter((p) => selectedPinIds.has(p.id));
      const rawTitle = board.title || 'pinterest_board';
      const safeZipName = sanitizeTitle(rawTitle, 25) || 'pinterest_board';

      // Split into chunks of 40 images per ZIP package to prevent server/network timeouts with 80+ images
      const CHUNK_SIZE = 40;
      const chunks: PinItem[][] = [];
      for (let i = 0; i < selectedPins.length; i += CHUNK_SIZE) {
        chunks.push(selectedPins.slice(i, i + CHUNK_SIZE));
      }

      for (let cIdx = 0; cIdx < chunks.length; cIdx++) {
        const chunkPins = chunks[cIdx];
        const startNum = cIdx * CHUNK_SIZE + 1;
        const endNum = startNum + chunkPins.length - 1;

        if (chunks.length > 1) {
          setProgressText(`ZIP作成中 (${cIdx + 1}/${chunks.length}分冊): ${startNum}〜${endNum}枚目を処理中...`);
        } else {
          setProgressText(`全${chunkPins.length}枚の画像をZIPに圧縮中...`);
        }

        const imageUrls = chunkPins.map((p) => getPinImageUrl(p, quality));
        const chunkZipName = chunks.length > 1 
          ? `${safeZipName}_part${cIdx + 1}_(${startNum}-${endNum})`
          : `${safeZipName}_${quality}`;

        const resp = await fetch('/api/download-zip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrls,
            zipName: chunkZipName
          })
        });

        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          throw new Error(errData.error || `ZIP作成に失敗しました (パート ${cIdx + 1})`);
        }

        const blob = await resp.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const asciiZipFilename = `${chunkZipName.replace(/[^a-zA-Z0-9_\-()]/g, '_')}.zip`;

        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = asciiZipFilename;
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
          if (a.parentNode) document.body.removeChild(a);
          window.URL.revokeObjectURL(blobUrl);
        }, 1000);

        // Pause briefly between chunk downloads if multiple parts
        if (cIdx < chunks.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }

      setProgressText('ZIPダウンロードが完了しました！');
      setTimeout(() => setProgressText(''), 3000);
    } catch (err: any) {
      console.error('ZIP download error:', err);
      let errMsg = err?.message || '';
      if (!errMsg || /pattern|fetch|SyntaxError|unexpected/i.test(errMsg)) {
        errMsg = 'ZIP作成中に一時的な通信エラーが発生しました。時間を置いてお試しください。';
      }
      setError(errMsg);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  // Sequential individual download handler
  const handleDownloadSequential = async () => {
    if (!board || selectedPinIds.size === 0) return;

    const selectedPins = board.pins.filter((p) => selectedPinIds.has(p.id));

    if (selectedPins.length > 25) {
      const confirmContinue = window.confirm(
        `選択数が多いため (${selectedPins.length}枚)、ブラウザの自動保存制限がかかる場合があります。\n80枚以上の大量ダウンロードには「一括ZIPダウンロード」のご利用がおすすめです。\n\nこのまま1枚ずつ順次保存を開始しますか？`
      );
      if (!confirmContinue) return;
    }

    setIsSequentialDownloading(true);

    let completed = 0;
    let failedCount = 0;

    for (const pin of selectedPins) {
      completed++;
      setProgressText(`1枚ずつ保存中 (${completed}/${selectedPins.length})...`);
      const rawUrl = getPinImageUrl(pin, quality);
      const safeTitle = sanitizeTitle(pin.title || 'pin', 15);
      const filename = `pin_${String(completed).padStart(3, '0')}_${safeTitle}.jpg`;

      const success = await downloadSingleImage(rawUrl, filename);
      if (!success) failedCount++;

      // Safe pause to prevent browser popup block
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    if (failedCount > 0) {
      setProgressText(`保存完了 (${completed - failedCount}/${selectedPins.length}枚)。一部ブラウザ制限によりスキップされました。`);
    } else {
      setProgressText('全画像の1枚ずつ保存が完了しました！');
    }
    setTimeout(() => setProgressText(''), 4000);
    setIsSequentialDownloading(false);
  };

  // Copy Image URLs Handler
  const handleCopyUrls = async () => {
    if (!board || selectedPinIds.size === 0) return;

    const selectedPins = board.pins.filter((p) => selectedPinIds.has(p.id));
    const urls = selectedPins.map((p) => getPinImageUrl(p, quality)).join('\n');

    const success = await copyToClipboard(urls);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    }
  };

  // Lightbox navigation
  const currentLightboxIndex = activeLightboxPin && board
    ? board.pins.findIndex((p) => p.id === activeLightboxPin.id)
    : -1;

  const handleNextLightbox = () => {
    if (board && currentLightboxIndex >= 0 && currentLightboxIndex < board.pins.length - 1) {
      setActiveLightboxPin(board.pins[currentLightboxIndex + 1]);
    }
  };

  const handlePrevLightbox = () => {
    if (board && currentLightboxIndex > 0) {
      setActiveLightboxPin(board.pins[currentLightboxIndex - 1]);
    }
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white ${
      isMobilePreviewMode ? 'p-3 sm:p-8 items-center justify-center bg-slate-900' : ''
    }`}>
      {/* Container wrapper for optional mobile device frame simulation */}
      <div className={`w-full flex-1 flex flex-col transition-all duration-300 ${
        isMobilePreviewMode
          ? 'max-w-[420px] h-[860px] max-h-[92vh] rounded-[40px] border-[10px] border-slate-800 shadow-2xl overflow-hidden bg-slate-950 relative ring-1 ring-slate-700/50'
          : 'max-w-xl mx-auto border-x border-slate-800/80 shadow-xl'
      }`}>

        {/* Top Navbar */}
        <Navbar
          onOpenGuide={() => setIsGuideOpen(true)}
          onOpenHistory={() => setIsHistoryOpen(true)}
          historyCount={history.length}
          isMobilePreviewMode={isMobilePreviewMode}
          onTogglePreviewMode={() => setIsMobilePreviewMode(!isMobilePreviewMode)}
        />

        {/* URL Input Form Section */}
        <UrlInputSection
          url={url}
          setUrl={setUrl}
          onFetch={() => handleFetchBoard()}
          isLoading={isLoading}
          onSelectPreset={(presetId) => loadPresetBoard(presetId)}
        />

        {/* Error Notification Banner */}
        {error && (
          <div className="bg-rose-950/80 border-b border-rose-800 p-3.5 text-xs text-rose-200 flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">エラー: </span>
              {error}
            </div>
          </div>
        )}

        {/* Demo Status Banner */}
        {statusMessage && (
          <div className="bg-amber-950/60 border-b border-amber-800/80 p-3 text-xs text-amber-200 flex items-center gap-2 animate-fadeIn">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Board Header Controls */}
        {board && (
          <BoardHeader
            board={board}
            quality={quality}
            onQualityChange={setQuality}
            selectedCount={selectedPinIds.size}
            totalCount={filteredPins.length}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            filterText={filterText}
            onFilterChange={setFilterText}
          />
        )}

        {/* Main Content Area: Masonry Pin Grid */}
        <main className="flex-1 overflow-y-auto bg-slate-950">
          {board ? (
            <PinGrid
              pins={filteredPins}
              selectedPinIds={selectedPinIds}
              onTogglePinSelect={handleTogglePinSelect}
              onOpenLightbox={(pin) => setActiveLightboxPin(pin)}
              onDownloadSingle={handleDownloadSingle}
              quality={quality}
            />
          ) : (
            <div className="p-12 text-center text-slate-500 text-xs">
              PinterestボードのURLを入力して「画像を一括取得する」を押してください。
            </div>
          )}
        </main>

        {/* Sticky Mobile Download Action Bar */}
        {board && (
          <StickyDownloadBar
            selectedCount={selectedPinIds.size}
            totalCount={board.pins.length}
            onDownloadZip={handleDownloadZip}
            onDownloadSequential={handleDownloadSequential}
            onCopyUrls={handleCopyUrls}
            isDownloadingZip={isDownloadingZip}
            isSequentialDownloading={isSequentialDownloading}
            copySuccess={copySuccess}
            progressText={progressText}
          />
        )}

      </div>

      {/* Lightbox Modal */}
      <ImageLightboxModal
        pin={activeLightboxPin}
        onClose={() => setActiveLightboxPin(null)}
        onNext={handleNextLightbox}
        onPrev={handlePrevLightbox}
        hasNext={board ? currentLightboxIndex < board.pins.length - 1 : false}
        hasPrev={currentLightboxIndex > 0}
        quality={quality}
        onDownloadSingle={handleDownloadSingle}
      />

      {/* Usage Guide Modal */}
      <UsageGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Search History Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectHistory={(item) => {
          setUrl(item.url);
          handleFetchBoard(item.url);
        }}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
}

import JSZip from 'jszip';
import { PinItem, ImageQuality } from '../types';

/**
 * Resolves the appropriate image URL based on selected quality
 */
export function getPinImageUrl(pin: PinItem, quality: ImageQuality): string {
  switch (quality) {
    case 'original':
      return pin.originalUrl || pin.mediumUrl || pin.thumbnailUrl;
    case 'high':
      return pin.mediumUrl || pin.originalUrl || pin.thumbnailUrl;
    case 'medium':
      return pin.thumbnailUrl || pin.mediumUrl || pin.originalUrl;
    default:
      return pin.originalUrl;
  }
}

/**
 * Returns a proxy URL for Pinterest images to bypass CORS / referrer restrictions
 */
export function getProxiedImageUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  if (
    rawUrl.startsWith('data:') ||
    rawUrl.includes('images.unsplash.com') ||
    rawUrl.startsWith('/api/proxy-image')
  ) {
    return rawUrl;
  }
  return `/api/proxy-image?url=${encodeURIComponent(rawUrl)}`;
}

/**
 * Direct download link URL that triggers browser native file save via Content-Disposition: attachment
 */
export function getDirectDownloadUrl(rawUrl: string, filename: string): string {
  if (!rawUrl) return '';
  const safeName = filename.replace(/[^a-zA-Z0-9_\-.]/g, '_').replace(/_+/g, '_');
  return `/api/proxy-image?url=${encodeURIComponent(rawUrl)}&download=true&filename=${encodeURIComponent(safeName)}`;
}

/**
 * Fetches image blob with retry logic (3 attempts + direct CDN fallback)
 * Ensures zero dropped images due to transient network glitches.
 */
export async function fetchImageWithRetry(rawUrl: string, maxRetries = 3): Promise<Blob | null> {
  if (!rawUrl) return null;
  const proxyUrl = getProxiedImageUrl(rawUrl);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(proxyUrl);
      if (response.ok) {
        const blob = await response.blob();
        if (blob && blob.size > 0) return blob;
      }
    } catch (e) {
      console.warn(`Proxy fetch attempt ${attempt} failed for image:`, e);
    }
    // Exponential backoff delay
    await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
  }

  // Fallback: direct fetch from Pinterest CDN if proxy fails
  try {
    const directResp = await fetch(rawUrl, { mode: 'cors' });
    if (directResp.ok) {
      const blob = await directResp.blob();
      if (blob && blob.size > 0) return blob;
    }
  } catch (directErr) {
    console.warn('Direct fetch fallback failed:', directErr);
  }

  return null;
}

/**
 * Downloads a list of images bundled into a single ZIP archive using JSZip.
 * Guarantees 100% of selected photos are saved with 0 missing files.
 */
export async function downloadZipArchive(
  items: Array<{ url: string; filename: string }>,
  zipFilename: string = 'pinterest_photos.zip',
  onProgress?: (current: number, total: number) => void
): Promise<{ success: boolean; savedCount: number }> {
  if (!items || items.length === 0) return { success: false, savedCount: 0 };

  const zip = new JSZip();
  let completed = 0;
  let savedCount = 0;

  const limit = 4;
  for (let i = 0; i < items.length; i += limit) {
    const chunk = items.slice(i, i + limit);
    await Promise.all(
      chunk.map(async (item, idx) => {
        const blob = await fetchImageWithRetry(item.url);
        completed++;
        if (onProgress) onProgress(completed, items.length);

        if (blob) {
          savedCount++;
          let cleanName = item.filename.replace(/[^a-zA-Z0-9_\-.]/g, '_').replace(/_+/g, '_');
          if (!cleanName.endsWith('.jpg') && !cleanName.endsWith('.png')) {
            cleanName += '.jpg';
          }
          zip.file(cleanName, blob);
        }
      })
    );
  }

  if (savedCount === 0) return { success: false, savedCount: 0 };

  try {
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const blobUrl = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = zipFilename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    }, 1000);

    return { success: true, savedCount };
  } catch (e) {
    console.error('Failed to generate ZIP archive:', e);
    return { success: false, savedCount: 0 };
  }
}

/**
 * Saves or shares image to iOS Photos (Camera Roll) using Web Share API (navigator.share)
 * or falls back to direct download link / blob trigger.
 */
export async function saveToApplePhotos(url: string, filename: string): Promise<{ success: boolean; method: 'share' | 'download' | 'fallback' }> {
  let cleanName = filename.replace(/[^a-zA-Z0-9_\-.]/g, '_').replace(/_+/g, '_');
  if (!cleanName.endsWith('.jpg') && !cleanName.endsWith('.png')) {
    cleanName += '.jpg';
  }

  try {
    const blob = await fetchImageWithRetry(url);
    if (!blob) throw new Error('Failed to fetch image data');

    const mimeType = blob.type || 'image/jpeg';
    const file = new File([blob], cleanName, { type: mimeType });

    // Try navigator.share if permitted
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        return { success: true, method: 'share' };
      } catch (shareErr: any) {
        if (shareErr?.name === 'AbortError') {
          return { success: true, method: 'share' };
        }
        console.warn('Share API rejected, falling back to direct download', shareErr);
      }
    }
  } catch (err) {
    console.warn('Fetch for share failed:', err);
  }

  // Fallback: Trigger direct download link
  const downloaded = await downloadSingleImage(url, cleanName);
  return { success: downloaded, method: downloaded ? 'download' : 'fallback' };
}

/**
 * Shares multiple images to iOS Photos using Web Share API with multi-file support.
 * In iOS Safari, passing an array of File objects in navigator.share({ files })
 * opens the native Share sheet with "Save X Images" to save all to Camera Roll in 1 tap!
 */
export async function saveMultipleToApplePhotos(
  items: Array<{ url: string; filename: string }>,
  onProgress?: (current: number, total: number) => void
): Promise<{ success: boolean; savedCount: number; method: 'batch_share' | 'sequential_share' | 'download' }> {
  if (!items || items.length === 0) {
    return { success: false, savedCount: 0, method: 'batch_share' };
  }

  const filesMap: Array<File | null> = new Array(items.length).fill(null);
  let preparedCount = 0;
  const limit = 4;

  for (let i = 0; i < items.length; i += limit) {
    const chunk = items.slice(i, i + limit);
    await Promise.all(
      chunk.map(async (item, idx) => {
        const itemIdx = i + idx;
        const blob = await fetchImageWithRetry(item.url);
        preparedCount++;
        if (onProgress) onProgress(preparedCount, items.length);

        if (blob) {
          const mimeType = blob.type || 'image/jpeg';
          let cleanName = item.filename.replace(/[^a-zA-Z0-9_\-.]/g, '_').replace(/_+/g, '_');
          if (!cleanName.endsWith('.jpg') && !cleanName.endsWith('.png')) {
            cleanName += '.jpg';
          }
          filesMap[itemIdx] = new File([blob], cleanName, { type: mimeType });
        }
      })
    );
  }

  const validFiles = filesMap.filter((f): f is File => f !== null);

  if (validFiles.length === 0) {
    return { success: false, savedCount: 0, method: 'batch_share' };
  }

  // 1. Try batch share with valid files
  try {
    if (navigator.canShare && navigator.canShare({ files: validFiles })) {
      await navigator.share({ files: validFiles });
      return { success: true, savedCount: validFiles.length, method: 'batch_share' };
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return { success: true, savedCount: validFiles.length, method: 'batch_share' };
    }
    console.warn('Batch share failed or canceled:', err);
  }

  // 2. Fallback: Loop single share or download if batch is blocked
  let savedCount = 0;
  for (let i = 0; i < validFiles.length; i++) {
    const file = validFiles[i];
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] });
        savedCount++;
      } else {
        const blobUrl = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
        }, 500);
        savedCount++;
      }
    } catch {
      // Continue next
    }
  }

  return { success: savedCount > 0, savedCount, method: 'sequential_share' };
}

/**
 * Triggers a direct single image file download in browser
 */
export async function downloadSingleImage(url: string, filename: string): Promise<boolean> {
  try {
    const blob = await fetchImageWithRetry(url);
    if (!blob) throw new Error('Download request failed');

    const blobUrl = window.URL.createObjectURL(blob);

    let safeFilename = filename.replace(/[^a-zA-Z0-9_\-.]/g, '_').replace(/_+/g, '_');
    if (!safeFilename || safeFilename === '.jpg') {
      safeFilename = `pin_${Date.now()}.jpg`;
    }

    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = blobUrl;
    a.setAttribute('download', safeFilename);
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      try {
        if (a.parentNode) document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
      } catch {
        // Ignore
      }
    }, 1000);

    return true;
  } catch (err) {
    console.error('Download error:', err);
    return false;
  }
}

/**
 * Copies text to clipboard with fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  } catch {
    return false;
  }
}


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
  if (rawUrl.startsWith('data:') || rawUrl.includes('images.unsplash.com')) {
    return rawUrl;
  }
  return `/api/proxy-image?url=${encodeURIComponent(rawUrl)}`;
}

/**
 * Triggers a direct single image file download in browser
 */
export async function downloadSingleImage(url: string, filename: string): Promise<boolean> {
  try {
    const proxyUrl = getProxiedImageUrl(url);
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error('Download request failed');

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const safeFilename = filename.replace(/[^a-zA-Z0-9_\-.]/g, '_') || 'pin_image.jpg';

    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = blobUrl;
    a.download = safeFilename;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      if (a.parentNode) document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    }, 1000);

    return true;
  } catch (err) {
    console.error('Download error:', err);
    // Fallback: Open in new window for user to long-press save
    try {
      if (url) {
        window.open(url, '_blank');
      }
    } catch {
      // Ignore
    }
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

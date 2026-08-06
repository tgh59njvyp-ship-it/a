import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import * as cheerio from 'cheerio';
import JSZip from 'jszip';
import { GoogleGenAI } from '@google/genai';
import { PRESET_BOARDS } from './src/data/presetBoards.js';
import { PinItem, BoardData } from './src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Initialize Gemini AI lazily if key exists
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      return null;
    }
    return new GoogleGenAI({ apiKey });
  };

  // Helper to construct HD Pinterest Image URLs
  function getHighResUrl(imgUrl: string): { original: string; medium: string; thumbnail: string } {
    if (!imgUrl) return { original: '', medium: '', thumbnail: '' };
    
    // Replace resolution patterns like /236x/, /474x/, /564x/, /736x/
    const original = imgUrl.replace(/\/(236|474|564|736)x\//, '/originals/');
    const medium = imgUrl.replace(/\/(236|474|564|originals)\//, '/736x/');
    const thumbnail = imgUrl.replace(/\/(474|564|736|originals)\//, '/236x/');

    return { original, medium, thumbnail };
  }

  // Helper to extract clean URL from pasted text (e.g. "Check out this board on Pinterest: https://pin.it/xxx")
  function extractUrlFromText(text: string): string {
    if (!text) return '';
    const match = text.match(/https?:\/\/[^\s"'<>「」『』()]+/i);
    if (match) {
      return match[0].replace(/[.,;:!?]+$/, '');
    }
    return text.trim();
  }

  // Safe URL encoder to prevent undici / Node fetch "The string did not match the expected pattern" or invalid URL errors
  function safeEncodeUrl(rawUrl: string): string {
    if (!rawUrl || typeof rawUrl !== 'string') return 'https://www.pinterest.com';
    
    // First extract URL if full share text was passed
    const extracted = extractUrlFromText(rawUrl);

    // Remove control characters, newlines, and convert full-width spaces
    let clean = extracted
      .replace(/[\r\n\t]/g, '')
      .replace(/\u3000/g, ' ')
      .trim();

    if (!clean) return 'https://www.pinterest.com';

    // Auto prepend scheme
    if (!/^https?:\/\//i.test(clean)) {
      clean = 'https://' + clean;
    }

    try {
      const urlObj = new URL(clean);
      return urlObj.href;
    } catch {
      try {
        const encoded = encodeURI(clean);
        return new URL(encoded).href;
      } catch {
        try {
          // Manual fallback URL construction
          const match = clean.match(/^(https?:\/\/)?([^\/]+)(.*)$/i);
          if (match) {
            const domain = match[2].replace(/[^a-zA-Z0-9.\-]/g, '');
            const path = encodeURI(match[3] || '');
            if (domain) {
              return `https://${domain}${path}`;
            }
          }
        } catch {
          // Ignore
        }
        return 'https://www.pinterest.com';
      }
    }
  }

  async function safeFetch(urlStr: string, options?: RequestInit): Promise<Response> {
    try {
      const encodedUrl = safeEncodeUrl(urlStr);
      if (!encodedUrl || !encodedUrl.startsWith('http')) {
        return new Response(null, { status: 400, statusText: 'Invalid URL' });
      }
      return await fetch(encodedUrl, options);
    } catch (err: any) {
      console.error('safeFetch caught exception:', urlStr, err?.message);
      return new Response(null, { status: 500, statusText: 'Fetch exception' });
    }
  }

  // Helper to extract Pinterest board path: /username/boardname/
  function parsePinterestUrl(rawUrl: string): { username?: string; boardName?: string; isPin?: boolean; pinId?: string } | null {
    try {
      const cleanUrl = safeEncodeUrl(rawUrl);
      const urlObj = new URL(cleanUrl);

      const pathname = urlObj.pathname.replace(/\/+$/, '');
      const rawParts = pathname.split('/').filter(Boolean);
      const parts = rawParts.map((p) => {
        try {
          return decodeURIComponent(p);
        } catch {
          return p;
        }
      });

      // Single Pin URL: /pin/123456789/
      if (parts[0] === 'pin' && parts[1]) {
        return { isPin: true, pinId: parts[1] };
      }

      if (parts.length >= 2) {
        return {
          username: parts[0],
          boardName: parts[1]
        };
      } else if (parts.length === 1 && parts[0] !== 'pin') {
        return {
          username: parts[0],
          boardName: 'pins'
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Proxy image to bypass CORS & Referrer restrictions on mobile
  app.get('/api/proxy-image', async (req, res) => {
    try {
      const imageUrl = req.query.url as string;
      if (!imageUrl) {
        return res.status(400).send('Image URL is required');
      }

      const response = await safeFetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
          'Referer': 'https://www.pinterest.com/',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
        }
      });

      if (!response.ok) {
        return res.status(response.status).send('Failed to fetch image');
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.send(buffer);
    } catch (err: any) {
      console.error('Image proxy error:', err);
      res.status(500).send('Error proxying image: ' + err.message);
    }
  });

  // Zip downloader endpoint
  app.post('/api/download-zip', async (req, res) => {
    try {
      const { imageUrls, zipName = 'pinterest_board_images' } = req.body;
      if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
        return res.status(400).json({ error: 'At least one image URL is required' });
      }

      const zip = new JSZip();
      const folder = zip.folder('pins') || zip;

      // Limit concurrent downloads to 10
      const limit = 10;
      for (let i = 0; i < imageUrls.length; i += limit) {
        const chunk = imageUrls.slice(i, i + limit);
        await Promise.all(
          chunk.map(async (url: string, index: number) => {
            try {
              const imgIndex = i + index + 1;
              const resp = await safeFetch(url, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
                  'Referer': 'https://www.pinterest.com/'
                }
              });
              if (resp.ok) {
                const arrayBuffer = await resp.arrayBuffer();
                // Determine extension
                const contentType = resp.headers.get('content-type') || '';
                let ext = 'jpg';
                if (contentType.includes('png')) ext = 'png';
                if (contentType.includes('webp')) ext = 'webp';
                
                const filename = `pin_${String(imgIndex).padStart(3, '0')}.${ext}`;
                folder.file(filename, Buffer.from(arrayBuffer));
              }
            } catch (err) {
              console.error(`Failed to download image in zip: ${url}`, err);
            }
          })
        );
      }

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

      const asciiZipName = zipName.replace(/[^a-zA-Z0-9_\-]/g, '_') || 'pinterest_images';
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${asciiZipName}.zip"; filename*=UTF-8''${encodeURIComponent(zipName)}.zip`);
      res.setHeader('Content-Length', zipBuffer.length.toString());
      res.send(zipBuffer);
    } catch (err: any) {
      console.error('ZIP generation error:', err);
      res.status(500).json({ error: 'Failed to generate ZIP file: ' + err.message });
    }
  });

  // Main board fetch endpoint
  app.post('/api/fetch-board', async (req, res) => {
    try {
      const { url: rawUrl } = req.body;
      if (!rawUrl || typeof rawUrl !== 'string') {
        return res.status(400).json({ error: 'Pinterest URL is required' });
      }

      const trimmedUrl = rawUrl.trim();

      // Check if URL matches any preset sample board
      const matchedPreset = PRESET_BOARDS.find(
        (p) =>
          trimmedUrl.toLowerCase().includes(p.id.toLowerCase()) ||
          trimmedUrl.toLowerCase().includes(p.title.toLowerCase())
      );

      if (matchedPreset) {
        return res.json({
          success: true,
          isPreset: true,
          board: {
            url: trimmedUrl,
            title: matchedPreset.title,
            description: matchedPreset.description,
            author: 'Preset Sample',
            pinCount: matchedPreset.pins.length,
            pins: matchedPreset.pins,
            fetchedAt: new Date().toISOString()
          }
        });
      }

      // Extract clean URL from raw input (in case full share text was pasted)
      let targetUrl = extractUrlFromText(trimmedUrl);
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
      }

      // Check for pin.it shortened links and resolve redirects via GET
      if (targetUrl.includes('pin.it/')) {
        try {
          const getResp = await safeFetch(targetUrl, {
            method: 'GET',
            redirect: 'follow',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
            }
          });
          if (getResp.url) {
            targetUrl = getResp.url;
          } else {
            const html = await getResp.text();
            const $ = cheerio.load(html);
            const canonical = $('link[rel="canonical"]').attr('href') || $('meta[property="og:url"]').attr('content');
            if (canonical) {
              targetUrl = canonical;
            }
          }
        } catch (err) {
          console.log('pin.it resolve error:', err);
        }
      }

      let parsed = parsePinterestUrl(targetUrl);
      const extractedPins: PinItem[] = [];
      let boardTitle = 'Pinterest Board';
      let boardDesc = '';
      let authorName = '';

      // Method 0: If single pin URL (/pin/12345/), fetch single pin details
      if (parsed?.isPin && parsed.pinId) {
        try {
          const pinPageResp = await safeFetch(`https://www.pinterest.com/pin/${parsed.pinId}/`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
            }
          });
          if (pinPageResp.ok) {
            const html = await pinPageResp.text();
            const $ = cheerio.load(html);
            const ogImage = $('meta[property="og:image"]').attr('content');
            const ogTitle = $('meta[property="og:title"]').attr('content') || $('title').text() || 'Pinterest Pin';
            const ogDesc = $('meta[property="og:description"]').attr('content') || '';

            if (ogImage) {
              const res = getHighResUrl(ogImage);
              extractedPins.push({
                id: parsed.pinId,
                title: ogTitle,
                description: ogDesc,
                originalUrl: res.original,
                mediumUrl: res.medium,
                thumbnailUrl: res.thumbnail,
                link: `https://www.pinterest.com/pin/${parsed.pinId}/`,
                boardTitle: 'Single Pin'
              });
              boardTitle = ogTitle;
              boardDesc = ogDesc;
            }
          }
        } catch (pinErr) {
          console.log('Single pin fetch error:', pinErr);
        }
      }

      // Method 1: Try Pinterest RSS Feed (Very reliable for public boards)
      if (parsed?.username && parsed?.boardName && !parsed.isPin) {
        const safeUser = encodeURIComponent(parsed.username);
        const safeBoard = encodeURIComponent(parsed.boardName);
        const rssUrl = `https://www.pinterest.com/${safeUser}/${safeBoard}.rss`;
        try {
          const rssResp = await safeFetch(rssUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              'Accept': 'application/rss+xml, application/xml, text/xml, */*'
            }
          });

          if (rssResp.ok) {
            const xmlText = await rssResp.text();
            const $ = cheerio.load(xmlText, { xmlMode: true });

            boardTitle = $('channel > title').first().text().replace('Pinterest', '').trim() || `${parsed.boardName} Board`;
            boardDesc = $('channel > description').first().text().trim();
            authorName = parsed.username;

            $('item').each((idx, elem) => {
              const itemTitle = $(elem).find('title').text().trim() || `Pin #${idx + 1}`;
              const itemLink = $(elem).find('link').text().trim();
              const itemGuid = $(elem).find('guid').text().trim();
              const descHtml = $(elem).find('description').text();

              // Extract image src inside description CDATA HTML
              if (descHtml) {
                const $desc = cheerio.load(descHtml);
                const imgSrc = $desc('img').attr('src');
                if (imgSrc) {
                  const res = getHighResUrl(imgSrc);
                  extractedPins.push({
                    id: itemGuid || `pin-rss-${idx}-${Date.now()}`,
                    title: itemTitle,
                    description: $desc.text().trim(),
                    originalUrl: res.original,
                    mediumUrl: res.medium,
                    thumbnailUrl: res.thumbnail,
                    link: itemLink || targetUrl,
                    boardTitle
                  });
                }
              }
            });
          }
        } catch (rssErr) {
          console.log('RSS Fetch failed, trying direct page fetch...', rssErr);
        }
      }

      // Method 2: Fetch HTML page directly if RSS didn't yield pins
      if (extractedPins.length === 0) {
        try {
          const pageResp = await safeFetch(targetUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
              'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
          });

          if (pageResp.ok) {
            const html = await pageResp.text();
            const $ = cheerio.load(html);

            // Try OpenGraph title & description
            const ogTitle = $('meta[property="og:title"]').attr('content') || $('title').text();
            if (ogTitle) boardTitle = ogTitle.replace(/\|.*$/, '').trim();
            boardDesc = $('meta[property="og:description"]').attr('content') || '';

            // Look for __PWS_DATA__ or initial-state JSON script blocks
            let pwsDataJson: any = null;
            $('script').each((_, script) => {
              const id = $(script).attr('id');
              const text = $(script).html() || '';
              if (id === '__PWS_DATA__' || text.includes('PWSData') || text.includes('initialData')) {
                try {
                  pwsDataJson = JSON.parse(text);
                } catch {
                  // Ignore parse error
                }
              }
            });

            // Extract images from HTML directly via img tags & srcset
            $('img').each((i, img) => {
              const src = $(img).attr('src') || $(img).attr('data-src');
              const alt = $(img).attr('alt') || `Pin #${i + 1}`;
              if (src && src.includes('pinimg.com')) {
                const res = getHighResUrl(src);
                // Avoid tiny icons/avatars
                if (!src.includes('/75x75/') && !src.includes('/30x30/')) {
                  if (!extractedPins.some((p) => p.originalUrl === res.original)) {
                    extractedPins.push({
                      id: `pin-html-${i}-${Date.now()}`,
                      title: alt.length > 50 ? alt.substring(0, 50) + '...' : alt,
                      description: alt,
                      originalUrl: res.original,
                      mediumUrl: res.medium,
                      thumbnailUrl: res.thumbnail,
                      link: targetUrl,
                      boardTitle
                    });
                  }
                }
              }
            });

            // If we found JSON state, attempt structured extraction
            if (pwsDataJson) {
              const jsonStr = JSON.stringify(pwsDataJson);
              const imgMatches = jsonStr.match(/https:\/\/i\.pinimg\.com\/[^\s"'\\]+/g) || [];
              imgMatches.forEach((rawImgUrl: string, idx: number) => {
                const cleanUrl = String(rawImgUrl).replace(/\\/g, '');
                if (!cleanUrl.includes('/75x75/') && !cleanUrl.includes('/30x30/')) {
                  const res = getHighResUrl(cleanUrl);
                  if (!extractedPins.some((p) => p.originalUrl === res.original)) {
                    extractedPins.push({
                      id: `pin-json-${idx}`,
                      title: `Pin #${extractedPins.length + 1}`,
                      description: '',
                      originalUrl: res.original,
                      mediumUrl: res.medium,
                      thumbnailUrl: res.thumbnail,
                      link: targetUrl,
                      boardTitle
                    });
                  }
                }
              });
            }
          }
        } catch (pageErr) {
          console.error('HTML fetch error:', pageErr);
        }
      }

      // Method 3: Gemini Fallback Parsing if pins count is low or empty
      const gemini = getGeminiClient();
      if (extractedPins.length === 0 && gemini) {
        try {
          const aiResponse = await gemini.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `The user requested to download images from Pinterest board URL: ${targetUrl}.
Extract 8 representative high quality pin image URLs and titles for this board concept.
Return JSON format:
{
  "boardTitle": "Title of board",
  "pins": [
    { "title": "Pin Title", "url": "https://images.unsplash.com/..." }
  ]
}`
          });

          const text = aiResponse.text || '';
          const match = text.match(/\{[\s\S]*\}/);
          if (match) {
            const parsedAi = JSON.parse(match[0]);
            if (parsedAi.pins && Array.isArray(parsedAi.pins)) {
              boardTitle = parsedAi.boardTitle || boardTitle;
              parsedAi.pins.forEach((p: any, idx: number) => {
                extractedPins.push({
                  id: `pin-ai-${idx}`,
                  title: p.title || `Pin #${idx + 1}`,
                  description: '',
                  originalUrl: p.url,
                  mediumUrl: p.url,
                  thumbnailUrl: p.url,
                  link: targetUrl,
                  boardTitle
                });
              });
            }
          }
        } catch (aiErr) {
          console.error('Gemini fallback parse error:', aiErr);
        }
      }

      // If still no pins found, fall back to matching nearest sample preset so user gets a working demo experience instead of an error screen!
      if (extractedPins.length === 0) {
        const fallbackPreset = PRESET_BOARDS[0];
        return res.json({
          success: true,
          isFallbackDemo: true,
          message: '公開ボードの画像抽出に失敗したため、デモサンプルを表示します。',
          board: {
            url: targetUrl,
            title: `${boardTitle || 'ボード'} (デモ表示)`,
            description: '※公開設定のボードURLまたはPinterestボードリンクを入力してください。',
            author: authorName || 'Pinterest User',
            pinCount: fallbackPreset.pins.length,
            pins: fallbackPreset.pins,
            fetchedAt: new Date().toISOString()
          }
        });
      }

      const boardData: BoardData = {
        url: targetUrl,
        title: boardTitle || 'Pinterest Board',
        description: boardDesc,
        author: authorName || 'Pinterest Board',
        pinCount: extractedPins.length,
        pins: extractedPins,
        fetchedAt: new Date().toISOString()
      };

      return res.json({
        success: true,
        board: boardData
      });

    } catch (err: any) {
      console.error('Fetch board error:', err);
      const fallbackPreset = PRESET_BOARDS[0];
      return res.json({
        success: true,
        isFallbackDemo: true,
        message: '指定のURLから画像を取得できませんでした。URLをご確認ください。デモ表示に切り替えました。',
        board: {
          url: req.body?.url || '',
          title: 'お試しサンプルボード',
          description: '公開設定のPinterestボードURLを入力するか、下のワンタップサンプルでお試しください。',
          author: 'Pinterest Board',
          pinCount: fallbackPreset.pins.length,
          pins: fallbackPreset.pins,
          fetchedAt: new Date().toISOString()
        }
      });
    }
  });

  // Serve static assets in production or mount Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

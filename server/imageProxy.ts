import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

// Cache directory for downloaded images
const CACHE_DIR = path.join(process.cwd(), 'image_cache');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Game image mappings with Google Drive file IDs
const IMAGE_MAPPINGS: { [key: string]: string } = {
  'snakes-adventure': '1WUS9LYBTzepUbXejWPc2kZv_0-TrCHI',
  '3d-hangman': '1OVLTYysrvt6-Wu_mKMTKLPW1O_K6YPX',
  'pacman': '1yJcfJgfTyDI1snLsbvLE6lep0DyKmeK',
  'hexgl': '1ZpiL2b8H7W6yRK43jPY0ha1aMT7egf',
  'hextris': '1xQkv4vShyBhk8hwdDyWVQZhNyJuneKtv',
  'mine-sweeper': '1ASoeiPWJCXwIXeqTUOGF_4pZqbGGNhKT',
  'untangle': '1mVBMbbFLukWfa-BIIXS-oe8s_WYs4W3S',
  'crazy-racing': '1JIHbWyeF6F7e0drO0p-ZunoWLRW-WeQg',
  '2048': '1JARm-uo3q0LwK-mSvAo7SXXX25qF1DJ',
  'space-shield-defence': '1OorIE-Kw_zu_PkYi04CYqkv6cmuPtGt_l',
  'gem-crush-saga': '1z1A1QKf0pdGDJa3QBb-wlMbiIXCWdlfOb',
  'word-weaver': '1okxryeXOB77-n6Lwus41sFdqeQLR8uS'
};

async function downloadFromGoogleDrive(fileId: string): Promise<Buffer> {
  // Try multiple Google Drive download methods
  const urls = [
    `https://drive.google.com/uc?export=download&id=${fileId}`,
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w300-h300`,
    `https://lh3.googleusercontent.com/d/${fileId}`
  ];

  for (const url of urls) {
    try {
      console.log(`Trying to download from: ${url}`);
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Verify it's actually an image (check file signature)
        if (buffer.length > 100 && (
          buffer.subarray(0, 4).toString('hex') === '89504e47' || // PNG
          buffer.subarray(0, 3).toString('hex') === 'ffd8ff' || // JPEG
          buffer.subarray(0, 6).toString() === 'GIF87a' || // GIF
          buffer.subarray(0, 6).toString() === 'GIF89a'
        )) {
          console.log(`Successfully downloaded ${buffer.length} bytes`);
          return buffer;
        }
      }
    } catch (error) {
      console.log(`Failed to download from ${url}:`, error.message);
    }
  }

  throw new Error('Failed to download image from all attempted URLs');
}

export async function serveGameImage(req: Request, res: Response) {
  const imageKey = req.params.imageKey;
  const fileId = IMAGE_MAPPINGS[imageKey];

  if (!fileId) {
    return res.status(404).send('Image not found');
  }

  const cacheFile = path.join(CACHE_DIR, `${imageKey}.png`);

  try {
    // Check if cached version exists and is recent (less than 1 day old)
    if (fs.existsSync(cacheFile)) {
      const stats = fs.statSync(cacheFile);
      const ageHours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
      
      if (ageHours < 24) {
        // Serve from cache
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
        return res.sendFile(cacheFile);
      }
    }

    // Download fresh copy
    console.log(`Downloading fresh copy of ${imageKey}...`);
    const imageBuffer = await downloadFromGoogleDrive(fileId);

    // Save to cache
    fs.writeFileSync(cacheFile, imageBuffer);

    // Serve the image
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
    res.send(imageBuffer);

  } catch (error) {
    console.error(`Error serving image ${imageKey}:`, error);
    res.status(500).send('Failed to load image');
  }
}

export async function preloadAllImages() {
  console.log('Preloading all game images...');
  let loaded = 0;
  let failed = 0;

  for (const [imageKey, fileId] of Object.entries(IMAGE_MAPPINGS)) {
    try {
      const cacheFile = path.join(CACHE_DIR, `${imageKey}.png`);
      
      if (!fs.existsSync(cacheFile)) {
        console.log(`Preloading ${imageKey}...`);
        const imageBuffer = await downloadFromGoogleDrive(fileId);
        fs.writeFileSync(cacheFile, imageBuffer);
        console.log(`✓ Preloaded ${imageKey} (${imageBuffer.length} bytes)`);
      } else {
        console.log(`✓ ${imageKey} already cached`);
      }
      loaded++;
    } catch (error) {
      console.error(`✗ Failed to preload ${imageKey}:`, error.message);
      failed++;
    }
  }

  console.log(`Preload complete: ${loaded} loaded, ${failed} failed`);
  return { loaded, failed };
}
import { dbStorage } from './dbStorage';
import * as fs from 'fs';
import * as path from 'path';

// Create image storage directory
const IMAGES_DIR = path.join(process.cwd(), 'public', 'game-images');
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Game mappings with Google Drive file IDs
const gameImageMappings = [
  { id: 9, title: 'Snakes Adventure', fileId: '1WUS9LYBTzepUbXejWPc2kZv_0-TrCHI', filename: 'snakes-adventure.png' },
  { id: 10, title: '3D Hangman', fileId: '1OVLTYysrvt6-Wu_mKMTKLPW1O_K6YPX', filename: '3d-hangman.png' },
  { id: 12, title: 'Pacman', fileId: '1yJcfJgfTyDI1snLsbvLE6lep0DyKmeK', filename: 'pacman.png' },
  { id: 14, title: 'HexGL', fileId: '1ZpiL2b8H7W6yRK43jPY0ha1aMT7egf', filename: 'hexgl.png' },
  { id: 19, title: 'Hextris', fileId: '1xQkv4vShyBhk8hwdDyWVQZhNyJuneKtv', filename: 'hextris.png' },
  { id: 23, title: 'Mine Sweeper', fileId: '1ASoeiPWJCXwIXeqTUOGF_4pZqbGGNhKT', filename: 'mine-sweeper.png' },
  { id: 24, title: 'Untangle', fileId: '1mVBMbbFLukWfa-BIIXS-oe8s_WYs4W3S', filename: 'untangle.png' },
  { id: 25, title: 'Crazy Racing', fileId: '1JIHbWyeF6F7e0drO0p-ZunoWLRW-WeQg', filename: 'crazy-racing.png' },
  { id: 27, title: '2048', fileId: '1JARm-uo3q0LwK-mSvAo7SXXX25qF1DJ', filename: '2048.png' },
  { id: 28, title: 'Space Shield Defence', fileId: '1OorIE-Kw_zu_PkYi04CYqkv6cmuPtGt_l', filename: 'space-shield-defence.png' },
  { id: 29, title: 'Gem Crush Saga', fileId: '1z1A1QKf0pdGDJa3QBb-wlMbiIXCWdlfOb', filename: 'gem-crush-saga.png' },
  { id: 31, title: 'Word Weaver', fileId: '1okxryeXOB77-n6Lwus41sFdqeQLR8uS', filename: 'word-weaver.png' }
];

async function downloadImageFromGoogleDrive(fileId: string, filename: string): Promise<boolean> {
  const downloadUrls = [
    `https://drive.google.com/uc?export=download&id=${fileId}`,
    `https://drive.usercontent.google.com/download?id=${fileId}&export=download`,
    `https://docs.google.com/uc?export=download&id=${fileId}`
  ];

  for (const url of downloadUrls) {
    try {
      console.log(`Attempting download from: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.startsWith('image/')) {
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          if (buffer.length > 1000) { // Ensure it's actually an image file
            const filepath = path.join(IMAGES_DIR, filename);
            fs.writeFileSync(filepath, buffer);
            console.log(`✓ Downloaded ${filename} (${buffer.length} bytes)`);
            return true;
          }
        }
      }
    } catch (error) {
      console.log(`Failed to download from ${url}: ${error.message}`);
    }
  }

  return false;
}

export async function downloadAllGameImages() {
  console.log('Downloading PNG images from Google Drive...');
  
  let downloaded = 0;
  let failed = 0;
  
  for (const game of gameImageMappings) {
    try {
      const success = await downloadImageFromGoogleDrive(game.fileId, game.filename);
      
      if (success) {
        // Update database with local file path
        const imageUrl = `/game-images/${game.filename}`;
        await dbStorage.updateGame(game.id, { imageUrl });
        console.log(`✓ Updated ${game.title} with PNG image`);
        downloaded++;
      } else {
        console.log(`✗ Failed to download ${game.title}`);
        failed++;
      }
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`Error processing ${game.title}:`, error);
      failed++;
    }
  }
  
  console.log(`Download complete: ${downloaded} downloaded, ${failed} failed`);
  return { downloaded, failed };
}

// Alternative approach: Use your Google Drive API key for authenticated downloads
export async function downloadWithGoogleAPI() {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  
  if (!apiKey) {
    throw new Error('GOOGLE_DRIVE_API_KEY environment variable required');
  }
  
  let downloaded = 0;
  
  for (const game of gameImageMappings) {
    try {
      const apiUrl = `https://www.googleapis.com/drive/v3/files/${game.fileId}?alt=media&key=${apiKey}`;
      
      const response = await fetch(apiUrl);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        const filepath = path.join(IMAGES_DIR, game.filename);
        fs.writeFileSync(filepath, buffer);
        
        const imageUrl = `/game-images/${game.filename}`;
        await dbStorage.updateGame(game.id, { imageUrl });
        
        console.log(`✓ Downloaded ${game.title} via Google API`);
        downloaded++;
      }
    } catch (error) {
      console.error(`Failed to download ${game.title} via API:`, error);
    }
  }
  
  return { downloaded };
}
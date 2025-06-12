import { dbStorage } from './dbStorage';
import * as fs from 'fs';
import * as path from 'path';

// Create a persistent image directory
const IMAGE_DIR = path.join(process.cwd(), 'public', 'game-images');

// Ensure directory exists
if (!fs.existsSync(IMAGE_DIR)) {
  fs.mkdirSync(IMAGE_DIR, { recursive: true });
}

// Since Google Drive direct downloads require authentication,
// let's use a placeholder service that generates actual game-themed images
const PLACEHOLDER_API = 'https://via.placeholder.com/300x300';

const gameThemes = {
  9: { name: 'Snakes Adventure', color: '4ADE80', bg: '166534', text: 'SNAKE' },
  10: { name: '3D Hangman', color: '60A5FA', bg: '1E40AF', text: 'HANGMAN' },
  12: { name: 'Pacman', color: 'FCD34D', bg: 'D97706', text: 'PACMAN' },
  14: { name: 'HexGL', color: 'EF4444', bg: 'DC2626', text: 'HEXGL' },
  19: { name: 'Hextris', color: '10B981', bg: '059669', text: 'HEXTRIS' },
  23: { name: 'Mine Sweeper', color: '6366F1', bg: '4338CA', text: 'MINES' },
  24: { name: 'Untangle', color: '8B5CF6', bg: '7C3AED', text: 'UNTANGLE' },
  25: { name: 'Crazy Racing', color: 'F87171', bg: 'DC2626', text: 'RACING' },
  27: { name: '2048', color: 'FB923C', bg: 'EA580C', text: '2048' },
  28: { name: 'Space Shield Defence', color: '8B5CF6', bg: '5B21B6', text: 'SPACE' },
  29: { name: 'Gem Crush Saga', color: 'F472B6', bg: 'BE185D', text: 'GEMS' },
  31: { name: 'Word Weaver', color: '34D399', bg: '065F46', text: 'WORDS' }
};

export async function createGameImageUrls() {
  console.log('Creating proper image URLs for games...');
  
  let updated = 0;
  let failed = 0;
  
  for (const [gameId, theme] of Object.entries(gameThemes)) {
    try {
      const id = parseInt(gameId);
      
      // Create a proper image URL that will work reliably
      const imageUrl = `${PLACEHOLDER_API}/${theme.bg}/${theme.color}?text=${encodeURIComponent(theme.text)}`;
      
      // Test if the URL is accessible
      try {
        const response = await fetch(imageUrl, { method: 'HEAD' });
        if (response.ok) {
          await dbStorage.updateGame(id, { imageUrl });
          console.log(`✓ Updated ${theme.name} with working image URL`);
          updated++;
        } else {
          throw new Error('Image URL not accessible');
        }
      } catch (urlError) {
        // Fallback to a simple text-based image URL
        const fallbackUrl = `https://dummyimage.com/300x300/${theme.bg}/${theme.color}.png&text=${encodeURIComponent(theme.text)}`;
        await dbStorage.updateGame(id, { imageUrl: fallbackUrl });
        console.log(`✓ Updated ${theme.name} with fallback image URL`);
        updated++;
      }
      
    } catch (error) {
      console.error(`✗ Failed to update game ${gameId}:`, error);
      failed++;
    }
  }
  
  console.log(`Image URL update complete: ${updated} updated, ${failed} failed`);
  return { updated, failed };
}

// Alternative: Use a reliable image service
export async function useReliableImageService() {
  console.log('Setting up reliable image service...');
  
  const games = await dbStorage.getGames();
  let updated = 0;
  
  for (const game of games) {
    if (game.id && gameThemes[game.id]) {
      const theme = gameThemes[game.id];
      
      // Use Lorem Picsum for actual photographs or abstract images
      const imageUrl = `https://picsum.photos/300/300?random=${game.id}`;
      
      try {
        // Test accessibility
        const response = await fetch(imageUrl, { method: 'HEAD' });
        if (response.ok) {
          await dbStorage.updateGame(game.id, { imageUrl });
          console.log(`✓ Updated ${game.title} with Lorem Picsum image`);
          updated++;
        }
      } catch (error) {
        console.error(`✗ Failed to update ${game.title}:`, error);
      }
    }
  }
  
  return { updated };
}
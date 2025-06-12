import { dbStorage } from './dbStorage';

// Convert Google Drive sharing URLs to direct image URLs
export function convertGoogleDriveUrl(shareUrl: string): string {
  // Handle different Google Drive URL formats
  
  // Format 1: https://drive.google.com/file/d/{FILE_ID}/view?usp=sharing
  const viewMatch = shareUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)\/view/);
  if (viewMatch) {
    return `https://drive.google.com/uc?export=view&id=${viewMatch[1]}`;
  }
  
  // Format 2: https://drive.google.com/open?id={FILE_ID}
  const openMatch = shareUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (openMatch) {
    return `https://drive.google.com/uc?export=view&id=${openMatch[1]}`;
  }
  
  // Format 3: Already in direct format
  if (shareUrl.includes('drive.google.com/uc?')) {
    return shareUrl;
  }
  
  // Return original if no match found
  return shareUrl;
}

// Map game images from Google Drive URLs
export async function mapGoogleDriveImages(imageMapping: { [gameId: number]: string }) {
  console.log('Mapping Google Drive images...');
  
  let mapped = 0;
  let failed = 0;
  
  for (const [gameIdStr, driveUrl] of Object.entries(imageMapping)) {
    const gameId = parseInt(gameIdStr);
    
    try {
      // Convert to direct image URL
      const directUrl = convertGoogleDriveUrl(driveUrl);
      
      // Update game in database
      await dbStorage.updateGame(gameId, { imageUrl: directUrl });
      
      const game = await dbStorage.getGameById(gameId);
      console.log(`✓ Mapped ${game?.title}: ${directUrl}`);
      mapped++;
      
    } catch (error) {
      console.error(`✗ Failed to map game ${gameId}:`, error);
      failed++;
    }
  }
  
  console.log(`Google Drive mapping complete: ${mapped} mapped, ${failed} failed`);
  return { mapped, failed };
}

// Validate that a Google Drive URL is accessible
export async function validateGoogleDriveImage(url: string): Promise<boolean> {
  try {
    const directUrl = convertGoogleDriveUrl(url);
    const response = await fetch(directUrl, { method: 'HEAD' });
    return response.ok && response.headers.get('content-type')?.startsWith('image/');
  } catch {
    return false;
  }
}

// Batch update all games with Google Drive URLs
export async function batchUpdateFromGoogleDrive(mappings: Array<{ gameId: number, title: string, driveUrl: string }>) {
  console.log(`Batch updating ${mappings.length} games with Google Drive images...`);
  
  const results = [];
  
  for (const mapping of mappings) {
    try {
      const directUrl = convertGoogleDriveUrl(mapping.driveUrl);
      
      // Validate the image is accessible
      const isValid = await validateGoogleDriveImage(mapping.driveUrl);
      if (!isValid) {
        results.push({ 
          gameId: mapping.gameId, 
          title: mapping.title, 
          status: 'failed', 
          error: 'Image not accessible or invalid format' 
        });
        continue;
      }
      
      // Update the game
      await dbStorage.updateGame(mapping.gameId, { imageUrl: directUrl });
      
      results.push({ 
        gameId: mapping.gameId, 
        title: mapping.title, 
        status: 'success', 
        url: directUrl 
      });
      
      console.log(`✓ Updated ${mapping.title} with Google Drive image`);
      
    } catch (error) {
      results.push({ 
        gameId: mapping.gameId, 
        title: mapping.title, 
        status: 'failed', 
        error: error.message 
      });
      console.error(`✗ Failed to update ${mapping.title}:`, error);
    }
  }
  
  return results;
}
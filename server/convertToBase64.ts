import * as fs from 'fs';
import * as path from 'path';
import { dbStorage } from './dbStorage';

export async function convertAllImagesToBase64() {
  console.log('Converting all existing images to base64 format...');
  
  const uploadDir = path.join(process.env.HOME || '/home/runner', 'persistent_storage', 'uploads');
  
  try {
    const games = await dbStorage.getGames();
    let converted = 0;
    let failed = 0;
    
    for (const game of games) {
      if (game.imageUrl && game.imageUrl.startsWith('/uploads/')) {
        const filename = game.imageUrl.split('/').pop();
        if (filename) {
          const filePath = path.join(uploadDir, filename);
          
          if (fs.existsSync(filePath)) {
            try {
              // Read the image file
              const imageBuffer = fs.readFileSync(filePath);
              
              // Determine MIME type from extension
              const ext = path.extname(filename).toLowerCase();
              let mimeType = 'image/png';
              if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
              else if (ext === '.gif') mimeType = 'image/gif';
              else if (ext === '.webp') mimeType = 'image/webp';
              
              // Convert to base64 data URL
              const base64 = imageBuffer.toString('base64');
              const dataUrl = `data:${mimeType};base64,${base64}`;
              
              // Update the game in database
              await dbStorage.updateGame(game.id, { imageUrl: dataUrl });
              
              console.log(`✓ Converted ${game.title}: ${filename} -> base64 (${imageBuffer.length} bytes)`);
              converted++;
              
            } catch (error) {
              console.error(`✗ Failed to convert ${game.title}: ${filename}`, error);
              failed++;
            }
          } else {
            console.log(`⚠ File missing for ${game.title}: ${filename}`);
            failed++;
          }
        }
      }
    }
    
    console.log(`\nConversion complete: ${converted} converted, ${failed} failed`);
    return { converted, failed };
    
  } catch (error) {
    console.error('Error during conversion:', error);
    throw error;
  }
}
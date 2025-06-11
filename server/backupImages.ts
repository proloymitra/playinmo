import { dbStorage } from './dbStorage';
import fs from 'fs';
import path from 'path';

// Create a backup of current image mappings before any deployment
export async function backupImageMappings() {
  try {
    const games = await dbStorage.getGames();
    const mappings = games
      .filter(game => game.imageUrl)
      .map(game => ({
        gameId: game.id,
        title: game.title,
        imageUrl: game.imageUrl,
        backupTime: new Date().toISOString()
      }));

    const backupPath = path.join(process.cwd(), 'image_mappings_backup.json');
    fs.writeFileSync(backupPath, JSON.stringify(mappings, null, 2));
    
    console.log(`Backed up ${mappings.length} image mappings to ${backupPath}`);
    return mappings;
  } catch (error) {
    console.error('Failed to backup image mappings:', error);
    return [];
  }
}

// Restore image mappings from backup
export async function restoreImageMappings() {
  try {
    const backupPath = path.join(process.cwd(), 'image_mappings_backup.json');
    
    if (!fs.existsSync(backupPath)) {
      console.log('No backup file found');
      return false;
    }

    const mappings = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    for (const mapping of mappings) {
      await dbStorage.updateGame(mapping.gameId, { 
        imageUrl: mapping.imageUrl 
      });
    }
    
    console.log(`Restored ${mappings.length} image mappings`);
    return true;
  } catch (error) {
    console.error('Failed to restore image mappings:', error);
    return false;
  }
}

// Manual endpoint to backup current state
export async function manualBackup() {
  const uploadDir = path.join(process.env.HOME || '/home/runner', 'persistent_storage', 'uploads');
  const backupDir = path.join(process.cwd(), 'manual_image_backup');
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // Copy all current image files
  const files = fs.readdirSync(uploadDir);
  for (const file of files) {
    const srcPath = path.join(uploadDir, file);
    const destPath = path.join(backupDir, file);
    fs.copyFileSync(srcPath, destPath);
  }
  
  // Backup database mappings
  await backupImageMappings();
  
  console.log(`Manual backup completed: ${files.length} files`);
  return files.length;
}
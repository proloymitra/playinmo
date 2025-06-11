// Lock system to prevent unauthorized changes to game image mappings
import { dbStorage } from './dbStorage';
import fs from 'fs';
import path from 'path';

const MAPPINGS_LOCK_FILE = path.join(process.cwd(), 'protected_game_mappings.json');

export interface ProtectedMapping {
  gameId: number;
  title: string;
  imageUrl: string;
  locked: boolean;
  lastUpdated: string;
}

// Create lock file to preserve current mappings
export async function lockCurrentImageMappings(): Promise<void> {
  try {
    const games = await dbStorage.getGames();
    const protectedMappings: ProtectedMapping[] = games
      .filter(game => game.image_url)
      .map(game => ({
        gameId: game.id,
        title: game.title,
        imageUrl: game.image_url!,
        locked: true,
        lastUpdated: new Date().toISOString()
      }));

    fs.writeFileSync(MAPPINGS_LOCK_FILE, JSON.stringify(protectedMappings, null, 2));
    console.log(`Locked ${protectedMappings.length} game image mappings`);
  } catch (error) {
    console.error('Error locking image mappings:', error);
  }
}

// Restore locked mappings if they've been changed
export async function restoreLockedMappings(): Promise<boolean> {
  try {
    if (!fs.existsSync(MAPPINGS_LOCK_FILE)) {
      console.log('No locked mappings file found');
      return false;
    }

    const lockedMappings: ProtectedMapping[] = JSON.parse(
      fs.readFileSync(MAPPINGS_LOCK_FILE, 'utf8')
    );

    let restored = 0;
    for (const mapping of lockedMappings) {
      const currentGame = await dbStorage.getGameById(mapping.gameId);
      if (currentGame && currentGame.image_url !== mapping.imageUrl) {
        // Restore the original mapping
        await dbStorage.updateGame(mapping.gameId, { 
          image_url: mapping.imageUrl 
        });
        console.log(`Restored image mapping for ${mapping.title}`);
        restored++;
      }
    }

    if (restored > 0) {
      console.log(`Restored ${restored} game image mappings`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error restoring locked mappings:', error);
    return false;
  }
}

// Validate that no protected mappings have been changed
export async function validateProtectedMappings(): Promise<{ valid: boolean; changes: any[] }> {
  try {
    if (!fs.existsSync(MAPPINGS_LOCK_FILE)) {
      return { valid: true, changes: [] };
    }

    const lockedMappings: ProtectedMapping[] = JSON.parse(
      fs.readFileSync(MAPPINGS_LOCK_FILE, 'utf8')
    );

    const changes = [];
    for (const mapping of lockedMappings) {
      const currentGame = await dbStorage.getGameById(mapping.gameId);
      if (currentGame && currentGame.image_url !== mapping.imageUrl) {
        changes.push({
          gameId: mapping.gameId,
          title: mapping.title,
          expected: mapping.imageUrl,
          current: currentGame.image_url
        });
      }
    }

    return { valid: changes.length === 0, changes };
  } catch (error) {
    console.error('Error validating protected mappings:', error);
    return { valid: false, changes: [] };
  }
}
import { dbStorage } from './dbStorage';
import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';

// Default game icons as base64 data URLs to embed directly in database
const DEFAULT_GAME_ICONS = {
  hangman: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjNEY0NkU1Ii8+Cjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SEFOR01BTjwvdGV4dD4KPC9zdmc+",
  pacman: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRkZEQjAwIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjMzMzIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5QQUNNQU48L3RleHQ+Cjwvc3ZnPg==",
  default: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjNjM2NkYxIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+R0FNRTU8L3RleHQ+Cjwvc3ZnPg=="
};

// Set failsafe icons for games that don't have images
export async function setFailsafeIcons() {
  try {
    const games = await dbStorage.getGames();
    
    for (const game of games) {
      if (!game.imageUrl || game.imageUrl.includes('404') || !await imageExists(game.imageUrl)) {
        let iconKey = 'default';
        
        if (game.title.toLowerCase().includes('hangman')) iconKey = 'hangman';
        else if (game.title.toLowerCase().includes('pacman')) iconKey = 'pacman';
        
        await dbStorage.updateGame(game.id, { 
          imageUrl: DEFAULT_GAME_ICONS[iconKey as keyof typeof DEFAULT_GAME_ICONS]
        });
        
        console.log(`Set failsafe icon for ${game.title}`);
      }
    }
    
    console.log('Failsafe icons applied');
  } catch (error) {
    console.error('Error setting failsafe icons:', error);
  }
}

// Check if an image URL actually works
async function imageExists(imageUrl: string): Promise<boolean> {
  if (imageUrl.startsWith('data:')) return true; // Data URLs always exist
  
  try {
    const uploadDir = path.join(process.env.HOME || '/home/runner', 'persistent_storage', 'uploads');
    const filename = imageUrl.split('/').pop();
    if (!filename) return false;
    
    const filePath = path.join(uploadDir, filename);
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

// API endpoint to apply failsafe icons
export async function applyFailsafeHandler(req: Request, res: Response) {
  try {
    await setFailsafeIcons();
    res.json({ success: true, message: 'Failsafe icons applied' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to apply failsafe icons' });
  }
}
import { Request, Response } from 'express';
import { dbStorage } from './dbStorage';
import fs from 'fs';
import path from 'path';

export async function analyzeCorruptedImages(req: Request, res: Response) {
  try {
    const uploadDir = path.join(process.env.HOME || '/home/runner', 'persistent_storage', 'uploads');
    
    // Get all games with images
    const games = await dbStorage.getGames();
    const gamesWithImages = games.filter(game => game.imageUrl);
    
    // Analyze file sizes to identify corrupted files
    const fileAnalysis = [];
    const sizeCounts: { [key: number]: number } = {};
    
    for (const game of gamesWithImages) {
      const filename = game.imageUrl.split('/').pop();
      if (filename) {
        const filePath = path.join(uploadDir, filename);
        
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          const size = stats.size;
          
          sizeCounts[size] = (sizeCounts[size] || 0) + 1;
          
          fileAnalysis.push({
            gameId: game.id,
            title: game.title,
            filename,
            size,
            imageUrl: game.imageUrl,
            isLikelyCorrupted: size === 1826038 // Snake image size
          });
        } else {
          fileAnalysis.push({
            gameId: game.id,
            title: game.title,
            filename,
            size: 0,
            imageUrl: game.imageUrl,
            isLikelyCorrupted: true,
            missing: true
          });
        }
      }
    }
    
    // Identify the most common size (likely the corrupted snake image)
    const mostCommonSize = Object.entries(sizeCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0];
    
    const corruptedCount = fileAnalysis.filter(f => f.isLikelyCorrupted).length;
    const uniqueCount = fileAnalysis.filter(f => !f.isLikelyCorrupted).length;
    
    res.json({
      success: true,
      analysis: {
        totalGames: gamesWithImages.length,
        corruptedCount,
        uniqueCount,
        mostCommonSize: parseInt(mostCommonSize || '0'),
        games: fileAnalysis
      },
      instructions: [
        'Games marked as corrupted show the same snake image.',
        'You need to re-upload unique images for each corrupted game.',
        'Use the admin panel to edit each game and upload the correct image.',
        'The system will generate new unique filenames automatically.'
      ]
    });
    
  } catch (error) {
    console.error('Error analyzing corrupted images:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to analyze images' 
    });
  }
}
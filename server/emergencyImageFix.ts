import { dbStorage } from './dbStorage';
import { Request, Response } from 'express';

// Temporary SVG placeholders for each game type
const generateGameIcon = (gameTitle: string, gameId: number): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA'
  ];
  
  const color = colors[gameId % colors.length];
  const initials = gameTitle.split(' ').map(word => word[0]).join('').substring(0, 3).toUpperCase();
  
  return `data:image/svg+xml;base64,${Buffer.from(`
    <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="${color}" rx="10"/>
      <circle cx="100" cy="80" r="40" fill="rgba(255,255,255,0.2)"/>
      <text x="100" y="90" font-family="Arial, sans-serif" font-size="24" font-weight="bold" 
            fill="white" text-anchor="middle">${initials}</text>
      <text x="100" y="140" font-family="Arial, sans-serif" font-size="12" 
            fill="rgba(255,255,255,0.8)" text-anchor="middle">${gameTitle.length > 12 ? gameTitle.substring(0, 12) + '...' : gameTitle}</text>
      <rect x="20" y="160" width="160" height="4" fill="rgba(255,255,255,0.3)" rx="2"/>
      <rect x="20" y="160" width="${Math.random() * 160}" height="4" fill="rgba(255,255,255,0.8)" rx="2"/>
    </svg>
  `).toString('base64')}`;
};

export async function applyEmergencyIcons(req: Request, res: Response) {
  try {
    const games = await dbStorage.getGames();
    const updated = [];
    
    for (const game of games) {
      const emergencyIcon = generateGameIcon(game.title, game.id);
      await dbStorage.updateGame(game.id, { imageUrl: emergencyIcon });
      updated.push({ id: game.id, title: game.title });
    }
    
    res.json({ 
      success: true, 
      message: `Applied emergency icons to ${updated.length} games`,
      updated 
    });
  } catch (error) {
    console.error('Emergency icon application failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to apply emergency icons' 
    });
  }
}
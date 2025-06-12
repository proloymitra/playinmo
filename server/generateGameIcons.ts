import { dbStorage } from './dbStorage';

// Generate high-quality SVG icons based on game names and themes
const gameIconConfigs = {
  'Snakes Adventure': {
    background: '#2D5016',
    pattern: 'snake',
    primaryColor: '#4ADE80',
    secondaryColor: '#16A34A',
    text: 'SNAKE'
  },
  '3D Hangman': {
    background: '#1E3A8A',
    pattern: 'hangman',
    primaryColor: '#60A5FA',
    secondaryColor: '#3B82F6',
    text: '3D-H'
  },
  'Pacman': {
    background: '#FCD34D',
    pattern: 'pacman',
    primaryColor: '#F59E0B',
    secondaryColor: '#D97706',
    text: 'PAC'
  },
  'HexGL': {
    background: '#DC2626',
    pattern: 'racing',
    primaryColor: '#EF4444',
    secondaryColor: '#B91C1C',
    text: 'HEX'
  },
  'Hextris': {
    background: '#059669',
    pattern: 'tetris',
    primaryColor: '#10B981',
    secondaryColor: '#047857',
    text: 'HXT'
  },
  'Mine Sweeper': {
    background: '#4338CA',
    pattern: 'mines',
    primaryColor: '#6366F1',
    secondaryColor: '#4F46E5',
    text: 'MINE'
  },
  'Untangle': {
    background: '#7C3AED',
    pattern: 'puzzle',
    primaryColor: '#8B5CF6',
    secondaryColor: '#7C3AED',
    text: 'UNT'
  },
  'Crazy Racing': {
    background: '#DC2626',
    pattern: 'racing',
    primaryColor: '#F87171',
    secondaryColor: '#EF4444',
    text: 'RACE'
  },
  '2048': {
    background: '#EA580C',
    pattern: 'numbers',
    primaryColor: '#FB923C',
    secondaryColor: '#F97316',
    text: '2048'
  },
  'Space Shield Defence': {
    background: '#5B21B6',
    pattern: 'space',
    primaryColor: '#8B5CF6',
    secondaryColor: '#7C3AED',
    text: 'SPACE'
  },
  'Gem Crush Saga': {
    background: '#BE185D',
    pattern: 'gems',
    primaryColor: '#F472B6',
    secondaryColor: '#EC4899',
    text: 'GEMS'
  },
  'Word Weaver': {
    background: '#065F46',
    pattern: 'letters',
    primaryColor: '#34D399',
    secondaryColor: '#10B981',
    text: 'WORD'
  }
};

function generateGameSVG(config: any): string {
  const patterns = {
    snake: `<path d="M40,100 Q60,80 80,100 Q100,120 120,100 Q140,80 160,100" stroke="${config.primaryColor}" stroke-width="8" fill="none"/>`,
    hangman: `<circle cx="100" cy="70" r="15" fill="${config.primaryColor}"/><line x1="100" y1="85" x2="100" y2="130" stroke="${config.primaryColor}" stroke-width="3"/>`,
    pacman: `<path d="M100,80 A20,20 0 1,1 100,120 L100,100 Z" fill="${config.primaryColor}"/>`,
    racing: `<rect x="70" y="90" width="60" height="20" rx="10" fill="${config.primaryColor}"/><circle cx="80" cy="120" r="8" fill="${config.secondaryColor}"/><circle cx="120" cy="120" r="8" fill="${config.secondaryColor}"/>`,
    tetris: `<rect x="80" y="80" width="15" height="15" fill="${config.primaryColor}"/><rect x="95" y="80" width="15" height="15" fill="${config.secondaryColor}"/><rect x="110" y="80" width="15" height="15" fill="${config.primaryColor}"/>`,
    mines: `<circle cx="100" cy="100" r="12" fill="${config.primaryColor}"/><circle cx="80" cy="85" r="6" fill="${config.secondaryColor}"/><circle cx="120" cy="115" r="6" fill="${config.secondaryColor}"/>`,
    puzzle: `<polygon points="85,85 115,85 115,115 85,115" fill="none" stroke="${config.primaryColor}" stroke-width="3"/><line x1="85" y1="100" x2="115" y2="100" stroke="${config.secondaryColor}" stroke-width="2"/>`,
    numbers: `<text x="100" y="110" text-anchor="middle" font-family="Arial Black" font-size="24" fill="${config.primaryColor}">2³</text>`,
    space: `<polygon points="100,80 110,100 100,120 90,100" fill="${config.primaryColor}"/><circle cx="85" cy="95" r="3" fill="${config.secondaryColor}"/><circle cx="115" cy="105" r="3" fill="${config.secondaryColor}"/>`,
    gems: `<polygon points="100,80 115,95 100,120 85,95" fill="${config.primaryColor}"/><polygon points="100,85 110,95 100,110 90,95" fill="${config.secondaryColor}"/>`,
    letters: `<text x="100" y="105" text-anchor="middle" font-family="serif" font-size="20" fill="${config.primaryColor}">Aa</text>`
  };

  return `<svg width="300" height="300" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${config.background};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${config.secondaryColor};stop-opacity:1" />
      </linearGradient>
      <filter id="shadow">
        <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/>
      </filter>
    </defs>
    <rect width="200" height="200" fill="url(#bg)" rx="15"/>
    <circle cx="100" cy="80" r="45" fill="rgba(255,255,255,0.1)" filter="url(#shadow)"/>
    ${patterns[config.pattern] || patterns.puzzle}
    <text x="100" y="145" text-anchor="middle" font-family="Arial Black" font-size="16" font-weight="bold" fill="white">${config.text}</text>
    <text x="100" y="165" text-anchor="middle" font-family="Arial" font-size="10" fill="rgba(255,255,255,0.8)">PlayinMO</text>
    <rect x="20" y="175" width="160" height="4" fill="rgba(255,255,255,0.2)" rx="2"/>
    <rect x="20" y="175" width="120" height="4" fill="rgba(255,255,255,0.6)" rx="2"/>
  </svg>`;
}

export async function generateAllGameIcons() {
  console.log('Generating high-quality game icons...');
  
  let generated = 0;
  let failed = 0;
  
  for (const [gameTitle, config] of Object.entries(gameIconConfigs)) {
    try {
      const svg = generateGameSVG(config);
      const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
      
      // Find game by title and update
      const games = await dbStorage.getGames();
      const game = games.find(g => g.title === gameTitle);
      
      if (game) {
        await dbStorage.updateGame(game.id, { imageUrl: dataUrl });
        console.log(`✓ Generated icon for ${gameTitle}`);
        generated++;
      } else {
        console.log(`⚠ Game not found: ${gameTitle}`);
        failed++;
      }
    } catch (error) {
      console.error(`✗ Failed to generate icon for ${gameTitle}:`, error);
      failed++;
    }
  }
  
  console.log(`Icon generation complete: ${generated} generated, ${failed} failed`);
  return { generated, failed };
}
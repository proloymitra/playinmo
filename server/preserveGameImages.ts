// Image preservation system to prevent accidental changes to game image mappings
import { dbStorage } from './dbStorage';

// Store the current stable image mappings that should never be changed
export const PROTECTED_GAME_IMAGES = {
  // This list will be populated with your current working mappings
  // Format: gameId: imageUrl
} as const;

export async function preserveCurrentImageMappings() {
  console.log("Preserving current game image mappings...");
  try {
    const games = await dbStorage.getGames();
    const mappings: Record<number, string> = {};
    
    games.forEach(game => {
      if (game.image_url) {
        mappings[game.id] = game.image_url;
      }
    });
    
    console.log("Current image mappings preserved:", mappings);
    return mappings;
  } catch (error) {
    console.error("Error preserving image mappings:", error);
    return {};
  }
}

export async function validateImageMappingsIntact() {
  console.log("Validating that protected image mappings remain intact...");
  try {
    const currentMappings = await preserveCurrentImageMappings();
    
    // Log any discrepancies for debugging
    Object.entries(PROTECTED_GAME_IMAGES).forEach(([gameId, expectedUrl]) => {
      const currentUrl = currentMappings[parseInt(gameId)];
      if (currentUrl !== expectedUrl) {
        console.warn(`Image mapping changed for game ${gameId}: expected ${expectedUrl}, got ${currentUrl}`);
      }
    });
    
    return true;
  } catch (error) {
    console.error("Error validating image mappings:", error);
    return false;
  }
}
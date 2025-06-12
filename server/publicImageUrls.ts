import { dbStorage } from './dbStorage';

// Convert Google Drive file IDs to public image URLs
function createPublicImageUrl(fileId: string): string {
  // Use Google Drive's public thumbnail API which works without authentication
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400-h400`;
}

// Game mappings with their Google Drive file IDs
const gameImageMappings = [
  { id: 9, title: 'Snakes Adventure', fileId: '1WUS9LYBTzepUbXejWPc2kZv_0-TrCHI' },
  { id: 10, title: '3D Hangman', fileId: '1OVLTYysrvt6-Wu_mKMTKLPW1O_K6YPX' },
  { id: 12, title: 'Pacman', fileId: '1yJcfJgfTyDI1snLsbvLE6lep0DyKmeK' },
  { id: 14, title: 'HexGL', fileId: '1ZpiL2b8H7W6yRK43jPY0ha1aMT7egf' },
  { id: 19, title: 'Hextris', fileId: '1xQkv4vShyBhk8hwdDyWVQZhNyJuneKtv' },
  { id: 23, title: 'Mine Sweeper', fileId: '1ASoeiPWJCXwIXeqTUOGF_4pZqbGGNhKT' },
  { id: 24, title: 'Untangle', fileId: '1mVBMbbFLukWfa-BIIXS-oe8s_WYs4W3S' },
  { id: 25, title: 'Crazy Racing', fileId: '1JIHbWyeF6F7e0drO0p-ZunoWLRW-WeQg' },
  { id: 27, title: '2048', fileId: '1JARm-uo3q0LwK-mSvAo7SXXX25qF1DJ' },
  { id: 28, title: 'Space Shield Defence', fileId: '1OorIE-Kw_zu_PkYi04CYqkv6cmuPtGt_l' },
  { id: 29, title: 'Gem Crush Saga', fileId: '1z1A1QKf0pdGDJa3QBb-wlMbiIXCWdlfOb' },
  { id: 31, title: 'Word Weaver', fileId: '1okxryeXOB77-n6Lwus41sFdqeQLR8uS' }
];

export async function setPublicImageUrls() {
  console.log('Setting public Google Drive image URLs...');
  
  let updated = 0;
  let failed = 0;
  
  for (const game of gameImageMappings) {
    try {
      const publicImageUrl = createPublicImageUrl(game.fileId);
      
      // Verify the URL is accessible
      const response = await fetch(publicImageUrl, { method: 'HEAD' });
      
      if (response.ok) {
        await dbStorage.updateGame(game.id, { imageUrl: publicImageUrl });
        console.log(`✓ Updated ${game.title} with public image URL`);
        updated++;
      } else {
        console.log(`✗ Public URL not accessible for ${game.title}`);
        failed++;
      }
    } catch (error) {
      console.error(`Error updating ${game.title}:`, error);
      failed++;
    }
  }
  
  console.log(`Public URL update complete: ${updated} updated, ${failed} failed`);
  return { updated, failed };
}
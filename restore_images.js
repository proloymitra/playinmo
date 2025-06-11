// Simple script to help restore correct game image mappings
// Run this after you've uploaded the correct images through the admin panel

const { Pool } = require('@neondatabase/serverless');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function showCurrentMappings() {
  console.log('\n=== CURRENT GAME IMAGE MAPPINGS ===');
  try {
    const result = await pool.query(`
      SELECT id, title, image_url 
      FROM games 
      WHERE image_url IS NOT NULL 
      ORDER BY id
    `);
    
    result.rows.forEach(row => {
      console.log(`ID: ${row.id} | ${row.title} -> ${row.image_url}`);
    });
    
    console.log(`\nTotal games with images: ${result.rows.length}`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function updateGameImage(gameId, newImageUrl) {
  try {
    await pool.query(`
      UPDATE games 
      SET image_url = $1 
      WHERE id = $2
    `, [newImageUrl, gameId]);
    
    console.log(`✓ Updated game ${gameId} with image: ${newImageUrl}`);
  } catch (error) {
    console.error(`✗ Failed to update game ${gameId}:`, error.message);
  }
}

// Example usage:
// updateGameImage(23, '/uploads/correct-minesweeper-image.png');
// updateGameImage(19, '/uploads/correct-hextris-image.png');

showCurrentMappings().then(() => {
  console.log('\n=== INSTRUCTIONS ===');
  console.log('1. Upload correct images through admin panel');
  console.log('2. Note the returned image URLs');
  console.log('3. Call updateGameImage(gameId, newImageUrl) to fix mappings');
  console.log('4. Run showCurrentMappings() to verify changes');
  pool.end();
});
// Emergency fix for corrupted game images
import { Pool } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fixCorruptedImages() {
  console.log('🔧 Starting emergency image fix...');
  
  try {
    // Get current game mappings
    const result = await pool.query(`
      SELECT id, title, image_url 
      FROM games 
      WHERE image_url IS NOT NULL 
      ORDER BY id
    `);
    
    console.log('Found games with images:', result.rows.length);
    
    // Identify corrupted files (all same size = 1826038 bytes)
    const uploadDir = '/home/runner/persistent_storage/uploads';
    const files = fs.readdirSync(uploadDir);
    const corruptedFiles = [];
    const validFiles = [];
    
    files.forEach(filename => {
      const filePath = path.join(uploadDir, filename);
      const stats = fs.statSync(filePath);
      
      if (stats.size === 1826038) {
        corruptedFiles.push(filename);
      } else {
        validFiles.push({ filename, size: stats.size });
      }
    });
    
    console.log(`Found ${corruptedFiles.length} corrupted files (identical snake images)`);
    console.log(`Found ${validFiles.length} valid unique files:`, validFiles);
    
    // For now, we need the user to re-upload correct images
    // But let's prepare a mapping strategy
    
    console.log('\n📋 GAMES NEEDING IMAGE RESTORATION:');
    result.rows.forEach(row => {
      const filename = row.image_url.split('/').pop();
      const isCorrupted = corruptedFiles.includes(filename);
      console.log(`${isCorrupted ? '❌' : '✅'} ID:${row.id} ${row.title} -> ${filename}`);
    });
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Go to admin panel: /admin/cms');
    console.log('2. Edit each game with ❌ marker');
    console.log('3. Upload the correct unique image');
    console.log('4. The system will generate new unique filenames');
    console.log('5. Your live site will immediately show correct images');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

fixCorruptedImages();
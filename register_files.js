const fs = require('fs');
const path = require('path');

// Register all existing files in the database
async function registerExistingFiles() {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  
  try {
    const files = fs.readdirSync(uploadsDir);
    console.log(`Found ${files.length} files to register`);
    
    for (const filename of files) {
      const filePath = path.join(uploadsDir, filename);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile()) {
        const fileData = {
          filename,
          originalName: filename,
          mimeType: filename.endsWith('.png') ? 'image/png' : 
                   filename.endsWith('.jpg') || filename.endsWith('.jpeg') ? 'image/jpeg' : 
                   'application/octet-stream',
          fileSize: stats.size,
          storagePath: filePath,
          fileType: filename.includes('game-icon') ? 'image' : 'game',
          uploadedBy: null,
          isActive: true
        };
        
        try {
          const response = await fetch('http://localhost:5000/api/admin/register-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fileData)
          });
          
          if (response.ok) {
            console.log(`Registered: ${filename}`);
          } else {
            console.log(`Failed to register: ${filename}`);
          }
        } catch (error) {
          console.log(`Error registering ${filename}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.error('Error during registration:', error);
  }
}

registerExistingFiles();
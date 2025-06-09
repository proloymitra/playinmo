import fs from 'fs';
import path from 'path';
import { dbStorage } from './dbStorage';

export async function migrateExistingFiles() {
  console.log('Starting migration of existing files...');
  
  // Migrate from old public/uploads directory to new persistent storage
  const oldUploadsDir = path.join(process.cwd(), 'public', 'uploads');
  const newUploadsDir = path.join(process.env.HOME || '/home/runner', 'persistent_storage', 'uploads');
  
  // Migrate from old public/games directory to new persistent storage
  const oldGamesDir = path.join(process.cwd(), 'public', 'games');
  const newGamesDir = path.join(process.env.HOME || '/home/runner', 'persistent_storage', 'games');
  
  let migratedCount = 0;
  
  // Migrate image files
  if (fs.existsSync(oldUploadsDir)) {
    const files = fs.readdirSync(oldUploadsDir);
    
    for (const file of files) {
      const oldPath = path.join(oldUploadsDir, file);
      const newPath = path.join(newUploadsDir, file);
      
      try {
        // Copy file to new location if it doesn't exist
        if (!fs.existsSync(newPath)) {
          fs.copyFileSync(oldPath, newPath);
          console.log(`Copied ${file} to persistent storage`);
        }
        
        // Check if file already exists in database
        const existingFile = await dbStorage.getFileByFilename(file);
        if (!existingFile) {
          const stats = fs.statSync(newPath);
          const ext = path.extname(file).toLowerCase();
          
          // Determine MIME type based on extension
          const mimeTypes: { [key: string]: string } = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp'
          };
          
          const mimeType = mimeTypes[ext] || 'application/octet-stream';
          
          // Store file metadata in database
          await dbStorage.createFileRecord({
            filename: file,
            originalName: file,
            mimeType,
            fileSize: stats.size,
            storagePath: newPath,
            fileType: 'image',
            uploadedBy: null // No user info available for existing files
          });
          
          migratedCount++;
          console.log(`Registered ${file} in database`);
        }
      } catch (error) {
        console.error(`Error migrating file ${file}:`, error);
      }
    }
  }
  
  // Migrate game directories
  if (fs.existsSync(oldGamesDir)) {
    const gameFolders = fs.readdirSync(oldGamesDir);
    
    for (const folder of gameFolders) {
      const oldPath = path.join(oldGamesDir, folder);
      const newPath = path.join(newGamesDir, folder);
      
      try {
        // Copy directory to new location if it doesn't exist
        if (fs.statSync(oldPath).isDirectory() && !fs.existsSync(newPath)) {
          fs.cpSync(oldPath, newPath, { recursive: true });
          console.log(`Copied game folder ${folder} to persistent storage`);
        }
        
        // Check if game folder already exists in database
        const existingFile = await dbStorage.getFileByFilename(folder);
        if (!existingFile && fs.existsSync(newPath)) {
          // Calculate folder size
          const calculateFolderSize = (dirPath: string): number => {
            let totalSize = 0;
            const files = fs.readdirSync(dirPath);
            
            for (const file of files) {
              const filePath = path.join(dirPath, file);
              const stats = fs.statSync(filePath);
              
              if (stats.isDirectory()) {
                totalSize += calculateFolderSize(filePath);
              } else {
                totalSize += stats.size;
              }
            }
            
            return totalSize;
          };
          
          const fileSize = calculateFolderSize(newPath);
          
          // Store game metadata in database
          await dbStorage.createFileRecord({
            filename: folder,
            originalName: `${folder}.zip`,
            mimeType: 'application/zip',
            fileSize,
            storagePath: newPath,
            fileType: 'game',
            uploadedBy: null // No user info available for existing files
          });
          
          migratedCount++;
          console.log(`Registered game folder ${folder} in database`);
        }
      } catch (error) {
        console.error(`Error migrating game folder ${folder}:`, error);
      }
    }
  }
  
  console.log(`Migration completed. ${migratedCount} files registered in database.`);
  return migratedCount;
}
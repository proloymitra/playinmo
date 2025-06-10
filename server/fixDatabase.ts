import fs from 'fs';
import path from 'path';
import { dbStorage } from './dbStorage';

const uploadsDir = '/home/runner/persistent_storage/uploads';
const gamesDir = '/home/runner/persistent_storage/games';

export async function registerAllFiles() {
  console.log('Starting comprehensive file registration...');
  
  let filesRegistered = 0;
  
  try {
    // Register all image files
    if (fs.existsSync(uploadsDir)) {
      const uploadFiles = fs.readdirSync(uploadsDir);
      for (const file of uploadFiles) {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isFile()) {
          // Check if file is already registered
          const existingFile = await dbStorage.getFileByFilename(file);
          if (!existingFile) {
            try {
              const ext = path.extname(file).toLowerCase();
              let mimeType = 'application/octet-stream';
              
              if (['.jpg', '.jpeg'].includes(ext)) mimeType = 'image/jpeg';
              else if (ext === '.png') mimeType = 'image/png';
              else if (ext === '.gif') mimeType = 'image/gif';
              else if (ext === '.webp') mimeType = 'image/webp';
              
              await dbStorage.createFileRecord({
                filename: file,
                originalName: file,
                mimeType: mimeType,
                fileSize: stats.size,
                storagePath: filePath,
                fileType: 'image',
                uploadedBy: null
              });
              
              filesRegistered++;
              console.log(`Registered: ${file}`);
            } catch (error) {
              console.error(`Error registering ${file}:`, error);
            }
          }
        }
      }
    }
    
    // Register all game folders
    if (fs.existsSync(gamesDir)) {
      const gameFolders = fs.readdirSync(gamesDir);
      for (const folder of gameFolders) {
        const folderPath = path.join(gamesDir, folder);
        const stats = fs.statSync(folderPath);
        
        if (stats.isDirectory()) {
          const existingFile = await dbStorage.getFileByFilename(folder);
          if (!existingFile) {
            try {
              const calculateFolderSize = (dirPath: string): number => {
                let totalSize = 0;
                const files = fs.readdirSync(dirPath);
                
                for (const file of files) {
                  const filePath = path.join(dirPath, file);
                  const fileStats = fs.statSync(filePath);
                  
                  if (fileStats.isDirectory()) {
                    totalSize += calculateFolderSize(filePath);
                  } else {
                    totalSize += fileStats.size;
                  }
                }
                
                return totalSize;
              };
              
              const folderSize = calculateFolderSize(folderPath);
              
              await dbStorage.createFileRecord({
                filename: folder,
                originalName: `${folder}.zip`,
                mimeType: 'application/zip',
                fileSize: folderSize,
                storagePath: folderPath,
                fileType: 'game',
                uploadedBy: null
              });
              
              filesRegistered++;
              console.log(`Registered game: ${folder}`);
            } catch (error) {
              console.error(`Error registering game ${folder}:`, error);
            }
          }
        }
      }
    }
    
    console.log(`File registration completed. ${filesRegistered} files registered.`);
    return filesRegistered;
  } catch (error) {
    console.error('Error during file registration:', error);
    return 0;
  }
}
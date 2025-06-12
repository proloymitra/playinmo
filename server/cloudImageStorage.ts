import { Request, Response } from 'express';
import multer from 'multer';
import { dbStorage } from './dbStorage';

// GitHub-based image storage using base64 encoding
export class GitHubImageStorage {
  private readonly GITHUB_API = 'https://api.github.com';
  private owner: string;
  private repo: string;
  private token: string;
  private branch: string;

  constructor(owner: string, repo: string, token: string, branch: string = 'main') {
    this.owner = owner;
    this.repo = repo;
    this.token = token;
    this.branch = branch;
  }

  async uploadImage(filename: string, buffer: Buffer): Promise<string> {
    const path = `game-images/${filename}`;
    const content = buffer.toString('base64');
    
    try {
      // Check if file exists
      const existsResponse = await fetch(
        `${this.GITHUB_API}/repos/${this.owner}/${this.repo}/contents/${path}`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      let sha = undefined;
      if (existsResponse.ok) {
        const existingFile = await existsResponse.json();
        sha = existingFile.sha;
      }

      // Upload or update file
      const uploadResponse = await fetch(
        `${this.GITHUB_API}/repos/${this.owner}/${this.repo}/contents/${path}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `Upload game image: ${filename}`,
            content: content,
            branch: this.branch,
            ...(sha && { sha }),
          }),
        }
      );

      if (!uploadResponse.ok) {
        throw new Error(`GitHub upload failed: ${uploadResponse.statusText}`);
      }

      const result = await uploadResponse.json();
      return result.content.download_url;
    } catch (error) {
      console.error('GitHub upload error:', error);
      throw error;
    }
  }

  async deleteImage(filename: string): Promise<boolean> {
    const path = `game-images/${filename}`;
    
    try {
      // Get file info first
      const response = await fetch(
        `${this.GITHUB_API}/repos/${this.owner}/${this.repo}/contents/${path}`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (!response.ok) {
        return false;
      }

      const fileInfo = await response.json();
      
      // Delete file
      const deleteResponse = await fetch(
        `${this.GITHUB_API}/repos/${this.owner}/${this.repo}/contents/${path}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `Delete game image: ${filename}`,
            sha: fileInfo.sha,
            branch: this.branch,
          }),
        }
      );

      return deleteResponse.ok;
    } catch (error) {
      console.error('GitHub delete error:', error);
      return false;
    }
  }
}

// Cloudinary-based storage (alternative option)
export class CloudinaryImageStorage {
  private cloudName: string;
  private apiKey: string;
  private apiSecret: string;

  constructor(cloudName: string, apiKey: string, apiSecret: string) {
    this.cloudName = cloudName;
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  async uploadImage(filename: string, buffer: Buffer): Promise<string> {
    const formData = new FormData();
    formData.append('file', new Blob([buffer]));
    formData.append('upload_preset', 'game_images');
    formData.append('public_id', filename.replace(/\.[^/.]+$/, ''));

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Cloudinary upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  }
}

// Configure multer for memory storage (no local files)
export const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF and WebP images are allowed.'));
    }
  },
});

// Cloud upload endpoint
export async function handleCloudImageUpload(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const filename = `game-icon-${Date.now()}-${Math.round(Math.random() * 1E9)}${getFileExtension(req.file.originalname)}`;
    
    // Try GitHub storage first
    const githubToken = process.env.GITHUB_TOKEN;
    const githubOwner = process.env.GITHUB_OWNER || 'ProloyMitra';
    const githubRepo = process.env.GITHUB_REPO || 'playinmo-images';

    if (githubToken) {
      try {
        const githubStorage = new GitHubImageStorage(githubOwner, githubRepo, githubToken);
        const imageUrl = await githubStorage.uploadImage(filename, req.file.buffer);
        
        console.log(`Image uploaded to GitHub: ${imageUrl}`);
        return res.status(200).json({
          message: 'Image uploaded successfully to GitHub',
          imageUrl,
          filename,
          storage: 'github'
        });
      } catch (githubError) {
        console.error('GitHub upload failed, trying fallback:', githubError);
      }
    }

    // Fallback to Cloudinary
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudName && apiKey && apiSecret) {
      try {
        const cloudinaryStorage = new CloudinaryImageStorage(cloudName, apiKey, apiSecret);
        const imageUrl = await cloudinaryStorage.uploadImage(filename, req.file.buffer);
        
        console.log(`Image uploaded to Cloudinary: ${imageUrl}`);
        return res.status(200).json({
          message: 'Image uploaded successfully to Cloudinary',
          imageUrl,
          filename,
          storage: 'cloudinary'
        });
      } catch (cloudinaryError) {
        console.error('Cloudinary upload failed:', cloudinaryError);
      }
    }

    // Final fallback - base64 data URL
    const base64 = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;
    const dataUrl = `data:${mimeType};base64,${base64}`;
    
    console.log('Using base64 fallback for image storage');
    return res.status(200).json({
      message: 'Image stored as base64 data URL',
      imageUrl: dataUrl,
      filename,
      storage: 'base64'
    });

  } catch (error) {
    console.error('Cloud image upload error:', error);
    res.status(500).json({ message: 'Failed to upload image' });
  }
}

function getFileExtension(filename: string): string {
  return filename.substring(filename.lastIndexOf('.'));
}
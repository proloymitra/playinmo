import { dbStorage } from './dbStorage';

// GitHub API configuration
const GITHUB_API = 'https://api.github.com';
const REPO_OWNER = 'playinmo';
const REPO_NAME = 'game-images';
const BRANCH = 'main';

export async function createGitHubRepo() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable is required');
  }

  try {
    // Check if repo already exists
    const checkResponse = await fetch(`${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (checkResponse.ok) {
      console.log('Repository already exists');
      return true;
    }

    // Create new repository
    const createResponse = await fetch(`${GITHUB_API}/user/repos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: REPO_NAME,
        description: 'PlayinMO game images storage',
        public: true,
        auto_init: true,
      }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      throw new Error(`Failed to create repository: ${error}`);
    }

    console.log('Repository created successfully');
    return true;
  } catch (error) {
    console.error('Error managing GitHub repository:', error);
    throw error;
  }
}

export async function uploadImageToGitHub(filename: string, imageBuffer: Buffer): Promise<string> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable is required');
  }

  const path = `images/${filename}`;
  const content = imageBuffer.toString('base64');

  try {
    // Check if file exists
    const existsResponse = await fetch(
      `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
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
      `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Upload game image: ${filename}`,
          content: content,
          branch: BRANCH,
          ...(sha && { sha }),
        }),
      }
    );

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      throw new Error(`GitHub upload failed: ${error}`);
    }

    const result = await uploadResponse.json();
    const downloadUrl = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/images/${filename}`;
    
    console.log(`Uploaded ${filename} to GitHub: ${downloadUrl}`);
    return downloadUrl;
  } catch (error) {
    console.error('GitHub upload error:', error);
    throw error;
  }
}

export async function downloadAndUploadFromGoogleDrive() {
  console.log('Starting Google Drive to GitHub migration...');
  
  // Game mappings with Google Drive file IDs
  const gameMappings = [
    { id: 9, title: 'Snakes Adventure', fileId: '1WUS9LYBTzepUbXejWPc2kZv_0-TrCHI', ext: '.png' },
    { id: 10, title: '3D Hangman', fileId: '1OVLTYysrvt6-Wu_mKMTKLPW1O_K6YPX', ext: '.png' },
    { id: 12, title: 'Pacman', fileId: '1yJcfJgfTyDI1snLsbvLE6lep0DyKmeK', ext: '.png' },
    { id: 14, title: 'HexGL', fileId: '1ZpiL2b8H7W6yRK43jPY0ha1aMT7egf', ext: '.png' },
    { id: 19, title: 'Hextris', fileId: '1xQkv4vShyBhk8hwdDyWVQZhNyJuneKtv', ext: '.png' },
    { id: 23, title: 'Mine Sweeper', fileId: '1ASoeiPWJCXwIXeqTUOGF_4pZqbGGNhKT', ext: '.png' },
    { id: 24, title: 'Untangle', fileId: '1mVBMbbFLukWfa-BIIXS-oe8s_WYs4W3S', ext: '.png' },
    { id: 25, title: 'Crazy Racing', fileId: '1JIHbWyeF6F7e0drO0p-ZunoWLRW-WeQg', ext: '.png' },
    { id: 27, title: '2048', fileId: '1JARm-uo3q0LwK-mSvAo7SXXX25qF1DJ', ext: '.png' },
    { id: 28, title: 'Space Shield Defence', fileId: '1OorIE-Kw_zu_PkYi04CYqkv6cmuPtGt_l', ext: '.png' },
    { id: 29, title: 'Gem Crush Saga', fileId: '1z1A1QKf0pdGDJa3QBb-wlMbiIXCWdlfOb', ext: '.png' },
    { id: 31, title: 'Word Weaver', fileId: '1okxryeXOB77-n6Lwus41sFdqeQLR8uS', ext: '.png' },
  ];

  const results = [];
  
  // Ensure repository exists
  await createGitHubRepo();
  
  for (const game of gameMappings) {
    try {
      // Download from Google Drive
      const driveUrl = `https://drive.google.com/uc?export=download&id=${game.fileId}`;
      console.log(`Downloading ${game.title} from Google Drive...`);
      
      const response = await fetch(driveUrl);
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);
      
      // Generate filename
      const filename = `${game.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}${game.ext}`;
      
      // Upload to GitHub
      const githubUrl = await uploadImageToGitHub(filename, imageBuffer);
      
      // Update database
      await dbStorage.updateGame(game.id, { imageUrl: githubUrl });
      
      results.push({
        gameId: game.id,
        title: game.title,
        status: 'success',
        url: githubUrl,
      });
      
      console.log(`✓ Migrated ${game.title} to GitHub`);
      
    } catch (error) {
      console.error(`✗ Failed to migrate ${game.title}:`, error);
      results.push({
        gameId: game.id,
        title: game.title,
        status: 'failed',
        error: error.message,
      });
    }
  }
  
  const successful = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'failed').length;
  
  console.log(`Migration complete: ${successful} successful, ${failed} failed`);
  return { results, summary: { successful, failed } };
}
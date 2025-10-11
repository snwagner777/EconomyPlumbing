import { DatabaseStorage } from './server/storage';
import { createBeforeAfterComposite } from './server/lib/beforeAfterComposer';
import { ObjectStorageService } from './server/objectStorage';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs/promises';

async function testApproval() {
  const storage = new DatabaseStorage();
  const storyId = '2b3cd294-cee3-4510-95ad-035b23660d41'; // Tom Thorp
  
  console.log('Testing approval process...\n');
  
  // Get the story
  const allStories = await storage.getAllSuccessStories();
  const story = allStories.find(s => s.id === storyId);
  if (!story) {
    console.log('Story not found!');
    return;
  }
  
  console.log('Story found:', story.customerName);
  console.log('Before photo:', story.beforePhotoUrl);
  console.log('After photo:', story.afterPhotoUrl);
  
  // Create collage
  console.log('\n1. Creating collage...');
  const tmpDir = os.tmpdir();
  const filename = `success_story_${storyId}_${Date.now()}.webp`;
  const tmpOutputPath = path.join(tmpDir, filename);
  
  await createBeforeAfterComposite(
    story.beforePhotoUrl,
    story.afterPhotoUrl,
    tmpOutputPath
  );
  
  console.log('✅ Collage created:', tmpOutputPath);
  
  // Upload to object storage
  console.log('\n2. Uploading to object storage...');
  const objectStorageService = new ObjectStorageService();
  const publicSearchPaths = objectStorageService.getPublicObjectSearchPaths();
  const publicPath = publicSearchPaths[0];
  
  const collageBuffer = await fs.readFile(tmpOutputPath);
  const objectStoragePath = `${publicPath}/success_stories/${filename}`;
  
  await objectStorageService.uploadBuffer(
    collageBuffer,
    objectStoragePath,
    'image/webp'
  );
  
  console.log('✅ Uploaded to:', objectStoragePath);
  
  // Clean up
  await fs.unlink(tmpOutputPath).catch(() => {});
  
  // Approve the story
  console.log('\n3. Approving story...');
  const approvedStory = await storage.approveSuccessStory(storyId, objectStoragePath);
  
  console.log('✅ Story approved!');
  console.log('Collage URL:', approvedStory.collagePhotoUrl);
  console.log('Approved:', approvedStory.approved);
  
  // Verify
  console.log('\n4. Verifying...');
  const allStoriesAfter = await storage.getAllSuccessStories();
  const verifyStory = allStoriesAfter.find(s => s.id === storyId);
  console.log('Database shows:');
  console.log('  Approved:', verifyStory?.approved);
  console.log('  Collage URL:', verifyStory?.collagePhotoUrl);
  
  // Download and verify the collage
  if (verifyStory?.collagePhotoUrl) {
    console.log('\n5. Downloading and verifying collage...');
    const collageBuffer = await objectStorageService.downloadBuffer(verifyStory.collagePhotoUrl);
    if (collageBuffer) {
      console.log(`✅ Collage accessible: ${collageBuffer.length} bytes`);
      await fs.writeFile('/tmp/final-collage.webp', collageBuffer);
      console.log('Saved to: /tmp/final-collage.webp');
    } else {
      console.log('❌ Could not download collage from:', verifyStory.collagePhotoUrl);
    }
  }
}

testApproval().catch(console.error);

import { ObjectStorageService } from './server/objectStorage';
import { createBeforeAfterComposite } from './server/lib/beforeAfterComposer';
import * as path from 'path';
import * as os from 'os';

async function testCollage() {
  const beforeUrl = '/replit-objstore-d3381c71-f557-457f-9913-e7cf7dce4d30/.private/success_stories/before_1760166827126.webp';
  const afterUrl = '/replit-objstore-d3381c71-f557-457f-9913-e7cf7dce4d30/.private/success_stories/after_1760166827126.webp';
  
  console.log('Testing collage generation for Tom Thorp story...');
  console.log('Before URL:', beforeUrl);
  console.log('After URL:', afterUrl);
  
  // Test downloading
  const objectStorageService = new ObjectStorageService();
  
  console.log('\n1. Testing download of before image...');
  const beforeBuffer = await objectStorageService.downloadBuffer(beforeUrl);
  if (beforeBuffer) {
    console.log(`✅ Before image downloaded: ${beforeBuffer.length} bytes`);
  } else {
    console.log('❌ Before image download failed');
    return;
  }
  
  console.log('\n2. Testing download of after image...');
  const afterBuffer = await objectStorageService.downloadBuffer(afterUrl);
  if (afterBuffer) {
    console.log(`✅ After image downloaded: ${afterBuffer.length} bytes`);
  } else {
    console.log('❌ After image download failed');
    return;
  }
  
  // Test collage creation
  console.log('\n3. Testing collage creation...');
  const tmpDir = os.tmpdir();
  const outputPath = path.join(tmpDir, 'test-collage.webp');
  
  try {
    await createBeforeAfterComposite(beforeUrl, afterUrl, outputPath);
    console.log(`✅ Collage created successfully: ${outputPath}`);
    
    // Check file size
    const fs = await import('fs/promises');
    const stats = await fs.stat(outputPath);
    console.log(`   File size: ${stats.size} bytes`);
    
    if (stats.size < 1000) {
      console.log('⚠️  WARNING: File size is very small, might be blank/corrupted');
    }
  } catch (error) {
    console.log('❌ Collage creation failed:', error);
  }
}

testCollage().catch(console.error);

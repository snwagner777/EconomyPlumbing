import sharp from 'sharp';

async function main() {
  try {
    await sharp('client/public/commercial-logos/dennys-temp.png')
      .resize(400, 200, { fit: 'inside', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .webp({ quality: 90 })
      .toFile('client/public/commercial-logos/dennys.webp');
    console.log('✅ Denny\'s converted');

    await sharp('client/public/commercial-logos/dollar-general-temp.png')
      .resize(400, 200, { fit: 'inside', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .webp({ quality: 90 })
      .toFile('client/public/commercial-logos/dollar-general.webp');
    console.log('✅ Dollar General converted');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function compressImage(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    const compressedBuffer = await sharp(buffer)
      .resize(1200, 630, { fit: 'cover' })
      .jpeg({ quality: 70 })
      .toBuffer();
    
    fs.writeFileSync(filePath, compressedBuffer);
    console.log(`Successfully compressed ${filePath}`);
  } catch (error) {
    console.error(`Error compressing ${filePath}:`, error);
  }
}

async function main() {
  await compressImage(path.join(__dirname, 'app', 'opengraph-image.jpeg'));
  await compressImage(path.join(__dirname, 'app', 'twitter-image.jpeg'));
}

main();

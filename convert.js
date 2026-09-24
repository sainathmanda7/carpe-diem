const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Update these paths based on where your images actually live (e.g., ./public/frames)
const inputDir = './public/frames';
const outputDir = './public/frames_optimized';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.readdirSync(inputDir).forEach(file => {
  if (file.match(/\.(png|jpg|jpeg)$/i)) {
    const inputFile = path.join(inputDir, file);
    // Changes ezgif-frame-001.jpg/png to ezgif-frame-001.webp
    const outputFile = path.join(outputDir, file.replace(/\.[^/.]+$/, ".webp")); 

    sharp(inputFile)
      .resize({ width: 1920, withoutEnlargement: true }) // Prevents upscaling
      .webp({ quality: 80, effort: 4 }) // Highly optimized webp compression
      .toFile(outputFile)
      .then(() => console.log(`Optimized: ${outputFile}`))
      .catch(err => console.error(`Error on ${file}:`, err));
  }
});
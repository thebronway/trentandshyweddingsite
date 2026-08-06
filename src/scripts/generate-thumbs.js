import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const isProd = process.env.NODE_ENV === 'production';
const baseDir = isProd ? 'dist/client/images' : 'public/images';

const dirs = [
  `${baseDir}/engagement`,
  `${baseDir}/wedding`,
  `${baseDir}/camping`
];

const generateThumbnails = async () => {
  for (const dir of dirs) {
    const fullDirPath = path.join(process.cwd(), dir);
    const thumbsDirPath = path.join(fullDirPath, 'thumbs');

    // Skip if the gallery directory doesn't exist yet
    if (!fs.existsSync(fullDirPath)) continue;

    // Create the thumbs directory if it doesn't exist
    if (!fs.existsSync(thumbsDirPath)) {
      fs.mkdirSync(thumbsDirPath, { recursive: true });
    }

    const files = fs.readdirSync(fullDirPath);

    for (const file of files) {
      // Only process image files, ignore folders or text files
      if (!/\.(jpg|jpeg|png|webp|gif)$/i.test(file)) continue;

      const inputPath = path.join(fullDirPath, file);
      const outputPath = path.join(thumbsDirPath, file);

      // Skip this file if the thumbnail already exists (saves build time)
      if (fs.existsSync(outputPath)) continue;

      try {
        console.log(`Generating thumbnail for ${file}...`);
        await sharp(inputPath)
          .rotate()               // Auto-rotates based on EXIF data so vertical photos stay vertical
          .resize({ width: 800 }) // Doubled the resolution for sharper grids
          .webp({ quality: 90 })  // Bumped quality to 90
          .toFile(outputPath);
      } catch (err) {
        console.error(`Error processing ${file}:`, err);
      }
    }
  }
  console.log('Thumbnail generation complete!');
};

generateThumbnails();
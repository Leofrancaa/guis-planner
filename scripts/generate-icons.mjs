import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Use the Guis photo as the PWA icon source
const srcPath = join(__dirname, '../public/unnamed.png');

const sizes = [
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

for (const { name, size } of sizes) {
  const out = join(__dirname, '../public', name);
  await sharp(srcPath)
    .resize(size, size, { fit: 'cover' })
    .png()
    .toFile(out);
  console.log(`✓ ${name} (${size}x${size})`);
}

// favicon
await sharp(srcPath).resize(32, 32, { fit: 'cover' }).png().toFile(
  join(__dirname, '../src/app/favicon.ico')
);
console.log('✓ favicon.ico');

console.log('All icons generated!');

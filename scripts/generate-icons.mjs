import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(projectRoot, 'src/assets/icon.svg');
const outputDirectory = path.join(projectRoot, 'public/icons');

await mkdir(outputDirectory, { recursive: true });

await Promise.all([
  sharp(source)
    .resize(192, 192)
    .png()
    .toFile(path.join(outputDirectory, 'icon-192.png')),
  sharp(source)
    .resize(512, 512)
    .png()
    .toFile(path.join(outputDirectory, 'icon-512.png')),
  sharp(source)
    .resize(332, 332)
    .extend({
      top: 90,
      right: 90,
      bottom: 90,
      left: 90,
      background: '#b9384f',
    })
    .png()
    .toFile(path.join(outputDirectory, 'icon-maskable-512.png')),
]);

console.log(`Generated PWA icons in ${outputDirectory}`);

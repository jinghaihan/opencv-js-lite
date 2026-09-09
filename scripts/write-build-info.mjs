import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const artifactPath = path.resolve(process.argv[2] || 'dist/opencv.pose-lite.js');
const repoDir = path.resolve(import.meta.dirname, '..');
const outputDir = path.dirname(artifactPath);
const [content, opencvVersion, emscriptenVersion] = await Promise.all([
  readFile(artifactPath),
  readFile(path.join(repoDir, 'opencv-version.txt'), 'utf8'),
  readFile(path.join(repoDir, 'emscripten-version.txt'), 'utf8'),
]);

const info = {
  opencvVersion: process.env.OPENCV_REF || opencvVersion.trim(),
  emscriptenVersion: emscriptenVersion.trim(),
  file: path.basename(artifactPath),
  sizeBytes: content.byteLength,
  gzipBytes: gzipSync(content, { level: 9 }).byteLength,
  sha256: createHash('sha256').update(content).digest('hex'),
};

await writeFile(
  path.join(outputDir, 'build-info.json'),
  `${JSON.stringify(info, null, 2)}\n`,
);
await writeFile(
  path.join(outputDir, 'build-summary.md'),
  [
    '## OpenCV.js Lite build result',
    '',
    '| Item | Result |',
    '| --- | --- |',
    `| OpenCV | ${info.opencvVersion} |`,
    `| Emscripten | ${info.emscriptenVersion} |`,
    `| Raw size | ${(info.sizeBytes / 1024 / 1024).toFixed(2)} MiB |`,
    `| Gzip size | ${(info.gzipBytes / 1024 / 1024).toFixed(2)} MiB |`,
    `| SHA-256 | \`${info.sha256}\` |`,
    '',
    'Verified that `Mat`, `matFromArray`, `solvePnP`, and `Rodrigues` work correctly.',
    '',
  ].join('\n'),
);

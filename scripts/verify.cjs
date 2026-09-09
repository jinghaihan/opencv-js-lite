const path = require('node:path');
const fs = require('node:fs');

const MAX_ARTIFACT_BYTES = 3_000_000;

async function loadOpenCv(artifactPath) {
  const exported = require(artifactPath);
  const candidate = exported?.default ?? exported;
  return typeof candidate === 'function' ? candidate() : candidate;
}

async function main() {
  const artifactPath = path.resolve(
    process.argv[2] || 'dist/opencv.pose-lite.js',
  );
  const sizeBytes = fs.statSync(artifactPath).size;
  if (sizeBytes > MAX_ARTIFACT_BYTES) {
    throw new Error(`Artifact exceeds 3 MB: ${sizeBytes} bytes`);
  }

  const cv = await loadOpenCv(artifactPath);
  const requiredApi = ['Mat', 'matFromArray', 'solvePnP', 'Rodrigues'];
  for (const name of requiredApi) {
    if (typeof cv[name] !== 'function') {
      throw new Error(`Required API is missing: cv.${name}`);
    }
  }

  const excludedApi = ['cvtColor', 'readNetFromONNX', 'warpPerspective'];
  for (const name of excludedApi) {
    if (typeof cv[name] !== 'undefined') {
      throw new Error(`Excluded API is still exported: cv.${name}`);
    }
  }

  const objectPointsArray = [
    -1, -1, 0,
    1, -1, 0,
    1, 1, 0,
    -1, 1, 0,
    0, 0, 1,
    0.5, -0.5, 2,
  ];
  const fx = 800;
  const fy = 800;
  const cx = 320;
  const cy = 240;
  const expectedTranslationZ = 8;
  const imagePointsArray = [];

  for (let index = 0; index < objectPointsArray.length; index += 3) {
    const x = objectPointsArray[index];
    const y = objectPointsArray[index + 1];
    const z = objectPointsArray[index + 2] + expectedTranslationZ;
    imagePointsArray.push(fx * x / z + cx, fy * y / z + cy);
  }

  const mats = [
    cv.matFromArray(6, 3, cv.CV_64FC1, objectPointsArray),
    cv.matFromArray(6, 2, cv.CV_64FC1, imagePointsArray),
    cv.matFromArray(3, 3, cv.CV_64FC1, [
      fx, 0, cx,
      0, fy, cy,
      0, 0, 1,
    ]),
    cv.matFromArray(4, 1, cv.CV_64FC1, [0, 0, 0, 0]),
    new cv.Mat(),
    new cv.Mat(),
    new cv.Mat(),
  ];

  const [objectPoints, imagePoints, cameraMatrix, distortion] = mats;
  const rotationVector = mats[4];
  const translationVector = mats[5];
  const rotationMatrix = mats[6];

  try {
    const solved = cv.solvePnP(
      objectPoints,
      imagePoints,
      cameraMatrix,
      distortion,
      rotationVector,
      translationVector,
    );
    cv.Rodrigues(rotationVector, rotationMatrix);

    const translationZ = translationVector.data64F[2];
    if (!solved || Math.abs(translationZ - expectedTranslationZ) > 0.01) {
      throw new Error(`Unexpected pose result: translationZ=${translationZ}`);
    }

    console.log(JSON.stringify({
      solved,
      sizeBytes,
      translationZ,
      requiredApi,
      excludedApi,
    }, null, 2));
  }
  finally {
    mats.forEach(mat => mat.delete());
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

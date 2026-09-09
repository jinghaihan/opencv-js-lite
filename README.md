# opencv-js-lite

Custom OpenCV.js build for converting PC-side facial landmarks into head pose and normal vectors.

The current build only exports:

- `cv.Mat`
- `cv.matFromArray`
- `cv.solvePnP`
- `cv.Rodrigues`
- `cv.CV_64FC1`
- `cv.SOLVEPNP_ITERATIVE`

It excludes APIs that the current architecture does not need, including `cvtColor`,
`warpPerspective`, and DNN. The verified single-file build using OpenCV 5.0.0 and
Emscripten 4.0.20 is approximately 2.1 MB, compared with approximately 13.3 MB
for the full build.

## GitHub Actions build

The `Build OpenCV.js Lite` workflow:

1. Reads `opencv-version.txt` and `emscripten-version.txt`.
2. Downloads the matching OpenCV and Emscripten sources.
3. Applies the compatibility adjustment in `scripts/patch-opencv.py`.
4. Restricts JavaScript exports with `config/pose.config.py`.
5. Runs `solvePnP` and `Rodrigues` in Node.js.
6. Verifies that excluded APIs are absent and that the artifact is below 3 MB.
7. Uploads an `opencv-js-lite-<OpenCV version>` artifact containing the JavaScript
   file, its SHA-256 checksum, and the build report.

Pushing a build configuration change triggers CI. The workflow can also be run
manually with an OpenCV ref without changing the version file first.

## Upgrading OpenCV

Update `opencv-version.txt` and push the change. If upstream source structure has
changed, the compatibility script fails explicitly so that the JavaScript bindings
and numerical verification can be reviewed before updating the adjustment.

## Local build

Install and activate the Emscripten version listed in `emscripten-version.txt`,
and ensure that `$EMSDK` is available:

```bash
./scripts/build.sh
node ./scripts/verify.cjs ./dist/opencv.pose-lite.js
node ./scripts/write-build-info.mjs ./dist/opencv.pose-lite.js
```

Build output is written to `dist/`.

## License

The build scripts in this repository are licensed under the MIT License. Generated
OpenCV.js artifacts remain subject to OpenCV's upstream Apache License 2.0.

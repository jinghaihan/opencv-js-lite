#!/usr/bin/env bash

set -euo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
opencv_ref="${1:-$(tr -d '[:space:]' < "${repo_dir}/opencv-version.txt")}"
emscripten_dir="${EMSCRIPTEN:-${EMSDK:-}/upstream/emscripten}"

if [[ -z "${emscripten_dir}" || ! -f "${emscripten_dir}/cmake/Modules/Platform/Emscripten.cmake" ]]; then
  echo 'Emscripten is not active. Source emsdk_env.sh or set EMSCRIPTEN.' >&2
  exit 1
fi

work_dir="$(mktemp -d "${TMPDIR:-/tmp}/opencv-js-lite.XXXXXX")"
trap 'rm -rf "${work_dir}"' EXIT

source_dir="${work_dir}/opencv"
build_dir="${work_dir}/build"
dist_dir="${repo_dir}/dist"

git init "${source_dir}"
git -C "${source_dir}" remote add origin https://github.com/opencv/opencv.git
git -C "${source_dir}" fetch --filter=blob:none --depth 1 origin "${opencv_ref}"
git -C "${source_dir}" checkout --detach FETCH_HEAD
python3 "${repo_dir}/scripts/patch-opencv.py" "${source_dir}"

python3 "${source_dir}/platforms/js/build_js.py" "${build_dir}" \
  --opencv_dir "${source_dir}" \
  --emscripten_dir "${emscripten_dir}" \
  --build_wasm \
  --config "${repo_dir}/config/pose.config.py" \
  --cmake_option=-DBUILD_LIST=core,geometry,js \
  --cmake_option=-DBUILD_EXAMPLES=OFF \
  --cmake_option=-DBUILD_TESTS=OFF \
  --cmake_option=-DBUILD_PERF_TESTS=OFF

mkdir -p "${dist_dir}"
cp "${build_dir}/bin/opencv_js.js" "${dist_dir}/opencv.pose-lite.js"
if command -v sha256sum >/dev/null 2>&1; then
  sha256sum "${dist_dir}/opencv.pose-lite.js" > "${dist_dir}/opencv.pose-lite.js.sha256"
else
  shasum -a 256 "${dist_dir}/opencv.pose-lite.js" > "${dist_dir}/opencv.pose-lite.js.sha256"
fi

echo "OpenCV.js Lite built: ${dist_dir}/opencv.pose-lite.js"

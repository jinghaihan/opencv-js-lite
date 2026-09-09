#!/usr/bin/env python3

"""Guard the imgproc namespace when OpenCV 5.0 builds only core and geometry."""

import pathlib
import sys


source_root = pathlib.Path(sys.argv[1]).resolve()
target = source_root / 'modules/js/src/core_bindings.cpp'
content = target.read_text(encoding='utf-8')
guarded = """#ifdef HAVE_OPENCV_IMGPROC
using namespace cv::segmentation;  // FIXIT
#endif"""

if guarded in content:
    print('The upstream source already guards the imgproc namespace.')
    raise SystemExit(0)

original = 'using namespace cv::segmentation;  // FIXIT'
if content.count(original) != 1:
    raise RuntimeError(
        'The core_bindings.cpp structure changed; review the new OpenCV JS bindings.'
    )

target.write_text(content.replace(original, guarded), encoding='utf-8')
print('Applied the imgproc namespace guard to core_bindings.cpp.')

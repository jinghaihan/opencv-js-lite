# Export only the OpenCV APIs needed to convert facial landmarks into head pose and normal vectors.
pose = {
    '': [
        'Rodrigues',
        'solvePnP',
    ],
}

white_list = makeWhiteList([pose])

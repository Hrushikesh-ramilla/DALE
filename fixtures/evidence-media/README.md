# Synthetic media fixtures

`synthetic.mp4` and `synthetic.webm` are 0.4-second gray 32×32 videos generated locally with FFmpeg. They test container/type validation, private upload/download, hash integrity and exclusion from the image-model payload. They depict no actual product, damage, shipment or physical capture; they are not independent claim evidence.

Generation: FFmpeg `color=c=gray:s=32x32:r=5`, duration `0.4`, without audio; H.264/yuv420p/faststart for MP4 and VP9 for WebM.

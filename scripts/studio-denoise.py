"""Denoise a Cycles light map with Blender's bundled Intel Open Image Denoise."""
import ctypes
import json
import math
import struct
import zlib
from pathlib import Path

import bpy
import numpy as np

def denoise_lightmap(image, destination):
    width, height = image.size
    rgba = np.empty(width * height * 4, dtype=np.float32)
    image.pixels.foreach_get(rgba)
    rgba = rgba.reshape(height, width, 4)
    np.savez_compressed(Path(destination).with_suffix('.npz'), pixels=rgba)
    color = np.ascontiguousarray(rgba[:, :, :3])
    output = np.empty_like(color)
    library_dir = Path(bpy.app.binary_path).parent / 'blender.shared'
    library = ctypes.CDLL(str(library_dir / 'OpenImageDenoise.dll'))
    ptr = ctypes.c_void_p
    library.oidnNewDevice.argtypes = [ctypes.c_int]
    library.oidnNewDevice.restype = ptr
    library.oidnCommitDevice.argtypes = [ptr]
    library.oidnNewFilter.argtypes = [ptr, ctypes.c_char_p]
    library.oidnNewFilter.restype = ptr
    library.oidnSetSharedFilterImage.argtypes = [ptr, ctypes.c_char_p, ptr, ctypes.c_int, ctypes.c_size_t, ctypes.c_size_t, ctypes.c_size_t, ctypes.c_size_t, ctypes.c_size_t]
    library.oidnSetFilterBool.argtypes = [ptr, ctypes.c_char_p, ctypes.c_bool]
    library.oidnCommitFilter.argtypes = [ptr]
    library.oidnExecuteFilter.argtypes = [ptr]
    library.oidnReleaseFilter.argtypes = [ptr]
    library.oidnReleaseDevice.argtypes = [ptr]
    library.oidnGetDeviceError.argtypes = [ptr, ctypes.POINTER(ctypes.c_char_p)]
    library.oidnGetDeviceError.restype = ctypes.c_int
    device = library.oidnNewDevice(1)  # CPU; avoid competing with the Cycles GPU allocation.
    library.oidnCommitDevice(device)
    # Blender's bundled OIDN build includes the general RT HDR filter, not
    # necessarily the separately trained RTLightmap weights.
    filter_handle = library.oidnNewFilter(device, b'RT')
    for name, array in [(b'color', color), (b'output', output)]:
        library.oidnSetSharedFilterImage(filter_handle, name, array.ctypes.data, 3, width, height, 0, 12, width * 12)
    library.oidnSetFilterBool(filter_handle, b'hdr', True)
    library.oidnCommitFilter(filter_handle)
    library.oidnExecuteFilter(filter_handle)
    message = ctypes.c_char_p()
    error = library.oidnGetDeviceError(device, ctypes.byref(message))
    error_message = message.value.decode('utf-8', errors='replace') if message.value else str(error)
    library.oidnReleaseFilter(filter_handle)
    library.oidnReleaseDevice(device)
    if error:
        raise RuntimeError('OIDN: ' + error_message)
    output = np.maximum(np.nan_to_num(output), 0)
    # Ignore tiny firefly/hotspot outliers when choosing the shared HDR range.
    # Otherwise one bright cord can quantise the entire wall into visible bands.
    gain = max(1, math.ceil(float(np.quantile(output, .999)) * 1.03))
    # Explicit scene-linear -> sRGB encoding avoids ambiguities in image.save().
    rgb = np.clip(output / gain, 0, 1)
    rgb = np.where(rgb <= .0031308, rgb * 12.92, 1.055 * np.power(rgb, 1 / 2.4) - .055)
    dither = np.random.default_rng(73).uniform(-.5, .5, rgb.shape)
    pixels = np.flipud(np.clip(np.rint(rgb * 255 + dither), 0, 255).astype(np.uint8))
    scanlines = b''.join(b'\0' + row.tobytes() for row in pixels)
    def chunk(kind, data):
        return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data) & 0xffffffff)
    png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(scanlines, 7)) + chunk(b'IEND', b'')
    Path(destination).write_bytes(png)
    print('STUDIO: denoised', destination, 'HDR gain', gain, flush=True)
    return gain

if __name__ == '__main__':
    import sys
    art_dir = Path(sys.argv[sys.argv.index('--') + 1])
    gains = {}
    for name in ['architecture', 'desk']:
        rgba = np.load(art_dir / (name + '-diffuse.npz'))['pixels']
        height, width, _ = rgba.shape
        image = bpy.data.images.new(name, width, height, alpha=False, float_buffer=True)
        image.pixels.foreach_set(rgba.ravel())
        gains[name] = denoise_lightmap(image, art_dir / (name + '-diffuse.png'))
    (art_dir / 'bake-manifest.json').write_text(json.dumps(gains))

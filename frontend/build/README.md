# Build Resources

Place an `icon.png` file (512x512 or 256x256 PNG) in this directory for the Windows installer icon.

For now, electron-builder will use a default icon if none is provided.

## To generate a proper .ico from PNG:
1. Place a 512x512 `icon.png` here
2. electron-builder will automatically convert it for Windows

## Quick build commands:
```bash
cd frontend
npm install
npm run dist          # Creates NSIS installer (.exe setup) in release/
npm run electron:build:portable  # Creates portable single .exe
```

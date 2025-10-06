# Brand Asset Workflow

This document explains how to (re)generate the app icon, Android adaptive icon foreground, splash image, and favicon without changing any build configuration.

What this does
- Recreates these files in-place under `assets/`:
  - `assets/icon.png`
  - `assets/adaptive-icon.png`
  - `assets/splash.png`
  - `assets/favicon.png`
- Keeps `app.json` paths unchanged, so existing build pipelines keep working.

Prerequisites
- Python 3.10+
- Pillow imaging library

Windows (cmd.exe) quickstart
1) Install Pillow (one-time):
   pip install pillow
2) Run the generator from the repo root:
   python tools/generate_brand_assets.py

Notes
- The generator is deterministic: running it again will overwrite the same files with the same design/colors.
- If you want to tweak colors or layout, update constants near the top of `tools/generate_brand_assets.py` and re-run.
- For Android’s adaptive icon, we generate a single `assets/adaptive-icon.png` as the foreground image. Background color is controlled via app.json (`android.adaptiveIcon.backgroundColor`).
- After regeneration, perform a quick visual smoke test on both platforms (emulator/simulator) and check:
  - Icon edges look crisp at different sizes.
  - Splash scales well on various aspect ratios.
  - Dark/light mode app backgrounds transition cleanly around the splash.

Troubleshooting
- If you see any caching artifacts in a dev build, clear the Metro cache and rerun the app. In EAS builds, assets are picked up automatically on the next build.
- If Pillow is missing, install it as shown above.

Change history
- 2025-10-06: Initial addition of generator and refreshed assets.

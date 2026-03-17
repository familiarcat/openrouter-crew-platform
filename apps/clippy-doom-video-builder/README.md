# Clippy Doom Video Builder

This app is the monorepo home for the Zantigo Clippy Doom project.

It combines:

- the imported Zantigo source bundle and assets
- the monorepo-aware creative pipeline runner
- crew webhook mapping and run-memory storage

## Entry Points

From the repo root:

```bash
pnpm clippy
```

Directly:

```bash
cd apps/clippy-doom-video-builder
./build_video.sh
```

## Imported Zantigo Source

The original Zantigo bundle has been merged into this app:

- bundled song assets in `assets/audio/`
- Clippy and background art in `assets/clippy/` and `assets/background/`
- imported AE source scripts in `scripts/ae/`
- imported Python source scripts in `scripts/python/`
- imported wizard flow in `wizard/setup_wizard.py`
- original project README in `README.imported-from-zantigo.md`

Reference event JSON from the imported project is stored in `analysis/reference/`.

## Runtime Notes

The monorepo pipeline uses bundled assets automatically when they are present.

If no valid Doom WAD is available, the pipeline falls back to generated placeholder sprites instead of failing the whole run. The currently imported `assets/wad/freedoom2.wad` is not a valid WAD binary, so it is preserved as source material but not treated as a guaranteed runtime dependency.

Run history is stored in `analysis/pipeline_memory.json`.

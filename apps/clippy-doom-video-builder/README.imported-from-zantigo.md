
# Clippy Doom Procedural Music Video Builder — V44

Final scaffold for an automated Doom‑style music video generator
driven by the song Michael McBurgerking.

-------------------------------------------------
Required files you must provide:

assets/audio/
  Michael_McBurgerking.wav
  Michael_McBurgerking.aiff
  Michael_McBurgerking.mp3

assets/background/
  windows_xp_bliss.jpg

assets/clippy/
  clippy_base.png

-------------------------------------------------
Quick Start

chmod +x build_video.sh
./build_video.sh

-------------------------------------------------
If no WAD file exists the script downloads
Freedoom automatically.


---
# System Architecture

The project generates the video through a procedural pipeline driven by the music.

```
USER ASSETS
   │
   ├── Michael_McBurgerking.wav
   ├── windows_xp_bliss.jpg
   └── clippy_base.png
            │
            ▼
     build_video.sh
            │
            ▼
      Setup Wizard
   wizard/setup_wizard.py
            │
 ┌──────────┼──────────┐
 ▼          ▼          ▼
Freedoom   Audio     Storm
Download   Analysis   System
            │
            ▼
     music_events.json
            │
            ▼
     Demon Spawn System
            │
            ▼
     spawn_events.json
            │
            ▼
   After Effects Scripts
            │
            ▼
     ClippyDoom_Master.aep
            │
            ▼
      Final Render
Michael_McBurgerking_music_video.mp4
```

## Real-Time Visual Systems

The generated composition contains:

```
Sky Layer
 ├── storm intensity
 ├── lightning
 └── hell-sky color shift

Hill Terrain
 └── Windows XP battlefield

Demon Horde
 ├── imp waves
 ├── demon waves
 ├── cacodemon waves
 └── baron elite waves

Combat Effects
 ├── blood particles
 ├── gibs
 └── lightning kills

Clippy Performer
 ├── vocalist
 ├── lip sync
 └── Doom Guy transformation
```

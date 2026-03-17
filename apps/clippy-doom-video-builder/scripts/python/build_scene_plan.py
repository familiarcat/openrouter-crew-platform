#!/usr/bin/env python3
import argparse
import json
import math
from pathlib import Path


def load_json(path_value):
    return json.loads(Path(path_value).read_text(encoding="utf-8"))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--analysis", required=True)
    parser.add_argument("--events", required=True)
    parser.add_argument("--sprites", required=True)
    parser.add_argument("--memory", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    analysis = load_json(args.analysis)
    events_doc = load_json(args.events)
    sprite_doc = load_json(args.sprites)
    memory_doc = load_json(args.memory) if Path(args.memory).exists() else {"runs": []}

    duration = float(analysis.get("duration_seconds", 48.0))
    fps = 12
    events = events_doc.get("events", [])
    sprites = sprite_doc.get("sprites", [])
    if not sprites:
        raise ValueError("No sprites were available for scene planning.")

    previous_runs = memory_doc.get("runs", [])
    prior_render_mode = previous_runs[-1].get("renderMode") if previous_runs else None

    scene_length = 4.0
    scene_count = max(1, math.ceil(duration / scene_length))
    scenes = []
    for index in range(scene_count):
        start = round(index * scene_length, 3)
        end = round(min(duration, start + scene_length), 3)
        window_events = [event for event in events if start <= event.get("time", 0) < end]
        average_intensity = (
            sum(event.get("intensity", 0.5) for event in window_events) / len(window_events)
            if window_events
            else 0.45 + (index % 3) * 0.1
        )
        spawn_count = max(1, min(5, int(round(average_intensity * 5))))

        spawns = []
        for spawn_index in range(spawn_count):
            sprite = sprites[(index + spawn_index) % len(sprites)]
            spawns.append({
                "sprite_name": sprite["name"],
                "sprite_path": sprite["path"],
                "entry_time": round(start + 0.35 * spawn_index, 3),
                "x": 80 + ((index * 91 + spawn_index * 117) % 460),
                "y": 170 + ((spawn_index * 23) % 110),
                "scale": round(0.85 + average_intensity * 0.8 + spawn_index * 0.05, 3),
                "speed": 16 + int(average_intensity * 28) + spawn_index * 4,
                "depth": round(0.45 + spawn_index * 0.12, 3),
            })

        lightning = [round(event["time"], 3) for event in window_events if event.get("intensity", 0) > 0.72][:4]
        camera = {
            "zoom": round(1.0 + average_intensity * 0.32, 3),
            "shake": round(average_intensity * 0.15, 3),
            "pan_x": int((index % 2) * 30 - 15),
        }

        scenes.append({
            "id": f"scene-{index:03d}",
            "start": start,
            "end": end,
            "storm_intensity": round(average_intensity, 3),
            "camera": camera,
            "lightning": lightning,
            "spawns": spawns,
        })

    scene_plan = {
        "mode": analysis.get("mode", "demo"),
        "duration_seconds": duration,
        "frames_per_second": fps,
        "scene_count": len(scenes),
        "prior_render_mode": prior_render_mode,
        "scenes": scenes,
    }

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(scene_plan, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()

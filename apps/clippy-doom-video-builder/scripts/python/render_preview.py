#!/usr/bin/env python3
import argparse
import json
import math
import shutil
import subprocess
from pathlib import Path


def load_json(path_value):
    return json.loads(Path(path_value).read_text(encoding="utf-8"))


def parse_ppm(path_value):
    raw = Path(path_value).read_bytes()
    if not raw.startswith(b"P6"):
        raise ValueError(f"Unsupported sprite format: {path_value}")

    tokens = []
    index = 2
    while len(tokens) < 3 and index < len(raw):
        while index < len(raw) and raw[index] in b" \t\r\n":
            index += 1
        if raw[index:index + 1] == b"#":
            while index < len(raw) and raw[index] != 10:
                index += 1
            continue
        start = index
        while index < len(raw) and raw[index] not in b" \t\r\n":
            index += 1
        tokens.append(raw[start:index].decode("ascii"))
    width, height, max_value = map(int, tokens)
    if max_value != 255:
        raise ValueError("Only 8-bit PPM files are supported.")
    while raw[index] in b" \t\r\n":
        index += 1
    pixel_data = raw[index:index + width * height * 3]
    return width, height, pixel_data


def new_canvas(width, height):
    pixels = bytearray(width * height * 3)
    for y in range(height):
        for x in range(width):
            factor = y / float(height)
            color = [
                int(18 + factor * 25),
                int(20 + factor * 18),
                int(34 + factor * 40),
            ]
            offset = (y * width + x) * 3
            pixels[offset:offset + 3] = bytes(color)
    return pixels


def draw_ground(pixels, width, height):
    for y in range(int(height * 0.72), height):
        for x in range(width):
            offset = (y * width + x) * 3
            pixels[offset:offset + 3] = bytes([44, 24, 18])


def draw_flash(pixels, width, height, strength):
    boost = int(180 * strength)
    for index in range(0, len(pixels), 3):
        pixels[index] = min(255, pixels[index] + boost)
        pixels[index + 1] = min(255, pixels[index + 1] + boost)
        pixels[index + 2] = min(255, pixels[index + 2] + boost)


def paste_sprite(canvas, canvas_width, canvas_height, sprite, x, y, scale):
    sprite_width, sprite_height, sprite_pixels = sprite
    scaled_width = max(1, int(sprite_width * scale))
    scaled_height = max(1, int(sprite_height * scale))

    for target_y in range(scaled_height):
        source_y = min(sprite_height - 1, int(target_y / scale))
        for target_x in range(scaled_width):
            source_x = min(sprite_width - 1, int(target_x / scale))
            source_offset = (source_y * sprite_width + source_x) * 3
            rgb = sprite_pixels[source_offset:source_offset + 3]
            if tuple(rgb) == (255, 0, 255):
                continue

            canvas_x = int(x + target_x)
            canvas_y = int(y + target_y)
            if canvas_x < 0 or canvas_x >= canvas_width or canvas_y < 0 or canvas_y >= canvas_height:
                continue
            target_offset = (canvas_y * canvas_width + canvas_x) * 3
            canvas[target_offset:target_offset + 3] = rgb


def write_ppm(path_value, width, height, pixels):
    with open(path_value, "wb") as handle:
        handle.write(f"P6\n{width} {height}\n255\n".encode("ascii"))
        handle.write(bytes(pixels))


def build_preview_html(frame_files):
    frames = [Path(frame).name for frame in frame_files]
    if not frames:
        return "<html><body><p>No frames generated.</p></body></html>"
    images = "".join(
        [f'<img src="{frame}" style="display:none;width:100%;height:auto;" />' for frame in frames]
    )
    return f"""<!doctype html>
<html>
<body style="margin:0;background:#0d1018;color:#f4f4f4;font-family:Menlo, monospace;">
  <div style="padding:16px;">Clippy Doom Render Preview</div>
  <div id="viewer" style="max-width:960px;margin:0 auto;">{images}</div>
  <script>
    const frames = Array.from(document.querySelectorAll('img'));
    let index = 0;
    function tick() {{
      frames.forEach((frame, frameIndex) => frame.style.display = frameIndex === index ? 'block' : 'none');
      index = (index + 1) % frames.length;
    }}
    tick();
    setInterval(tick, 100);
  </script>
</body>
</html>"""


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--scene-plan", required=True)
    parser.add_argument("--sprites", required=True)
    parser.add_argument("--analysis", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--manifest", required=True)
    args = parser.parse_args()

    scene_plan = load_json(args.scene_plan)
    sprite_doc = load_json(args.sprites)
    analysis = load_json(args.analysis)

    output_dir = Path(args.output_dir)
    frame_dir = output_dir / "frames"
    frame_dir.mkdir(parents=True, exist_ok=True)

    sprite_cache = {}
    for sprite in sprite_doc.get("sprites", []):
        sprite_cache[sprite["name"]] = parse_ppm(sprite["path"])

    width = 640
    height = 360
    fps = int(scene_plan.get("frames_per_second", 12))
    duration = float(scene_plan.get("duration_seconds", 48.0))
    frame_count = max(24, min(96, int(math.ceil(duration * fps))))
    scenes = scene_plan.get("scenes", [])

    frame_files = []
    for frame_index in range(frame_count):
        timestamp = frame_index / float(fps)
        scene = next((scene for scene in scenes if scene["start"] <= timestamp < scene["end"]), scenes[-1] if scenes else None)
        canvas = new_canvas(width, height)
        draw_ground(canvas, width, height)

        if scene:
            for lightning_time in scene.get("lightning", []):
                if abs(timestamp - lightning_time) < 0.08:
                    draw_flash(canvas, width, height, scene.get("storm_intensity", 0.5))

            for spawn in scene.get("spawns", []):
                if timestamp < spawn.get("entry_time", 0):
                    continue
                sprite = sprite_cache.get(spawn["sprite_name"])
                if not sprite:
                    continue
                x = spawn["x"] + (timestamp - spawn["entry_time"]) * spawn.get("speed", 0)
                y = spawn["y"] - (timestamp - spawn["entry_time"]) * 4
                paste_sprite(canvas, width, height, sprite, x, y, spawn.get("scale", 1.0))

        frame_path = frame_dir / f"frame_{frame_index:04d}.ppm"
        write_ppm(frame_path, width, height, canvas)
        frame_files.append(str(frame_path))

    preview_html = build_preview_html(frame_files)
    (output_dir / "index.html").write_text(preview_html, encoding="utf-8")

    ffmpeg_path = shutil.which("ffmpeg")
    output_video = output_dir / "clippy-doom-preview.mp4"
    render_mode = "frame-sequence"
    output_kind = "frame-sequence-preview"
    warnings = []

    if ffmpeg_path:
        completed = subprocess.run(
            [
                ffmpeg_path,
                "-y",
                "-framerate",
                str(fps),
                "-i",
                str(frame_dir / "frame_%04d.ppm"),
                "-pix_fmt",
                "yuv420p",
                str(output_video),
            ],
            capture_output=True,
            text=True,
            timeout=120,
            check=False,
        )
        if completed.returncode == 0:
            render_mode = "ffmpeg"
            output_kind = "video"
        else:
            warnings.append("ffmpeg was detected but video encoding failed. Keeping frame sequence preview.")
    else:
        warnings.append("No ffmpeg or aerender runtime was detected. Created a preview frame sequence instead.")

    manifest = {
        "analysis_mode": analysis.get("mode"),
        "render_mode": render_mode,
        "output_kind": output_kind,
        "output_path": str(output_video if output_kind == "video" else (output_dir / "index.html")),
        "frame_count": frame_count,
        "fps": fps,
        "warnings": warnings,
    }

    manifest_path = Path(args.manifest)
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()

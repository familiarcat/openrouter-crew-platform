#!/usr/bin/env python3
import argparse
import json
import re
import struct
from pathlib import Path


SPRITE_NAME_PATTERN = re.compile(r"^[A-Z0-9]{4}[A-Z][0-8].*")


def write_ppm(path, width, height, pixels):
    with open(path, "wb") as handle:
        handle.write(f"P6\n{width} {height}\n255\n".encode("ascii"))
        handle.write(bytes(pixels))


def generate_demo_sprite(output_dir, name, color):
    width = 48
    height = 48
    pixels = bytearray([255, 0, 255] * width * height)
    for y in range(8, 40):
        for x in range(8, 40):
            dx = x - 24
            dy = y - 24
            if dx * dx + dy * dy < 15 * 15:
                offset = (y * width + x) * 3
                pixels[offset:offset + 3] = bytes(color)
    for eye_x in (18, 30):
        for y in range(18, 22):
            for x in range(eye_x - 2, eye_x + 2):
                offset = (y * width + x) * 3
                pixels[offset:offset + 3] = bytes([255, 255, 255])
    file_path = output_dir / f"{name}.ppm"
    write_ppm(file_path, width, height, pixels)
    return {
        "name": name,
        "width": width,
        "height": height,
        "path": str(file_path),
        "transparent_key": [255, 0, 255],
    }


def parse_palette(lump_bytes):
    if len(lump_bytes) < 768:
        return None
    palette = []
    for index in range(0, 768, 3):
        palette.append(tuple(lump_bytes[index:index + 3]))
    return palette


def decode_patch_image(lump_bytes, palette):
    if len(lump_bytes) < 8:
        return None

    width, height, _, _ = struct.unpack_from("<hhhh", lump_bytes, 0)
    if width <= 0 or height <= 0 or len(lump_bytes) < 8 + width * 4:
        return None

    column_offsets = [
        struct.unpack_from("<I", lump_bytes, 8 + index * 4)[0]
        for index in range(width)
    ]
    transparent = bytes([255, 0, 255])
    pixels = bytearray(transparent * width * height)

    for column, offset in enumerate(column_offsets):
        if offset >= len(lump_bytes):
            continue
        while offset < len(lump_bytes):
            top_delta = lump_bytes[offset]
            if top_delta == 255:
                break
            if offset + 3 >= len(lump_bytes):
                break
            length = lump_bytes[offset + 1]
            offset += 3
            for row in range(length):
                if offset + row >= len(lump_bytes):
                    break
                y = top_delta + row
                if y >= height:
                    continue
                color_index = lump_bytes[offset + row]
                rgb = palette[color_index]
                pixel_offset = (y * width + column) * 3
                pixels[pixel_offset:pixel_offset + 3] = bytes(rgb)
            offset += length + 1

    return width, height, pixels


def extract_from_wad(wad_path, output_dir):
    wad_bytes = Path(wad_path).read_bytes()
    if len(wad_bytes) < 12:
        raise ValueError("WAD file is too small to parse.")

    signature, lump_count, directory_offset = struct.unpack_from("<4sii", wad_bytes, 0)
    if signature not in (b"IWAD", b"PWAD"):
        raise ValueError("Input file is not a Doom WAD.")

    directory = []
    for index in range(lump_count):
        entry_offset = directory_offset + index * 16
        file_pos, size, raw_name = struct.unpack_from("<ii8s", wad_bytes, entry_offset)
        name = raw_name.rstrip(b"\0").decode("ascii", errors="ignore")
        directory.append({"name": name, "file_pos": file_pos, "size": size})

    palette = None
    for entry in directory:
        if entry["name"] == "PLAYPAL":
            lump_bytes = wad_bytes[entry["file_pos"]:entry["file_pos"] + entry["size"]]
            palette = parse_palette(lump_bytes)
            break

    if not palette:
        raise ValueError("The WAD does not contain a readable PLAYPAL lump.")

    sprite_entries = []
    in_sprite_section = False
    for entry in directory:
        name = entry["name"]
        if name in ("S_START", "SS_START"):
            in_sprite_section = True
            continue
        if name in ("S_END", "SS_END"):
            in_sprite_section = False
            continue
        if in_sprite_section or SPRITE_NAME_PATTERN.match(name):
            sprite_entries.append(entry)

    extracted = []
    for entry in sprite_entries[:48]:
        lump_bytes = wad_bytes[entry["file_pos"]:entry["file_pos"] + entry["size"]]
        decoded = decode_patch_image(lump_bytes, palette)
        if not decoded:
            continue
        width, height, pixels = decoded
        file_path = output_dir / f"{entry['name']}.ppm"
        write_ppm(file_path, width, height, pixels)
        extracted.append({
            "name": entry["name"],
            "width": width,
            "height": height,
            "path": str(file_path),
            "transparent_key": [255, 0, 255],
        })

    if not extracted:
        raise ValueError("No decodable sprite patches were extracted from the WAD.")

    return {
        "mode": "wad",
        "source": str(wad_path),
        "sprite_count": len(extracted),
        "sprites": extracted,
    }


def generate_demo_manifest(output_dir):
    sprites = [
        generate_demo_sprite(output_dir, "IMPA1", [205, 74, 74]),
        generate_demo_sprite(output_dir, "CACOA1", [113, 58, 190]),
        generate_demo_sprite(output_dir, "SKULA1", [220, 220, 220]),
        generate_demo_sprite(output_dir, "BAROA1", [190, 120, 40]),
    ]
    return {
        "mode": "demo",
        "source": "synthetic",
        "sprite_count": len(sprites),
        "sprites": sprites,
        "warnings": ["No WAD input was supplied. Generated procedural placeholder sprites instead."],
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--wad", default="")
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--manifest", required=True)
    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    wad_path = args.wad.strip()
    if wad_path and Path(wad_path).exists():
        manifest = extract_from_wad(wad_path, output_dir)
    else:
        manifest = generate_demo_manifest(output_dir)

    manifest_path = Path(args.manifest)
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()

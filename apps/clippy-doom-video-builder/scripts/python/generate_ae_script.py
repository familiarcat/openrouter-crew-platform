#!/usr/bin/env python3
import argparse
import json
from pathlib import Path


def load_json(path_value):
    return json.loads(Path(path_value).read_text(encoding="utf-8"))


def jsx_escape(value):
    return value.replace("\\", "\\\\").replace('"', '\\"')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--scene-plan", required=True)
    parser.add_argument("--sprites", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    scene_plan = load_json(args.scene_plan)
    sprite_doc = load_json(args.sprites)
    duration = float(scene_plan.get("duration_seconds", 48.0))

    imports = []
    for sprite in sprite_doc.get("sprites", [])[:8]:
        imports.append(
            f'var importFile_{sprite["name"]} = new ImportOptions(File("{jsx_escape(sprite["path"])}"));'
        )
        imports.append(f'var footage_{sprite["name"]} = project.importFile(importFile_{sprite["name"]});')

    layer_statements = []
    for scene in scene_plan.get("scenes", [])[:10]:
        for spawn in scene.get("spawns", [])[:3]:
            layer_name = spawn["sprite_name"]
            entry_time = spawn["entry_time"]
            end_time = scene["end"]
            start_x = spawn["x"]
            start_y = spawn["y"]
            end_x = spawn["x"] + spawn["speed"] * 2
            scale = int(spawn["scale"] * 100)
            layer_statements.extend([
                f'var layer_{scene["id"]}_{layer_name} = comp.layers.add(footage_{layer_name});',
                f'layer_{scene["id"]}_{layer_name}.startTime = {entry_time};',
                f'layer_{scene["id"]}_{layer_name}.outPoint = {end_time};',
                f'layer_{scene["id"]}_{layer_name}.property("Position").setValueAtTime({entry_time}, [{start_x}, {start_y}]);',
                f'layer_{scene["id"]}_{layer_name}.property("Position").setValueAtTime({end_time}, [{end_x}, {start_y - 30}]);',
                f'layer_{scene["id"]}_{layer_name}.property("Scale").setValue([{scale}, {scale}]);',
                f'layer_{scene["id"]}_{layer_name}.blendingMode = BlendingMode.SCREEN;',
            ])

    lightning_statements = []
    for scene in scene_plan.get("scenes", [])[:10]:
        for lightning_time in scene.get("lightning", []):
            flash_name = f'flash_{str(lightning_time).replace(".", "_")}'
            lightning_statements.extend([
                f'var {flash_name} = comp.layers.addSolid([1, 1, 1], "Lightning", 1920, 1080, 1, 0.1);',
                f'{flash_name}.startTime = {lightning_time};',
                f'{flash_name}.outPoint = {min(duration, lightning_time + 0.08)};',
                f'{flash_name}.property("Opacity").setValue(65);',
                f'{flash_name}.blendingMode = BlendingMode.ADD;',
            ])

    jsx = f"""#target aftereffects
app.beginUndoGroup("Clippy Doom Auto Build");
var project = app.project || app.newProject();
var comp = project.items.addComp("Clippy Doom Render", 1920, 1080, 1, {duration}, 24);
var bg = comp.layers.addSolid([0.05, 0.06, 0.1], "Storm Background", 1920, 1080, 1, {duration});
bg.moveToEnd();
{"".join(imports)}
{"".join(layer_statements)}
{"".join(lightning_statements)}
app.endUndoGroup();
"""

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(jsx, encoding="utf-8")

    manifest = {
        "output_path": str(output_path),
        "scene_count": scene_plan.get("scene_count", 0),
        "import_count": min(len(sprite_doc.get("sprites", [])), 8),
    }
    manifest_path = output_path.with_suffix(output_path.suffix + ".json")
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()

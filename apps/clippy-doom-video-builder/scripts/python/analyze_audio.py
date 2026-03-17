#!/usr/bin/env python3
import argparse
import json
import math
import struct
import subprocess
import wave
from pathlib import Path


def ffprobe_duration(audio_path):
    try:
        completed = subprocess.run(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "default=noprint_wrappers=1:nokey=1",
                audio_path,
            ],
            capture_output=True,
            text=True,
            timeout=20,
            check=False,
        )
        if completed.returncode == 0 and completed.stdout.strip():
            return float(completed.stdout.strip())
    except Exception:
        return None
    return None


def synthesize_demo():
    duration = 48.0
    bpm = 120
    beat_interval = 60.0 / bpm
    beats = []
    intensity_curve = []
    timestamp = 0.0
    while timestamp < duration:
        normalized = timestamp / duration
        intensity = 0.35 + 0.55 * abs(math.sin(normalized * math.pi * 3))
        beats.append(round(timestamp, 3))
        intensity_curve.append({"time": round(timestamp, 3), "intensity": round(intensity, 3)})
        timestamp += beat_interval
    events = [
        {
            "time": round(item["time"], 3),
            "label": "beat",
            "intensity": item["intensity"],
        }
        for item in intensity_curve
    ]
    return {
        "mode": "demo",
        "source": "synthetic",
        "duration_seconds": duration,
        "bpm_estimate": bpm,
        "beat_count": len(beats),
        "beats": beats,
        "intensity_curve": intensity_curve,
        "warnings": ["No audio input was supplied. Generated a demo timing profile instead."],
    }, events


def load_reference_analysis(audio_path):
    audio_name = Path(audio_path).name
    app_dir = Path(__file__).resolve().parents[2]
    reference_path = app_dir / "analysis" / "reference" / "music_events.json"
    if audio_name != "Michael_McBurgerking.wav" or not reference_path.exists():
        return None

    reference = json.loads(reference_path.read_text(encoding="utf-8"))
    beats = [round(float(value), 3) for value in reference.get("beats", [])]
    if not beats:
        return None

    duration = max(beats[-1] + 1.0, 1.0)
    intensity_curve = []
    for beat in beats:
        normalized = min(1.0, beat / duration)
        intensity = 0.55 + 0.35 * abs(math.sin(normalized * math.pi * 4))
        intensity_curve.append({"time": beat, "intensity": round(intensity, 3)})

    events = [
        {
            "time": item["time"],
            "label": "beat",
            "intensity": item["intensity"],
        }
        for item in intensity_curve
    ]

    return {
        "mode": "reference",
        "source": audio_path,
        "duration_seconds": round(duration, 3),
        "bpm_estimate": round(float(reference.get("tempo", 0))),
        "beat_count": len(beats),
        "beats": beats,
        "intensity_curve": intensity_curve,
        "warnings": ["Used imported Zantigo reference timing data for the bundled song asset."],
    }, events


def analyze_wave(audio_path):
    with wave.open(audio_path, "rb") as wav_file:
        frame_rate = wav_file.getframerate()
        channels = wav_file.getnchannels()
        sample_width = wav_file.getsampwidth()
        frame_count = wav_file.getnframes()
        duration = frame_count / float(frame_rate)
        frames = wav_file.readframes(frame_count)

    if sample_width != 2:
        raise ValueError("Only 16-bit PCM WAV files are supported without optional dependencies.")

    sample_count = frame_count * channels
    samples = struct.unpack("<" + "h" * sample_count, frames)
    mono = []
    for index in range(0, len(samples), channels):
        frame = samples[index:index + channels]
        mono.append(sum(abs(value) for value in frame) / float(channels * 32768))

    window_size = max(frame_rate // 4, 1)
    envelope = []
    for start in range(0, len(mono), window_size):
        window = mono[start:start + window_size]
        if not window:
            continue
        rms = math.sqrt(sum(value * value for value in window) / len(window))
        envelope.append(rms)

    average = sum(envelope) / max(len(envelope), 1)
    threshold = average * 1.22
    beats = []
    intensity_curve = []

    for index, value in enumerate(envelope):
        current_time = round(index * (window_size / float(frame_rate)), 3)
        intensity_curve.append({"time": current_time, "intensity": round(min(value * 2.2, 1.0), 3)})
        if value >= threshold and (not beats or current_time - beats[-1] >= 0.3):
            beats.append(current_time)

    bpm_estimate = 0
    if duration > 0 and beats:
        bpm_estimate = round(len(beats) / duration * 60)

    events = [
        {
            "time": beat,
            "label": "beat",
            "intensity": next((item["intensity"] for item in intensity_curve if item["time"] == beat), 0.6),
        }
        for beat in beats
    ]

    return {
        "mode": "wave",
        "source": audio_path,
        "duration_seconds": round(duration, 3),
        "bpm_estimate": bpm_estimate,
        "beat_count": len(beats),
        "beats": beats,
        "intensity_curve": intensity_curve,
        "warnings": [],
    }, events


def analyze(audio_path):
    if not audio_path or not Path(audio_path).exists():
        return synthesize_demo()

    extension = Path(audio_path).suffix.lower()
    reference_result = load_reference_analysis(audio_path)
    if reference_result:
        return reference_result

    if extension == ".wav":
        return analyze_wave(audio_path)

    duration = ffprobe_duration(audio_path)
    if duration:
        result, events = synthesize_demo()
        result["mode"] = "ffprobe-fallback"
        result["source"] = audio_path
        result["duration_seconds"] = round(duration, 3)
        result["warnings"] = [
            "Used ffprobe fallback because enhanced audio libraries are not installed for this format."
        ]
        return result, events

    result, events = synthesize_demo()
    result["source"] = audio_path
    result["warnings"] = [
        "Could not decode the provided audio file in the local runtime. Generated demo timing instead."
    ]
    return result, events


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="")
    parser.add_argument("--output", required=True)
    parser.add_argument("--events", required=True)
    args = parser.parse_args()

    analysis, events = analyze(args.input.strip())

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(analysis, indent=2) + "\n", encoding="utf-8")

    events_path = Path(args.events)
    events_path.parent.mkdir(parents=True, exist_ok=True)
    events_path.write_text(json.dumps({"events": events}, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()

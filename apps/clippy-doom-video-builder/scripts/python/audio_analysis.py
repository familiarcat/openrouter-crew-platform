import librosa
import json
import os
import numpy as np

print("Running audio analysis...")

audio_file = "assets/audio/Michael_McBurgerking.wav"

y, sr = librosa.load(audio_file)

tempo, beats = librosa.beat.beat_track(y=y, sr=sr)

# Handle tempo returned as numpy array
if isinstance(tempo, np.ndarray):
    tempo = float(tempo[0])
else:
    tempo = float(tempo)

beat_times = librosa.frames_to_time(beats, sr=sr)

os.makedirs("analysis", exist_ok=True)

data = {
    "tempo": tempo,
    "beats": beat_times.tolist()
}

with open("analysis/music_events.json", "w") as f:
    json.dump(data, f, indent=2)

print("Audio analysis complete.")
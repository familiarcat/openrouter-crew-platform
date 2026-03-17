
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from scripts.python.download_freedoom import *
from scripts.python.audio_analysis import *
from scripts.python.storm_system import *
from scripts.python.demon_spawn_system import *
import traceback

try:
    download_freedoom()
    audio_analysis()
    storm_system()
    demon_spawn_system()
except Exception as e:
    print("Setup wizard failed:")
    traceback.print_exc()
    exit(1)
    
download_freedoom()
audio_analysis()
storm_system()
demon_spawn_system()

if not os.path.exists("assets/audio/Michael_McBurgerking.wav"):
    print("Missing song file: assets/audio/Michael_McBurgerking.wav")
    exit()
    
print("Wizard finished")

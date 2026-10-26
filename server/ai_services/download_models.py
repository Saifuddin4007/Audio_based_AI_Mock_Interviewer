import urllib.request
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

FILES = {
    "en_US-lessac-medium.onnx":
        "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx",
    "en_US-lessac-medium.onnx.json":
        "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json",
}

for filename, url in FILES.items():
    destination = BASE_DIR / filename

    if destination.exists():
        print(f"✓ {filename} already exists")
        continue

    print(f"Downloading {filename}...")
    urllib.request.urlretrieve(url, destination)
    print(f"✓ Downloaded {filename}")
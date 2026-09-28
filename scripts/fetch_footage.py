#!/usr/bin/env python3
"""
Downloads the footage listed in src/cinematic/footage.json into public/footage/, trimmed and
re-encoded to 1080p H.264 with short keyframe intervals so Remotion can seek quickly.

The clips are not committed: the stock licenses allow using them in your video but not
redistributing the raw files. Run this once before previewing or rendering the cinematic intro.

    pip install imageio-ffmpeg      # or have ffmpeg on your PATH
    python3 scripts/fetch_footage.py
"""
import json
import os
import shutil
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = json.loads((ROOT / "src" / "cinematic" / "footage.json").read_text())
OUT = ROOT / "public" / "footage"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36"


def find_ffmpeg():
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    try:
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        sys.exit("ffmpeg not found: install it, or run `pip install imageio-ffmpeg`.")


FFMPEG = find_ffmpeg()
PROXY = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")


def fetch(clip):
    dest = OUT / f"{clip['id']}.mp4"
    if dest.exists():
        return clip["id"], "cached"
    net = ["-user_agent", UA, "-rw_timeout", "60000000"] + (["-http_proxy", PROXY] if PROXY else [])
    trim_in = ["-ss", str(clip["start"])] if "start" in clip else []
    trim_out = ["-t", str(clip["duration"])] if "duration" in clip else []
    tmp = dest.with_suffix(".part.mp4")
    cmd = [
        FFMPEG, "-nostdin", "-hide_banner", "-loglevel", "error", "-y",
        *net, *trim_in, "-i", clip["url"], *trim_out,
        "-an", "-vf", "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,format=yuv420p",
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-g", "12", "-movflags", "+faststart", str(tmp),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        tmp.unlink(missing_ok=True)
        return clip["id"], "FAILED: " + result.stderr.strip()[-300:]
    tmp.rename(dest)
    return clip["id"], f"{dest.stat().st_size / 1e6:.1f} MB"


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    failed = 0
    with ThreadPoolExecutor(4) as pool:
        for clip_id, status in pool.map(fetch, MANIFEST["clips"]):
            print(f"{clip_id:18s} {status}")
            failed += status.startswith("FAILED")
    if failed:
        sys.exit(f"{failed} clip(s) failed to download.")


if __name__ == "__main__":
    main()

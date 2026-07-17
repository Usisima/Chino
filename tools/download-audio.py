#!/usr/bin/env python3
"""Obtiene el audio de las canciones de la app Chino y lo deja en assets/songs/<id>.mp3.

Mismo esquema que lyricglass, con dos modos separados:

  LOCAL   copia (y convierte a mp3 si hace falta) un archivo tuyo.
  AUTO    busca la canción y descarga el audio con yt-dlp + FFmpeg.

El archivo de salida es exactamente el que la app espera reproducir: la ruta
`audio` declarada en SONGS dentro de assets/js/app/songs.js (por defecto
assets/songs/<id>.mp3). Un audio ya presente se reutiliza salvo --force.

Ejemplos (desde la carpeta del proyecto):

  # listar las canciones y ver cuáles ya tienen audio
  python tools/download-audio.py --list

  # modo AUTO: busca «夜走 打倒三明治» en YouTube y guarda assets/songs/yezou.mp3
  python tools/download-audio.py yezou

  # búsqueda a medida (útil si el resultado por defecto no es el bueno)
  python tools/download-audio.py yezou --query "打倒三明治 夜走 official audio"

  # pegar directamente la URL de un video/pista concreta
  python tools/download-audio.py yezou --url "https://www.youtube.com/watch?v=..."

  # modo LOCAL: usa un archivo que ya tienes (se convierte a mp3)
  python tools/download-audio.py yezou --local "D:/Music/yezou.m4a"

Requisitos: yt-dlp y FFmpeg. Instala yt-dlp con  pip install yt-dlp
(FFmpeg debe estar en el PATH, o pásalo con --ffmpeg "C:/ruta/ffmpeg.exe").

NOTA: la descarga desde YouTube la ejecutas tú, bajo tu criterio y para tu uso
personal. Este script solo automatiza el proceso; consigue el audio de forma
que respete la licencia de cada canción.
"""

from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
from pathlib import Path

# Raíz del proyecto = carpeta que contiene tools/  (este archivo vive en tools/)
ROOT = Path(__file__).resolve().parent.parent
SONGS_JS = ROOT / "assets" / "js" / "app" / "songs.js"


def die(msg: str) -> "None":
    print(f"\n[!] {msg}", file=sys.stderr)
    sys.exit(1)


def parse_songs() -> list[dict]:
    """Extrae id / title / sub (artista) / audio de cada entrada de SONGS."""
    if not SONGS_JS.exists():
        die(f"No encuentro {SONGS_JS}. Ejecuta el script desde el proyecto Chino.")
    text = SONGS_JS.read_text(encoding="utf-8")

    songs: list[dict] = []
    # Cada objeto de canción empieza por  id: '...'  ; recogemos los campos de
    # texto que nos interesan dentro de la misma entrada.
    for m in re.finditer(r"id:\s*'([^']+)'", text):
        start = m.start()
        chunk = text[start:start + 600]  # la cabecera de una canción cabe de sobra

        def field(name: str) -> str:
            fm = re.search(name + r":\s*'((?:[^'\\]|\\.)*)'", chunk)
            return fm.group(1) if fm else ""

        songs.append({
            "id": m.group(1),
            "title": field("title"),
            "sub": field("sub"),
            "audio": field("audio") or f"assets/songs/{m.group(1)}.mp3",
        })
    return songs


def find_song(songs: list[dict], song_id: str) -> dict:
    for s in songs:
        if s["id"] == song_id:
            return s
    ids = ", ".join(s["id"] for s in songs) or "(ninguna)"
    die(f"No hay ninguna canción con id '{song_id}'. Disponibles: {ids}")


def artist_from_sub(sub: str) -> str:
    """La descripción es «artista» o «... · artista»; toma el último segmento."""
    return sub.split("·")[-1].strip()


def dest_path(song: dict) -> Path:
    return ROOT / Path(song["audio"])


def check_tools(ffmpeg: str) -> str:
    try:
        import yt_dlp  # noqa: F401
    except ImportError:
        die("yt-dlp no está instalado.  Instálalo con:  pip install yt-dlp")
    exe = ffmpeg or shutil.which("ffmpeg") or ""
    if not exe:
        die("No encuentro FFmpeg en el PATH. Pásalo con  --ffmpeg \"C:/ruta/ffmpeg.exe\"")
    return exe


def convert_local(src: Path, dest: Path, ffmpeg: str) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if src.suffix.lower() == ".mp3":
        shutil.copy2(src, dest)
        print(f"[ok] Copiado: {dest.relative_to(ROOT)}")
        return
    print(f"[..] Convirtiendo a mp3 con FFmpeg: {src.name}")
    cmd = [ffmpeg, "-y", "-i", str(src), "-vn", "-b:a", "192k", str(dest)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        die("FFmpeg falló:\n" + r.stderr[-800:])
    print(f"[ok] Audio listo: {dest.relative_to(ROOT)}")


def download_auto(song: dict, dest: Path, ffmpeg: str,
                  query: str | None, url: str | None) -> None:
    from yt_dlp import YoutubeDL

    dest.parent.mkdir(parents=True, exist_ok=True)
    # yt-dlp añade la extensión; el postprocesador la deja en .mp3
    out_template = str(dest.with_suffix("")) + ".%(ext)s"

    if url:
        target, label = url, url
    else:
        artist = artist_from_sub(song["sub"])
        term = query or f"{artist} {song['title']} audio".strip()
        target, label = f"ytsearch1:{term}", term

    def hook(d: dict) -> None:
        if d.get("status") == "downloading":
            pct = d.get("_percent_str", "").strip()
            spd = d.get("_speed_str", "").strip()
            print(f"\r      {pct}  {spd}          ", end="", flush=True)
        elif d.get("status") == "finished":
            print("\r      Descarga completa; extrayendo audio…            ")

    opts = {
        "format": "bestaudio/best",
        "outtmpl": out_template,
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
        "default_search": "ytsearch1",
        "continuedl": True,
        "ffmpeg_location": str(Path(ffmpeg).parent),
        "progress_hooks": [hook],
        "postprocessors": [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": "192",
        }],
    }

    print(f"[..] Buscando audio para: {label}")
    try:
        with YoutubeDL(opts) as ydl:
            ydl.download([target])
    except Exception as exc:  # noqa: BLE001
        die(f"No se pudo descargar el audio: {exc}")

    if not dest.exists():
        die("La descarga terminó pero no se generó el mp3 esperado.")
    print(f"[ok] Audio listo: {dest.relative_to(ROOT)}")


def main() -> None:
    ap = argparse.ArgumentParser(
        description="Descarga/copia el audio de una canción de Chino a assets/songs/<id>.mp3.")
    ap.add_argument("song_id", nargs="?", help="id de la canción (ver --list)")
    ap.add_argument("--list", action="store_true", help="lista las canciones y su estado de audio")
    ap.add_argument("--local", metavar="ARCHIVO", help="modo LOCAL: usa este archivo de audio")
    ap.add_argument("--query", metavar="TEXTO", help="texto de búsqueda a medida (modo AUTO)")
    ap.add_argument("--url", metavar="URL", help="descarga esta URL concreta en vez de buscar")
    ap.add_argument("--ffmpeg", metavar="RUTA", help="ruta a ffmpeg si no está en el PATH")
    ap.add_argument("--force", action="store_true", help="rehace el audio aunque ya exista")
    args = ap.parse_args()

    songs = parse_songs()

    if args.list or not args.song_id:
        print("Canciones en la app:\n")
        for s in songs:
            mark = "♪" if dest_path(s).exists() else "·"
            print(f"  {mark}  {s['id']:<10} {s['title']}  —  {s['sub']}")
        print("\n  ♪ = audio presente    · = falta el audio")
        if not args.song_id:
            print("\nUso:  python tools/download-audio.py <id>  [--local ARCHIVO | --query ... | --url ...]")
        return

    song = find_song(songs, args.song_id)
    dest = dest_path(song)

    if dest.exists() and not args.force:
        print(f"[=] Ya existe {dest.relative_to(ROOT)} — usa --force para rehacerlo.")
        return

    if args.local:
        src = Path(args.local).expanduser()
        if not src.exists():
            die(f"El archivo local no existe: {src}")
        ffmpeg = shutil.which(args.ffmpeg or "ffmpeg") or (args.ffmpeg or "")
        if src.suffix.lower() != ".mp3" and not ffmpeg:
            die("Para convertir a mp3 hace falta FFmpeg. Pásalo con --ffmpeg o deja un .mp3.")
        convert_local(src, dest, ffmpeg)
    else:
        ffmpeg = check_tools(args.ffmpeg or "")
        download_auto(song, dest, ffmpeg, args.query, args.url)

    print("\nListo. Abre la app, entra en Música → la canción y pulsa play.")


if __name__ == "__main__":
    main()

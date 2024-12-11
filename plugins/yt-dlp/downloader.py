import json
import time
import yt_dlp
import sys
from pathlib import Path

def get_available_formats(url):
    ydl_opts = {
        'quiet': True,
        'noplaylist': True,
        'extract_flat': True
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info_dict = ydl.extract_info(url, download=False)
            formats = info_dict.get('formats', [])
            format_list = [
                f"{fmt['format_id']}: {fmt['height']}p" if 'height' in fmt else f"{fmt['format_id']}: {fmt['ext']}"
                for fmt in formats
            ]
            return format_list, None
    except Exception as e:
        return None, str(e)

def download_file(url, output_path, format_code=''):
    start_time = time.time()  # Moved start_time to the top of the function
    ydl_opts = {
        'outtmpl': str(output_path),
        'quiet': True,
        'noprogress': True,
        'noplaylist': True,
        'concurrent_fragment_downloads': 4
    }

    if format_code:
        ydl_opts['format'] = format_code

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
    except Exception as e:
        return "Download failed", str(e), None, 0, 0

    if not Path(output_path).exists():
        return "Download failed", "File not found after download", None, 0, 0

    file_size = Path(output_path).stat().st_size
    download_speed = file_size / (time.time() - start_time)  # No more NameError

    return None, None, output_path, download_speed, file_size

def main(url, output_dir, quality=None):
    file_name = f"file_{int(time.time())}"  
    output_path = Path(output_dir) / file_name

    formats, error = get_available_formats(url)
    if error:
        print(json.dumps({"error": "Format check failed", "message": error}))
        return

    format_code = ''
    if any('mp4' in fmt for fmt in formats):
        format_code = next((fmt.split(':')[0] for fmt in formats if quality in fmt), '')

    error, error_message, output_path, download_speed, file_size = download_file(url, output_path, format_code)

    if error:
        print(json.dumps({"error": error, "message": error_message}))
        return

    print(json.dumps({"filePath": str(output_path), "downloadSpeed": download_speed, "fileSize": file_size}))

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: python downloader.py <url> <output_dir> [<quality>]"}))
        sys.exit(1)

    url = sys.argv[1]
    output_dir = sys.argv[2]
    quality = sys.argv[3] if len(sys.argv) > 3 else None
    main(url, output_dir, quality)

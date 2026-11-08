"""Read public playlist metadata only; never downloads media or generates captions."""
import json
import re
import sys
LIMIT = 2000

def normalize_playlist(data, playlist_id):
    if data.get('id') != playlist_id:
        return {'available': False, 'code': 'PLAYLIST_INCOMPLETE'}
    entries = list(data.get('entries') or [])
    if len(entries) > LIMIT or int(data.get('playlist_count') or len(entries)) > LIMIT:
        return {'available': False, 'code': 'PLAYLIST_LIMIT'}
    if data.get('playlist_count') and int(data['playlist_count']) != len(entries):
        return {'available': False, 'code': 'PLAYLIST_INCOMPLETE'}
    items, seen, unavailable = [], set(), 0
    for entry in entries:
        if not entry or entry.get('availability') in ('private', 'needs_auth', 'premium_only', 'subscriber_only') or entry.get('title') in ('[Private video]', '[Deleted video]'):
            unavailable += 1
            continue
        vid, title = entry.get('id'), entry.get('title')
        if not isinstance(vid, str) or not re.fullmatch(r'[A-Za-z0-9_-]{11}', vid) or not isinstance(title, str) or not title.strip():
            return {'available': False, 'code': 'PLAYLIST_INCOMPLETE'}
        if vid in seen:
            return {'available': False, 'code': 'PLAYLIST_INCOMPLETE'}
        seen.add(vid)
        items.append({'id': vid, 'title': title[:500]})
    if not items:
        return {'available': False, 'code': 'PLAYLIST_UNAVAILABLE'}
    return {'available': True, 'complete': True, 'playlistId': playlist_id, 'title': str(data.get('title') or 'Playlist YouTube')[:500], 'items': items, 'unavailable': unavailable, 'total': len(entries)}

def extract(playlist_id):
    if not isinstance(playlist_id, str) or not re.fullmatch(r'[A-Za-z0-9_-]{10,150}', playlist_id):
        return {'available': False, 'code': 'PLAYLIST_UNAVAILABLE'}
    import yt_dlp
    class QuietLogger:
        def debug(self, msg): pass
        def warning(self, msg): pass
        def error(self, msg): pass
    options = {'quiet': True, 'no_warnings': True, 'logger': QuietLogger(), 'extract_flat': 'in_playlist', 'skip_download': True, 'playlistend': LIMIT + 1, 'socket_timeout': 15, 'retries': 0, 'extractor_retries': 0, 'cachedir': False}
    with yt_dlp.YoutubeDL(options) as downloader:
        data = downloader.extract_info('https://www.youtube.com/playlist?list=' + playlist_id, download=False)
    return normalize_playlist(data, playlist_id)

if __name__ == '__main__':
    try:
        print(json.dumps(extract(json.load(sys.stdin).get('playlistId'))))
    except Exception:
        print(json.dumps({'available': False, 'code': 'PLAYLIST_UNAVAILABLE'}))

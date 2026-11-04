"""Public YouTube captions. All returned times are SECONDS, never milliseconds."""
import html
import json
import math
import os
import re
import sys
from urllib.parse import urlparse

MAX_CUES = 10000
MAX_BYTES = 3_000_000


class CaptionError(Exception):
    def __init__(self, code, message):
        self.code, self.message = code, message
        super().__init__(message)


def clean(text):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]*>', '', html.unescape(str(text)))).strip()


def normalize(rows):
    cues = []
    for row in rows:
        try:
            start, end = float(row['start']), float(row['end'])
            text = clean(row['text'])
            if not text or not math.isfinite(start) or not math.isfinite(end) or start < 0 or end <= start:
                continue
            if len(text) > 1500:
                raise CaptionError('CAPTIONS_TOO_LARGE', 'Một đoạn phụ đề vượt 1500 ký tự.')
            cue = {'start': round(start, 3), 'end': round(end, 3), 'text': text}
            if not cues or cue != cues[-1]:
                cues.append(cue)
        except (ValueError, KeyError, TypeError):
            continue
    cues.sort(key=lambda c: c['start'])
    if len(cues) > MAX_CUES:
        raise CaptionError('CAPTIONS_TOO_LARGE', 'Vượt 10000 đoạn, giới hạn của module nghe Elio hiện tại.')
    if not cues:
        raise CaptionError('CAPTIONS_EMPTY', 'Nguồn phụ đề không trả nội dung đọc được.')
    return cues


def parse_payload(raw):
    if len(raw.encode('utf-8')) > MAX_BYTES:
        raise CaptionError('CAPTIONS_TOO_LARGE', 'Phụ đề vượt 3 MB.')
    if raw.lstrip().startswith('{'):
        data = json.loads(raw)
        return normalize([{'start': e['tStartMs'] / 1000,
                           'end': (e['tStartMs'] + max(1, e.get('dDurationMs', 2000))) / 1000,
                           'text': ''.join(s.get('utf8', '') for s in e.get('segs', []))}
                          for e in data.get('events', []) if isinstance(e.get('tStartMs'), (int, float))])
    if raw.lstrip().startswith('<'):
        from defusedxml import ElementTree
        root = ElementTree.fromstring(raw)
        return normalize([{'start': float(e.attrib['start']),
                           'end': float(e.attrib['start']) + float(e.attrib.get('dur', 2)),
                           'text': ''.join(e.itertext())}
                          for e in root if 'start' in e.attrib])
    rows = []
    def seconds(value):
        return sum(float(x) * 60 ** i for i, x in enumerate(reversed(value.replace(',', '.').split(':'))))
    for block in re.split(r'\n\s*\n', raw.replace('\r', '')):
        lines = block.splitlines()
        for i, line in enumerate(lines):
            m = re.search(r'([\d:.,]+)\s*-->\s*([\d:.,]+)', line)
            if m:
                rows.append({'start': seconds(m[1]), 'end': seconds(m[2]), 'text': ' '.join(lines[i+1:])})
                break
    return normalize(rows)


def map_error(error):
    name, text = type(error).__name__, str(error).lower()
    if isinstance(error, CaptionError):
        return error
    if '429' in text or 'too many requests' in text:
        return CaptionError('CAPTIONS_RATE_LIMIT', 'YouTube đang giới hạn yêu cầu từ IP máy chủ lấy phụ đề (HTTP 429). Đây không phải số lượt bạn đã dùng trong ngày. Hãy thử lại sau.')
    if name in ('RequestBlocked', 'IpBlocked', 'PoTokenRequired') or 'not a bot' in text:
        return CaptionError('CAPTIONS_BLOCKED', 'YouTube chặn yêu cầu hoặc yêu cầu xác minh máy chủ.')
    if name in ('AgeRestricted', 'VideoUnplayable') or any(s in text for s in ('private video', 'sign in', 'age-restricted')):
        return CaptionError('CAPTIONS_ACCESS_REQUIRED', 'Video cần quyền truy cập hoặc xác minh độ tuổi.')
    if name in ('NoTranscriptFound', 'TranscriptsDisabled') or 'no subtitles' in text:
        return CaptionError('CAPTIONS_NOT_FOUND', 'Không tìm thấy phụ đề trong ngôn ngữ bạn chọn.')
    if name == 'VideoUnavailable' or 'video unavailable' in text:
        return CaptionError('CAPTIONS_VIDEO_UNAVAILABLE', 'Video không khả dụng.')
    return CaptionError('CAPTIONS_UPSTREAM_ERROR', 'Nguồn phụ đề chưa truy cập được; không kết luận video thiếu phụ đề.')


def library_fetch(video_id, languages):
    from requests import Session
    from youtube_transcript_api import YouTubeTranscriptApi
    class TimedSession(Session):
        def request(self, *args, **kwargs):
            kwargs.setdefault('timeout', 12)
            return super().request(*args, **kwargs)
    with TimedSession() as session:
        api = YouTubeTranscriptApi(http_client=session)
        transcript = api.fetch(video_id, languages=languages)
        cues = normalize([{'start': s.start, 'end': s.start + s.duration, 'text': s.text} for s in transcript])
        return {'cues': cues, 'language': transcript.language_code,
                'source': 'youtube-auto' if transcript.is_generated else 'youtube', 'via': 'youtube-transcript-api'}


def ytdlp_fetch(video_id, languages):
    import requests
    import yt_dlp
    class QuietLogger:
        def debug(self, msg): pass
        def warning(self, msg): pass
        def error(self, msg): pass
    options = {'quiet': True, 'no_warnings': True, 'logger': QuietLogger(),
               'skip_download': True, 'noplaylist': True, 'ignore_no_formats_error': True,
               'socket_timeout': 12, 'retries': 0, 'extractor_retries': 0,
               'js_runtimes': {'node': {}}, 'cachedir': False,
               'compat_opts': {'no-certifi'}}
    # yt-dlp obtains available subtitle URLs. Fetch only ONE selected language,
    # avoiding translated-subtitle downloads and their avoidable rate limits.
    with yt_dlp.YoutubeDL(options) as downloader:
        info = downloader.extract_info('https://www.youtube.com/watch?v=' + video_id, download=False)
    selected = None
    for requested in languages:
        for field in ('subtitles', 'automatic_captions'):
            tracks = info.get(field) or {}
            keys = [k for k in tracks if k == requested or k.startswith(requested + '-')]
            for language in keys:
                # Ignore machine translations when yt-dlp explicitly marks them.
                formats = [f for f in tracks[language] if f.get('url') and
                           not f.get('is_translated') and 'tlang=' not in f.get('url', '')]
                for ext in ('json3', 'vtt', 'srv1', 'ttml'):
                    chosen = next((f for f in formats if f.get('ext') == ext), None)
                    if chosen:
                        selected = (language, field, chosen)
                        break
                if selected: break
            if selected: break
        if selected: break
    if not selected:
        raise CaptionError('CAPTIONS_NOT_FOUND', 'Không tìm thấy phụ đề gốc trong ngôn ngữ bạn chọn.')
    language, field, track = selected
    parsed = urlparse(track['url'])
    if parsed.scheme != 'https' or parsed.hostname not in ('youtube.com', 'www.youtube.com') or parsed.path != '/api/timedtext':
        raise CaptionError('CAPTIONS_URL_INVALID', 'Nguồn trả địa chỉ phụ đề không được hỗ trợ.')
    with requests.get(track['url'], timeout=15, stream=True, allow_redirects=False) as response:
        response.raise_for_status()
        if response.is_redirect:
            raise CaptionError('CAPTIONS_ACCESS_REQUIRED', 'YouTube yêu cầu chuyển hướng hoặc xác minh.')
        chunks, size = [], 0
        for chunk in response.iter_content(65536):
            size += len(chunk)
            if size > MAX_BYTES:
                raise CaptionError('CAPTIONS_TOO_LARGE', 'Phụ đề vượt 3 MB.')
            chunks.append(chunk)
    cues = parse_payload(b''.join(chunks).decode('utf-8-sig'))
    return {'cues': cues, 'language': language, 'source': 'youtube-auto' if field == 'automatic_captions' else 'youtube',
            'via': 'yt-dlp', 'title': info.get('title', '')}


if __name__ == '__main__':
    try:
        request = json.load(sys.stdin)
        if not re.fullmatch(r'[A-Za-z0-9_-]{11}', request['id']):
            raise CaptionError('INVALID_VIDEO_ID', 'Mã video không hợp lệ.')
        engine = request['engine']
        result = (library_fetch if engine == 'youtube-transcript-api' else ytdlp_fetch)(request['id'], request['languages'])
        print(json.dumps({'ok': True, **result}, ensure_ascii=False))
    except Exception as exc:
        err = map_error(exc)
        print(json.dumps({'ok': False, 'code': err.code, 'reason': err.message}, ensure_ascii=False))
        sys.exit(1)

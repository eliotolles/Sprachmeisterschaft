"""Elio transcript sidecar. Python 3.11+, no web framework required."""
import concurrent.futures
import hashlib
import hmac
import json
import os
from pathlib import Path
import re
import sqlite3
import subprocess
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

BASE = Path(__file__).resolve().parent
TOKEN = os.environ.get('ELIO_TRANSCRIPT_TOKEN', '')
BIND = os.environ.get('HOST', '127.0.0.1')
PORT = int(os.environ.get('PORT', '8080'))
ORIGINS = {s.strip().rstrip('/') for s in os.environ.get('ALLOWED_ORIGINS', '').split(',') if s.strip()}
DB = os.environ.get('CACHE_DB', str(BASE / 'data' / 'transcripts.sqlite3'))
TTL = int(os.environ.get('CACHE_TTL_SECONDS', '86400'))
DEADLINE = min(120, max(10, int(os.environ.get('REQUEST_TIMEOUT_SECONDS', '55'))))
SLOTS = threading.BoundedSemaphore(max(1, int(os.environ.get('MAX_CONCURRENT', '2'))))
DB_LOCK = threading.Lock()
RATE_LOCK = threading.Lock()
RATE = {}


def video_id(value):
    if not isinstance(value, str) or len(value) > 2048:
        raise ValueError('Link hoặc mã video không hợp lệ.')
    if re.fullmatch(r'[A-Za-z0-9_-]{11}', value): return value
    url = urlparse(value)
    if url.scheme not in ('https', 'http') or url.username or url.password or url.port not in (None, 443, 80):
        raise ValueError('Cần link YouTube hợp lệ.')
    if url.hostname == 'youtu.be': candidate = url.path.strip('/').split('/')[0]
    elif url.hostname in ('youtube.com', 'www.youtube.com', 'm.youtube.com', 'www.youtube-nocookie.com'):
        candidate = parse_qs(url.query).get('v', [''])[0]
        if not candidate:
            parts = url.path.strip('/').split('/')
            candidate = parts[1] if len(parts) > 1 and parts[0] in ('shorts', 'embed', 'live') else ''
    else: raise ValueError('Chỉ nhận link YouTube.')
    if not re.fullmatch(r'[A-Za-z0-9_-]{11}', candidate): raise ValueError('Không tìm thấy mã video trong link.')
    return candidate


def initialize():
    Path(DB).parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB) as db:
        db.execute('PRAGMA journal_mode=WAL')
        db.execute('CREATE TABLE IF NOT EXISTS captions (cache_key TEXT PRIMARY KEY, expires REAL, payload TEXT)')


def cache_read(key):
    with DB_LOCK, sqlite3.connect(DB) as db:
        row = db.execute('SELECT payload FROM captions WHERE cache_key=? AND expires>?', (key, time.time())).fetchone()
        return json.loads(row[0]) if row else None


def cache_write(key, payload):
    with DB_LOCK, sqlite3.connect(DB) as db:
        db.execute('DELETE FROM captions WHERE expires<?', (time.time(),))
        db.execute('INSERT OR REPLACE INTO captions VALUES (?,?,?)', (key, time.time() + TTL, json.dumps(payload, ensure_ascii=False)))


def failure(code, reason):
    return {'available': False, 'code': code, 'reason': reason, 'cues': [],
            'retryable': code in ('CAPTIONS_RATE_LIMIT', 'CAPTIONS_BLOCKED', 'CAPTIONS_TIMEOUT', 'CAPTIONS_BUSY', 'CAPTIONS_UPSTREAM_ERROR')}


def resolve(payload):
    vid = video_id(payload.get('id') or payload.get('url'))
    langs = payload.get('languages', ['de'])
    if not isinstance(langs, list) or not 1 <= len(langs) <= 5 or any(not isinstance(v, str) or not re.fullmatch(r'[a-zA-Z]{2,3}(?:-[a-zA-Z0-9]{2,8})*', v) for v in langs):
        raise ValueError('languages phải là danh sách mã như ["de"] hoặc ["vi", "en"].')
    engine = payload.get('engine', 'auto')
    if engine not in ('auto', 'youtube-transcript-api', 'yt-dlp'): raise ValueError('engine không hợp lệ.')
    key = hashlib.sha256(json.dumps([vid, langs, engine]).encode()).hexdigest()
    hit = cache_read(key)
    if hit: return {**hit, 'cached': True}
    if not SLOTS.acquire(blocking=False): return failure('CAPTIONS_BUSY', 'Máy chủ đang xử lý video khác. Hãy thử lại sau.')
    try:
        engines = ['youtube-transcript-api', 'yt-dlp'] if engine == 'auto' else [engine]
        end = time.monotonic() + DEADLINE
        attempts = []
        for index, chosen in enumerate(engines):
            remaining = end - time.monotonic()
            # Reserve at least half of the request budget for the fallback.
            budget = min(25, remaining / 2) if len(engines) > 1 and index == 0 else remaining
            if budget <= 1: break
            try:
                proc = subprocess.run([sys.executable, str(BASE / 'extract.py')],
                    input=json.dumps({'id': vid, 'languages': langs, 'engine': chosen}),
                    capture_output=True, text=True, timeout=budget, env=os.environ.copy())
                data = json.loads(proc.stdout)
                if data.get('ok') and data.get('cues'):
                    result = {'available': True, 'videoId': vid, 'language': data['language'],
                              'source': data['source'], 'via': data['via'], 'cues': data['cues'],
                              'cached': False, 'timeUnit': 'seconds', 'fetchedAt': int(time.time()),
                              'title': data.get('title', ''), 'attempts': attempts}
                    cache_write(key, result)
                    return result
                attempts.append({'engine': chosen, 'code': data.get('code', 'CAPTIONS_UPSTREAM_ERROR')})
            except subprocess.TimeoutExpired:
                attempts.append({'engine': chosen, 'code': 'CAPTIONS_TIMEOUT'})
            except (ValueError, OSError):
                attempts.append({'engine': chosen, 'code': 'CAPTIONS_UPSTREAM_ERROR'})
        # Report access/transport failures before concluding that captions are absent.
        codes = {a['code'] for a in attempts}
        messages = [('CAPTIONS_RATE_LIMIT', 'YouTube đang giới hạn yêu cầu từ IP máy chủ lấy phụ đề (HTTP 429). Đây không phải số lượt bạn đã dùng trong ngày. Hãy thử lại sau.'),
                    ('CAPTIONS_BLOCKED', 'YouTube yêu cầu xác minh hoặc chặn IP máy chủ.'),
                    ('CAPTIONS_ACCESS_REQUIRED', 'Video yêu cầu quyền truy cập hoặc xác minh độ tuổi.'),
                    ('CAPTIONS_TIMEOUT', 'Hết thời gian lấy phụ đề từ các nguồn.'),
                    ('CAPTIONS_TOO_LARGE', 'Phụ đề vượt giới hạn 10000 đoạn hoặc 3 MB của Elio.'),
                    ('CAPTIONS_VIDEO_UNAVAILABLE', 'Video không khả dụng.'),
                    ('CAPTIONS_UPSTREAM_ERROR', 'Nguồn phụ đề chưa truy cập được. Không kết luận video thiếu phụ đề.'),
                    ('CAPTIONS_NOT_FOUND', 'Không tìm thấy phụ đề trong ngôn ngữ đã chọn.'),
                    ('CAPTIONS_EMPTY', 'Nguồn phụ đề trả nội dung rỗng.')]
        code, reason = next(((c, m) for c, m in messages if c in codes), messages[3])
        return {**failure(code, reason), 'attempts': attempts, 'videoId': vid}
    finally: SLOTS.release()


def format_cues(cues, format):
    def stamp(seconds, separator):
        n = max(0, round(seconds * 1000))
        return f'{n//3600000:02}:{n//60000%60:02}:{n//1000%60:02}{separator}{n%1000:03}'
    if format == 'txt': return '\n'.join(c['text'] for c in cues) + '\n'
    if format == 'json': return json.dumps(cues, ensure_ascii=False, indent=2)
    return ('WEBVTT\n\n' if format == 'vtt' else '') + '\n\n'.join(
        (str(i+1)+'\n' if format == 'srt' else '') + stamp(c['start'], ',' if format == 'srt' else '.') + ' --> ' + stamp(c['end'], ',' if format == 'srt' else '.') + '\n' + c['text']
        for i, c in enumerate(cues)) + '\n'


class Handler(BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'
    def setup(self):
        super().setup()
        self.connection.settimeout(15)
    def log_message(self, fmt, *args):
        # Never log Authorization, signed caption URLs, or request bodies.
        sys.stderr.write('%s %s\n' % (time.strftime('%Y-%m-%dT%H:%M:%S'), fmt % args))
    def send(self, status, value, content_type='application/json; charset=utf-8', extra=None):
        raw = json.dumps(value, ensure_ascii=False).encode() if isinstance(value, dict) else value.encode()
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(raw)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        origin = self.headers.get('Origin')
        if origin in ORIGINS:
            self.send_header('Access-Control-Allow-Origin', origin)
            self.send_header('Vary', 'Origin')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS, GET')
            self.send_header('Access-Control-Allow-Headers', 'Authorization, Content-Type')
        for k,v in (extra or {}).items(): self.send_header(k,v)
        self.end_headers()
        self.wfile.write(raw)
    def do_OPTIONS(self):
        self.send(204, '') if self.headers.get('Origin') in ORIGINS else self.send(403, {'error':'Origin not allowed'})
    def do_GET(self):
        if self.path == '/health': self.send(200, {'ok':True, 'service':'elio-transcript', 'version':'1.0.0'})
        else: self.send(404, {'error':'Not found'})
    def do_POST(self):
        if self.path not in ('/v1/transcript', '/v1/export', '/api/listening/captions'):
            self.send(404, {'error':'Not found'}); return
        if not TOKEN or not hmac.compare_digest(self.headers.get('Authorization',''), 'Bearer '+TOKEN):
            self.close_connection=True; self.send(401, {'error':'Unauthorized'}); return
        if self.headers.get('Origin') and self.headers['Origin'] not in ORIGINS:
            self.close_connection=True; self.send(403, {'error':'Origin not allowed'}); return
        # Per-IP limit; bind behind your reverse proxy and its own rate limits for public service.
        now=time.monotonic(); ip=self.client_address[0]
        with RATE_LOCK:
            for k in list(RATE):
                if RATE[k][1] < now-60: del RATE[k]
            count, since=RATE.get(ip,(0,now))
            if now-since>=60: count,since=0,now
            RATE[ip]=(count+1,since)
        if count>=30:
            self.close_connection=True; self.send(429, failure('CAPTIONS_RATE_LIMIT','Tối đa 30 yêu cầu/phút.'),extra={'Retry-After':'60'});return
        try:
            size=int(self.headers.get('Content-Length','0'))
            if not 1<=size<=8192:
                self.close_connection=True; self.send(413, {'error':'Body must be 1–8192 bytes'}); return
            payload=json.loads(self.rfile.read(size))
            if not isinstance(payload,dict): raise ValueError('Body phải là JSON object.')
            format=payload.get('format','srt')
            if self.path=='/v1/export' and format not in ('srt','vtt','txt','json'): raise ValueError('Định dạng không hợp lệ.')
            result=resolve(payload)
            if self.path=='/v1/export' and result['available']:
                mime={'vtt':'text/vtt; charset=utf-8','json':'application/json; charset=utf-8'}.get(format,'text/plain; charset=utf-8')
                self.send(200,format_cues(result['cues'],format),mime,{'Content-Disposition':f'attachment; filename="{result["videoId"]}.{format}"'})
            else:
                # Captions unavailable is a typed result, compatible with Elio's existing queue.
                self.send(200,result)
        except (ValueError,TypeError,UnicodeDecodeError): self.send(400,{'error':'Link, ngôn ngữ hoặc JSON không hợp lệ.'})
        except Exception: self.send(500, failure('CAPTIONS_INTERNAL_ERROR','Máy chủ gặp lỗi nội bộ.'))


class BoundedServer(ThreadingHTTPServer):
    daemon_threads=True
    def __init__(self,*a,**k):
        super().__init__(*a,**k)
        self.pool=concurrent.futures.ThreadPoolExecutor(max_workers=8)
        self.connections=threading.BoundedSemaphore(16)
    def process_request(self,request,client_address):
        if not self.connections.acquire(blocking=False):
            self.shutdown_request(request);return
        def handle():
            try:self.process_request_thread(request,client_address)
            finally:self.connections.release()
        self.pool.submit(handle)


if __name__=='__main__':
    if len(TOKEN)<24: sys.exit('Set ELIO_TRANSCRIPT_TOKEN to a random secret of at least 24 characters.')
    initialize()
    print(f'Elio Transcript listening on {BIND}:{PORT}',flush=True)
    BoundedServer((BIND,PORT),Handler).serve_forever()

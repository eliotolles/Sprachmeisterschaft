import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import threading
import unittest
from unittest.mock import patch
import urllib.request
import urllib.error

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
import server
import extract

GOOD={'ok':True,'language':'de','source':'youtube-auto','via':'yt-dlp','cues':[{'start':10.2,'end':16.119,'text':'Hallo Welt.'}]}

class BackendTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        server.DB=str(Path(self.temp.name)/'cache.db')
        server.initialize()
    def tearDown(self):self.temp.cleanup()
    def test_urls_and_ssrf(self):
        for value in ['BESKw0hiZ3Q','https://youtu.be/BESKw0hiZ3Q','https://www.youtube.com/shorts/BESKw0hiZ3Q','https://www.youtube.com/watch?v=BESKw0hiZ3Q']:
            self.assertEqual(server.video_id(value),'BESKw0hiZ3Q')
        for value in ['https://youtube.com.evil.example/watch?v=BESKw0hiZ3Q','http://127.0.0.1/','https://evil@youtube.com/watch?v=BESKw0hiZ3Q','bad']:
            with self.assertRaises(ValueError):server.video_id(value)
    def test_json3_seconds_and_empty_events(self):
        raw=json.dumps({'events':[{'tStartMs':10200,'dDurationMs':5919,'segs':[{'utf8':'Hallo'}]},{'tStartMs':0}]})
        self.assertEqual(extract.parse_payload(raw),[{'start':10.2,'end':16.119,'text':'Hallo'}])
    def test_vtt_xml_and_markup(self):
        vtt='WEBVTT\n\n00:00:10.200 --> 00:00:16.119 align:start\n<c>Hallo</c> &amp; Welt\n'
        xml='<transcript><text start="10.2" dur="5.919">Hallo &amp; Welt</text></transcript>'
        self.assertEqual(extract.parse_payload(vtt),extract.parse_payload(xml))
    def test_formatter(self):
        srt=server.format_cues(GOOD['cues'],'srt')
        self.assertTrue(srt.startswith('1\n00:00:10,200 --> 00:00:16,119'))
        self.assertTrue(server.format_cues(GOOD['cues'],'vtt').startswith('WEBVTT\n\n'))
    def test_fallback_and_cache_no_second_network_call(self):
        fail=subprocess.CompletedProcess([],1,json.dumps({'ok':False,'code':'CAPTIONS_BLOCKED'}),'')
        good=subprocess.CompletedProcess([],0,json.dumps(GOOD),'')
        with patch.object(server.subprocess,'run',side_effect=[fail,good]) as run:
            first=server.resolve({'id':'BESKw0hiZ3Q'})
            second=server.resolve({'id':'BESKw0hiZ3Q'})
            self.assertTrue(first['available']);self.assertEqual(first['timeUnit'],'seconds')
            self.assertEqual(first['attempts'][0]['engine'],'youtube-transcript-api')
            self.assertTrue(second['cached']);self.assertEqual(run.call_count,2)
    def test_failures_not_cached_or_misreported_missing(self):
        fail=subprocess.CompletedProcess([],1,json.dumps({'ok':False,'code':'CAPTIONS_BLOCKED'}),'')
        with patch.object(server.subprocess,'run',return_value=fail) as run:
            for _ in range(2):
                d=server.resolve({'id':'BESKw0hiZ3Q'})
                self.assertFalse(d['available']);self.assertEqual(d['code'],'CAPTIONS_BLOCKED')
            self.assertEqual(run.call_count,4)
    def test_timeout_tries_second_engine(self):
        good=subprocess.CompletedProcess([],0,json.dumps(GOOD),'')
        with patch.object(server.subprocess,'run',side_effect=[subprocess.TimeoutExpired('x',1),good]):
            self.assertTrue(server.resolve({'id':'BESKw0hiZ3Q'})['available'])
    def test_http_auth_export_and_cors(self):
        old=server.TOKEN; server.TOKEN='a-test-secret-not-for-production'
        http=server.BoundedServer(('127.0.0.1',0),server.Handler)
        thread=threading.Thread(target=http.serve_forever,daemon=True);thread.start()
        base='http://127.0.0.1:'+str(http.server_address[1])
        body=json.dumps({'id':'BESKw0hiZ3Q','format':'srt'}).encode()
        try:
            self.assertTrue(json.load(urllib.request.urlopen(base+'/health'))['ok'])
            req=urllib.request.Request(base+'/v1/transcript',data=body,headers={'Content-Type':'application/json'})
            with self.assertRaises(urllib.error.HTTPError) as caught:urllib.request.urlopen(req)
            self.assertEqual(caught.exception.code,401)
            req=urllib.request.Request(base+'/v1/export',data=body,headers={'Authorization':'Bearer '+server.TOKEN,'Content-Type':'application/json'})
            with patch.object(server,'resolve',return_value={'available':True,'videoId':'BESKw0hiZ3Q','cues':GOOD['cues']}):
                with urllib.request.urlopen(req) as response:
                    self.assertIn('.srt',response.headers['Content-Disposition']);self.assertIn(b'00:00:10,200',response.read())
            req=urllib.request.Request(base+'/v1/transcript',data=body,headers={'Authorization':'Bearer '+server.TOKEN,'Origin':'https://evil.example'})
            with self.assertRaises(urllib.error.HTTPError) as caught:urllib.request.urlopen(req)
            self.assertEqual(caught.exception.code,403)
        finally:
            http.shutdown();http.server_close();http.pool.shutdown();server.TOKEN=old

if __name__=='__main__':unittest.main()

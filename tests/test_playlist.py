import unittest
from services.transcript.playlist import normalize_playlist
class PlaylistTests(unittest.TestCase):
    def test_all_accessible_entries_and_unavailable_count(self):
        result=normalize_playlist({'id':'PLfixture123','title':'Fixture','playlist_count':3,'entries':[{'id':'abcdefghijk','title':'One'},{'id':'12345678901','title':'Two'},{'title':'[Private video]'}]},'PLfixture123')
        self.assertTrue(result['complete']);self.assertEqual(len(result['items']),2);self.assertEqual(result['unavailable'],1);self.assertEqual(result['total'],3)
    def test_no_partial_or_duplicate_success(self):
        entry={'id':'abcdefghijk','title':'One'}
        for data in [{'id':'wrong','entries':[entry]},{'id':'PLfixture123','playlist_count':2,'entries':[entry]},{'id':'PLfixture123','entries':[entry,entry]},{'id':'PLfixture123','playlist_count':2001,'entries':[entry]}]:
            self.assertFalse(normalize_playlist(data,'PLfixture123')['available'])
if __name__=='__main__':unittest.main()

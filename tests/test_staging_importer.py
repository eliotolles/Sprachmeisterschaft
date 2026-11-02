import importlib.util
import io
import json
import os
import sqlite3
import sys
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "import_elio_staging_turso.py"
spec = importlib.util.spec_from_file_location("staging_importer", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class ImporterSafetyTests(unittest.TestCase):
    def test_endpoint_rejects_untrusted_hosts(self):
        for url in ["https://example.org", "http://my-db.turso.io", "https://evil-turso.io",
                    "https://user:pass@my-db.turso.io", "https://my-db.turso.io/?token=x"]:
            with self.subTest(url=url), self.assertRaises(ValueError):
                module.endpoint(url)
        self.assertEqual(module.endpoint("libsql://my-db.turso.io"),
                         "https://my-db.turso.io/v2/pipeline")

    def test_dry_run_requires_no_credentials_or_network(self):
        with tempfile.TemporaryDirectory() as directory:
            path = os.path.join(directory, "test.db")
            connection = sqlite3.connect(path)
            connection.execute(module.CREATE)
            connection.execute("INSERT INTO elio_shared_vocabulary (source_id, german) VALUES (?, ?)", ("a", "Haus"))
            connection.commit()
            connection.close()
            with patch.object(sys, "argv", ["importer", path]), patch.object(module, "execute") as remote:
                output = io.StringIO()
                with redirect_stdout(output):
                    module.main()
                remote.assert_not_called()
                result = json.loads(output.getvalue())
                self.assertEqual(result["mode"], "dry-run")
                self.assertEqual(result["records"], 1)

    def test_apply_without_explicit_host_never_writes(self):
        with tempfile.TemporaryDirectory() as directory:
            path = os.path.join(directory, "test.db")
            connection = sqlite3.connect(path)
            connection.execute(module.CREATE)
            connection.execute("INSERT INTO elio_shared_vocabulary (source_id, german) VALUES (?, ?)", ("a", "Haus"))
            connection.commit()
            connection.close()
            with patch.object(sys, "argv", ["importer", path, "--apply", "--acknowledge-isolated-database"]), \
                 patch.object(module, "execute") as remote:
                with redirect_stdout(io.StringIO()), self.assertRaisesRegex(ValueError, "exact expected host"):
                    module.main()
                remote.assert_not_called()


    def test_remote_count_rejects_malformed_response(self):
        with patch.object(module, "execute", return_value={"results": []}):
            with self.assertRaisesRegex(RuntimeError, "Malformed Turso count"):
                module.remote_count("https://fake.turso.io/v2/pipeline", "fake")

    def test_remote_count_reads_turso_integer_cell(self):
        response = {"results": [{"response": {"result": {"rows": [[{"type": "integer", "value": "6718"}]]}}}]}
        with patch.object(module, "execute", return_value=response):
            self.assertEqual(module.remote_count("https://fake.turso.io/v2/pipeline", "fake"), 6718)
\nif __name__ == "__main__":\n    unittest.main()\n
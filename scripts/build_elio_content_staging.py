#!/usr/bin/env python3
"""Build a reversible, isolated Elio learning-content SQLite staging database.

Usage: python3 scripts/build_elio_content_staging.py vocabulary_staging.json output.db
Never run against the production Turso database. Does not import users or secrets.
"""
import json
import sqlite3
import sys
from pathlib import Path

SCHEMA = """
CREATE TABLE IF NOT EXISTS migration_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS elio_shared_vocabulary (
  source_id TEXT PRIMARY KEY,
  german TEXT NOT NULL,
  article TEXT NOT NULL DEFAULT '',
  word_type TEXT NOT NULL DEFAULT '',
  vietnamese TEXT NOT NULL DEFAULT '',
  example_de TEXT NOT NULL DEFAULT '',
  example_vi TEXT NOT NULL DEFAULT '',
  topic TEXT NOT NULL DEFAULT '',
  level TEXT NOT NULL DEFAULT '',
  source_deck_id TEXT NOT NULL DEFAULT '',
  extra_json TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_elio_vocab_topic ON elio_shared_vocabulary(topic);
CREATE INDEX IF NOT EXISTS idx_elio_vocab_level ON elio_shared_vocabulary(level);
"""

FIELDS = ("german", "article", "word_type", "vietnamese", "example_de",
          "example_vi", "topic", "level", "source_deck_id")
EXTRA = ("english", "meaning_de", "synonyms", "phrases")

def build(source, output):
    source, output = Path(source), Path(output)
    if source.resolve() == output.resolve():
        raise ValueError("Source and destination must be different")
    if output.exists():
        raise FileExistsError("Refusing to overwrite an existing database")
    records = json.loads(source.read_text(encoding="utf-8"))
    if not isinstance(records, list):
        raise ValueError("Expected a list of vocabulary records")
    seen = set()
    rows = []
    for idx, record in enumerate(records):
        if not isinstance(record, dict):
            raise ValueError(f"Invalid item {idx}")
        identifier = str(record.get("source_id") or "").strip()
        german = str(record.get("german") or "").strip()
        if not identifier or not german or identifier in seen:
            raise ValueError(f"Missing/duplicate source_id or german at item {idx}")
        seen.add(identifier)
        values = [str(record.get(field) or "") for field in FIELDS]
        extra = {field: record[field] for field in EXTRA if field in record}
        rows.append((identifier, *values, json.dumps(extra, ensure_ascii=False)))
    try:
        with sqlite3.connect(output) as conn:
            conn.executescript(SCHEMA)
            conn.executemany(
                "INSERT INTO elio_shared_vocabulary VALUES (?,?,?,?,?,?,?,?,?,?,?)", rows
            )
            conn.execute("INSERT INTO migration_meta VALUES (?,?)",
                         ("source", "Elio vocabulary staging; no user or secret data"))
            actual = conn.execute("SELECT COUNT(*) FROM elio_shared_vocabulary").fetchone()[0]
            integrity = conn.execute("PRAGMA integrity_check").fetchone()[0]
            if actual != len(rows) or integrity != "ok":
                raise RuntimeError("Migration validation failed")
        return actual
    except BaseException:
        output.unlink(missing_ok=True)
        raise

if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    print(f"Staged {build(sys.argv[1], sys.argv[2])} records; production unchanged.")

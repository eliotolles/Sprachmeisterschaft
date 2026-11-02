#!/usr/bin/env python3
"""Read-only audit for Elio vocabulary staging SQLite. Does not modify the database."""
import json
import sqlite3
import sys
from pathlib import Path

def audit(path):
    uri = Path(path).resolve().as_uri() + "?mode=ro"
    con = sqlite3.connect(uri, uri=True)
    try:
        integrity = con.execute("PRAGMA integrity_check").fetchone()[0]
        count, unique = con.execute(
            "SELECT COUNT(*), COUNT(DISTINCT source_id) FROM elio_shared_vocabulary"
        ).fetchone()
        empty = con.execute(
            "SELECT COUNT(*) FROM elio_shared_vocabulary WHERE trim(german) = '' OR trim(source_id) = ''"
        ).fetchone()[0]
        suspicious = con.execute("""
            SELECT source_id, german, topic FROM elio_shared_vocabulary
            WHERE lower(trim(word_type)) IN ('loại từ', 'wortart')
               OR lower(trim(vietnamese)) IN ('nghĩa tiếng việt', 'bedeutung')
               OR german LIKE '%(Từ vựng)%'
            ORDER BY source_id LIMIT 100
        """).fetchall()
        return {
            "integrity": integrity,
            "count": count,
            "unique_ids": unique,
            "missing_required": empty,
            "suspicious_placeholder_samples": [
                {"source_id": x, "german": y, "topic": z} for x, y, z in suspicious
            ],
            "pass": integrity == "ok" and count == unique and empty == 0,
        }
    finally:
        con.close()

if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python scripts/audit_elio_staging.py staged.db")
    report = audit(sys.argv[1])
    print(json.dumps(report, ensure_ascii=False, indent=2))
    sys.exit(0 if report["pass"] else 1)

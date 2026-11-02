#!/usr/bin/env python3
"""Prepare an isolated Turso staging import. DRY RUN by default.

Requires a staging-only Turso database. Never reads or writes production credentials.
Usage:
  python scripts/import_elio_staging_turso.py staging.db
  ELIO_STAGING_TURSO_DATABASE_URL=libsql://... \
  ELIO_STAGING_TURSO_AUTH_TOKEN=... \
  python scripts/import_elio_staging_turso.py staging.db --apply --acknowledge-isolated-database \\
    --expected-staging-host my-isolated-db-org.turso.io
"""
import argparse
import json
import os
import sqlite3
import sys
import urllib.error
import urllib.parse
import urllib.request

COLUMNS = ("source_id", "german", "article", "word_type", "vietnamese",
           "example_de", "example_vi", "topic", "level", "source_deck_id", "extra_json")
CREATE = """CREATE TABLE IF NOT EXISTS elio_shared_vocabulary (
source_id TEXT PRIMARY KEY, german TEXT NOT NULL, article TEXT NOT NULL DEFAULT '',
word_type TEXT NOT NULL DEFAULT '', vietnamese TEXT NOT NULL DEFAULT '',
example_de TEXT NOT NULL DEFAULT '', example_vi TEXT NOT NULL DEFAULT '',
topic TEXT NOT NULL DEFAULT '', level TEXT NOT NULL DEFAULT '',
source_deck_id TEXT NOT NULL DEFAULT '', extra_json TEXT NOT NULL DEFAULT '{}')"""

def endpoint(raw):
    url = urllib.parse.urlparse(raw.replace("libsql://", "https://", 1).replace("wss://", "https://", 1))
    if url.scheme != "https" or not url.hostname or not url.hostname.endswith(".turso.io"):
        raise ValueError("Staging endpoint must be a Turso HTTPS host")
    if url.username or url.password or url.query or url.fragment or url.path not in ("", "/"):
        raise ValueError("Invalid Turso staging endpoint")
    return "https://" + url.netloc + "/v2/pipeline"

def execute(url, token, statements):
    requests = [{"type": "execute", "stmt": {"sql": sql, "args": args}} for sql, args in statements]
    requests.append({"type": "close"})
    body = json.dumps({"requests": requests}).encode()
    req = urllib.request.Request(url, body, {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json",
    }, method="POST")
    with urllib.request.urlopen(req, timeout=40) as response:
        result = json.load(response)
    if len(result.get("results", [])) != len(requests):
        raise RuntimeError("Incomplete Turso response")
    if any(item.get("type") != "ok" for item in result["results"]):
        raise RuntimeError("Turso rejected import batch")
    return result

def remote_count(url, token):
    response = execute(url, token, [("SELECT COUNT(*) AS n FROM elio_shared_vocabulary", [])])
    try:
        return int(response["results"][0]["response"]["result"]["rows"][0][0]["value"])
    except (KeyError, IndexError, TypeError, ValueError) as error:
        raise RuntimeError("Malformed Turso count response") from error

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("sqlite_file")
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--acknowledge-isolated-database", action="store_true")
    parser.add_argument("--expected-staging-host", help="Exact hostname of the separately created staging Turso database")
    args = parser.parse_args()
    connection = sqlite3.connect("file:" + os.path.abspath(args.sqlite_file) + "?mode=ro", uri=True)
    try:
        if connection.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
            raise ValueError("SQLite integrity failed")
        count, unique = connection.execute(
            "SELECT COUNT(*), COUNT(DISTINCT source_id) FROM elio_shared_vocabulary").fetchone()
        if not count or count != unique:
            raise ValueError("Empty or duplicate staging source IDs")
        print(json.dumps({"mode": "apply" if args.apply else "dry-run",
                          "records": count, "unique_ids": unique,
                          "target": "isolated staging only"}))
        if not args.apply:
            return
        if not args.acknowledge_isolated_database or not args.expected_staging_host:
            raise ValueError("Explicit staging acknowledgement and exact expected host required")
        raw = os.environ.get("ELIO_STAGING_TURSO_DATABASE_URL", "")
        token = os.environ.get("ELIO_STAGING_TURSO_AUTH_TOKEN", "")
        if not raw or not token:
            raise ValueError("Missing staging-only Turso credentials")
        prod = os.environ.get("TURSO_DATABASE_URL", "")
        if prod and endpoint(raw) == endpoint(prod):
            raise ValueError("Staging URL matches production URL")
        url = endpoint(raw)
        parsed_host = urllib.parse.urlparse(url).hostname
        if parsed_host != args.expected_staging_host.lower().strip():
            raise ValueError("Staging host does not match explicitly expected host")
        if not parsed_host or not parsed_host.endswith(".turso.io"):
            raise ValueError("Invalid staging hostname")
        execute(url, token, [(CREATE, [])])
        before = remote_count(url, token)
        if before != 0:
            raise ValueError("Target staging table is not empty; refusing to alter existing data")
        sql = ("INSERT OR IGNORE INTO elio_shared_vocabulary (" + ",".join(COLUMNS)
               + ") VALUES (" + ",".join("?" for _ in COLUMNS) + ")")
        cursor = connection.execute("SELECT " + ",".join(COLUMNS) + " FROM elio_shared_vocabulary ORDER BY source_id")
        processed = 0
        while True:
            rows = cursor.fetchmany(25)
            if not rows:
                break
            statements = [(sql, [{"type": "text", "value": str(value if value is not None else "")}
                                  for value in row]) for row in rows]
            execute(url, token, statements)
            processed += len(rows)
            print("Processed", processed, "of", count)
        after = remote_count(url, token)
        if after != count:
            raise RuntimeError("Remote staging row count does not match source")
        print(json.dumps({"verified_remote_count": after, "source_count": count, "status": "verified"}))
    finally:
        connection.close()

if __name__ == "__main__":
    try:
        main()
    except (ValueError, RuntimeError, sqlite3.Error, urllib.error.URLError) as error:
        print("Staging import stopped:", str(error), file=sys.stderr)
        sys.exit(1)

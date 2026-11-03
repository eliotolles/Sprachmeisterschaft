# Source-backed colon-format password compatibility

An existing, clean local ElioEinfach checkout is available at commit
`423250a356f38f187b42810d4bcc98bae5a01ac2` (2026-11-01). Its committed
`worker/index.js` defines `passwordHash(password, salt=random())` as:

- 32 random bytes encoded as 64 lowercase hexadecimal characters for the salt;
- PBKDF2 with SHA-256, 100,000 iterations and 256 output bits;
- the UTF-8 hexadecimal salt string as derivation salt (not decoded salt bytes);
- output `salt + ':' + hex(derivedBits)`.

The current GitHub connector still returns 404 for `eliotolles/ElioEinfach`.
That does not establish deletion. The local committed source provides evidence
for this precise format; it is not evidence about current remote HEAD or live
account credentials. No files in that source checkout were changed.

`passwordMatches` now accepts that exact 64-hex:64-hex encoding in addition to
the existing `pbkdf2$100000$...` encoding. New passwords retain the modern format.
Unknown encodings, Google markers, malformed lengths and unexpected parameters
still fail closed. Verification uses a constant-work comparison, and login does
not update hashes, reset passwords, change IDs/roles or delete existing sessions.

Tests derive an independent synthetic fixture with Node's `pbkdf2Sync`, exercise
actual SQLite-backed gateway login, reject wrong passwords/unknown encodings and
assert that the user record and previous session table remain untouched.

The prior backup path is absent from this workspace. No live database was read or
written, and no user password/hash was disclosed. Therefore this change does NOT
prove that the three previously unverified account hashes use this exact format.
Their mapping and actual login acceptance remain blockers until verified in an
authorized environment with the relevant source/data. No raw password is needed
in chat. Google OAuth acceptance is independently outstanding.

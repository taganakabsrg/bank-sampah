# Security Specification - Remix: Master Bank Sampah

## Data Invariants
1. A **User** profile is only readable by the user themselves or an admin.
2. Only admins can update **HargaSampah**. All users can read it.
3. **Setoran** is created by admins, but belongs to a nasabah. Nasabah can only read their own setoran. Admins can read all.
4. **Penarikan** requests are created by nasabah. Nasabah can only read/update their own (update limited to certain fields or status pending). Admins can update status.
5. **Penjualan** records are managed exclusively by admins.
6. **Sessions** are only accessible by the owner.

## The "Dirty Dozen" Payloads (Red Team Test Cases)
1. **Identity Spoofing**: Attempt to create a user profile with a different UID than `auth.uid`.
2. **Privilege Escalation**: Non-admin attempting to update waste prices (`hargaSampah`).
3. **Balance Tampering**: Nasabah attempting to directly update their `balance` field.
4. **Illegal Deletion**: Nasabah attempting to delete their own account or records.
5. **Session Hijacking**: User A attempting to read User B's active sessions.
6. **Atomic Sync Failure**: Creating a `Setoran` without updating the user's `balance` (requires `existsAfter`).
7. **Status Injection**: Nasabah attempting to set a `Penarikan` status to 'approved' during creation.
8. **Junk ID Poisoning**: Creating a record with a 2MB string as a document ID.
9. **Email Spoofing**: Attempting admin access with a non-verified email.
10. **Shadow Update**: Adding a `isAdmin: true` field to a regular user profile.
11. **Bulk Exfiltration**: Attempting to list all users as a regular nasabah.
12. **Orphaned Writes**: Creating a `Setoran` for a non-existent `sampahId`.

## Test Runner (Draft)
A comprehensive test suite will be implemented in `firestore.rules.test.ts` using the Firebase Emulator Suite.

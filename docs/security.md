# FertiLens AI — Security Architecture & Data-At-Rest Encryption

## 1. Overview & Threat Model

FertiLens AI is designed to protect sensitive Assisted Reproductive Technology (ART) patient health information (PHI) while maintaining high-performance clinical workflows and RAG vector searches.

The system addresses the following key threats:
1. **Database Compromise / Physical Leakage**: If a raw MongoDB dump or storage volume is stolen, PHI fields (names, phone numbers, clinical diagnoses, notes) cannot be read.
2. **File Storage Exfiltration**: PDF documents (ultrasound scans, lab panels, clinician case notes) stored on disk are encrypted using authenticated symmetric encryption (AES-256-GCM).
3. **Cross-Portal Privilege Escalation**: Separate hospital and patient login portals prevent credential reuse and account confusion. Any cross-portal authentication attempt is rejected with a generic `401 Unauthorized` and recorded to the immutable audit log (`wrong_portal_login`).
4. **Information Leakage via Search**: Patient searches by name use deterministic HMAC-SHA256 blind indexing rather than decrypting every record or storing plaintext names in MongoDB indexes.

---

## 2. Authentication & Authorization

### 2.1 Dual-Portal Isolation
- **Hospital Staff Portal** (`/login/hospital`): Restricts access to roles `doctor`, `staff`, `admin`. Rejects patient credentials with generic "Invalid email or password" and audit log `wrong_portal_login`.
- **Patient Portal** (`/login/patient`): Restricts access to role `patient`. Rejects clinical credentials with generic "Invalid email or password" and audit log `wrong_portal_login`.
- **Chooser Gateway** (`/login`): Directs users to the appropriate clinical or patient portal.
- **Tokens**: Dual-token architecture using `httpOnly`, `Secure`, `SameSite=Lax` cookies with strict rotation and cryptographic token reuse detection (`pwdlib[argon2]`, `PyJWT`).

---

## 3. Data-At-Rest Encryption Architecture

### 3.1 Field-Level Encryption (`MultiFernet`)
- **Engine**: Python `cryptography` library with `MultiFernet`.
- **Key Rotation**: Configured via comma-separated `ENCRYPTION_KEY` in environment variables. The primary (first) key is used for all new encryptions, while any previous keys in the list can be used for decryption.
- **Ciphertext Format**: Sensitive fields are stored as:
  ```
  enc:v1:<base64-encoded-fernet-token>
  ```
- **Idempotence**: Fields already starting with `enc:v1:` are never re-encrypted.

### 3.2 Sensitive Field Mapping
The following fields are encrypted before writing to MongoDB:
| Collection | Encrypted Fields |
| :--- | :--- |
| `patients` | `first_name`, `last_name`, `email`, `phone`, `address`, `emergency_contact`, `dob`, `primary_diagnosis`, `notes` |
| `medical_records` | `title`, `clinical_summary`, `findings`, `plan` |
| `documents` | `original_filename`, `title` |
| `document_chunks` | `text`, `document_title` |
| `appointments` | `title`, `notes` |
| `followups` | `title`, `description`, `resolution_notes` |
| `notifications` | `title`, `message` |
| `chat_messages` | `content` |

*Note: Identifiers (`_id`, `patient_id`, `user_id`, `mrn`), roles, statuses, numerical metrics (`amh_level`, `fsh_level`, `afc`), and 768-dimensional vector embeddings are NOT encrypted to enable indexing, role enforcement, and vector similarity search.*

### 3.3 Blind Indexing (`HMAC-SHA256`)
To allow exact-match patient searches by name without exposing plaintext in the database or decrypting every record:
1. Names (first name, last name, full name) are normalized (lowercase, trimmed).
2. An HMAC-SHA256 digest is generated using `SEARCH_INDEX_KEY`.
3. Hashes are stored in the `name_search_tokens` array on each patient document.
4. Searches compute the HMAC token for user queries and execute fast indexed `$in` queries against `name_search_tokens`.

### 3.4 File-Level Encryption (`AES-256-GCM`)
- **Algorithm**: AES-256 in Galois/Counter Mode (GCM) providing both confidentiality and integrity authentication.
- **Key Derivation**: SHA-256 derived from the primary encryption key.
- **Nonce**: 12-byte cryptographically secure random nonce generated per file.
- **Header**: Encrypted files on disk begin with the magic bytes `ENC_GCM_V1:`.
- **Transparent Ingestion & Decryption**: PyMuPDF (`fitz`) opens decrypted streams in-memory during RAG ingestion without writing plaintext files to disk.

---

## 4. Migration & Maintenance

- **Migration Tool**: `backend/scripts/encrypt_existing_data.py`
  - Scans all MongoDB collections and local upload directories.
  - Automatically encrypts unencrypted records and files while preserving existing ciphertext.
  - Safe to execute repeatedly (idempotent).
- **Automated Seeder**: `backend/scripts/seed_chatbot_demo_data.py`
  - Upserts synthetic demo patients, records, appointments, and PDFs directly in encrypted format.
- **Test Suite**: `backend/tests/test_encryption.py`
  - Validates encryption/decryption roundtrips, blind index consistency, repository transparency, and file streaming decryption.

import os
import hmac
import hashlib
from typing import Dict, Any, List, Optional, Union
from cryptography.fernet import Fernet, MultiFernet
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.core.config import settings
from app.core.logging_config import logger

CIPHER_PREFIX = "enc:v1:"

# Define sensitive fields per collection
SENSITIVE_FIELDS: Dict[str, List[str]] = {
    "patients": [
        "first_name",
        "last_name",
        "email",
        "phone",
        "address",
        "emergency_contact",
        "dob",
        "primary_diagnosis",
        "notes"
    ],
    "medical_records": [
        "title",
        "clinical_summary",
        "findings",
        "plan"
    ],
    "documents": [
        "original_filename",
        "title"
    ],
    "document_chunks": [
        "text",
        "document_title"
    ],
    "appointments": [
        "title",
        "notes"
    ],
    "followups": [
        "title",
        "description",
        "resolution_notes"
    ],
    "notifications": [
        "title",
        "message"
    ],
    "chat_messages": [
        "content"
    ]
}

def get_multi_fernet() -> MultiFernet:
    """
    Initializes MultiFernet supporting key rotation.
    First key in comma-separated list is the primary encryption key.
    All keys are used for decryption.
    """
    raw_keys = [k.strip() for k in settings.ENCRYPTION_KEY.split(",") if k.strip()]
    if not raw_keys:
        # Fallback to a stable default key if none configured
        raw_keys = ["cT9uNQ8vCpKER3w00TT4LsnBEDG1HGoP0GiDVbBOSVc="]
    
    fernet_instances = [Fernet(k.encode() if isinstance(k, str) else k) for k in raw_keys]
    return MultiFernet(fernet_instances)

_fernet_engine = get_multi_fernet()

def encrypt_field(value: Any) -> Any:
    """
    Encrypts a string or serializable field using MultiFernet.
    Returns string prefixed with 'enc:v1:'
    """
    if value is None:
        return None
    if not isinstance(value, str):
        val_str = str(value)
    else:
        val_str = value

    if not val_str:
        return val_str

    # Idempotent check
    if val_str.startswith(CIPHER_PREFIX):
        return val_str

    try:
        ciphertext = _fernet_engine.encrypt(val_str.encode("utf-8")).decode("utf-8")
        return f"{CIPHER_PREFIX}{ciphertext}"
    except Exception as e:
        logger.error(f"Field encryption failed: {e}")
        return val_str

def decrypt_field(value: Any) -> Any:
    """
    Decrypts a ciphertext field prefixed with 'enc:v1:' using MultiFernet.
    """
    if value is None or not isinstance(value, str):
        return value

    if not value.startswith(CIPHER_PREFIX):
        return value

    raw_token = value[len(CIPHER_PREFIX):]
    try:
        plaintext = _fernet_engine.decrypt(raw_token.encode("utf-8")).decode("utf-8")
        return plaintext
    except Exception as e:
        logger.warning(f"Field decryption failed or invalid key: {e}")
        return value

def compute_blind_index_token(token: str) -> str:
    """
    Generates a deterministic HMAC-SHA256 blind index hash for exact searches
    on encrypted terms without revealing the plaintext.
    """
    if not token:
        return ""
    normalized = token.lower().strip().encode("utf-8")
    key = settings.SEARCH_INDEX_KEY.encode("utf-8")
    return hmac.new(key, normalized, hashlib.sha256).hexdigest()

def generate_name_search_tokens(first_name: Optional[str], last_name: Optional[str]) -> List[str]:
    """
    Generates blind index tokens for exact name queries.
    """
    tokens = set()
    fn = (first_name or "").strip().lower()
    ln = (last_name or "").strip().lower()

    if fn:
        tokens.add(compute_blind_index_token(fn))
    if ln:
        tokens.add(compute_blind_index_token(ln))
    if fn and ln:
        tokens.add(compute_blind_index_token(f"{fn} {ln}"))
        tokens.add(compute_blind_index_token(f"{ln} {fn}"))

    return list(tokens)

def encrypt_doc(doc: Optional[Dict[str, Any]], collection_name: str) -> Optional[Dict[str, Any]]:
    """
    Recursively encrypts sensitive fields in a document before persisting to MongoDB.
    """
    if not doc:
        return doc
    encrypted = dict(doc)
    fields = SENSITIVE_FIELDS.get(collection_name, [])

    for field in fields:
        if field in encrypted and encrypted[field] is not None:
            encrypted[field] = encrypt_field(encrypted[field])

    # Special handling for patients: add blind index search tokens
    if collection_name == "patients":
        fn = decrypt_field(doc.get("first_name"))
        ln = decrypt_field(doc.get("last_name"))
        encrypted["name_search_tokens"] = generate_name_search_tokens(fn, ln)

    return encrypted

def decrypt_doc(doc: Optional[Dict[str, Any]], collection_name: str) -> Optional[Dict[str, Any]]:
    """
    Decrypts sensitive fields in a document after reading from MongoDB.
    """
    if not doc:
        return doc
    decrypted = dict(doc)
    fields = SENSITIVE_FIELDS.get(collection_name, [])

    for field in fields:
        if field in decrypted and decrypted[field] is not None:
            decrypted[field] = decrypt_field(decrypted[field])

    return decrypted

def decrypt_docs(docs: List[Dict[str, Any]], collection_name: str) -> List[Dict[str, Any]]:
    return [decrypt_doc(d, collection_name) for d in docs if d is not None]

# ----------------- File Encryption At Rest (AES-256-GCM) ----------------- #

def _get_aes_gcm_key() -> bytes:
    """Derives 32-byte AES key from primary encryption key."""
    raw_key = settings.ENCRYPTION_KEY.split(",")[0].strip().encode("utf-8")
    return hashlib.sha256(raw_key).digest()

FILE_MAGIC_BYTES = b"ENC_GCM_V1:"

def encrypt_file_bytes(file_bytes: bytes) -> bytes:
    """
    Encrypts file bytes using AES-256-GCM with a fresh 12-byte nonce.
    Returns: FILE_MAGIC_BYTES (11 bytes) + nonce (12 bytes) + ciphertext + tag (16 bytes)
    """
    if file_bytes.startswith(FILE_MAGIC_BYTES):
        return file_bytes  # Already encrypted

    key = _get_aes_gcm_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, file_bytes, None)
    return FILE_MAGIC_BYTES + nonce + ciphertext

def decrypt_file_bytes(encrypted_bytes: bytes) -> bytes:
    """
    Decrypts AES-256-GCM encrypted file bytes.
    If file is not encrypted (legacy or raw PDF), returns bytes as is.
    """
    if not encrypted_bytes.startswith(FILE_MAGIC_BYTES):
        return encrypted_bytes

    key = _get_aes_gcm_key()
    aesgcm = AESGCM(key)
    nonce = encrypted_bytes[len(FILE_MAGIC_BYTES):len(FILE_MAGIC_BYTES) + 12]
    ciphertext = encrypted_bytes[len(FILE_MAGIC_BYTES) + 12:]
    return aesgcm.decrypt(nonce, ciphertext, None)

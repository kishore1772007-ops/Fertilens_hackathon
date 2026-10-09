"""
Migration script: Encrypt existing data at rest in MongoDB and local PDF files on disk.
Idempotent: Only unencrypted fields (not prefixed with 'enc:v1:') and unencrypted files
(not prefixed with 'ENC_GCM_V1:') are encrypted.
"""
import asyncio
import os
import sys
import certifi
from motor.motor_asyncio import AsyncIOMotorClient

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.core.encryption import (
    SENSITIVE_FIELDS,
    encrypt_doc,
    encrypt_file_bytes,
    FILE_MAGIC_BYTES,
    CIPHER_PREFIX
)

COLLECTIONS_TO_ENCRYPT = [
    "patients",
    "medical_records",
    "documents",
    "document_chunks",
    "appointments",
    "followups",
    "notifications",
    "chat_messages"
]

async def run_migration():
    print("=================================================================")
    print("  FERTILENS AI — AT-REST ENCRYPTION MIGRATION")
    print("=================================================================")
    print(f"Connecting to MongoDB at {settings.MONGODB_URI}...")

    try:
        client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=8000,
            uuidRepresentation="standard"
        )
        db = client[settings.MONGODB_DB_NAME]
        await client.admin.command("ping")
        print(f"Connected to database: {settings.MONGODB_DB_NAME}")
    except Exception as e:
        print(f"Cloud Atlas connection failed ({e}). Falling back to local mongomock.")
        from mongomock_motor import AsyncMongoMockClient
        client = AsyncMongoMockClient()
        db = client[settings.MONGODB_DB_NAME]

    total_encrypted_docs = 0
    total_skipped_docs = 0

    for col_name in COLLECTIONS_TO_ENCRYPT:
        collection = db[col_name]
        fields = SENSITIVE_FIELDS.get(col_name, [])
        if not fields:
            continue

        print(f"\nProcessing collection: {col_name} (Sensitive fields: {fields})...")
        cursor = collection.find({})
        col_encrypted = 0
        col_skipped = 0

        async for doc in cursor:
            doc_id = doc["_id"]
            needs_update = False
            
            # Check if any sensitive field is unencrypted
            for field in fields:
                val = doc.get(field)
                if val is not None and isinstance(val, str) and not val.startswith(CIPHER_PREFIX):
                    needs_update = True
                    break

            # Special check for patients collection: ensure name_search_tokens is populated
            if col_name == "patients" and "name_search_tokens" not in doc:
                needs_update = True

            if needs_update:
                encrypted_doc = encrypt_doc(doc, col_name)
                # Keep _id unchanged
                encrypted_doc["_id"] = doc_id
                await collection.replace_one({"_id": doc_id}, encrypted_doc)
                col_encrypted += 1
            else:
                col_skipped += 1

        print(f"  -> {col_name}: {col_encrypted} encrypted, {col_skipped} already encrypted / skipped.")
        total_encrypted_docs += col_encrypted
        total_skipped_docs += col_skipped

    # 2. Encrypt PDF files on disk
    print(f"\nScanning storage directory for unencrypted PDF files: {settings.UPLOAD_DIR}...")
    files_encrypted = 0
    files_skipped = 0

    if os.path.exists(settings.UPLOAD_DIR):
        for root, _, files in os.walk(settings.UPLOAD_DIR):
            for file in files:
                if file.lower().endswith(".pdf"):
                    filepath = os.path.join(root, file)
                    try:
                        with open(filepath, "rb") as f:
                            raw_bytes = f.read()

                        if raw_bytes.startswith(FILE_MAGIC_BYTES):
                            files_skipped += 1
                        else:
                            encrypted_data = encrypt_file_bytes(raw_bytes)
                            with open(filepath, "wb") as f:
                                f.write(encrypted_data)
                            files_encrypted += 1
                    except Exception as e:
                        print(f"Error encrypting file {filepath}: {e}")

    print(f"  -> PDF files on disk: {files_encrypted} encrypted, {files_skipped} already encrypted / skipped.")

    print("\n================ MIGRATION COMPLETE ================")
    print(f"Total documents updated: {total_encrypted_docs}")
    print(f"Total documents skipped (already encrypted): {total_skipped_docs}")
    print(f"Total PDF files encrypted: {files_encrypted}")
    print("====================================================\n")

if __name__ == "__main__":
    asyncio.run(run_migration())

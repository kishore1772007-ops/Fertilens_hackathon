from datetime import datetime, timezone
from typing import Dict, Any, List
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.services.pdf_service import extract_text_per_page
from app.rag.chunker import chunk_text
from app.services.embedding_service import embedding_service
from app.core.encryption import encrypt_doc
from app.core.logging_config import logger

async def ingest_document(
    db: AsyncIOMotorDatabase,
    document_id: str
) -> Dict[str, Any]:
    """
    Executes the full clinical document ingestion pipeline:
    1. Fetch document record (status: pending/processing)
    2. Extract text per page via PyMuPDF
    3. Generate overlapping chunks
    4. Compute embeddings via Ollama nomic-embed-text (768d)
    5. Save chunks to document_chunks collection
    6. Mark document status as 'indexed' (or 'failed' on error)
    """
    doc = await db.documents.find_one({"document_id": document_id})
    if not doc:
        raise ValueError(f"Document {document_id} not found in database")

    file_path = doc.get("stored_filepath")
    patient_id = doc.get("patient_id")
    title = doc.get("title")

    # Set status to processing
    await db.documents.update_one(
        {"document_id": document_id},
        {"$set": {"status": "processing", "updated_at": datetime.now(timezone.utc)}}
    )

    try:
        # Step 2: Extract text per page
        pages_data = extract_text_per_page(file_path)
        if not pages_data:
            raise ValueError("No text could be extracted from PDF file")

        # Step 3: Chunk text per page
        all_chunks = []
        for page in pages_data:
            page_num = page["page_number"]
            page_text = page["text"]
            chunks = chunk_text(page_text, page_number=page_num)
            all_chunks.extend(chunks)

        if not all_chunks:
            raise ValueError("Document yielded 0 text chunks")

        # Step 4: Embed chunks
        chunk_texts = [c["text"] for c in all_chunks]
        embeddings = await embedding_service.get_embeddings_batch(chunk_texts)

        # Step 5: Prepare chunk records for MongoDB
        chunk_records = []
        for idx, (chunk_info, emb) in enumerate(zip(all_chunks, embeddings)):
            chunk_records.append({
                "chunk_id": f"CHK-{document_id}-{idx + 1}",
                "patient_id": patient_id,
                "document_id": document_id,
                "document_title": title,
                "page_number": chunk_info["page_number"],
                "chunk_index": idx,
                "text": chunk_info["text"],
                "embedding": emb,
                "approved_for_patient": doc.get("approved_for_patient", False),
                "created_at": datetime.now(timezone.utc)
            })

        # Remove any old chunks for this document if re-ingesting
        await db.document_chunks.delete_many({"document_id": document_id})
        encrypted_chunks = [encrypt_doc(r, "document_chunks") for r in chunk_records]
        await db.document_chunks.insert_many(encrypted_chunks)

        # Step 6: Mark document as indexed
        await db.documents.update_one(
            {"document_id": document_id},
            {
                "$set": {
                    "status": "indexed",
                    "page_count": len(pages_data),
                    "chunk_count": len(chunk_records),
                    "error_message": None,
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )
        logger.info(f"Successfully indexed document {document_id}: {len(chunk_records)} chunks saved.")
        return {
            "status": "indexed",
            "document_id": document_id,
            "page_count": len(pages_data),
            "chunk_count": len(chunk_records)
        }

    except Exception as e:
        logger.error(f"Failed to ingest document {document_id}: {e}")
        await db.documents.update_one(
            {"document_id": document_id},
            {
                "$set": {
                    "status": "failed",
                    "error_message": str(e),
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )
        raise e

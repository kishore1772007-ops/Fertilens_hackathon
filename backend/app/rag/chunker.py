from typing import List, Dict, Any

def chunk_text(
    text: str,
    page_number: int,
    chunk_size_chars: int = 1500,  # ~400-600 tokens
    overlap_chars: int = 200        # ~50-80 tokens
) -> List[Dict[str, Any]]:
    """
    Chunks page text into overlapping windows.
    Returns list of chunks with metadata:
    [{ 'page_number': int, 'chunk_index': int, 'text': str }]
    """
    clean_text = " ".join(text.split())
    if not clean_text:
        return []

    chunks = []
    start = 0
    chunk_idx = 0

    while start < len(clean_text):
        end = start + chunk_size_chars
        chunk_text_slice = clean_text[start:end].strip()

        if chunk_text_slice:
            chunks.append({
                "page_number": page_number,
                "chunk_index": chunk_idx,
                "text": chunk_text_slice
            })
            chunk_idx += 1

        if end >= len(clean_text):
            break
        start += chunk_size_chars - overlap_chars

    return chunks

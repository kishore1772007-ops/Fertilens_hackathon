import os
import fitz  # PyMuPDF
from typing import List, Dict, Any
from app.core.logging_config import logger
from app.core.encryption import encrypt_file_bytes, decrypt_file_bytes

def extract_text_per_page(pdf_path: str) -> List[Dict[str, Any]]:
    """
    Extracts text per page from a PDF file using PyMuPDF (fitz).
    Decrypts transparently if the file on disk is encrypted with AES-256-GCM.
    Returns a list of dicts: [{'page_number': 1, 'text': '...'}]
    """
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF file not found at: {pdf_path}")

    pages_data = []
    with open(pdf_path, "rb") as f:
        file_bytes = f.read()

    decrypted_bytes = decrypt_file_bytes(file_bytes)
    doc = fitz.open(stream=decrypted_bytes, filetype="pdf")
    try:
        for page_idx in range(len(doc)):
            page = doc[page_idx]
            text = page.get_text("text").strip()
            pages_data.append({
                "page_number": page_idx + 1,
                "text": text
            })
    finally:
        doc.close()

    logger.info(f"Extracted {len(pages_data)} pages from {pdf_path}")
    return pages_data

def generate_synthetic_clinical_pdf(
    output_path: str,
    patient_name: str,
    patient_id: str,
    mrn: str,
    doctor_name: str,
    doc_title: str,
    pages_content: List[Dict[str, str]],
    encrypt_at_rest: bool = True
):
    """
    Generates a clean, multi-page synthetic clinical PDF using PyMuPDF.
    Each page contains clinical headers, metadata, and structured clinical notes.
    Encrypts the generated PDF file at rest using AES-256-GCM by default.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    doc = fitz.open()

    for idx, page_info in enumerate(pages_content):
        page = doc.new_page(width=612, height=792)  # Standard Letter size
        
        # Clinical Header Banner
        header_rect = fitz.Rect(50, 40, 562, 90)
        page.draw_rect(header_rect, color=(0.05, 0.58, 0.53), width=1.5)
        
        page.insert_text(
            (60, 60),
            "FERTILENS AI CLINICAL REPRODUCTIVE CENTER",
            fontsize=12,
            fontname="helv",
            fontfile=None,
            color=(0.05, 0.45, 0.4)
        )
        page.insert_text(
            (60, 75),
            f"Department of Reproductive Endocrinology & ART | Confidential Medical Record",
            fontsize=8,
            color=(0.3, 0.3, 0.3)
        )

        # Patient Demographics Stripe
        demographics_y = 110
        demo_text = (
            f"PATIENT: {patient_name.upper()} | ID: {patient_id} | MRN: {mrn} | "
            f"PHYSICIAN: {doctor_name} | PAGE: {idx + 1} of {len(pages_content)}"
        )
        page.insert_text((50, demographics_y), demo_text, fontsize=8, color=(0.2, 0.2, 0.2))
        page.draw_line(fitz.Point(50, demographics_y + 6), fitz.Point(562, demographics_y + 6), color=(0.8, 0.8, 0.8), width=1)

        # Document Section Title
        page.insert_text((50, 140), f"{doc_title.upper()} — {page_info.get('section', 'CLINICAL DOCUMENT')}", fontsize=11, color=(0.1, 0.1, 0.1))

        # Main Body Text
        body_text = page_info.get("text", "")
        body_rect = fitz.Rect(50, 160, 562, 720)
        page.insert_textbox(body_rect, body_text, fontsize=9.5, color=(0.1, 0.15, 0.2), lineheight=13)

        # Disclaimer Footer
        footer_text = "FertiLens AI Demo Synthetic Clinical Document • Strict ART Ground Truth Evidence Only"
        page.insert_text((50, 750), footer_text, fontsize=7.5, color=(0.5, 0.5, 0.5))

    pdf_bytes = doc.tobytes()
    doc.close()

    if encrypt_at_rest:
        final_bytes = encrypt_file_bytes(pdf_bytes)
    else:
        final_bytes = pdf_bytes

    with open(output_path, "wb") as f:
        f.write(final_bytes)

    logger.info(f"Generated synthetic clinical PDF at {output_path} (encrypted: {encrypt_at_rest})")

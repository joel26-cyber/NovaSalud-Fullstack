import sys
from pathlib import Path
from pypdf import PdfReader
from docx import Document

base = Path(__file__).parent

for pdf in ["TRABAJO_FINAL.pdf", "contenido.pdf"]:
    p = base / pdf
    reader = PdfReader(str(p))
    out = base / (p.stem + ".txt")
    with out.open("w", encoding="utf-8") as f:
        for i, page in enumerate(reader.pages, 1):
            f.write(f"\n\n===== PAGINA {i} =====\n\n")
            f.write(page.extract_text() or "")
    print(f"{pdf}: {len(reader.pages)} pages -> {out.name}")

docx_path = base / "FORMATO.docx"
doc = Document(str(docx_path))
out = base / "FORMATO.txt"
with out.open("w", encoding="utf-8") as f:
    for para in doc.paragraphs:
        if para.text.strip():
            f.write(para.text + "\n")
    for ti, table in enumerate(doc.tables, 1):
        f.write(f"\n\n===== TABLA {ti} =====\n")
        for row in table.rows:
            f.write(" | ".join(cell.text.strip() for cell in row.cells) + "\n")
print(f"FORMATO.docx -> {out.name}")

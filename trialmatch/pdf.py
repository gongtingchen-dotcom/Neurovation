"""PDF text extraction."""
from pypdf import PdfReader


def extract_text(file) -> str:
    """Return the text of every page. `file` is a path or a file-like object."""
    reader = PdfReader(file)
    return "\n".join((page.extract_text() or "") for page in reader.pages)

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
import pymupdf
import httpx
from bs4 import BeautifulSoup
from app.core.vectorstore import get_vectorstore

splitter = RecursiveCharacterTextSplitter(
    chunk_size=512,    # caracteres por chunk
    chunk_overlap=64,  # solapamiento para no perder contexto en los bordes
)

def _store(docs):
    chunks = splitter.split_documents(docs)
    get_vectorstore().add_documents(chunks)
    return len(chunks)

def ingest_pdf(file_bytes, filename):
    pdf = pymupdf.open(stream=file_bytes, filetype="pdf")
    docs = []
    for i, page in enumerate(pdf):
        text = page.get_text()
        if text.strip():
            docs.append(Document(
                page_content=text,
                metadata={"source": filename, "page": i + 1, "type": "pdf"}
            ))
    return _store(docs)

def ingest_text(content, filename):
    # Divide por headings para preservar secciones
    lines = content.splitlines()
    sections, heading, buffer = [], "intro", []
    for line in lines:
        if line.startswith("#"):
            if buffer:
                sections.append(Document(
                    page_content="\n".join(buffer),
                    metadata={"source": filename, "section": heading, "type": "markdown"}
                ))
            heading = line.lstrip("#").strip()
            buffer = [line]
        else:
            buffer.append(line)
    if buffer:
        sections.append(Document(
            page_content="\n".join(buffer),
            metadata={"source": filename, "section": heading, "type": "markdown"}
        ))
    return _store([s for s in sections if s.page_content.strip()])

async def ingest_url(url):
    async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
        resp = await client.get(url)
    soup = BeautifulSoup(resp.text, "html.parser")
    for tag in soup(["script", "style", "nav", "footer"]):
        tag.decompose()
    docs = []
    for el in soup.find_all(["h1","h2","h3","p","pre"]):
        text = el.get_text(" ").strip()
        if len(text) > 40:
            docs.append(Document(
                page_content=text,
                metadata={"source": url, "type": "url",
                          "anchor": "#" + (el.get("id") or "")}
            ))
    return _store(docs)
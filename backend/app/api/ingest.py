from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel
from app.services.ingestion import ingest_pdf, ingest_text, ingest_url

router = APIRouter(tags=["ingestion"])

class URLBody(BaseModel):
    url: str

@router.post("/ingest/file")
async def upload_file(file: UploadFile = File(...)):
    data = await file.read()
    name = file.filename or "file"
    if name.endswith(".pdf"):
        n = ingest_pdf(data, name)
    elif name.endswith((".md", ".txt")):
        n = ingest_text(data.decode(), name)
    else:
        raise HTTPException(415, "Only PDF, .md, .txt supported")
    return {"chunks_stored": n, "message": f"'{name}' ingested."}

@router.post("/ingest/url")
async def upload_url(body: URLBody):
    n = await ingest_url(body.url)
    return {"chunks_stored": n, "message": "URL ingested."}

@router.delete("/ingest/reset")
def reset():
    from app.core.vectorstore import get_vectorstore, get_retriever
    get_vectorstore().delete_collection()
    get_vectorstore.cache_clear()    # ← agrega esta línea
    return {"message": "Reset done."}
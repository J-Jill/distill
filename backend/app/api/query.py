from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.services.rag import rag_stream, AVAILABLE_MODELS

router = APIRouter(tags=["query"])

class QueryBody(BaseModel):
    question: str
    model: str = "llama-3.3-70b-versatile"

@router.get("/models")
def get_models():
    return {"models": [
        {"id": k, "name": v} for k, v in AVAILABLE_MODELS.items()
    ]}

@router.post("/query")
async def query(body: QueryBody):
    return StreamingResponse(
        rag_stream(body.question, body.model),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
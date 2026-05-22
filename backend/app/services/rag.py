import json
import os
from groq import AsyncGroq
from app.core.vectorstore import get_retriever

client = AsyncGroq(api_key=os.environ["GROQ_API_KEY"])

SYSTEM = """You are Distill. Answer ONLY from the CONTEXT provided.
Be concise and developer-friendly. Cite sources as [Source: X]."""

AVAILABLE_MODELS = {
    "llama-3.3-70b-versatile": "Llama 3.3 70B",
    "llama-3.1-8b-instant":    "Llama 3.1 8B (fast)",
    "mixtral-8x7b-32768":      "Mixtral 8x7B",
    "gemma2-9b-it":            "Gemma 2 9B",
}

async def rag_stream(question: str, model: str = "llama-3.3-70b-versatile"):
    # Valida que el modelo sea uno permitido
    if model not in AVAILABLE_MODELS:
        model = "llama-3.3-70b-versatile"

    docs = await get_retriever(k=5).ainvoke(question)

    if not docs:
        yield f'data: {json.dumps({"type":"token","content":"No relevant documentation found."})}\n\n'
        yield f'data: {json.dumps({"type":"done"})}\n\n'
        return

    context = "\n\n---\n\n".join(
        f"[{i+1}] Source: {d.metadata.get('source')} | {d.metadata.get('section','')}\n{d.page_content}"
        for i, d in enumerate(docs)
    )

    stream = await client.chat.completions.create(
        model=model,
        max_tokens=1024,
        messages=[
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": f"CONTEXT:\n{context}\n\nQUESTION: {question}"}
        ],
        stream=True,
    )

    async for chunk in stream:
        text = chunk.choices[0].delta.content or ""
        if text:
            yield f'data: {json.dumps({"type":"token","content":text})}\n\n'

    sources = [
        {
            "source": d.metadata.get("source", ""),
            "section": d.metadata.get("section", ""),
            "anchor": d.metadata.get("anchor", ""),
            "page": d.metadata.get("page"),
            "chunk": d.page_content[:200]
        }
        for d in docs
    ]
    yield f'data: {json.dumps({"type":"sources","content":sources})}\n\n'
    yield f'data: {json.dumps({"type":"done"})}\n\n'
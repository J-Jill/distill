from dotenv import load_dotenv
load_dotenv()  # debe ser lo primero, antes de cualquier otro import

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import ingest, query

app = FastAPI(title="Distill API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://distill-khaki-seven.vercel.app",
        "https://distill-git-main-j-jills-projects.vercel.app",
        "https://trydistill.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(ingest.router, prefix="/api")
app.include_router(query.router, prefix="/api")

@app.get("/health")
def health():
    return {"status": "ok"}
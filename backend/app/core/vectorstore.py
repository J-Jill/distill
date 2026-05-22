from functools import lru_cache
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

@lru_cache(maxsize=1)
def get_embeddings():
    return HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

@lru_cache(maxsize=1)
def get_vectorstore():
    return Chroma(
        collection_name="distill",
        embedding_function=get_embeddings(),
        persist_directory="./chroma_db", 
    )

def get_retriever(k=5):
    return get_vectorstore().as_retriever(search_kwargs={"k": k})
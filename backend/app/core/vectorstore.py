import os
from functools import lru_cache
from langchain_huggingface import HuggingFaceEndpointEmbeddings
from langchain_chroma import Chroma


@lru_cache(maxsize=1)
def get_embeddings() -> HuggingFaceEndpointEmbeddings:
    return HuggingFaceEndpointEmbeddings(
        model="sentence-transformers/all-MiniLM-L6-v2",
        huggingfacehub_api_token=os.environ["HF_API_KEY"],
    )


@lru_cache(maxsize=1)
def get_vectorstore() -> Chroma:
    return Chroma(
        collection_name="distill",
        embedding_function=get_embeddings(),
        persist_directory="/tmp/chroma_db",
    )


def get_retriever(k=5):
    return get_vectorstore().as_retriever(search_kwargs={"k": k})
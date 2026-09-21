from fastapi import APIRouter
from app.ai.ollama_client import ollama_client

router = APIRouter()

@router.get("/ollama-status")
async def get_ollama_status():
    return await ollama_client.check_health()

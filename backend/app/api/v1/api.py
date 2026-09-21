from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, subjects, documents, chat, summaries, flashcards, 
    questions, quizzes, plans, analytics, system
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Autenticação"])
api_router.include_router(subjects.router, prefix="/subjects", tags=["Matérias"])
api_router.include_router(documents.router, prefix="/documents", tags=["Documentos & Upload"])
api_router.include_router(chat.router, prefix="/chat", tags=["Chat com Matéria"])
api_router.include_router(summaries.router, prefix="/summaries", tags=["Resumos"])
api_router.include_router(flashcards.router, prefix="/flashcards", tags=["Flashcards"])
api_router.include_router(questions.router, prefix="/questions", tags=["Questões"])
api_router.include_router(quizzes.router, prefix="/quizzes", tags=["Simulados"])
api_router.include_router(plans.router, prefix="/plans", tags=["Plano de Estudos & Prova Amanhã"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Desempenho & Dashboard"])
api_router.include_router(system.router, prefix="/system", tags=["Status do Sistema & Ollama"])

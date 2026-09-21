from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.core.database import get_db
from app.models.models import User, Summary, Subject
from app.schemas.schemas import SummaryGenerateRequest, SummaryResponse
from app.api.deps import get_current_user
from app.services.study_generator_service import study_generator_service

router = APIRouter()

@router.get("/", response_model=List[SummaryResponse])
async def list_summaries(
    subject_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Summary).where(Summary.user_id == current_user.id)
    if subject_id:
        query = query.where(Summary.subject_id == subject_id)
    query = query.order_by(Summary.created_at.desc())
    
    res = await db.execute(query)
    return res.scalars().all()

@router.post("/generate", response_model=SummaryResponse)
async def generate_summary(
    req: SummaryGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    subject = await db.get(Subject, req.subject_id)
    if not subject or subject.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Matéria não encontrada.")

    try:
        summary = await study_generator_service.generate_summary(
            db=db,
            user_id=current_user.id,
            subject_id=req.subject_id,
            summary_type=req.summary_type,
            document_id=req.document_id,
            custom_instructions=req.custom_instructions
        )
        return summary
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar resumo com IA: {str(e)}")

@router.get("/{summary_id}", response_model=SummaryResponse)
async def get_summary(
    summary_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    summary = await db.get(Summary, summary_id)
    if not summary or summary.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Resumo não encontrado.")
    return summary

@router.delete("/{summary_id}")
async def delete_summary(
    summary_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    summary = await db.get(Summary, summary_id)
    if not summary or summary.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Resumo não encontrado.")
    await db.delete(summary)
    await db.commit()
    return {"message": "Resumo excluído com sucesso."}

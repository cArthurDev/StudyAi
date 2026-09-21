from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.core.database import get_db
from app.models.models import User, Flashcard, Subject, FlashcardReview
from app.schemas.schemas import (
    FlashcardGenerateRequest, FlashcardResponse, FlashcardReviewRequest
)
from app.api.deps import get_current_user
from app.services.study_generator_service import study_generator_service
from app.services.mastery_service import mastery_service

router = APIRouter()

@router.get("/", response_model=List[FlashcardResponse])
async def list_flashcards(
    subject_id: Optional[str] = None,
    due_only: Optional[bool] = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Flashcard).where(Flashcard.user_id == current_user.id)
    if subject_id:
        query = query.where(Flashcard.subject_id == subject_id)
    query = query.order_by(Flashcard.next_review_at.asc())
    
    res = await db.execute(query)
    return res.scalars().all()

@router.post("/generate", response_model=List[FlashcardResponse])
async def generate_flashcards(
    req: FlashcardGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    subject = await db.get(Subject, req.subject_id)
    if not subject or subject.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Matéria não encontrada.")

    try:
        flashcards = await study_generator_service.generate_flashcards(
            db=db,
            user_id=current_user.id,
            subject_id=req.subject_id,
            count=req.count,
            document_id=req.document_id,
            topic_name=req.topic_name,
            difficulty=req.difficulty
        )
        return flashcards
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar flashcards: {str(e)}")

@router.post("/{flashcard_id}/review", response_model=FlashcardResponse)
async def review_flashcard(
    flashcard_id: str,
    req: FlashcardReviewRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    fc = await db.get(Flashcard, flashcard_id)
    if not fc or fc.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Flashcard não encontrado.")

    # Record review entry
    review = FlashcardReview(
        flashcard_id=fc.id,
        user_id=current_user.id,
        rating=req.rating
    )
    db.add(review)
    await db.commit()

    # Update SM-2 schedule
    updated_fc = await study_generator_service.review_flashcard(
        db=db,
        user_id=current_user.id,
        flashcard_id=flashcard_id,
        rating=req.rating
    )

    # If associated with topic, recompute deterministic topic mastery
    if updated_fc.topic_id:
        await mastery_service.update_topic_mastery(
            db=db,
            user_id=current_user.id,
            topic_id=updated_fc.topic_id,
            subject_id=updated_fc.subject_id
        )

    return updated_fc

@router.delete("/{flashcard_id}")
async def delete_flashcard(
    flashcard_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    fc = await db.get(Flashcard, flashcard_id)
    if not fc or fc.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Flashcard não encontrado.")
    await db.delete(fc)
    await db.commit()
    return {"message": "Flashcard excluído com sucesso."}

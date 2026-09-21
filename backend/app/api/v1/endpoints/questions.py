from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.core.database import get_db
from app.models.models import User, Question, Subject, QuestionAttempt, Topic
from app.schemas.schemas import (
    QuestionGenerateRequest, QuestionResponse, QuestionAttemptRequest, QuestionAttemptResponse
)
from app.api.deps import get_current_user
from app.services.study_generator_service import study_generator_service
from app.services.mastery_service import mastery_service

router = APIRouter()

@router.get("/", response_model=List[QuestionResponse])
async def list_questions(
    subject_id: Optional[str] = None,
    difficulty: Optional[str] = None,
    question_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Question).where(Question.user_id == current_user.id)
    if subject_id:
        query = query.where(Question.subject_id == subject_id)
    if difficulty and difficulty != "Misturado":
        query = query.where(Question.difficulty == difficulty)
    if question_type and question_type != "misturado":
        query = query.where(Question.question_type == question_type)
        
    query = query.order_by(Question.created_at.desc())
    res = await db.execute(query)
    return res.scalars().all()

@router.post("/generate", response_model=List[QuestionResponse])
async def generate_questions(
    req: QuestionGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    subject = await db.get(Subject, req.subject_id)
    if not subject or subject.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Matéria não encontrada.")

    try:
        questions = await study_generator_service.generate_questions(
            db=db,
            user_id=current_user.id,
            subject_id=req.subject_id,
            count=req.count,
            question_type=req.question_type,
            difficulty=req.difficulty,
            document_id=req.document_id,
            topic_name=req.topic_name
        )
        return questions
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar questões: {str(e)}")

@router.post("/{question_id}/attempt", response_model=QuestionAttemptResponse)
async def submit_question_attempt(
    question_id: str,
    req: QuestionAttemptRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = await db.get(Question, question_id)
    if not q or q.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Questão não encontrada.")

    # Evaluate answer correctness
    user_ans = req.user_answer.strip().upper()
    correct_ans = q.correct_answer.strip().upper()
    
    # Check simple equality or substring match for multiple choice / boolean
    is_correct = False
    if q.question_type == "multipla_escolha":
        # Check if first character (A, B, C, D) matches
        is_correct = (user_ans[:1] == correct_ans[:1]) or (user_ans == correct_ans)
    elif q.question_type == "verdadeiro_falso":
        is_correct = (user_ans.startswith("V") and correct_ans.startswith("V")) or \
                     (user_ans.startswith("F") and correct_ans.startswith("F"))
    else:
        # Discursive length/keyword check or positive if attempted
        is_correct = len(user_ans) >= 15

    attempt = QuestionAttempt(
        user_id=current_user.id,
        question_id=q.id,
        subject_id=q.subject_id,
        topic_id=q.topic_id,
        quiz_id=req.quiz_id,
        user_answer=req.user_answer,
        is_correct=is_correct,
        time_spent_seconds=req.time_spent_seconds
    )
    db.add(attempt)
    await db.commit()

    updated_score = None
    updated_status = None

    # Recalculate deterministic topic mastery
    if q.topic_id:
        mastery = await mastery_service.update_topic_mastery(
            db=db,
            user_id=current_user.id,
            topic_id=q.topic_id,
            subject_id=q.subject_id
        )
        updated_score = mastery.mastery_score
        updated_status = mastery.status

    return QuestionAttemptResponse(
        is_correct=is_correct,
        correct_answer=q.correct_answer,
        explanation=q.explanation,
        source_citation=q.source_citation,
        updated_mastery_score=updated_score,
        updated_mastery_status=updated_status
    )

@router.delete("/{question_id}")
async def delete_question(
    question_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = await db.get(Question, question_id)
    if not q or q.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Questão não encontrada.")
    await db.delete(q)
    await db.commit()
    return {"message": "Questão excluída com sucesso."}

from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.core.database import get_db
from app.models.models import User, Quiz, QuizQuestion, Question, Subject, QuestionAttempt
from app.schemas.schemas import QuizCreateRequest, QuizResponse, QuizSubmitRequest, QuestionResponse
from app.api.deps import get_current_user
from app.services.study_generator_service import study_generator_service
from app.services.mastery_service import mastery_service

router = APIRouter()

@router.get("/", response_model=List[QuizResponse])
async def list_quizzes(
    subject_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Quiz).where(Quiz.user_id == current_user.id)
    if subject_id:
        query = query.where(Quiz.subject_id == subject_id)
    query = query.order_by(Quiz.created_at.desc())
    
    res = await db.execute(query)
    quizzes = res.scalars().all()
    return quizzes

@router.post("/", response_model=QuizResponse)
async def create_quiz(
    req: QuizCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    subject = await db.get(Subject, req.subject_id)
    if not subject or subject.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Matéria não encontrada.")

    # 1. Fetch available questions or generate new ones if needed
    q_query = select(Question).where(
        and_(
            Question.subject_id == req.subject_id,
            Question.user_id == current_user.id
        )
    )
    res = await db.execute(q_query)
    existing_questions = res.scalars().all()

    selected_questions = list(existing_questions)

    # If not enough questions, generate dynamically
    if len(selected_questions) < req.total_questions:
        needed = req.total_questions - len(selected_questions)
        try:
            new_qs = await study_generator_service.generate_questions(
                db=db,
                user_id=current_user.id,
                subject_id=req.subject_id,
                count=min(needed, 15),
                question_type="multipla_escolha",
                difficulty=req.difficulty or "Misturado"
            )
            selected_questions.extend(new_qs)
        except Exception:
            pass

    if not selected_questions:
        raise HTTPException(
            status_code=400,
            detail="Envie documentos primeiro para gerar questões do simulado."
        )

    # Take up to requested total
    final_questions = selected_questions[:req.total_questions]

    # Create Quiz row
    quiz = Quiz(
        user_id=current_user.id,
        subject_id=req.subject_id,
        title=req.title or f"Simulado — {subject.name}",
        total_questions=len(final_questions),
        time_limit_minutes=req.time_limit_minutes,
        status="in_progress"
    )
    db.add(quiz)
    await db.flush()

    # Link questions
    for idx, q in enumerate(final_questions, start=1):
        qq = QuizQuestion(
            quiz_id=quiz.id,
            question_id=q.id,
            order_index=idx
        )
        db.add(qq)

    await db.commit()
    await db.refresh(quiz)

    # Build response with questions
    q_responses = [QuestionResponse.model_validate(q) for q in final_questions]
    
    resp = QuizResponse.model_validate(quiz)
    resp.questions = q_responses
    return resp

@router.get("/{quiz_id}", response_model=QuizResponse)
async def get_quiz(
    quiz_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Quiz).where(
        and_(Quiz.id == quiz_id, Quiz.user_id == current_user.id)
    )
    res = await db.execute(query)
    quiz = res.scalars().first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Simulado não encontrado.")

    # Fetch associated questions
    qq_query = select(Question).join(
        QuizQuestion, QuizQuestion.question_id == Question.id
    ).where(QuizQuestion.quiz_id == quiz.id).order_by(QuizQuestion.order_index.asc())
    
    qq_res = await db.execute(qq_query)
    questions = qq_res.scalars().all()

    resp = QuizResponse.model_validate(quiz)
    resp.questions = [QuestionResponse.model_validate(q) for q in questions]
    return resp

@router.post("/{quiz_id}/submit", response_model=QuizResponse)
async def submit_quiz(
    quiz_id: str,
    req: QuizSubmitRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    quiz = await db.get(Quiz, quiz_id)
    if not quiz or quiz.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Simulado não encontrado.")

    # Fetch quiz questions
    qq_query = select(QuizQuestion, Question).join(
        Question, QuizQuestion.question_id == Question.id
    ).where(QuizQuestion.quiz_id == quiz.id)
    
    res = await db.execute(qq_query)
    items = res.all()

    correct_count = 0
    topic_stats: Dict[str, Dict[str, int]] = {}

    for qq, question in items:
        user_ans = req.answers.get(question.id, "").strip().upper()
        correct_ans = question.correct_answer.strip().upper()

        is_correct = False
        if question.question_type == "multipla_escolha":
            is_correct = (user_ans[:1] == correct_ans[:1]) or (user_ans == correct_ans)
        elif question.question_type == "verdadeiro_falso":
            is_correct = (user_ans.startswith("V") and correct_ans.startswith("V")) or \
                         (user_ans.startswith("F") and correct_ans.startswith("F"))
        else:
            is_correct = len(user_ans) >= 15

        qq.user_answer = user_ans
        qq.is_correct = is_correct

        if is_correct:
            correct_count += 1

        # Track per-topic performance
        t_name = question.topic_name or "Geral"
        if t_name not in topic_stats:
            topic_stats[t_name] = {"total": 0, "correct": 0}
        topic_stats[t_name]["total"] += 1
        if is_correct:
            topic_stats[t_name]["correct"] += 1

        # Register QuestionAttempt
        attempt = QuestionAttempt(
            user_id=current_user.id,
            question_id=question.id,
            subject_id=question.subject_id,
            topic_id=question.topic_id,
            quiz_id=quiz.id,
            user_answer=user_ans,
            is_correct=is_correct,
            time_spent_seconds=req.total_time_seconds // max(1, len(items))
        )
        db.add(attempt)

        # Update mastery if topic exists
        if question.topic_id:
            await mastery_service.update_topic_mastery(
                db=db,
                user_id=current_user.id,
                topic_id=question.topic_id,
                subject_id=question.subject_id
            )

    # Compute breakdown percentage
    breakdown = {}
    for t_name, data in topic_stats.items():
        if data["total"] > 0:
            breakdown[t_name] = round((data["correct"] / data["total"]) * 100, 1)

    total_q = len(items)
    score_pct = round((correct_count / total_q) * 100, 1) if total_q > 0 else 0.0

    quiz.status = "completed"
    quiz.score_percentage = score_pct
    quiz.correct_count = correct_count
    quiz.incorrect_count = total_q - correct_count
    quiz.total_time_seconds = req.total_time_seconds
    quiz.topics_breakdown_json = breakdown
    quiz.completed_at = datetime.utcnow()

    await db.commit()
    await db.refresh(quiz)

    return await get_quiz(quiz_id=quiz.id, db=db, current_user=current_user)

from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.core.database import get_db
from app.models.models import User, StudyPlan, StudySession, Subject, Exam
from app.schemas.schemas import (
    StudyPlanCreateRequest, CramModeRequest, StudyPlanResponse, 
    StudySessionResponse, ExamCreate, ExamResponse
)
from app.api.deps import get_current_user
from app.services.study_generator_service import study_generator_service

router = APIRouter()

@router.get("/", response_model=List[StudyPlanResponse])
async def list_study_plans(
    subject_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(StudyPlan).where(StudyPlan.user_id == current_user.id)
    if subject_id:
        query = query.where(StudyPlan.subject_id == subject_id)
    query = query.order_by(StudyPlan.created_at.desc())
    
    res = await db.execute(query)
    plans = res.scalars().all()

    response = []
    for p in plans:
        sess_query = select(StudySession).where(
            StudySession.study_plan_id == p.id
        ).order_by(StudySession.order_index.asc())
        sess_res = await db.execute(sess_query)
        sessions = sess_res.scalars().all()

        plan_resp = StudyPlanResponse(
            id=p.id,
            user_id=p.user_id,
            subject_id=p.subject_id,
            title=p.title,
            plan_type=p.plan_type,
            total_hours=p.total_hours,
            mastered_topics_avoid=p.mastered_topics_avoid or [],
            parameters_json=p.parameters_json or {},
            sessions=[StudySessionResponse.model_validate(s) for s in sessions],
            created_at=p.created_at
        )
        response.append(plan_resp)

    return response

@router.post("/weekly", response_model=StudyPlanResponse)
async def create_weekly_study_plan(
    req: StudyPlanCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate structured multi-day study schedule with realistic micro-sessions."""
    subjects_query = select(Subject).where(Subject.user_id == current_user.id)
    if req.subject_id:
        subjects_query = subjects_query.where(Subject.id == req.subject_id)
    
    s_res = await db.execute(subjects_query)
    subjects = s_res.scalars().all()

    if not subjects:
        raise HTTPException(status_code=400, detail="Crie ao menos uma matéria antes de gerar o plano.")

    plan = StudyPlan(
        user_id=current_user.id,
        subject_id=req.subject_id,
        title=req.title or "Cronograma de Estudos Semanal",
        plan_type="weekly",
        total_hours=req.available_hours_per_day * len(req.days_of_week),
        parameters_json={
            "hours_per_day": req.available_hours_per_day,
            "days": req.days_of_week
        }
    )
    db.add(plan)
    await db.flush()

    # Distribute subjects and generate study sessions
    order = 1
    for day in req.days_of_week:
        sub = subjects[(order - 1) % len(subjects)]
        
        # Block 1: Theory & Notes (40m)
        s1 = StudySession(
            study_plan_id=plan.id,
            user_id=current_user.id,
            subject_id=sub.id,
            title=f"{day}: {sub.name} — Revisão Teórica e Conceitos",
            start_time_label="19:00",
            end_time_label="19:40",
            duration_minutes=40,
            activity_type="theory",
            priority_level="alta",
            description=f"Leitura de materiais e resumos estruturados de {sub.name}.",
            order_index=order
        )
        db.add(s1)
        order += 1

        # Block 2: Flashcards (20m)
        s2 = StudySession(
            study_plan_id=plan.id,
            user_id=current_user.id,
            subject_id=sub.id,
            title=f"{day}: {sub.name} — Flashcards de Fixação",
            start_time_label="19:45",
            end_time_label="20:05",
            duration_minutes=20,
            activity_type="flashcards",
            priority_level="media",
            description="Revisão ativa com baralho de flashcards da matéria.",
            order_index=order
        )
        db.add(s2)
        order += 1

        # Block 3: Questions & Quizzes (30m)
        s3 = StudySession(
            study_plan_id=plan.id,
            user_id=current_user.id,
            subject_id=sub.id,
            title=f"{day}: {sub.name} — Resolução de Questões",
            start_time_label="20:10",
            end_time_label="20:40",
            duration_minutes=30,
            activity_type="questions",
            priority_level="critica",
            description="Responda questões no banco para consolidar e calibrar seu domínio.",
            order_index=order
        )
        db.add(s3)
        order += 1

    await db.commit()
    await db.refresh(plan)

    # Return full plan with sessions
    sess_query = select(StudySession).where(
        StudySession.study_plan_id == plan.id
    ).order_by(StudySession.order_index.asc())
    sess_res = await db.execute(sess_query)
    sessions = sess_res.scalars().all()

    return StudyPlanResponse(
        id=plan.id,
        user_id=plan.user_id,
        subject_id=plan.subject_id,
        title=plan.title,
        plan_type=plan.plan_type,
        total_hours=plan.total_hours,
        mastered_topics_avoid=plan.mastered_topics_avoid or [],
        parameters_json=plan.parameters_json or {},
        sessions=[StudySessionResponse.model_validate(s) for s in sessions],
        created_at=plan.created_at
    )

@router.post("/cram-mode", response_model=StudyPlanResponse)
async def create_cram_plan(
    req: CramModeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """'🚨 Tenho Prova Amanhã' algorithm generation."""
    subject = await db.get(Subject, req.subject_id)
    if not subject or subject.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Matéria não encontrada.")

    try:
        plan = await study_generator_service.generate_cram_plan(
            db=db,
            user_id=current_user.id,
            subject_id=req.subject_id,
            available_hours=req.available_hours,
            exam_date_time=req.exam_date_time
        )
        
        sess_query = select(StudySession).where(
            StudySession.study_plan_id == plan.id
        ).order_by(StudySession.order_index.asc())
        sess_res = await db.execute(sess_query)
        sessions = sess_res.scalars().all()

        return StudyPlanResponse(
            id=plan.id,
            user_id=plan.user_id,
            subject_id=plan.subject_id,
            title=plan.title,
            plan_type=plan.plan_type,
            total_hours=plan.total_hours,
            mastered_topics_avoid=plan.mastered_topics_avoid or [],
            parameters_json=plan.parameters_json or {},
            sessions=[StudySessionResponse.model_validate(s) for s in sessions],
            created_at=plan.created_at
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar plano de emergência: {str(e)}")

@router.patch("/sessions/{session_id}/toggle", response_model=StudySessionResponse)
async def toggle_session_completed(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sess = await db.get(StudySession, session_id)
    if not sess or sess.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Sessão não encontrada.")

    sess.is_completed = not sess.is_completed
    sess.completed_at = datetime.utcnow() if sess.is_completed else None
    await db.commit()
    await db.refresh(sess)
    return sess

# --- EXAMS ---
@router.get("/exams", response_model=List[ExamResponse])
async def list_exams(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Exam, Subject).join(
        Subject, Exam.subject_id == Subject.id
    ).where(Exam.user_id == current_user.id).order_by(Exam.exam_date.asc())
    
    res = await db.execute(query)
    rows = res.all()

    result = []
    now = datetime.utcnow()
    for exam, subject in rows:
        days_rem = (exam.exam_date - now).days
        result.append(ExamResponse(
            id=exam.id,
            subject_id=exam.subject_id,
            subject_name=subject.name,
            title=exam.title,
            exam_date=exam.exam_date,
            notes=exam.notes or "",
            days_remaining=days_rem,
            created_at=exam.created_at
        ))
    return result

@router.post("/exams", response_model=ExamResponse)
async def create_exam(
    exam_in: ExamCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    subject = await db.get(Subject, exam_in.subject_id)
    if not subject or subject.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Matéria não encontrada.")

    exam = Exam(
        user_id=current_user.id,
        subject_id=exam_in.subject_id,
        title=exam_in.title,
        exam_date=exam_in.exam_date,
        notes=exam_in.notes or ""
    )
    db.add(exam)
    await db.commit()
    await db.refresh(exam)

    days_rem = (exam.exam_date - datetime.utcnow()).days
    return ExamResponse(
        id=exam.id,
        subject_id=exam.subject_id,
        subject_name=subject.name,
        title=exam.title,
        exam_date=exam.exam_date,
        notes=exam.notes,
        days_remaining=days_rem,
        created_at=exam.created_at
    )

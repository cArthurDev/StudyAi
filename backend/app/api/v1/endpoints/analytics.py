from datetime import datetime, timedelta
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from app.core.database import get_db
from app.models.models import (
    User, Subject, QuestionAttempt, Flashcard, StudySession, Exam, TopicMastery, Topic
)
from app.schemas.schemas import (
    DashboardOverviewResponse, SubjectResponse, ExamResponse, 
    StudySessionResponse, TopicMasteryResponse
)
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/dashboard", response_model=DashboardOverviewResponse)
async def get_dashboard_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Total Subjects
    total_subjects = await db.scalar(
        select(func.count(Subject.id)).where(Subject.user_id == current_user.id)
    ) or 0

    # 2. Total questions and accuracy
    q_stmt = select(QuestionAttempt).where(QuestionAttempt.user_id == current_user.id)
    q_res = await db.execute(q_stmt)
    attempts = q_res.scalars().all()
    
    total_q = len(attempts)
    correct_q = sum(1 for a in attempts if a.is_correct)
    accuracy = round((correct_q / total_q) * 100, 1) if total_q > 0 else 0.0

    # 3. Total study hours (estimated from completed sessions + question attempts + flashcards)
    completed_sessions = await db.execute(
        select(StudySession).where(
            and_(StudySession.user_id == current_user.id, StudySession.is_completed == True)
        )
    )
    sess_mins = sum(s.duration_minutes for s in completed_sessions.scalars().all())
    total_hours = round(sess_mins / 60.0 + (total_q * 1.5) / 60.0, 1)

    # 4. Upcoming exams
    now = datetime.utcnow()
    exams_query = select(Exam, Subject).join(
        Subject, Exam.subject_id == Subject.id
    ).where(
        and_(Exam.user_id == current_user.id, Exam.exam_date >= now)
    ).order_by(Exam.exam_date.asc()).limit(4)
    
    exams_res = await db.execute(exams_query)
    upcoming_exams = []
    for exam, subject in exams_res.all():
        days_rem = (exam.exam_date - now).days
        upcoming_exams.append(ExamResponse(
            id=exam.id,
            subject_id=exam.subject_id,
            subject_name=subject.name,
            title=exam.title,
            exam_date=exam.exam_date,
            notes=exam.notes or "",
            days_remaining=days_rem,
            created_at=exam.created_at
        ))

    # 5. Today's sessions
    today_sessions_stmt = select(StudySession).where(
        StudySession.user_id == current_user.id
    ).order_by(StudySession.order_index.asc()).limit(5)
    today_res = await db.execute(today_sessions_stmt)
    today_sessions = [StudySessionResponse.model_validate(s) for s in today_res.scalars().all()]

    # 6. Recent subjects
    recent_subs_stmt = select(Subject).where(
        Subject.user_id == current_user.id
    ).order_by(Subject.updated_at.desc()).limit(4)
    recent_res = await db.execute(recent_subs_stmt)
    recent_subs = []
    for s in recent_res.scalars().all():
        avg_m = await db.scalar(
            select(func.avg(TopicMastery.mastery_score)).where(TopicMastery.subject_id == s.id)
        ) or 0.0
        recent_subs.append(SubjectResponse(
            id=s.id,
            user_id=s.user_id,
            name=s.name,
            description=s.description or "",
            color=s.color or "#6366f1",
            icon=s.icon or "BookOpen",
            created_at=s.created_at,
            updated_at=s.updated_at,
            document_count=0,
            flashcard_count=0,
            question_count=0,
            mastery_average=round(float(avg_m), 1)
        ))

    # 7. Weekly question activity
    weekly_progress = {"Seg": 0, "Ter": 0, "Qua": 0, "Qui": 0, "Sex": 0, "Sáb": 0, "Dom": 0}
    day_map = {0: "Seg", 1: "Ter", 2: "Qua", 3: "Qui", 4: "Sex", 5: "Sáb", 6: "Dom"}
    seven_days_ago = now - timedelta(days=7)
    
    for a in attempts:
        if a.created_at and a.created_at >= seven_days_ago:
            weekday_str = day_map.get(a.created_at.weekday(), "Seg")
            weekly_progress[weekday_str] += 1

    # 8. Weak topics ("Pontos fracos" / CRÍTICO or PRECISA REVISAR)
    weak_stmt = select(TopicMastery, Topic, Subject).join(
        Topic, TopicMastery.topic_id == Topic.id
    ).join(
        Subject, TopicMastery.subject_id == Subject.id
    ).where(
        and_(
            TopicMastery.user_id == current_user.id,
            TopicMastery.mastery_score < 60.0
        )
    ).order_by(TopicMastery.mastery_score.asc()).limit(6)
    
    weak_res = await db.execute(weak_stmt)
    weak_topics = []
    crit_count = 0

    for m, t, s in weak_res.all():
        if m.status == "CRÍTICO":
            crit_count += 1
        acc = round((m.correct_attempts / m.total_attempts) * 100, 1) if m.total_attempts > 0 else 0.0
        weak_topics.append(TopicMasteryResponse(
            topic_id=t.id,
            topic_name=t.name,
            subject_id=s.id,
            subject_name=s.name,
            mastery_score=m.mastery_score,
            status=m.status,
            total_attempts=m.total_attempts,
            correct_attempts=m.correct_attempts,
            accuracy_rate=acc,
            last_reviewed_at=m.last_reviewed_at
        ))

    return DashboardOverviewResponse(
        user_name=current_user.full_name,
        total_subjects=total_subjects,
        total_hours_studied=total_hours,
        total_questions_answered=total_q,
        overall_accuracy_percentage=accuracy,
        upcoming_exams=upcoming_exams,
        today_sessions=today_sessions,
        recent_subjects=recent_subs,
        weekly_progress=weekly_progress,
        weak_topics=weak_topics,
        critical_topics_count=crit_count
    )

@router.get("/mastery-all", response_model=List[TopicMasteryResponse])
async def list_all_mastery(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(TopicMastery, Topic, Subject).join(
        Topic, TopicMastery.topic_id == Topic.id
    ).join(
        Subject, TopicMastery.subject_id == Subject.id
    ).where(TopicMastery.user_id == current_user.id).order_by(TopicMastery.mastery_score.asc())

    res = await db.execute(stmt)
    result = []
    for m, t, s in res.all():
        acc = round((m.correct_attempts / m.total_attempts) * 100, 1) if m.total_attempts > 0 else 0.0
        result.append(TopicMasteryResponse(
            topic_id=t.id,
            topic_name=t.name,
            subject_id=s.id,
            subject_name=s.name,
            mastery_score=m.mastery_score,
            status=m.status,
            total_attempts=m.total_attempts,
            correct_attempts=m.correct_attempts,
            accuracy_rate=acc,
            last_reviewed_at=m.last_reviewed_at
        ))
    return result

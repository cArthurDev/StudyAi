from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from app.core.database import get_db
from app.models.models import User, Subject, Document, Flashcard, Question, Topic, TopicMastery
from app.schemas.schemas import SubjectCreate, SubjectUpdate, SubjectResponse, TopicResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/", response_model=List[SubjectResponse])
async def list_subjects(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Subject).where(Subject.user_id == current_user.id).order_by(Subject.created_at.desc())
    result = await db.execute(query)
    subjects = result.scalars().all()

    response_list = []
    for s in subjects:
        # Count documents, flashcards, questions
        doc_count = await db.scalar(
            select(func.count(Document.id)).where(Document.subject_id == s.id)
        ) or 0
        fc_count = await db.scalar(
            select(func.count(Flashcard.id)).where(Flashcard.subject_id == s.id)
        ) or 0
        q_count = await db.scalar(
            select(func.count(Question.id)).where(Question.subject_id == s.id)
        ) or 0
        
        # Average mastery
        avg_mastery = await db.scalar(
            select(func.avg(TopicMastery.mastery_score)).where(TopicMastery.subject_id == s.id)
        ) or 0.0

        resp = SubjectResponse(
            id=s.id,
            user_id=s.user_id,
            name=s.name,
            description=s.description or "",
            color=s.color or "#6366f1",
            icon=s.icon or "BookOpen",
            created_at=s.created_at,
            updated_at=s.updated_at,
            document_count=doc_count,
            flashcard_count=fc_count,
            question_count=q_count,
            mastery_average=round(float(avg_mastery), 1)
        )
        response_list.append(resp)

    return response_list

@router.post("/", response_model=SubjectResponse)
async def create_subject(
    subject_in: SubjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    subject = Subject(
        user_id=current_user.id,
        name=subject_in.name,
        description=subject_in.description or "",
        color=subject_in.color or "#6366f1",
        icon=subject_in.icon or "BookOpen"
    )
    db.add(subject)
    await db.commit()
    await db.refresh(subject)
    
    return SubjectResponse(
        id=subject.id,
        user_id=subject.user_id,
        name=subject.name,
        description=subject.description or "",
        color=subject.color or "#6366f1",
        icon=subject.icon or "BookOpen",
        created_at=subject.created_at,
        updated_at=subject.updated_at,
        document_count=0,
        flashcard_count=0,
        question_count=0,
        mastery_average=0.0
    )

@router.get("/{subject_id}", response_model=SubjectResponse)
async def get_subject(
    subject_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Subject).where(
        and_(Subject.id == subject_id, Subject.user_id == current_user.id)
    )
    res = await db.execute(query)
    s = res.scalars().first()
    if not s:
        raise HTTPException(status_code=404, detail="Matéria não encontrada.")

    doc_count = await db.scalar(select(func.count(Document.id)).where(Document.subject_id == s.id)) or 0
    fc_count = await db.scalar(select(func.count(Flashcard.id)).where(Flashcard.subject_id == s.id)) or 0
    q_count = await db.scalar(select(func.count(Question.id)).where(Question.subject_id == s.id)) or 0
    avg_mastery = await db.scalar(select(func.avg(TopicMastery.mastery_score)).where(TopicMastery.subject_id == s.id)) or 0.0

    return SubjectResponse(
        id=s.id,
        user_id=s.user_id,
        name=s.name,
        description=s.description or "",
        color=s.color or "#6366f1",
        icon=s.icon or "BookOpen",
        created_at=s.created_at,
        updated_at=s.updated_at,
        document_count=doc_count,
        flashcard_count=fc_count,
        question_count=q_count,
        mastery_average=round(float(avg_mastery), 1)
    )

@router.put("/{subject_id}", response_model=SubjectResponse)
async def update_subject(
    subject_id: str,
    subject_in: SubjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Subject).where(
        and_(Subject.id == subject_id, Subject.user_id == current_user.id)
    )
    res = await db.execute(query)
    subject = res.scalars().first()
    if not subject:
        raise HTTPException(status_code=404, detail="Matéria não encontrada.")

    if subject_in.name is not None:
        subject.name = subject_in.name
    if subject_in.description is not None:
        subject.description = subject_in.description
    if subject_in.color is not None:
        subject.color = subject_in.color
    if subject_in.icon is not None:
        subject.icon = subject_in.icon

    await db.commit()
    await db.refresh(subject)
    return await get_subject(subject_id=subject.id, db=db, current_user=current_user)

@router.delete("/{subject_id}")
async def delete_subject(
    subject_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Subject).where(
        and_(Subject.id == subject_id, Subject.user_id == current_user.id)
    )
    res = await db.execute(query)
    subject = res.scalars().first()
    if not subject:
        raise HTTPException(status_code=404, detail="Matéria não encontrada.")

    await db.delete(subject)
    await db.commit()
    return {"message": "Matéria excluída com sucesso."}

@router.get("/{subject_id}/mindmap")
async def get_subject_mindmap(
    subject_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate structured hierarchical mindmap nodes and mermaid diagram."""
    subject = await db.get(Subject, subject_id)
    if not subject or subject.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Matéria não encontrada.")

    topics_res = await db.execute(
        select(Topic, TopicMastery).outerjoin(
            TopicMastery, and_(Topic.id == TopicMastery.topic_id, TopicMastery.user_id == current_user.id)
        ).where(Topic.subject_id == subject_id)
    )
    rows = topics_res.all()

    # Group topics by chapter
    chapters: Dict[str, List[Dict[str, Any]]] = {}
    for topic, mastery in rows:
        chapter_name = topic.chapter or "Geral"
        if chapter_name not in chapters:
            chapters[chapter_name] = []
        
        mastery_score = mastery.mastery_score if mastery else 0.0
        chapters[chapter_name].append({
            "id": topic.id,
            "name": topic.name,
            "description": topic.description,
            "difficulty": topic.difficulty,
            "mastery_score": mastery_score,
            "status": mastery.status if mastery else "CRÍTICO",
            "definitions": topic.definitions or [],
            "formulas": topic.formulas or []
        })

    # Mermaid diagram text
    clean_sub_name = subject.name.replace('"', '')
    mermaid_lines = ["mindmap", f'  root(("{clean_sub_name}"))']
    for ch_name, topic_list in chapters.items():
        clean_ch = ch_name.replace('"', '')
        mermaid_lines.append(f'    {clean_ch}')
        for t in topic_list:
            clean_t = t["name"].replace('"', '')
            score_tag = f" [{int(t['mastery_score'])}%]"
            mermaid_lines.append(f'      {clean_t}{score_tag}')

    mermaid_code = "\n".join(mermaid_lines)

    return {
        "subject_name": subject.name,
        "chapters": chapters,
        "mermaid": mermaid_code
    }

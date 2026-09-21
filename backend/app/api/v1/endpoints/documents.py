import os
import uuid
import aiofiles
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.core.database import get_db, AsyncSessionLocal
from app.models.models import User, Document, Subject
from app.schemas.schemas import DocumentResponse, DocumentStatusResponse
from app.api.deps import get_current_user
from app.core.config import settings
from app.services.document_service import document_service

router = APIRouter()

@router.get("/", response_model=List[DocumentResponse])
async def list_documents(
    subject_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Document).where(Document.user_id == current_user.id)
    if subject_id:
        query = query.where(Document.subject_id == subject_id)
    query = query.order_by(Document.created_at.desc())
    
    res = await db.execute(query)
    docs = res.scalars().all()
    return docs

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    subject_id: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify subject belongs to user
    subject = await db.get(Subject, subject_id)
    if not subject or subject.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Matéria selecionada não existe.")

    # Validate file extension
    original_filename = file.filename or "document"
    ext = os.path.splitext(original_filename)[1].lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Formato não suportado. Envie arquivos nos formatos: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    # Sanitize and create storage path
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    unique_name = f"{uuid.uuid4().hex}_{original_filename.replace(' ', '_')}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_name)

    # Read and save file
    content = await file.read()
    file_size = len(content)
    
    if file_size > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"Arquivo excede o limite máximo permitido de {settings.MAX_UPLOAD_SIZE_MB}MB."
        )

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    doc = Document(
        user_id=current_user.id,
        subject_id=subject_id,
        name=original_filename.rsplit(".", 1)[0].replace("_", " "),
        original_filename=original_filename,
        file_type=ext.replace(".", ""),
        file_size=file_size,
        file_path=file_path,
        status="uploading",
        progress=20
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    # Launch async background pipeline
    background_tasks.add_task(
        document_service.process_document_background,
        AsyncSessionLocal,
        doc.id
    )

    return doc

@router.get("/{document_id}/status", response_model=DocumentStatusResponse)
async def get_document_status(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Document).where(
        and_(Document.id == document_id, Document.user_id == current_user.id)
    )
    res = await db.execute(query)
    doc = res.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado.")

    return DocumentStatusResponse(
        id=doc.id,
        status=doc.status,
        progress=doc.progress,
        error_message=doc.error_message
    )

@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Document).where(
        and_(Document.id == document_id, Document.user_id == current_user.id)
    )
    res = await db.execute(query)
    doc = res.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado.")
    return doc

@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Document).where(
        and_(Document.id == document_id, Document.user_id == current_user.id)
    )
    res = await db.execute(query)
    doc = res.scalars().first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado.")

    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception:
            pass

    await db.delete(doc)
    await db.commit()
    return {"message": "Documento excluído com sucesso."}

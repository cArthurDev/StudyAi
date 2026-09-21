from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.core.database import get_db
from app.models.models import User, ChatConversation, ChatMessage, Subject
from app.schemas.schemas import (
    ChatMessageRequest, ChatMessageResponse, ChatConversationResponse, ChatSource
)
from app.api.deps import get_current_user
from app.rag.rag_engine import rag_engine

router = APIRouter()

@router.get("/conversations", response_model=List[ChatConversationResponse])
async def list_conversations(
    subject_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(ChatConversation).where(
        and_(
            ChatConversation.subject_id == subject_id,
            ChatConversation.user_id == current_user.id
        )
    ).order_by(ChatConversation.updated_at.desc())
    
    res = await db.execute(query)
    convs = res.scalars().all()
    
    response = []
    for c in convs:
        msgs_query = select(ChatMessage).where(ChatMessage.conversation_id == c.id).order_by(ChatMessage.created_at.asc())
        msgs_res = await db.execute(msgs_query)
        msgs = msgs_res.scalars().all()
        
        parsed_msgs = []
        for m in msgs:
            sources_list = [ChatSource(**s) for s in (m.sources_json or [])]
            parsed_msgs.append(ChatMessageResponse(
                id=m.id,
                conversation_id=m.conversation_id,
                sender=m.sender,
                content=m.content,
                sources=sources_list,
                created_at=m.created_at
            ))
            
        response.append(ChatConversationResponse(
            id=c.id,
            subject_id=c.subject_id,
            document_id=c.document_id,
            title=c.title,
            created_at=c.created_at,
            updated_at=c.updated_at,
            messages=parsed_msgs
        ))
    return response

@router.post("/conversations/{conversation_id}/messages", response_model=ChatMessageResponse)
async def send_message(
    conversation_id: str,
    msg_in: ChatMessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conv = await db.get(ChatConversation, conversation_id)
    if not conv or conv.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Conversa não encontrada.")

    # 1. Save user message
    user_msg = ChatMessage(
        conversation_id=conv.id,
        user_id=current_user.id,
        sender="user",
        content=msg_in.content,
        sources_json=[]
    )
    db.add(user_msg)
    await db.commit()

    # 2. Get past chat history
    past_msgs_stmt = select(ChatMessage).where(
        ChatMessage.conversation_id == conv.id
    ).order_by(ChatMessage.created_at.asc()).limit(8)
    past_res = await db.execute(past_msgs_stmt)
    history = [{"sender": m.sender, "content": m.content} for m in past_res.scalars().all()]

    # 3. Query RAG engine
    rag_result = await rag_engine.answer_question(
        db=db,
        user_id=current_user.id,
        question=msg_in.content,
        subject_id=conv.subject_id,
        document_id=msg_in.document_id or conv.document_id,
        chat_history=history
    )

    # 4. Save assistant reply
    assistant_msg = ChatMessage(
        conversation_id=conv.id,
        user_id=current_user.id,
        sender="assistant",
        content=rag_result["answer"],
        sources_json=rag_result["sources"]
    )
    db.add(assistant_msg)
    
    # Update conversation title if first message
    if conv.title == "Novo Chat":
        conv.title = msg_in.content[:40] + ("..." if len(msg_in.content) > 40 else "")
    
    await db.commit()
    await db.refresh(assistant_msg)

    sources_list = [ChatSource(**s) for s in (assistant_msg.sources_json or [])]
    return ChatMessageResponse(
        id=assistant_msg.id,
        conversation_id=assistant_msg.conversation_id,
        sender="assistant",
        content=assistant_msg.content,
        sources=sources_list,
        created_at=assistant_msg.created_at
    )

@router.post("/conversations", response_model=ChatConversationResponse)
async def create_conversation(
    subject_id: str,
    document_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    subject = await db.get(Subject, subject_id)
    if not subject or subject.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Matéria não encontrada.")

    conv = ChatConversation(
        user_id=current_user.id,
        subject_id=subject_id,
        document_id=document_id,
        title="Novo Chat"
    )
    db.add(conv)
    await db.commit()
    await db.refresh(conv)

    return ChatConversationResponse(
        id=conv.id,
        subject_id=conv.subject_id,
        document_id=conv.document_id,
        title=conv.title,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        messages=[]
    )

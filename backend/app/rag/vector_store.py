import logging
import json
import numpy as np
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, text
from app.models.models import DocumentChunk, Document
from app.ai.ollama_client import ollama_client
from app.core.config import settings

logger = logging.getLogger(__name__)

class VectorStore:
    @staticmethod
    def chunk_document_pages(
        pages_data: List[Dict[str, Any]],
        chunk_size: int = settings.CHUNK_SIZE,
        chunk_overlap: int = settings.CHUNK_OVERLAP
    ) -> List[Dict[str, Any]]:
        """
        Split page/slide texts into chunks while preserving page/slide numbers and character offsets.
        """
        chunks = []
        global_chunk_idx = 0

        for item in pages_data:
            page_num = item["page_or_slide"]
            text_content = item["content"]
            
            if len(text_content) <= chunk_size:
                chunks.append({
                    "chunk_index": global_chunk_idx,
                    "content": text_content,
                    "page_or_slide": page_num,
                    "char_start": 0,
                    "char_end": len(text_content),
                    "metadata": {"page_or_slide": page_num}
                })
                global_chunk_idx += 1
                continue

            start = 0
            while start < len(text_content):
                end = min(start + chunk_size, len(text_content))
                
                if end < len(text_content):
                    last_space = text_content.rfind(" ", start, end)
                    last_newline = text_content.rfind("\n", start, end)
                    break_point = max(last_space, last_newline)
                    if break_point > start + (chunk_size // 2):
                        end = break_point

                chunk_text = text_content[start:end].strip()
                if chunk_text:
                    chunks.append({
                        "chunk_index": global_chunk_idx,
                        "content": chunk_text,
                        "page_or_slide": page_num,
                        "char_start": start,
                        "char_end": end,
                        "metadata": {"page_or_slide": page_num}
                    })
                    global_chunk_idx += 1

                if end >= len(text_content):
                    break
                start = end - chunk_overlap

        return chunks

    @staticmethod
    async def index_document_chunks(
        db: AsyncSession,
        document_id: str,
        subject_id: str,
        user_id: str,
        chunks_data: List[Dict[str, Any]]
    ) -> int:
        """
        Generate embeddings and save chunks into the database (works in PostgreSQL and SQLite).
        """
        # Delete existing chunks for this document if re-indexing
        del_stmt = select(DocumentChunk).where(DocumentChunk.document_id == document_id)
        existing_res = await db.execute(del_stmt)
        for existing in existing_res.scalars().all():
            await db.delete(existing)

        chunk_models = []
        for chunk in chunks_data:
            embedding_vector = await ollama_client.generate_embedding(chunk["content"])
            
            chunk_obj = DocumentChunk(
                document_id=document_id,
                subject_id=subject_id,
                user_id=user_id,
                chunk_index=chunk["chunk_index"],
                content=chunk["content"],
                page_or_slide=chunk["page_or_slide"],
                char_start=chunk["char_start"],
                char_end=chunk["char_end"],
                metadata_json=chunk.get("metadata", {}),
                embedding=embedding_vector
            )
            chunk_models.append(chunk_obj)

        db.add_all(chunk_models)
        await db.commit()
        return len(chunk_models)

    @staticmethod
    async def search_similar_chunks(
        db: AsyncSession,
        user_id: str,
        query_text: str,
        subject_id: Optional[str] = None,
        document_id: Optional[str] = None,
        top_k: int = settings.TOP_K_CHUNKS
    ) -> List[Dict[str, Any]]:
        """
        Find top-k semantically similar chunks:
        - If PostgreSQL with pgvector: uses `<=>` vector cosine distance.
        - If SQLite (Zero Docker): loads chunks and calculates Cosine Similarity via NumPy.
        """
        query_embedding = await ollama_client.generate_embedding(query_text)
        is_postgres = "postgresql" in settings.DATABASE_URL.lower()

        if is_postgres:
            query_embedding_str = "[" + ",".join(map(str, query_embedding)) + "]"
            conditions = ["c.user_id = :user_id", "c.embedding IS NOT NULL"]
            params: Dict[str, Any] = {
                "user_id": user_id,
                "query_emb": query_embedding_str,
                "top_k": top_k
            }
            if subject_id:
                conditions.append("c.subject_id = :subject_id")
                params["subject_id"] = subject_id
            if document_id:
                conditions.append("c.document_id = :document_id")
                params["document_id"] = document_id

            where_clause = " AND ".join(conditions)
            sql = f"""
                SELECT 
                    c.id, c.document_id, c.subject_id, c.content, c.page_or_slide,
                    d.name as document_name, d.file_type,
                    (c.embedding <=> :query_emb::vector) as distance
                FROM document_chunks c
                JOIN documents d ON c.document_id = d.id
                WHERE {where_clause}
                ORDER BY distance ASC
                LIMIT :top_k
            """
            try:
                result = await db.execute(text(sql), params)
                rows = result.fetchall()
                return [
                    {
                        "chunk_id": r.id,
                        "document_id": r.document_id,
                        "document_name": r.document_name,
                        "file_type": r.file_type,
                        "content": r.content,
                        "page_or_slide": r.page_or_slide,
                        "similarity": 1.0 - float(r.distance) if r.distance is not None else 1.0
                    }
                    for r in rows
                ]
            except Exception as e:
                logger.warning(f"Postgres vector search fallback to in-memory: {e}")

        # Native in-memory Cosine Similarity with NumPy (Zero Docker support)
        query_stmt = select(DocumentChunk, Document).join(
            Document, DocumentChunk.document_id == Document.id
        ).where(DocumentChunk.user_id == user_id)

        if subject_id:
            query_stmt = query_stmt.where(DocumentChunk.subject_id == subject_id)
        if document_id:
            query_stmt = query_stmt.where(DocumentChunk.document_id == document_id)

        res = await db.execute(query_stmt)
        items = res.all()

        if not items:
            return []

        q_vec = np.array(query_embedding, dtype=np.float32)
        q_norm = np.linalg.norm(q_vec)
        if q_norm == 0:
            q_norm = 1e-8

        scored_chunks = []
        for chunk, doc in items:
            raw_emb = chunk.embedding
            if raw_emb is None:
                continue
            if isinstance(raw_emb, str):
                try:
                    raw_emb = json.loads(raw_emb)
                except Exception:
                    continue
            
            c_vec = np.array(raw_emb, dtype=np.float32)
            c_norm = np.linalg.norm(c_vec)
            if c_norm == 0:
                c_norm = 1e-8
            
            sim = float(np.dot(q_vec, c_vec) / (q_norm * c_norm))
            scored_chunks.append({
                "chunk_id": chunk.id,
                "document_id": chunk.document_id,
                "document_name": doc.name,
                "file_type": doc.file_type,
                "content": chunk.content,
                "page_or_slide": chunk.page_or_slide,
                "similarity": sim
            })

        scored_chunks.sort(key=lambda x: x["similarity"], reverse=True)
        return scored_chunks[:top_k]

import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.rag.vector_store import VectorStore
from app.ai.ollama_client import ollama_client
from app.core.config import settings

logger = logging.getLogger(__name__)

class RAGEngine:
    @staticmethod
    async def answer_question(
        db: AsyncSession,
        user_id: str,
        question: str,
        subject_id: str,
        document_id: Optional[str] = None,
        chat_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        1. Retrieve relevant chunks using vector similarity
        2. Assemble augmented context with page/slide metadata
        3. Call qwen3:8b to answer grounded strictly in material
        4. Return response + verified source citations
        """
        chunks = await VectorStore.search_similar_chunks(
            db=db,
            user_id=user_id,
            query_text=question,
            subject_id=subject_id,
            document_id=document_id,
            top_k=settings.TOP_K_CHUNKS
        )

        if not chunks:
            # No materials uploaded or found for this subject
            system_prompt = (
                "Você é o assistente de estudos StudyMind AI. Não há materiais suficientes "
                "enviados pelo aluno para responder com base em fontes específicas. "
                "Avise cordialmente ao aluno que ele pode enviar documentos (PDF, PPTX, TXT) "
                "para obter respostas fundamentadas no seu próprio material, e forneça uma explicação conceitual clara."
            )
            ans = await ollama_client.generate_text(
                prompt=question,
                system_prompt=system_prompt,
                temperature=0.3
            )
            return {
                "answer": ans,
                "sources": []
            }

        # Build context from chunks
        context_parts = []
        sources = []
        seen_sources = set()

        for idx, c in enumerate(chunks, start=1):
            doc_name = c["document_name"]
            page = c["page_or_slide"]
            content = c["content"]
            file_type = c["file_type"]
            label = "slide" if file_type in ["pptx", "ppt"] else "página"
            
            source_key = f"{doc_name}:{page}"
            if source_key not in seen_sources:
                seen_sources.add(source_key)
                sources.append({
                    "document_name": doc_name,
                    "page_or_slide": page,
                    "file_type": file_type,
                    "snippet": content[:180] + ("..." if len(content) > 180 else "")
                })

            context_parts.append(
                f"[FONTE {idx}: {doc_name} — {label} {page}]\n{content}"
            )

        assembled_context = "\n\n".join(context_parts)

        # History formatting
        history_str = ""
        if chat_history:
            history_str = "\nHistórico recente da conversa:\n" + "\n".join(
                f"{'Aluno' if h.get('sender') == 'user' else 'IA'}: {h.get('content')}"
                for h in chat_history[-4:]
            )

        system_prompt = (
            "Você é o StudyMind AI, tutor inteligente e dedicado de estudos do aluno.\n"
            "Diretrizes RÍGIDAS:\n"
            "1. Responda à pergunta do aluno utilizando PRINCIPALMENTE as fontes e trechos dos documentos fornecidos.\n"
            "2. Seja didático, claro, preciso e encorajador.\n"
            "3. Indique sempre no final ou no corpo da resposta quais partes dos documentos foram consultadas.\n"
            "4. NUNCA invente fontes, páginas ou informações não contidas no material quando se tratar de dados específicos.\n"
            "5. Se a informação não estiver nos materiais, explique o conceito geral e informe educadamente que aquele detalhe específico não consta nos documentos atuais."
        )

        user_prompt = (
            f"MATERIAIS E TRECHOS ENCONTRADOS:\n{assembled_context}\n\n"
            f"{history_str}\n\n"
            f"PERGUNTA DO ALUNO:\n{question}\n\n"
            f"Por favor, responda de forma completa e estruturada."
        )

        answer_text = await ollama_client.generate_text(
            prompt=user_prompt,
            system_prompt=system_prompt,
            temperature=0.2
        )

        return {
            "answer": answer_text,
            "sources": sources
        }

rag_engine = RAGEngine()

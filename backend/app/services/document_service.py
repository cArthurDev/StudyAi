import os
import re
import json
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.models import Document, Topic, TopicMastery, Subject
from app.document_processing.extractors import DocumentExtractor
from app.ai.ollama_client import ollama_client
from app.rag.vector_store import VectorStore
from app.core.config import settings

logger = logging.getLogger(__name__)

class DocumentService:
    @staticmethod
    async def process_document_background(
        db_session_factory,
        document_id: str
    ):
        """
        Background task that executes the complete extraction, AI analysis, chunking, and embedding pipeline.
        """
        async with db_session_factory() as db:
            doc = await db.get(Document, document_id)
            if not doc:
                logger.error(f"Document {document_id} not found for background processing")
                return

            try:
                # Stage 1: Text Extraction (35%)
                doc.status = "extracting"
                doc.progress = 35
                await db.commit()

                full_text, pages_data, total_pages = DocumentExtractor.extract_from_file(
                    doc.file_path, doc.file_type
                )
                doc.extracted_text = full_text
                doc.page_count = total_pages
                await db.commit()

                # Stage 2: AI Analysis (55%)
                doc.status = "analyzing"
                doc.progress = 55
                await db.commit()

                analysis_data = await DocumentService._analyze_document_hierarchical(
                    full_text=full_text,
                    pages_data=pages_data,
                    file_name=doc.name
                )
                doc.analysis_json = analysis_data
                await db.commit()

                # Save extracted topics to Topic table & init Mastery
                await DocumentService._sync_topics_from_analysis(
                    db=db,
                    user_id=doc.user_id,
                    subject_id=doc.subject_id,
                    analysis_data=analysis_data
                )

                # Stage 3: Chunks & Embeddings (80%)
                doc.status = "indexing"
                doc.progress = 80
                await db.commit()

                chunks_data = VectorStore.chunk_document_pages(
                    pages_data=pages_data,
                    chunk_size=settings.CHUNK_SIZE,
                    chunk_overlap=settings.CHUNK_OVERLAP
                )
                
                await VectorStore.index_document_chunks(
                    db=db,
                    document_id=doc.id,
                    subject_id=doc.subject_id,
                    user_id=doc.user_id,
                    chunks_data=chunks_data
                )

                # Stage 4: Ready (100%)
                doc.status = "ready"
                doc.progress = 100
                doc.error_message = None
                await db.commit()
                logger.info(f"Document {document_id} processed successfully!")

            except Exception as e:
                logger.error(f"Error processing document {document_id}: {e}", exc_info=True)
                doc.status = "error"
                doc.error_message = f"Erro no processamento: {str(e)}"
                await db.commit()

    @staticmethod
    async def _analyze_document_hierarchical(
        full_text: str,
        pages_data: List[Dict[str, Any]],
        file_name: str
    ) -> Dict[str, Any]:
        """
        Token estimation & hierarchical processing:
        If token count fits within standard context window, analyze in one shot.
        If large, process sections and consolidate them into a complete structured document analysis.
        """
        token_count = ollama_client.estimate_tokens(full_text)
        logger.info(f"Document {file_name} has ~{token_count} estimated tokens.")

        system_prompt = (
            "Você é um especialista em análise pedagógica de materiais de estudo. "
            "Analise o documento e extraia rigorosamente sua estrutura e conteúdos em formato JSON estruturado."
        )

        json_schema_prompt = """
        {
            "titulo": "Título do material ou assunto principal",
            "materia_sugerida": "Nome da matéria",
            "capitulos": ["Capítulo 1", "Capítulo 2"],
            "assuntos": [
                {
                    "nome": "Nome do Tópico",
                    "capitulo": "Nome do Capítulo correspondente",
                    "descricao": "Resumo conciso do que trata o tópico",
                    "dificuldade": "Fácil | Médio | Difícil",
                    "provavel_em_prova": true,
                    "importancia_score": 85,
                    "subassuntos": ["Subtópico A", "Subtópico B"],
                    "definicoes": ["Definição chave 1"],
                    "formulas": ["Fórmula ou sintaxe 1"]
                }
            ],
            "datas_importantes": ["Data ou evento histórico relevante"],
            "nomes_importantes": ["Nome de autor, cientista ou figura chave"],
            "dificuldade_estimada_geral": "Fácil | Médio | Difícil",
            "possiveis_conteudos_prova": ["O que provavelmente será cobrado em prova"]
        }
        """

        if token_count <= 8000:
            prompt = (
                f"DOCUMENTO: {file_name}\n\n"
                f"CONTEÚDO:\n{full_text}\n\n"
                f"Extraia a análise completa conforme a estrutura JSON:"
            )
            try:
                return await ollama_client.generate_structured(
                    prompt=prompt,
                    system_prompt=system_prompt,
                    schema_format=json_schema_prompt
                )
            except Exception as e:
                logger.warning(f"Structured single-shot analysis fallback: {e}")
                return DocumentService._fallback_analysis(file_name)

        # Hierarchical / Map-Reduce analysis for large documents
        logger.info(f"Processing large document hierarchically in sections...")
        section_summaries = []
        step = max(1, len(pages_data) // 5)
        
        for i in range(0, len(pages_data), step):
            section_pages = pages_data[i:i+step]
            sec_text = "\n".join(p["content"] for p in section_pages)
            sec_prompt = (
                f"Analise a seguinte seção do documento {file_name} (páginas/slides {section_pages[0]['page_or_slide']} a {section_pages[-1]['page_or_slide']}):\n\n"
                f"{sec_text[:6000]}\n\n"
                f"Liste os principais tópicos, definições, fórmulas e pontos para prova."
            )
            try:
                sec_analysis = await ollama_client.generate_text(
                    prompt=sec_prompt,
                    system_prompt="Você é um assistente acadêmico conciso.",
                    temperature=0.2
                )
                section_summaries.append(sec_analysis)
            except Exception as e:
                logger.warning(f"Section analysis failed: {e}")

        # Consolidate section analyses
        consolidated_input = "\n\n=== SEÇÃO ===\n".join(section_summaries)
        consolidation_prompt = (
            f"Consolide as análises parciais do documento '{file_name}' na estrutura JSON final:\n\n"
            f"{consolidated_input}\n\n"
            f"Retorne o JSON consolidado completo:"
        )

        try:
            return await ollama_client.generate_structured(
                prompt=consolidation_prompt,
                system_prompt=system_prompt,
                schema_format=json_schema_prompt
            )
        except Exception as e:
            logger.error(f"Hierarchical consolidation failed: {e}")
            return DocumentService._fallback_analysis(file_name)

    @staticmethod
    def _fallback_analysis(file_name: str) -> Dict[str, Any]:
        """Provides a safe structured fallback if the LLM output is malformed."""
        base_name = file_name.rsplit(".", 1)[0].replace("_", " ").title()
        return {
            "titulo": base_name,
            "materia_sugerida": "Geral",
            "capitulos": ["Introdução", "Conceitos Principais", "Aplicações Práticas"],
            "assuntos": [
                {
                    "nome": f"Fundamentos de {base_name}",
                    "capitulo": "Introdução",
                    "descricao": f"Conceitos essenciais e terminologias de {base_name}",
                    "dificuldade": "Médio",
                    "provavel_em_prova": True,
                    "importancia_score": 75.0,
                    "subassuntos": ["Definições", "Princípios Básicos"],
                    "definicoes": [],
                    "formulas": []
                }
            ],
            "datas_importantes": [],
            "nomes_importantes": [],
            "dificuldade_estimada_geral": "Médio",
            "possiveis_conteudos_prova": [f"Definição e aplicações de {base_name}"]
        }

    @staticmethod
    async def _sync_topics_from_analysis(
        db: AsyncSession,
        user_id: str,
        subject_id: str,
        analysis_data: Dict[str, Any]
    ):
        """Extract topics from AI analysis and persist in Topic and TopicMastery tables."""
        assuntos = analysis_data.get("assuntos", [])
        if not isinstance(assuntos, list):
            return

        for ass in assuntos:
            if not isinstance(ass, dict):
                continue
            name = ass.get("nome", "").strip()
            if not name:
                continue

            # Check if topic already exists for this subject
            existing = await db.execute(
                select(Topic).where(
                    and_(
                        Topic.subject_id == subject_id,
                        Topic.name == name
                    )
                )
            )
            topic_obj = existing.scalars().first()

            if not topic_obj:
                topic_obj = Topic(
                    subject_id=subject_id,
                    user_id=user_id,
                    name=name,
                    description=ass.get("descricao", ""),
                    chapter=ass.get("capitulo", ""),
                    difficulty=ass.get("dificuldade", "Médio"),
                    is_exam_likely=ass.get("provavel_em_prova", False),
                    importance_score=float(ass.get("importancia_score", 50.0)),
                    definitions=ass.get("definicoes", []),
                    formulas=ass.get("formulas", [])
                )
                db.add(topic_obj)
                await db.flush()

                # Init TopicMastery
                mastery = TopicMastery(
                    user_id=user_id,
                    topic_id=topic_obj.id,
                    subject_id=subject_id,
                    mastery_score=0.0,
                    status="CRÍTICO"
                )
                db.add(mastery)

        await db.commit()

document_service = DocumentService()

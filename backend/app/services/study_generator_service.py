import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from app.models.models import (
    Subject, Document, Topic, TopicMastery, Summary, Flashcard, 
    Question, Quiz, QuizQuestion, StudyPlan, StudySession
)
from app.ai.ollama_client import ollama_client
from app.services.mastery_service import mastery_service

logger = logging.getLogger(__name__)

class StudyGeneratorService:
    @staticmethod
    async def _get_subject_context(
        db: AsyncSession,
        subject_id: str,
        document_id: Optional[str] = None
    ) -> str:
        """Fetch extracted text context from documents of a subject."""
        if document_id:
            doc = await db.get(Document, document_id)
            if doc and doc.extracted_text:
                return f"DOCUMENTO: {doc.name}\n{doc.extracted_text[:12000]}"
            return ""

        query = select(Document).where(
            and_(
                Document.subject_id == subject_id,
                Document.status == "ready"
            )
        )
        res = await db.execute(query)
        docs = res.scalars().all()
        
        context_parts = []
        for d in docs[:5]:
            if d.extracted_text:
                context_parts.append(f"DOCUMENTO '{d.name}':\n{d.extracted_text[:4000]}")
                
        return "\n\n".join(context_parts)

    @staticmethod
    async def generate_summary(
        db: AsyncSession,
        user_id: str,
        subject_id: str,
        summary_type: str,
        document_id: Optional[str] = None,
        custom_instructions: Optional[str] = None
    ) -> Summary:
        """Generate tailored AI summary and save to database."""
        context = await StudyGeneratorService._get_subject_context(db, subject_id, document_id)
        if not context:
            raise ValueError("Não há materiais disponíveis nesta matéria para gerar o resumo.")

        type_instructions = {
            "rapido": "Crie um RESUMO RÁPIDO e conciso de leitura em 3 minutos, destacando os 3 principais conceitos.",
            "completo": "Crie um RESUMO COMPLETO e aprofundado, dividindo em tópicos, subtópicos, definições e exemplos práticos.",
            "prova": "Crie um RESUMO ESTRATÉGICO PARA PROVA, com foco no que é mais cobrado, pegadinhas comuns, fórmulas e termos essenciais.",
            "topicos": "Crie um RESUMO EM BULLET POINTS estruturado, direto ao ponto e categorizado por assuntos.",
            "simplificado": "Crie um RESUMO SIMPLIFICADO explicando como se o aluno tivesse 12 anos, com analogias do dia a dia e sem jargões desnecessários."
        }

        instruction = type_instructions.get(summary_type, type_instructions["completo"])
        if custom_instructions:
            instruction += f"\nInstruções adicionais do aluno: {custom_instructions}"

        system_prompt = (
            "Você é um pedagogo e sintetizador acadêmico de elite do StudyMind AI. "
            "Gere resumos claros, bem formatados em Markdown, com negritos, listas e citações conceituais baseadas no material."
        )

        user_prompt = (
            f"{instruction}\n\n"
            f"MATERIAL DE ESTUDO:\n{context}\n\n"
            "Retorne o resumo formatado em Markdown com um título chamativo e estruturado."
        )

        content = await ollama_client.generate_text(
            prompt=user_prompt,
            system_prompt=system_prompt,
            temperature=0.3
        )

        # Determine title
        first_line = content.strip().split("\n")[0].replace("#", "").strip()
        title = first_line[:100] if first_line else f"Resumo {summary_type.capitalize()}"

        summary_obj = Summary(
            user_id=user_id,
            subject_id=subject_id,
            document_id=document_id,
            title=title,
            summary_type=summary_type,
            content=content
        )
        db.add(summary_obj)
        await db.commit()
        await db.refresh(summary_obj)
        return summary_obj

    @staticmethod
    async def generate_flashcards(
        db: AsyncSession,
        user_id: str,
        subject_id: str,
        count: int = 10,
        document_id: Optional[str] = None,
        topic_name: Optional[str] = None,
        difficulty: str = "Misturado"
    ) -> List[Flashcard]:
        """Generate high-yield flashcards grounded in document materials."""
        context = await StudyGeneratorService._get_subject_context(db, subject_id, document_id)
        if not context:
            raise ValueError("Não há materiais disponíveis para gerar flashcards.")

        schema = """
        [
            {
                "pergunta": "Pergunta direta e objetiva",
                "resposta": "Resposta clara, didática e precisa",
                "assunto": "Nome do tópico ou conceito",
                "dificuldade": "Fácil | Médio | Difícil",
                "fonte": "Nome do material ou página aproximada"
            }
        ]
        """

        system_prompt = (
            "Você é um especialista em técnicas de memorização ativa e flashcards. "
            "Crie flashcards que testem compreensão ativa, não apenas memorização passiva de palavras soltas. "
            "Retorne APENAS um array JSON válido."
        )

        user_prompt = (
            f"Gere exatamente {count} flashcards de estudo com dificuldade '{difficulty}'.\n"
            f"{f'Foco no assunto: {topic_name}' if topic_name else ''}\n\n"
            f"MATERIAL BASE:\n{context}\n\n"
            f"Estrutura JSON requerida:\n{schema}"
        )

        data = await ollama_client.generate_structured(
            prompt=user_prompt,
            system_prompt=system_prompt,
            schema_format=schema
        )

        flashcards_list = data if isinstance(data, list) else data.get("flashcards", [])
        created_flashcards = []

        for item in flashcards_list[:count]:
            if not isinstance(item, dict):
                continue
            
            fc = Flashcard(
                user_id=user_id,
                subject_id=subject_id,
                document_id=document_id,
                question=item.get("pergunta", "Pergunta"),
                answer=item.get("resposta", "Resposta"),
                topic_name=item.get("assunto", topic_name or "Geral"),
                difficulty=item.get("dificuldade", "Médio"),
                source_citation=item.get("fonte", "Material da matéria"),
                interval_days=1.0,
                ease_factor=2.5,
                repetition_count=0,
                next_review_at=datetime.utcnow()
            )
            db.add(fc)
            created_flashcards.append(fc)

        await db.commit()
        return created_flashcards

    @staticmethod
    async def review_flashcard(
        db: AsyncSession,
        user_id: str,
        flashcard_id: str,
        rating: str  # 'errei', 'dificil', 'bom', 'facil'
    ) -> Flashcard:
        """
        Spaced Repetition (SM-2 algorithm implementation).
        Adjusts interval_days, ease_factor, and schedules next_review_at.
        """
        fc = await db.get(Flashcard, flashcard_id)
        if not fc or fc.user_id != user_id:
            raise ValueError("Flashcard não encontrado")

        fc.last_rating = rating.lower()
        
        # SM-2 logic
        # Quality: errei=0, dificil=2, bom=4, facil=5
        quality_map = {"errei": 0, "dificil": 2, "bom": 4, "facil": 5}
        q = quality_map.get(rating.lower(), 3)

        if q < 3:
            # Failed recall -> reset repetitions
            fc.repetition_count = 0
            fc.interval_days = 1.0
        else:
            # Successful recall
            if fc.repetition_count == 0:
                fc.interval_days = 1.0
            elif fc.repetition_count == 1:
                fc.interval_days = 3.0
            else:
                fc.interval_days = round(fc.interval_days * fc.ease_factor, 1)
            fc.repetition_count += 1

        # Ease factor modification: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        new_ef = fc.ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        fc.ease_factor = max(1.3, round(new_ef, 2))
        fc.next_review_at = datetime.utcnow() + timedelta(days=fc.interval_days)

        await db.commit()
        await db.refresh(fc)
        return fc

    @staticmethod
    async def generate_questions(
        db: AsyncSession,
        user_id: str,
        subject_id: str,
        count: int = 5,
        question_type: str = "multipla_escolha",
        difficulty: str = "Médio",
        document_id: Optional[str] = None,
        topic_name: Optional[str] = None
    ) -> List[Question]:
        """Generate academic questions with multiple choice, true/false or discursive format."""
        context = await StudyGeneratorService._get_subject_context(db, subject_id, document_id)
        if not context:
            raise ValueError("Não há materiais disponíveis para gerar questões.")

        schema = """
        [
            {
                "tipo": "multipla_escolha | verdadeiro_falso | discursiva",
                "dificuldade": "Fácil | Médio | Difícil",
                "assunto": "Tópico",
                "subassunto": "Subtópico",
                "enunciado": "Texto da questão claro e contextualizado",
                "opcoes": ["A) ...", "B) ...", "C) ...", "D) ..."],
                "resposta_correta": "A | B | C | D | Verdadeiro | Falso | Resposta discursiva esperada",
                "explicacao": "Explicação detalhada de por que a resposta está certa e as outras erradas",
                "fonte": "Documento / Página de referência"
            }
        ]
        """

        system_prompt = (
            "Você é um examinador acadêmico rigoroso e didático. "
            "Gere questões desafiadoras e realistas baseadas unicamente no material fornecido. "
            "Retorne APENAS um array JSON válido."
        )

        user_prompt = (
            f"Gere exatamente {count} questões do tipo '{question_type}' com nível de dificuldade '{difficulty}'.\n"
            f"{f'Foco no assunto: {topic_name}' if topic_name else ''}\n\n"
            f"CONTEÚDO BASE:\n{context}\n\n"
            f"Estrutura JSON requerida:\n{schema}"
        )

        data = await ollama_client.generate_structured(
            prompt=user_prompt,
            system_prompt=system_prompt,
            schema_format=schema
        )

        q_list = data if isinstance(data, list) else data.get("questoes", [])
        created_questions = []

        for item in q_list[:count]:
            if not isinstance(item, dict):
                continue
            
            # Find related topic if exists
            topic_item_name = item.get("assunto", topic_name or "Geral")
            t_stmt = select(Topic).where(
                and_(Topic.subject_id == subject_id, Topic.name.ilike(f"%{topic_item_name}%"))
            )
            t_res = await db.execute(t_stmt)
            topic_obj = t_res.scalars().first()

            q = Question(
                user_id=user_id,
                subject_id=subject_id,
                document_id=document_id,
                topic_id=topic_obj.id if topic_obj else None,
                question_type=item.get("tipo", question_type),
                difficulty=item.get("dificuldade", difficulty),
                topic_name=topic_item_name,
                subtopic_name=item.get("subassunto", ""),
                question_text=item.get("enunciado", "Enunciado"),
                options_json=item.get("opcoes", []),
                correct_answer=item.get("resposta_correta", ""),
                explanation=item.get("explicacao", ""),
                source_citation=item.get("fonte", "Material da matéria")
            )
            db.add(q)
            created_questions.append(q)

        await db.commit()
        return created_questions

    @staticmethod
    async def generate_cram_plan(
        db: AsyncSession,
        user_id: str,
        subject_id: str,
        available_hours: float = 3.0,
        exam_date_time: Optional[datetime] = None
    ) -> StudyPlan:
        """
        '🚨 Tenho Prova Amanhã' (Cram Mode):
        1. Fetch all topics and deterministic mastery ratings for this subject.
        2. Calculate cram priority score for each topic.
        3. Rank topics: Critical (>60 priority), High, Review.
        4. Split available time budget into realistic chronological study sessions.
        5. Filter out topics with mastery >= 80% ('Não perca tempo agora com').
        """
        # Fetch topics and masteries
        t_stmt = select(Topic, TopicMastery).outerjoin(
            TopicMastery, and_(Topic.id == TopicMastery.topic_id, TopicMastery.user_id == user_id)
        ).where(Topic.subject_id == subject_id)
        
        res = await db.execute(t_stmt)
        topics_rows = res.all()

        scored_topics = []
        mastered_topics = []

        for topic, mastery in topics_rows:
            mastery_score = mastery.mastery_score if mastery else 0.0
            
            if mastery_score >= 80.0:
                mastered_topics.append(topic.name)
            
            priority = mastery_service.calculate_cram_priority(
                difficulty=topic.difficulty,
                mastery_score=mastery_score,
                importance_score=topic.importance_score,
                is_exam_likely=topic.is_exam_likely
            )
            scored_topics.append({
                "topic": topic,
                "mastery_score": mastery_score,
                "priority_score": priority
            })

        # Sort by priority score descending
        scored_topics.sort(key=lambda x: x["priority_score"], reverse=True)

        # Budget time (in minutes)
        total_minutes = int(available_hours * 60)
        
        # Build plan sessions
        plan = StudyPlan(
            user_id=user_id,
            subject_id=subject_id,
            title=f"Plano Intensivo — {available_hours:g}h (Prova Amanhã)",
            plan_type="cram_mode",
            total_hours=available_hours,
            mastered_topics_avoid=mastered_topics,
            parameters_json={
                "available_hours": available_hours,
                "exam_date_time": exam_date_time.isoformat() if exam_date_time else None
            }
        )
        db.add(plan)
        await db.flush()

        current_minute = 0
        order = 1
        sessions = []

        def format_time(mins: int) -> str:
            h = mins // 60
            m = mins % 60
            return f"{h:02d}:{m:02d}"

        # Top critical topics get deep focused blocks (35-45 mins)
        top_focus = scored_topics[:3]
        for item in top_focus:
            if current_minute >= total_minutes - 40:
                break
            duration = min(40, total_minutes - current_minute - 30)
            t_name = item["topic"].name
            
            sess = StudySession(
                study_plan_id=plan.id,
                user_id=user_id,
                subject_id=subject_id,
                topic_id=item["topic"].id,
                title=f"Foco Intensivo: {t_name}",
                start_time_label=format_time(current_minute),
                end_time_label=format_time(current_minute + duration),
                duration_minutes=duration,
                activity_type="theory",
                priority_level="critica" if item["priority_score"] >= 65 else "alta",
                description=f"Revisão prioritária do assunto '{t_name}'. Conceitos-chave, definições e fórmulas.",
                order_index=order
            )
            db.add(sess)
            sessions.append(sess)
            current_minute += duration
            order += 1

        # Mid session: Mini Simulado (30 mins)
        if current_minute < total_minutes - 25:
            sim_dur = min(30, total_minutes - current_minute - 20)
            sess = StudySession(
                study_plan_id=plan.id,
                user_id=user_id,
                subject_id=subject_id,
                title="Simulado Relâmpago de Fixação",
                start_time_label=format_time(current_minute),
                end_time_label=format_time(current_minute + sim_dur),
                duration_minutes=sim_dur,
                activity_type="quiz",
                priority_level="alta",
                description="Responda de 5 a 10 questões com cronômetro para testar retenção sob pressão.",
                order_index=order
            )
            db.add(sess)
            sessions.append(sess)
            current_minute += sim_dur
            order += 1

        # End session: Flashcards e Revisão de Erros (rest of time)
        if current_minute < total_minutes:
            remaining = total_minutes - current_minute
            sess = StudySession(
                study_plan_id=plan.id,
                user_id=user_id,
                subject_id=subject_id,
                title="Flashcards Essenciais e Fechamento",
                start_time_label=format_time(current_minute),
                end_time_label=format_time(total_minutes),
                duration_minutes=remaining,
                activity_type="flashcards",
                priority_level="revisao",
                description="Repasse rápido dos flashcards mais difíceis e fórmulas essenciais antes da prova.",
                order_index=order
            )
            db.add(sess)
            sessions.append(sess)

        await db.commit()
        await db.refresh(plan)
        return plan

study_generator_service = StudyGeneratorService()

import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from app.models.models import Topic, TopicMastery, QuestionAttempt, FlashcardReview, Flashcard, Question

logger = logging.getLogger(__name__)

class MasteryService:
    @staticmethod
    def classify_mastery_status(score: float) -> str:
        """
        Determinist classification:
        - DOMINADO: >= 80%
        - EM PROGRESSO: 60% - 79%
        - PRECISA REVISAR: 40% - 59%
        - CRÍTICO: < 40%
        """
        if score >= 80.0:
            return "DOMINADO"
        elif score >= 60.0:
            return "EM PROGRESSO"
        elif score >= 40.0:
            return "PRECISA REVISAR"
        else:
            return "CRÍTICO"

    @staticmethod
    async def update_topic_mastery(
        db: AsyncSession,
        user_id: str,
        topic_id: str,
        subject_id: str
    ) -> TopicMastery:
        """
        Pure deterministic calculation of 0-100 mastery score for a topic.
        Combines:
        1. Question attempts accuracy with difficulty weights
        2. Flashcard review ratings and repetition health
        3. Recency factor
        """
        # Fetch or create TopicMastery row
        query = select(TopicMastery).where(
            and_(
                TopicMastery.user_id == user_id,
                TopicMastery.topic_id == topic_id
            )
        )
        res = await db.execute(query)
        mastery = res.scalars().first()

        if not mastery:
            mastery = TopicMastery(
                user_id=user_id,
                topic_id=topic_id,
                subject_id=subject_id,
                mastery_score=0.0,
                status="CRÍTICO",
                total_attempts=0,
                correct_attempts=0,
                flashcards_reviewed=0,
                flashcards_correct=0,
                last_reviewed_at=datetime.utcnow()
            )
            db.add(mastery)

        # 1. Calculate question performance
        q_attempts_stmt = select(QuestionAttempt, Question).join(
            Question, QuestionAttempt.question_id == Question.id
        ).where(
            and_(
                QuestionAttempt.user_id == user_id,
                QuestionAttempt.topic_id == topic_id
            )
        )
        attempts_res = await db.execute(q_attempts_stmt)
        attempts = attempts_res.all()

        q_score_weighted = 0.0
        q_total_weight = 0.0
        correct_count = 0

        diff_weights = {"Fácil": 1.0, "Médio": 1.5, "Difícil": 2.0}

        for attempt, question in attempts:
            weight = diff_weights.get(question.difficulty, 1.2)
            q_total_weight += weight
            if attempt.is_correct:
                correct_count += 1
                q_score_weighted += 100.0 * weight

        question_metric = (q_score_weighted / q_total_weight) if q_total_weight > 0 else None

        # 2. Calculate flashcard performance
        flashcard_stmt = select(Flashcard).where(
            and_(
                Flashcard.user_id == user_id,
                Flashcard.topic_id == topic_id
            )
        )
        fc_res = await db.execute(flashcard_stmt)
        flashcards = fc_res.scalars().all()

        fc_score = 0.0
        fc_count = 0
        rating_values = {"errei": 0.0, "dificil": 40.0, "bom": 75.0, "facil": 100.0}

        for fc in flashcards:
            if fc.last_rating:
                fc_score += rating_values.get(fc.last_rating.lower(), 50.0)
                fc_count += 1

        flashcard_metric = (fc_score / fc_count) if fc_count > 0 else None

        # 3. Deterministic combination
        if question_metric is not None and flashcard_metric is not None:
            raw_score = (question_metric * 0.65) + (flashcard_metric * 0.35)
        elif question_metric is not None:
            raw_score = question_metric
        elif flashcard_metric is not None:
            raw_score = flashcard_metric
        else:
            raw_score = 0.0

        # Recency decay adjustment: if not reviewed in > 14 days, reduce by 5% per week up to 20%
        if mastery.last_reviewed_at:
            days_inactive = (datetime.utcnow() - mastery.last_reviewed_at).days
            if days_inactive > 14:
                decay = min(20.0, (days_inactive - 14) * 0.7)
                raw_score = max(0.0, raw_score - decay)

        final_score = round(min(100.0, max(0.0, raw_score)), 1)
        mastery.mastery_score = final_score
        mastery.status = MasteryService.classify_mastery_status(final_score)
        mastery.total_attempts = len(attempts)
        mastery.correct_attempts = correct_count
        mastery.flashcards_reviewed = fc_count
        mastery.last_reviewed_at = datetime.utcnow()

        await db.commit()
        await db.refresh(mastery)
        return mastery

    @staticmethod
    def calculate_cram_priority(
        difficulty: str,
        mastery_score: float,
        importance_score: float,
        is_exam_likely: bool,
        last_reviewed_days: int = 7
    ) -> float:
        """
        Deterministic priority score for 'Tenho Prova Amanhã':
        priority_score = w_diff + w_low_mastery + w_imp + w_rec + w_exam_likely
        """
        # Difficulty weight (0 to 25)
        diff_map = {"Fácil": 8.0, "Médio": 16.0, "Difícil": 25.0}
        w_diff = diff_map.get(difficulty, 15.0)

        # Low mastery weight (0 to 40) - the lower the mastery, the higher the cram priority
        w_low_mastery = (100.0 - mastery_score) * 0.40

        # Importance score weight (0 to 20)
        w_imp = (importance_score / 100.0) * 20.0

        # Exam likely bonus (0 or 15)
        w_exam_bonus = 15.0 if is_exam_likely else 0.0

        # Recency urgency (0 to 10)
        w_rec = min(10.0, last_reviewed_days * 0.8)

        total_priority = w_diff + w_low_mastery + w_imp + w_exam_bonus + w_rec
        return round(total_priority, 1)

mastery_service = MasteryService()

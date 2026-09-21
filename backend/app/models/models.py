import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    Column, String, Text, Integer, Float, Boolean, DateTime, ForeignKey, JSON
)
from sqlalchemy.types import TypeDecorator
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from app.core.database import Base
from app.core.config import settings

def generate_uuid() -> str:
    return str(uuid.uuid4())

class CompatibleVector(TypeDecorator):
    """
    Uses PostgreSQL pgvector Vector when on Postgres, and JSON array on SQLite.
    """
    impl = JSON
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(Vector(settings.EMBEDDING_DIMENSION))
        return dialect.type_descriptor(JSON())

    def process_bind_param(self, value, dialect):
        return value

    def process_result_value(self, value, dialect):
        return value

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    subjects = relationship("Subject", back_populates="user", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")
    flashcards = relationship("Flashcard", back_populates="user", cascade="all, delete-orphan")
    questions = relationship("Question", back_populates="user", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="user", cascade="all, delete-orphan")
    study_plans = relationship("StudyPlan", back_populates="user", cascade="all, delete-orphan")
    conversations = relationship("ChatConversation", back_populates="user", cascade="all, delete-orphan")
    exams = relationship("Exam", back_populates="user", cascade="all, delete-orphan")


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    color = Column(String(50), default="#6366f1")
    icon = Column(String(50), default="BookOpen")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="subjects")
    documents = relationship("Document", back_populates="subject", cascade="all, delete-orphan")
    topics = relationship("Topic", back_populates="subject", cascade="all, delete-orphan")
    summaries = relationship("Summary", back_populates="subject", cascade="all, delete-orphan")
    flashcards = relationship("Flashcard", back_populates="subject", cascade="all, delete-orphan")
    questions = relationship("Question", back_populates="subject", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="subject", cascade="all, delete-orphan")
    exams = relationship("Exam", back_populates="subject", cascade="all, delete-orphan")
    conversations = relationship("ChatConversation", back_populates="subject", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_type = Column(String(20), nullable=False)
    file_size = Column(Integer, default=0)
    file_path = Column(String(500), nullable=False)
    
    status = Column(String(50), default="uploading", index=True)
    progress = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    
    extracted_text = Column(Text, nullable=True)
    page_count = Column(Integer, default=0)
    analysis_json = Column(JSON, default=dict)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="documents")
    subject = relationship("Subject", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")
    summaries = relationship("Summary", back_populates="document", cascade="all, delete-orphan")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    chunk_index = Column(Integer, default=0)
    content = Column(Text, nullable=False)
    page_or_slide = Column(Integer, default=1)
    char_start = Column(Integer, default=0)
    char_end = Column(Integer, default=0)
    metadata_json = Column(JSON, default=dict)
    
    embedding = Column(CompatibleVector, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    document = relationship("Document", back_populates="chunks")


class Topic(Base):
    __tablename__ = "topics"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    chapter = Column(String(255), default="")
    difficulty = Column(String(50), default="Médio")
    is_exam_likely = Column(Boolean, default=False)
    importance_score = Column(Float, default=50.0)
    definitions = Column(JSON, default=list)
    formulas = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    subject = relationship("Subject", back_populates="topics")
    mastery = relationship("TopicMastery", back_populates="topic", uselist=False, cascade="all, delete-orphan")


class TopicMastery(Base):
    __tablename__ = "topic_mastery"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    
    mastery_score = Column(Float, default=0.0)
    status = Column(String(50), default="CRÍTICO")
    
    total_attempts = Column(Integer, default=0)
    correct_attempts = Column(Integer, default=0)
    flashcards_reviewed = Column(Integer, default=0)
    flashcards_correct = Column(Integer, default=0)
    
    last_reviewed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    topic = relationship("Topic", back_populates="mastery")


class Summary(Base):
    __tablename__ = "summaries"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True, index=True)
    
    title = Column(String(255), nullable=False)
    summary_type = Column(String(50), default="completo")
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    subject = relationship("Subject", back_populates="summaries")
    document = relationship("Document", back_populates="summaries")


class Flashcard(Base):
    __tablename__ = "flashcards"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True, index=True)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="SET NULL"), nullable=True, index=True)
    
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    topic_name = Column(String(255), default="Geral")
    difficulty = Column(String(50), default="Médio")
    source_citation = Column(String(255), default="")
    
    repetition_count = Column(Integer, default=0)
    interval_days = Column(Float, default=1.0)
    ease_factor = Column(Float, default=2.5)
    last_rating = Column(String(50), nullable=True)
    next_review_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="flashcards")
    subject = relationship("Subject", back_populates="flashcards")
    reviews = relationship("FlashcardReview", back_populates="flashcard", cascade="all, delete-orphan")


class FlashcardReview(Base):
    __tablename__ = "flashcard_reviews"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    flashcard_id = Column(String(36), ForeignKey("flashcards.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    rating = Column(String(50), nullable=False)
    reviewed_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    flashcard = relationship("Flashcard", back_populates="reviews")


class Question(Base):
    __tablename__ = "questions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True, index=True)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="SET NULL"), nullable=True, index=True)
    
    question_type = Column(String(50), default="multipla_escolha")
    difficulty = Column(String(50), default="Médio")
    topic_name = Column(String(255), default="Geral")
    subtopic_name = Column(String(255), default="")
    
    question_text = Column(Text, nullable=False)
    options_json = Column(JSON, default=list)
    correct_answer = Column(Text, nullable=False)
    explanation = Column(Text, default="")
    source_citation = Column(String(255), default="")
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="questions")
    subject = relationship("Subject", back_populates="questions")
    attempts = relationship("QuestionAttempt", back_populates="question", cascade="all, delete-orphan")


class QuestionAttempt(Base):
    __tablename__ = "question_attempts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(String(36), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="SET NULL"), nullable=True, index=True)
    quiz_id = Column(String(36), ForeignKey("quizzes.id", ondelete="SET NULL"), nullable=True, index=True)
    
    user_answer = Column(Text, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    time_spent_seconds = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    question = relationship("Question", back_populates="attempts")


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    
    title = Column(String(255), nullable=False)
    total_questions = Column(Integer, default=10)
    time_limit_minutes = Column(Integer, default=20)
    status = Column(String(50), default="in_progress")
    
    score_percentage = Column(Float, default=0.0)
    correct_count = Column(Integer, default=0)
    incorrect_count = Column(Integer, default=0)
    total_time_seconds = Column(Integer, default=0)
    topics_breakdown_json = Column(JSON, default=dict)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="quizzes")
    subject = relationship("Subject", back_populates="quizzes")
    quiz_questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    quiz_id = Column(String(36), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(String(36), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    order_index = Column(Integer, default=0)
    user_answer = Column(Text, nullable=True)
    is_correct = Column(Boolean, nullable=True)

    # Relationships
    quiz = relationship("Quiz", back_populates="quiz_questions")
    question = relationship("Question")


class Exam(Base):
    __tablename__ = "exams"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    
    title = Column(String(255), nullable=False)
    exam_date = Column(DateTime, nullable=False)
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="exams")
    subject = relationship("Subject", back_populates="exams")


class StudyPlan(Base):
    __tablename__ = "study_plans"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True, index=True)
    
    title = Column(String(255), nullable=False)
    plan_type = Column(String(50), default="weekly")
    total_hours = Column(Float, default=3.0)
    parameters_json = Column(JSON, default=dict)
    mastered_topics_avoid = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="study_plans")
    sessions = relationship("StudySession", back_populates="plan", cascade="all, delete-orphan")


class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    study_plan_id = Column(String(36), ForeignKey("study_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=True, index=True)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="SET NULL"), nullable=True, index=True)
    
    title = Column(String(255), nullable=False)
    start_time_label = Column(String(50), default="")
    end_time_label = Column(String(50), default="")
    duration_minutes = Column(Integer, default=30)
    
    activity_type = Column(String(50), default="theory")
    priority_level = Column(String(50), default="media")
    description = Column(Text, default="")
    
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    order_index = Column(Integer, default=0)

    # Relationships
    plan = relationship("StudyPlan", back_populates="sessions")


class ChatConversation(Base):
    __tablename__ = "chat_conversations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True, index=True)
    
    title = Column(String(255), default="Novo Chat")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="conversations")
    subject = relationship("Subject", back_populates="conversations")
    messages = relationship("ChatMessage", back_populates="conversation", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    conversation_id = Column(String(36), ForeignKey("chat_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    sender = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    sources_json = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    conversation = relationship("ChatConversation", back_populates="messages")

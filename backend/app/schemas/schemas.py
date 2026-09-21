from datetime import datetime
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, EmailStr, Field

# --- AUTH & USER ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# --- SUBJECTS ---
class SubjectBase(BaseModel):
    name: str
    description: Optional[str] = ""
    color: Optional[str] = "#6366f1"
    icon: Optional[str] = "BookOpen"

class SubjectCreate(SubjectBase):
    pass

class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None

class SubjectResponse(SubjectBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    document_count: Optional[int] = 0
    flashcard_count: Optional[int] = 0
    question_count: Optional[int] = 0
    mastery_average: Optional[float] = 0.0

    class Config:
        from_attributes = True

# --- DOCUMENTS ---
class DocumentResponse(BaseModel):
    id: str
    user_id: str
    subject_id: str
    name: str
    original_filename: str
    file_type: str
    file_size: int
    status: str
    progress: int
    error_message: Optional[str] = None
    page_count: int
    analysis_json: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DocumentStatusResponse(BaseModel):
    id: str
    status: str
    progress: int
    error_message: Optional[str] = None

# --- TOPICS & MASTERY ---
class TopicBase(BaseModel):
    name: str
    description: Optional[str] = ""
    chapter: Optional[str] = ""
    difficulty: Optional[str] = "Médio"
    is_exam_likely: Optional[bool] = False
    importance_score: Optional[float] = 50.0

class TopicResponse(TopicBase):
    id: str
    subject_id: str
    definitions: Optional[List[Any]] = []
    formulas: Optional[List[Any]] = []
    mastery_score: Optional[float] = 0.0
    mastery_status: Optional[str] = "CRÍTICO"
    created_at: datetime

    class Config:
        from_attributes = True

class TopicMasteryResponse(BaseModel):
    topic_id: str
    topic_name: str
    subject_id: str
    subject_name: Optional[str] = ""
    mastery_score: float
    status: str
    total_attempts: int
    correct_attempts: int
    accuracy_rate: float
    last_reviewed_at: Optional[datetime] = None

# --- SUMMARIES ---
class SummaryGenerateRequest(BaseModel):
    subject_id: str
    document_id: Optional[str] = None
    summary_type: str = Field(
        default="completo",
        description="rapido, completo, prova, topicos, simplificado"
    )
    custom_instructions: Optional[str] = None

class SummaryResponse(BaseModel):
    id: str
    user_id: str
    subject_id: str
    document_id: Optional[str] = None
    title: str
    summary_type: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- FLASHCARDS ---
class FlashcardGenerateRequest(BaseModel):
    subject_id: str
    document_id: Optional[str] = None
    count: int = Field(default=10, ge=1, le=30)
    topic_name: Optional[str] = None
    difficulty: Optional[str] = "Misturado"

class FlashcardResponse(BaseModel):
    id: str
    user_id: str
    subject_id: str
    document_id: Optional[str] = None
    topic_name: str
    question: str
    answer: str
    difficulty: str
    source_citation: str
    repetition_count: int
    interval_days: float
    ease_factor: float
    last_rating: Optional[str] = None
    next_review_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class FlashcardReviewRequest(BaseModel):
    # rating: 'errei', 'dificil', 'bom', 'facil'
    rating: str

# --- QUESTIONS ---
class QuestionGenerateRequest(BaseModel):
    subject_id: str
    document_id: Optional[str] = None
    count: int = Field(default=5, ge=1, le=30)
    # type: 'multipla_escolha', 'verdadeiro_falso', 'discursiva', 'misturado'
    question_type: str = "multipla_escolha"
    # difficulty: 'Fácil', 'Médio', 'Difícil', 'Misturado'
    difficulty: str = "Médio"
    topic_name: Optional[str] = None

class QuestionResponse(BaseModel):
    id: str
    user_id: str
    subject_id: str
    document_id: Optional[str] = None
    topic_name: str
    subtopic_name: str
    question_type: str
    difficulty: str
    question_text: str
    options_json: List[str] = []
    correct_answer: str
    explanation: str
    source_citation: str
    created_at: datetime

    class Config:
        from_attributes = True

class QuestionAttemptRequest(BaseModel):
    user_answer: str
    time_spent_seconds: int = 0
    quiz_id: Optional[str] = None

class QuestionAttemptResponse(BaseModel):
    is_correct: bool
    correct_answer: str
    explanation: str
    source_citation: str
    updated_mastery_score: Optional[float] = None
    updated_mastery_status: Optional[str] = None

# --- SIMULADOS (QUIZZES) ---
class QuizCreateRequest(BaseModel):
    subject_id: str
    title: Optional[str] = "Simulado Geral"
    total_questions: int = Field(default=10, ge=3, le=50)
    time_limit_minutes: int = Field(default=20, ge=5, le=180)
    difficulty: Optional[str] = "Misturado"
    topics: Optional[List[str]] = []

class QuizResponse(BaseModel):
    id: str
    user_id: str
    subject_id: str
    title: str
    total_questions: int
    time_limit_minutes: int
    status: str
    score_percentage: float
    correct_count: int
    incorrect_count: int
    total_time_seconds: int
    topics_breakdown_json: Dict[str, Any] = {}
    created_at: datetime
    completed_at: Optional[datetime] = None
    questions: Optional[List[QuestionResponse]] = []

    class Config:
        from_attributes = True

class QuizSubmitRequest(BaseModel):
    answers: Dict[str, str]  # {question_id: user_answer}
    total_time_seconds: int

# --- STUDY PLANS & CRAM MODE ---
class StudyPlanCreateRequest(BaseModel):
    subject_id: Optional[str] = None
    exam_date: Optional[datetime] = None
    available_hours_per_day: float = 2.0
    days_of_week: List[str] = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"]
    title: Optional[str] = "Plano de Estudos Semanal"

class CramModeRequest(BaseModel):
    subject_id: str
    available_hours: float = Field(default=3.0, ge=0.5, le=24.0)
    exam_date_time: Optional[datetime] = None
    focus_areas: Optional[List[str]] = []

class StudySessionResponse(BaseModel):
    id: str
    title: str
    start_time_label: str
    end_time_label: str
    duration_minutes: int
    activity_type: str
    priority_level: str
    description: str
    is_completed: bool
    completed_at: Optional[datetime] = None
    order_index: int

    class Config:
        from_attributes = True

class StudyPlanResponse(BaseModel):
    id: str
    user_id: str
    subject_id: Optional[str] = None
    title: str
    plan_type: str
    total_hours: float
    mastered_topics_avoid: List[str] = []
    parameters_json: Dict[str, Any] = {}
    sessions: List[StudySessionResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True

# --- EXAMS ---
class ExamCreate(BaseModel):
    subject_id: str
    title: str
    exam_date: datetime
    notes: Optional[str] = ""

class ExamResponse(BaseModel):
    id: str
    subject_id: str
    subject_name: Optional[str] = ""
    title: str
    exam_date: datetime
    notes: str
    days_remaining: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- RAG & CHAT ---
class ChatMessageRequest(BaseModel):
    content: str
    document_id: Optional[str] = None  # None means all documents in the subject

class ChatSource(BaseModel):
    document_name: str
    page_or_slide: int
    file_type: str
    snippet: str

class ChatMessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender: str
    content: str
    sources: List[ChatSource] = []
    created_at: datetime

    class Config:
        from_attributes = True

class ChatConversationResponse(BaseModel):
    id: str
    subject_id: str
    document_id: Optional[str] = None
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessageResponse] = []

    class Config:
        from_attributes = True

# --- DASHBOARD & ANALYTICS ---
class DashboardOverviewResponse(BaseModel):
    user_name: str
    total_subjects: int
    total_hours_studied: float
    total_questions_answered: int
    overall_accuracy_percentage: float
    upcoming_exams: List[ExamResponse] = []
    today_sessions: List[StudySessionResponse] = []
    recent_subjects: List[SubjectResponse] = []
    weekly_progress: Dict[str, int] = {}
    weak_topics: List[TopicMasteryResponse] = []
    critical_topics_count: int = 0

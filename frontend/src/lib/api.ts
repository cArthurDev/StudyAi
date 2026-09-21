const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
  document_count: number;
  flashcard_count: number;
  question_count: number;
  mastery_average: number;
}

export interface DocumentItem {
  id: string;
  user_id: string;
  subject_id: string;
  name: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  status: 'uploading' | 'extracting' | 'analyzing' | 'indexing' | 'ready' | 'error';
  progress: number;
  error_message?: string;
  page_count: number;
  analysis_json?: any;
  created_at: string;
  updated_at: string;
}

export interface ChatSource {
  document_name: string;
  page_or_slide: number;
  file_type: string;
  snippet: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender: 'user' | 'assistant';
  content: string;
  sources: ChatSource[];
  created_at: string;
}

export interface ChatConversation {
  id: string;
  subject_id: string;
  document_id?: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
}

export interface Summary {
  id: string;
  user_id: string;
  subject_id: string;
  document_id?: string;
  title: string;
  summary_type: string;
  content: string;
  created_at: string;
}

export interface Flashcard {
  id: string;
  user_id: string;
  subject_id: string;
  document_id?: string;
  topic_name: string;
  question: string;
  answer: string;
  difficulty: string;
  source_citation: string;
  repetition_count: number;
  interval_days: number;
  ease_factor: number;
  last_rating?: string;
  next_review_at: string;
  created_at: string;
}

export interface Question {
  id: string;
  user_id: string;
  subject_id: string;
  document_id?: string;
  topic_name: string;
  subtopic_name: string;
  question_type: 'multipla_escolha' | 'verdadeiro_falso' | 'discursiva';
  difficulty: string;
  question_text: string;
  options_json: string[];
  correct_answer: string;
  explanation: string;
  source_citation: string;
  created_at: string;
}

export interface Quiz {
  id: string;
  user_id: string;
  subject_id: string;
  title: string;
  total_questions: number;
  time_limit_minutes: number;
  status: string;
  score_percentage: number;
  correct_count: number;
  incorrect_count: number;
  total_time_seconds: number;
  topics_breakdown_json: Record<string, number>;
  created_at: string;
  completed_at?: string;
  questions?: Question[];
}

export interface StudySession {
  id: string;
  title: string;
  start_time_label: string;
  end_time_label: string;
  duration_minutes: number;
  activity_type: string;
  priority_level: string;
  description: string;
  is_completed: boolean;
  completed_at?: string;
  order_index: number;
}

export interface StudyPlan {
  id: string;
  user_id: string;
  subject_id?: string;
  title: string;
  plan_type: string;
  total_hours: number;
  mastered_topics_avoid: string[];
  parameters_json: any;
  sessions: StudySession[];
  created_at: string;
}

export interface Exam {
  id: string;
  subject_id: string;
  subject_name: string;
  title: string;
  exam_date: string;
  notes: string;
  days_remaining?: number;
  created_at: string;
}

export interface TopicMastery {
  topic_id: string;
  topic_name: string;
  subject_id: string;
  subject_name: string;
  mastery_score: number;
  status: 'DOMINADO' | 'EM PROGRESSO' | 'PRECISA REVISAR' | 'CRÍTICO';
  total_attempts: number;
  correct_attempts: number;
  accuracy_rate: number;
  last_reviewed_at?: string;
}

export interface DashboardOverview {
  user_name: string;
  total_subjects: number;
  total_hours_studied: number;
  total_questions_answered: number;
  overall_accuracy_percentage: number;
  upcoming_exams: Exam[];
  today_sessions: StudySession[];
  recent_subjects: Subject[];
  weekly_progress: Record<string, number>;
  weak_topics: TopicMastery[];
  critical_topics_count: number;
}

// Token helper
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('studymind_token');
};

export const setToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('studymind_token', token);
  }
};

export const removeToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('studymind_token');
    localStorage.removeItem('studymind_user');
  }
};

// Base Fetcher
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    removeToken();
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
      window.location.href = '/login';
    }
  }

  if (!response.ok) {
    let errorDetail = 'Ocorreu um erro na requisição.';
    try {
      const err = await response.json();
      errorDetail = err.detail || errorDetail;
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

// API methods
export const api = {
  // Auth
  register: (data: any) => apiFetch<{ access_token: string; user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => apiFetch<{ access_token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => apiFetch<User>('/auth/me'),

  // Subjects
  getSubjects: () => apiFetch<Subject[]>('/subjects/'),
  getSubject: (id: string) => apiFetch<Subject>(`/subjects/${id}`),
  createSubject: (data: any) => apiFetch<Subject>('/subjects/', { method: 'POST', body: JSON.stringify(data) }),
  updateSubject: (id: string, data: any) => apiFetch<Subject>(`/subjects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSubject: (id: string) => apiFetch<{ message: string }>(`/subjects/${id}`, { method: 'DELETE' }),
  getSubjectMindmap: (id: string) => apiFetch<any>(`/subjects/${id}/mindmap`),

  // Documents
  getDocuments: (subjectId?: string) => apiFetch<DocumentItem[]>(`/documents/${subjectId ? `?subject_id=${subjectId}` : ''}`),
  uploadDocument: (formData: FormData) => apiFetch<DocumentItem>('/documents/upload', { method: 'POST', body: formData }),
  getDocumentStatus: (id: string) => apiFetch<{ id: string; status: string; progress: number; error_message?: string }>(`/documents/${id}/status`),
  deleteDocument: (id: string) => apiFetch<{ message: string }>(`/documents/${id}`, { method: 'DELETE' }),

  // Chat RAG
  getConversations: (subjectId: string) => apiFetch<ChatConversation[]>(`/chat/conversations?subject_id=${subjectId}`),
  createConversation: (subjectId: string, documentId?: string) => apiFetch<ChatConversation>(`/chat/conversations?subject_id=${subjectId}${documentId ? `&document_id=${documentId}` : ''}`, { method: 'POST' }),
  sendMessage: (convId: string, content: string, docId?: string) => apiFetch<ChatMessage>(`/chat/conversations/${convId}/messages`, { method: 'POST', body: JSON.stringify({ content, document_id: docId }) }),

  // Summaries
  getSummaries: (subjectId?: string) => apiFetch<Summary[]>(`/summaries/${subjectId ? `?subject_id=${subjectId}` : ''}`),
  generateSummary: (data: { subject_id: string; document_id?: string; summary_type: string; custom_instructions?: string }) => apiFetch<Summary>('/summaries/generate', { method: 'POST', body: JSON.stringify(data) }),
  deleteSummary: (id: string) => apiFetch<{ message: string }>(`/summaries/${id}`, { method: 'DELETE' }),

  // Flashcards
  getFlashcards: (subjectId?: string) => apiFetch<Flashcard[]>(`/flashcards/${subjectId ? `?subject_id=${subjectId}` : ''}`),
  generateFlashcards: (data: any) => apiFetch<Flashcard[]>('/flashcards/generate', { method: 'POST', body: JSON.stringify(data) }),
  reviewFlashcard: (id: string, rating: string) => apiFetch<Flashcard>(`/flashcards/${id}/review`, { method: 'POST', body: JSON.stringify({ rating }) }),
  deleteFlashcard: (id: string) => apiFetch<{ message: string }>(`/flashcards/${id}`, { method: 'DELETE' }),

  // Questions
  getQuestions: (subjectId?: string, difficulty?: string, type?: string) => {
    const params = new URLSearchParams();
    if (subjectId) params.append('subject_id', subjectId);
    if (difficulty) params.append('difficulty', difficulty);
    if (type) params.append('question_type', type);
    return apiFetch<Question[]>(`/questions/?${params.toString()}`);
  },
  generateQuestions: (data: any) => apiFetch<Question[]>('/questions/generate', { method: 'POST', body: JSON.stringify(data) }),
  submitQuestionAttempt: (id: string, data: { user_answer: string; time_spent_seconds?: number; quiz_id?: string }) => apiFetch<any>(`/questions/${id}/attempt`, { method: 'POST', body: JSON.stringify(data) }),
  deleteQuestion: (id: string) => apiFetch<{ message: string }>(`/questions/${id}`, { method: 'DELETE' }),

  // Quizzes (Simulados)
  getQuizzes: (subjectId?: string) => apiFetch<Quiz[]>(`/quizzes/${subjectId ? `?subject_id=${subjectId}` : ''}`),
  createQuiz: (data: any) => apiFetch<Quiz>('/quizzes/', { method: 'POST', body: JSON.stringify(data) }),
  getQuiz: (id: string) => apiFetch<Quiz>(`/quizzes/${id}`),
  submitQuiz: (id: string, data: { answers: Record<string, string>; total_time_seconds: number }) => apiFetch<Quiz>(`/quizzes/${id}/submit`, { method: 'POST', body: JSON.stringify(data) }),

  // Study Plans & Cram Mode
  getStudyPlans: (subjectId?: string) => apiFetch<StudyPlan[]>(`/plans/${subjectId ? `?subject_id=${subjectId}` : ''}`),
  createWeeklyPlan: (data: any) => apiFetch<StudyPlan>('/plans/weekly', { method: 'POST', body: JSON.stringify(data) }),
  createCramPlan: (data: { subject_id: string; available_hours: number; exam_date_time?: string }) => apiFetch<StudyPlan>('/plans/cram-mode', { method: 'POST', body: JSON.stringify(data) }),
  toggleSession: (sessionId: string) => apiFetch<StudySession>(`/plans/sessions/${sessionId}/toggle`, { method: 'PATCH' }),
  getExams: () => apiFetch<Exam[]>('/plans/exams'),
  createExam: (data: any) => apiFetch<Exam>('/plans/exams', { method: 'POST', body: JSON.stringify(data) }),

  // Analytics & Dashboard
  getDashboard: () => apiFetch<DashboardOverview>('/analytics/dashboard'),
  getAllMastery: () => apiFetch<TopicMastery[]>('/analytics/mastery-all'),

  // System
  getOllamaStatus: () => apiFetch<any>('/system/ollama-status'),
};

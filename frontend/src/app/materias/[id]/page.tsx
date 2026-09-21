'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  api, Subject, DocumentItem, Summary, Flashcard, 
  Question, Quiz, TopicMastery 
} from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { UploadDropzone } from '@/components/UploadDropzone';
import { ChatInterface } from '@/components/ChatInterface';
import { FlashcardStudy } from '@/components/FlashcardStudy';
import { QuestionPractice } from '@/components/QuestionPractice';
import { SimuladoRunner } from '@/components/SimuladoRunner';
import { MindMapViewer } from '@/components/MindMapViewer';
import {
  BookOpen,
  FileText,
  MessageSquare,
  FileSpreadsheet,
  Layers,
  HelpCircle,
  Timer,
  Network,
  BarChart2,
  Trash2,
  Plus,
  Sparkles,
  Loader2,
  CheckCircle2,
  Zap,
  ArrowLeft
} from 'lucide-react';

export default function SubjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.id as string;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('visao_geral');
  const [subject, setSubject] = useState<Subject | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [mindmapData, setMindmapData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Active quiz runner state
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);

  // Generators state
  const [summaryType, setSummaryType] = useState('completo');
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [questionCount, setQuestionCount] = useState(5);
  const [questionType, setQuestionType] = useState('multipla_escolha');
  const [questionDifficulty, setQuestionDifficulty] = useState('Médio');

  const loadData = async () => {
    try {
      const [subData, docsData, sumsData, fcData, qData, quizData] = await Promise.all([
        api.getSubject(subjectId),
        api.getDocuments(subjectId),
        api.getSummaries(subjectId),
        api.getFlashcards(subjectId),
        api.getQuestions(subjectId),
        api.getQuizzes(subjectId)
      ]);

      setSubject(subData);
      setDocuments(docsData);
      setSummaries(sumsData);
      setFlashcards(fcData);
      setQuestions(qData);
      setQuizzes(quizData);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const loadMindmap = async () => {
    try {
      const data = await api.getSubjectMindmap(subjectId);
      setMindmapData(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (subjectId) {
      loadData();
    }
  }, [subjectId]);

  useEffect(() => {
    if (activeTab === 'mapa_mental' && !mindmapData) {
      loadMindmap();
    }
  }, [activeTab]);

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Deseja excluir este documento?')) return;
    try {
      await api.deleteDocument(docId);
      loadData();
    } catch {
      // ignore
    }
  };

  const handleGenerateSummary = async () => {
    setGeneratingSummary(true);
    try {
      const newSum = await api.generateSummary({
        subject_id: subjectId,
        summary_type: summaryType
      });
      setSummaries((prev) => [newSum, ...prev]);
    } catch (err: any) {
      alert(err.message || 'Erro ao gerar resumo.');
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    setGeneratingFlashcards(true);
    try {
      const newCards = await api.generateFlashcards({
        subject_id: subjectId,
        count: 10,
        difficulty: 'Misturado'
      });
      setFlashcards((prev) => [...newCards, ...prev]);
    } catch (err: any) {
      alert(err.message || 'Erro ao gerar flashcards.');
    } finally {
      setGeneratingFlashcards(false);
    }
  };

  const handleGenerateQuestions = async () => {
    setGeneratingQuestions(true);
    try {
      const newQs = await api.generateQuestions({
        subject_id: subjectId,
        count: questionCount,
        question_type: questionType,
        difficulty: questionDifficulty
      });
      setQuestions((prev) => [...newQs, ...prev]);
    } catch (err: any) {
      alert(err.message || 'Erro ao gerar questões.');
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleStartSimulado = async () => {
    try {
      const quiz = await api.createQuiz({
        subject_id: subjectId,
        title: `Simulado — ${subject?.name}`,
        total_questions: 10,
        time_limit_minutes: 20
      });
      setActiveQuiz(quiz);
      setActiveTab('simulados');
    } catch (err: any) {
      alert(err.message || 'Falha ao criar simulado.');
    }
  };

  const tabs = [
    { id: 'visao_geral', label: 'Visão Geral', icon: BookOpen },
    { id: 'materiais', label: `Materiais (${documents.length})`, icon: FileText },
    { id: 'chat', label: 'Chat com Matéria', icon: MessageSquare },
    { id: 'resumos', label: `Resumos (${summaries.length})`, icon: FileSpreadsheet },
    { id: 'flashcards', label: `Flashcards (${flashcards.length})`, icon: Layers },
    { id: 'questoes', label: `Questões (${questions.length})`, icon: HelpCircle },
    { id: 'simulados', label: `Simulados (${quizzes.length})`, icon: Timer },
    { id: 'mapa_mental', label: 'Mapa Mental', icon: Network },
  ];

  if (loading || !subject) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0d12]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0a0d12]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header Banner */}
          <div className="p-6 md:p-8 rounded-3xl bg-[#161b22] border border-slate-800/80 shadow-xl relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Link
                  href="/materias"
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Link>

                <div
                  className="flex items-center justify-center w-14 h-14 rounded-2xl text-white font-bold shadow-lg"
                  style={{ backgroundColor: subject.color || '#6366f1' }}
                >
                  <BookOpen className="w-7 h-7" />
                </div>

                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
                    {subject.name}
                  </h1>
                  <p className="text-xs md:text-sm text-slate-400 mt-0.5">
                    {subject.description || 'Matéria configurada no StudyMind AI'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href={`/prova-amanha?subject_id=${subject.id}`}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-500/20 transition-all"
                >
                  <Zap className="w-4 h-4 animate-pulse" />
                  Prova Amanhã
                </Link>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 mt-8 pt-4 border-t border-slate-800/80 overflow-x-auto pb-1">
              {tabs.map((t) => {
                const Icon = t.icon;
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TAB 1: VISÃO GERAL */}
          {activeTab === 'visao_geral' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-[#161b22] border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400 uppercase font-semibold">Documentos</span>
                  <div className="text-2xl font-bold font-mono text-slate-100">{documents.length}</div>
                </div>
                <div className="p-5 rounded-2xl bg-[#161b22] border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400 uppercase font-semibold">Flashcards</span>
                  <div className="text-2xl font-bold font-mono text-indigo-400">{flashcards.length}</div>
                </div>
                <div className="p-5 rounded-2xl bg-[#161b22] border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400 uppercase font-semibold">Questões</span>
                  <div className="text-2xl font-bold font-mono text-emerald-400">{questions.length}</div>
                </div>
                <div className="p-5 rounded-2xl bg-[#161b22] border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400 uppercase font-semibold">Domínio Médio</span>
                  <div className="text-2xl font-bold font-mono text-purple-400">
                    {Math.round(subject.mastery_average || 0)}%
                  </div>
                </div>
              </div>

              {/* Upload Dropzone */}
              <UploadDropzone
                subjectId={subject.id}
                onSuccess={() => loadData()}
              />
            </div>
          )}

          {/* TAB 2: MATERIAIS */}
          {activeTab === 'materiais' && (
            <div className="space-y-6">
              <UploadDropzone
                subjectId={subject.id}
                onSuccess={() => loadData()}
              />

              <div className="p-6 bg-[#161b22] border border-slate-800/80 rounded-2xl shadow-xl space-y-4">
                <h3 className="text-base font-bold text-slate-100">Documentos desta Matéria</h3>

                {documents.length > 0 ? (
                  <div className="divide-y divide-slate-800">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-slate-200">{doc.name}</h4>
                            <p className="text-xs text-slate-400">
                              {doc.file_type.toUpperCase()} • {(doc.file_size / 1024 / 1024).toFixed(2)} MB • {doc.page_count} páginas/slides
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                            doc.status === 'ready'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : doc.status === 'error'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 animate-pulse'
                          }`}>
                            {doc.status === 'ready' ? 'Pronto' : doc.status === 'error' ? 'Erro' : `Processando (${doc.progress}%)`}
                          </span>

                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-2 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    Nenhum documento enviado ainda.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CHAT RAG */}
          {activeTab === 'chat' && (
            <ChatInterface subjectId={subject.id} documents={documents} />
          )}

          {/* TAB 4: RESUMOS */}
          {activeTab === 'resumos' && (
            <div className="space-y-6">
              {/* Generator control card */}
              <div className="p-6 bg-[#161b22] border border-slate-800/80 rounded-2xl shadow-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-100">Gerador de Resumos com IA</h3>
                    <p className="text-xs text-slate-400">Escolha o formato ideal para seu momento de estudo</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={summaryType}
                      onChange={(e) => setSummaryType(e.target.value)}
                      className="px-3.5 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="rapido">⚡ Resumo Rápido (3 min)</option>
                      <option value="completo">📖 Resumo Completo</option>
                      <option value="prova">🎯 Resumo para Prova</option>
                      <option value="topicos">📌 Resumo em Tópicos</option>
                      <option value="simplificado">👶 Resumo Simplificado (12 anos)</option>
                    </select>

                    <button
                      disabled={generatingSummary || documents.length === 0}
                      onClick={handleGenerateSummary}
                      className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl shadow-lg shadow-indigo-600/30"
                    >
                      {generatingSummary ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      Gerar Resumo
                    </button>
                  </div>
                </div>
              </div>

              {/* Summaries list */}
              <div className="space-y-4">
                {summaries.map((sum) => (
                  <div key={sum.id} className="p-6 bg-[#161b22] border border-slate-800/80 rounded-2xl shadow-xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <h4 className="text-base font-bold text-slate-100">{sum.title}</h4>
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 uppercase">
                        {sum.summary_type}
                      </span>
                    </div>

                    <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {sum.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: FLASHCARDS */}
          {activeTab === 'flashcards' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center p-6 bg-[#161b22] border border-slate-800/80 rounded-2xl">
                <div>
                  <h3 className="text-base font-bold text-slate-100">Baralho de Flashcards</h3>
                  <p className="text-xs text-slate-400">Revisão espaçada (SM-2) para retenção de longo prazo</p>
                </div>

                <button
                  disabled={generatingFlashcards || documents.length === 0}
                  onClick={handleGenerateFlashcards}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl shadow-lg shadow-indigo-600/20"
                >
                  {generatingFlashcards ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Gerar 10 Flashcards com IA
                </button>
              </div>

              <FlashcardStudy flashcards={flashcards} onFinish={() => loadData()} />
            </div>
          )}

          {/* TAB 6: QUESTÕES */}
          {activeTab === 'questoes' && (
            <div className="space-y-6">
              {/* Question Generator controls */}
              <div className="p-6 bg-[#161b22] border border-slate-800/80 rounded-2xl shadow-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-100">Gerar Questões com IA</h3>
                    <p className="text-xs text-slate-400">Simule questões acadêmicas baseadas rigorosamente nos seus materiais</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Number(e.target.value))}
                      className="px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
                    >
                      <option value={5}>5 questões</option>
                      <option value={10}>10 questões</option>
                      <option value={20}>20 questões</option>
                      <option value={30}>30 questões</option>
                    </select>

                    <select
                      value={questionType}
                      onChange={(e) => setQuestionType(e.target.value)}
                      className="px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
                    >
                      <option value="multipla_escolha">Múltipla Escolha</option>
                      <option value="verdadeiro_falso">Verdadeiro / Falso</option>
                      <option value="discursiva">Discursiva</option>
                    </select>

                    <select
                      value={questionDifficulty}
                      onChange={(e) => setQuestionDifficulty(e.target.value)}
                      className="px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
                    >
                      <option value="Fácil">Fácil</option>
                      <option value="Médio">Médio</option>
                      <option value="Difícil">Difícil</option>
                      <option value="Misturado">Misturado</option>
                    </select>

                    <button
                      disabled={generatingQuestions || documents.length === 0}
                      onClick={handleGenerateQuestions}
                      className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl shadow-lg shadow-indigo-600/30"
                    >
                      {generatingQuestions ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      Gerar Questões
                    </button>
                  </div>
                </div>
              </div>

              <QuestionPractice questions={questions} />
            </div>
          )}

          {/* TAB 7: SIMULADOS */}
          {activeTab === 'simulados' && (
            <div className="space-y-6">
              {!activeQuiz ? (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-[#161b22] border border-slate-800/80 rounded-2xl">
                    <div>
                      <h3 className="text-base font-bold text-slate-100">Simulados Cronometrados</h3>
                      <p className="text-xs text-slate-400">Teste sua retenção sob pressão de tempo e receba scorecard por assunto</p>
                    </div>

                    <button
                      onClick={handleStartSimulado}
                      className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/30"
                    >
                      <Timer className="w-4 h-4" />
                      Iniciar Novo Simulado (10 questões)
                    </button>
                  </div>

                  {/* History of quizzes */}
                  <div className="space-y-3">
                    {quizzes.map((q) => (
                      <div
                        key={q.id}
                        onClick={() => setActiveQuiz(q)}
                        className="flex items-center justify-between p-4 bg-[#161b22] border border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                            <Timer className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-slate-200">{q.title}</h4>
                            <span className="text-xs text-slate-400">{q.total_questions} questões • {q.time_limit_minutes} min</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-base font-extrabold font-mono text-indigo-400">
                            {q.score_percentage}%
                          </span>
                          <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                            q.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {q.status === 'completed' ? 'Finalizado' : 'Em andamento'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={() => setActiveQuiz(null)}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    ← Voltar para lista de simulados
                  </button>
                  <SimuladoRunner quiz={activeQuiz} onFinish={() => loadData()} />
                </div>
              )}
            </div>
          )}

          {/* TAB 8: MAPA MENTAL */}
          {activeTab === 'mapa_mental' && (
            <div className="space-y-6">
              {mindmapData ? (
                <MindMapViewer
                  subjectName={subject.name}
                  chapters={mindmapData.chapters}
                  mermaidCode={mindmapData.mermaid}
                />
              ) : (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

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
  AlarmClock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';

const tabGroups = [
  {
    id: 'organizar',
    label: 'Organizar',
    description: 'Ver a matéria e os arquivos',
    ids: ['visao_geral', 'materiais'],
  },
  {
    id: 'aprender',
    label: 'Aprender',
    description: 'Conversar, resumir e mapear',
    ids: ['chat', 'resumos', 'mapa_mental'],
  },
  {
    id: 'treinar',
    label: 'Treinar',
    description: 'Cartas, questões e simulados',
    ids: ['flashcards', 'questoes', 'simulados'],
  },
];

const summaryFormats = [
  { id: 'completo', label: 'Completo', hint: 'Texto estruturado para estudar com calma' },
  { id: 'topicos', label: 'Em tópicos', hint: 'Lista curta para revisar depois' },
  { id: 'simplificado', label: 'Linguagem simples', hint: 'Explicado como para alguém de 12 anos' },
];

export default function SubjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.id as string;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('visao_geral');
  const [menuGroup, setMenuGroup] = useState('organizar');
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeError, setNoticeError] = useState<string | null>(null);
  const [summaryIntent, setSummaryIntent] = useState<'rapido' | 'estudar' | 'prova' | null>(null);
  const [questionStep, setQuestionStep] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
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
    setNotice(null);
    setNoticeError(null);
    try {
      await api.deleteDocument(docId);
      setPendingDelete(null);
      setNotice('Documento excluído. A lista foi atualizada.');
      loadData();
    } catch {
      setNoticeError('Não foi possível excluir o documento. Tente de novo.');
    }
  };

  const handleGenerateSummary = async () => {
    setGeneratingSummary(true);
    setNotice(null);
    setNoticeError(null);
    try {
      const newSum = await api.generateSummary({
        subject_id: subjectId,
        summary_type: summaryType
      });
      setSummaries((prev) => [newSum, ...prev]);
      setNotice('Resumo pronto. Ele aparece logo abaixo, no formato que você escolheu.');
    } catch (err: any) {
      setNoticeError(err.message || 'Não foi possível gerar o resumo. Confira se há um material pronto.');
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    setGeneratingFlashcards(true);
    setNotice(null);
    setNoticeError(null);
    try {
      const newCards = await api.generateFlashcards({
        subject_id: subjectId,
        count: 10,
        difficulty: 'Misturado'
      });
      setFlashcards((prev) => [...newCards, ...prev]);
      setNotice('10 flashcards criados. Comece a revisão no baralho abaixo.');
    } catch (err: any) {
      setNoticeError(err.message || 'Não foi possível gerar os flashcards.');
    } finally {
      setGeneratingFlashcards(false);
    }
  };

  const handleGenerateQuestions = async () => {
    setGeneratingQuestions(true);
    setNotice(null);
    setNoticeError(null);
    try {
      const newQs = await api.generateQuestions({
        subject_id: subjectId,
        count: questionCount,
        question_type: questionType,
        difficulty: questionDifficulty
      });
      setQuestions((prev) => [...newQs, ...prev]);
      setNotice('Questões geradas. Responda abaixo para ver o gabarito na hora.');
    } catch (err: any) {
      setNoticeError(err.message || 'Não foi possível gerar as questões.');
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
      setMenuGroup('treinar');
      setActiveTab('simulados');
      setNoticeError(null);
      setNotice('Simulado criado. O cronômetro começa quando você entrar na prova.');
    } catch (err: any) {
      setNoticeError(err.message || 'Não foi possível criar o simulado.');
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

  const openGroup = tabGroups.find((group) => group.id === menuGroup) ?? tabGroups[0];
  const contentTab = openGroup.ids.includes(activeTab) ? activeTab : null;
  const questionTypeLabel = questionType === 'multipla_escolha' ? 'múltipla escolha' : questionType === 'verdadeiro_falso' ? 'verdadeiro ou falso' : 'discursivas';

  if (loading || !subject) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-[#0a0d12]" role="status">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm text-slate-300">Carregando a matéria e os materiais…</p>
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
                  title="Volta para a lista de matérias"
                  className="btn-quiet rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
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
                  title="Gera um plano curto só com o que ainda está fraco"
                  className="aviso-prova btn-primary rounded-xl font-bold transition-all"
                >
                  <AlarmClock className="w-4 h-4" />
                  Prova Amanhã
                </Link>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-800/80 space-y-3">
              <p className="text-xs text-slate-400">
                Primeiro escolha a etapa. As ferramentas dessa etapa aparecem em seguida, para você decidir entre poucas opções.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" role="tablist" aria-label="Etapas da matéria">
                {tabGroups.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    aria-pressed={menuGroup === group.id}
                    onClick={() => {
                      setMenuGroup(group.id);
                      setNotice(null);
                    }}
                    className="choice-chip"
                  >
                    <span className="block text-sm font-bold">{group.label}</span>
                    <span className="block text-xs opacity-80">{group.description}</span>
                  </button>
                ))}
              </div>
              <div className="ihc-reveal flex flex-wrap gap-2" role="tablist" aria-label={`Ferramentas de ${openGroup.label}`}>
                {tabs.filter((tab) => openGroup.ids.includes(tab.id)).map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setActiveTab(tab.id)}
                      className="subject-tab flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl whitespace-nowrap"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* TAB 1: VISÃO GERAL */}
          {(notice || noticeError) && (
            <div role="status" className={noticeError ? 'ihc-status ihc-status-error' : 'ihc-status'}>
              {noticeError ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
              <p className="text-sm font-medium">{noticeError || notice}</p>
            </div>
          )}

          {contentTab === null && (
            <div className="p-6 rounded-2xl bg-[#161b22] border border-slate-800 text-sm text-slate-300">
              Escolha uma ferramenta na etapa <strong>{openGroup.label}</strong>. O conteúdo muda só depois desse clique.
            </div>
          )}

          {contentTab === 'visao_geral' && (
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
          {contentTab === 'materiais' && (
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

                          {pendingDelete === doc.id ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleDeleteDocument(doc.id)}
                                className="btn-quiet bg-rose-600 text-white hover:bg-rose-500"
                              >
                                Confirmar exclusão
                              </button>
                              <button
                                type="button"
                                onClick={() => setPendingDelete(null)}
                                className="btn-quiet text-slate-300 hover:bg-slate-800"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              title="Remove este arquivo da matéria"
                              onClick={() => setPendingDelete(doc.id)}
                              className="btn-quiet text-slate-300 hover:text-rose-400 hover:bg-rose-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                              Excluir
                            </button>
                          )}
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
          {contentTab === 'chat' && (
            <ChatInterface subjectId={subject.id} documents={documents} />
          )}

          {/* TAB 4: RESUMOS */}
          {contentTab === 'resumos' && (
            <div className="space-y-6">
              {/* Generator control card */}
              <div className="p-6 bg-[#161b22] border border-slate-800/80 rounded-2xl shadow-xl space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-100">Gerador de Resumos com IA</h3>
                  <p className="text-xs text-slate-400 mt-1">Passo 1: diga o que você precisa agora. O formato só aparece se ainda houver escolha.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button type="button" aria-pressed={summaryIntent === 'rapido'} onClick={() => { setSummaryIntent('rapido'); setSummaryType('rapido'); }} className="choice-chip">
                    <span className="block text-sm font-bold">Revisar em 3 minutos</span>
                    <span className="block text-xs opacity-80">Um resumo curto</span>
                  </button>
                  <button type="button" aria-pressed={summaryIntent === 'estudar'} onClick={() => setSummaryIntent('estudar')} className="choice-chip">
                    <span className="block text-sm font-bold">Estudar o conteúdo</span>
                    <span className="block text-xs opacity-80">Escolhe o formato no passo 2</span>
                  </button>
                  <button type="button" aria-pressed={summaryIntent === 'prova'} onClick={() => { setSummaryIntent('prova'); setSummaryType('prova'); }} className="choice-chip">
                    <span className="block text-sm font-bold">Focar na prova</span>
                    <span className="block text-xs opacity-80">O que cai e as pegadinhas</span>
                  </button>
                </div>
                {summaryIntent === 'estudar' && (
                  <div className="ihc-reveal grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {summaryFormats.map((format) => (
                      <button key={format.id} type="button" aria-pressed={summaryType === format.id} onClick={() => setSummaryType(format.id)} className="choice-chip">
                        <span className="block text-sm font-bold">{format.label}</span>
                        <span className="block text-xs opacity-80">{format.hint}</span>
                      </button>
                    ))}
                  </div>
                )}
                <p className="field-help text-slate-400">
                  {documents.length === 0
                    ? 'Envie um material em Organizar antes de gerar. O botão fica disponível quando houver arquivo pronto.'
                    : summaryIntent
                    ? 'A IA usa só os documentos desta matéria. O resumo novo aparece logo abaixo.'
                    : 'Escolha uma intenção para liberar a geração.'}
                </p>
                <button
                  disabled={generatingSummary || documents.length === 0 || !summaryIntent || (summaryIntent === 'estudar' && !summaryFormats.some((format) => format.id === summaryType))}
                  onClick={handleGenerateSummary}
                  className="btn-primary bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-lg shadow-indigo-600/30"
                >
                  {generatingSummary ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {generatingSummary ? 'Gerando resumo…' : 'Gerar resumo'}
                </button>
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
          {contentTab === 'flashcards' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center p-6 bg-[#161b22] border border-slate-800/80 rounded-2xl">
                <div>
                  <h3 className="text-base font-bold text-slate-100">Baralho de Flashcards</h3>
                  <p className="text-xs text-slate-400">Revisão espaçada (SM-2) para retenção de longo prazo</p>
                </div>

                <button
                  disabled={generatingFlashcards || documents.length === 0}
                  title={documents.length === 0 ? 'Envie um material antes de gerar cartas' : 'Cria 10 cartas a partir dos seus arquivos'}
                  onClick={handleGenerateFlashcards}
                  className="btn-primary bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-lg shadow-indigo-600/20"
                >
                  {generatingFlashcards ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {generatingFlashcards ? 'Gerando cartas…' : 'Gerar 10 flashcards'}
                </button>
              </div>

              <FlashcardStudy flashcards={flashcards} onFinish={() => loadData()} />
            </div>
          )}

          {/* TAB 6: QUESTÕES */}
          {contentTab === 'questoes' && (
            <div className="space-y-6">
              {/* Question Generator controls */}
              <div className="p-6 bg-[#161b22] border border-slate-800/80 rounded-2xl shadow-xl space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-100">Gerar questões com IA</h3>
                  <p className="text-xs text-slate-400 mt-1">Uma decisão por vez: tipo, depois nível, depois quantidade.</p>
                </div>
                <p className="text-xs font-semibold text-slate-300">Passo {questionStep} de 3</p>
                {questionStep === 1 && (
                  <div className="ihc-reveal grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      ['multipla_escolha', 'Múltipla escolha', 'Uma alternativa correta'],
                      ['verdadeiro_falso', 'Verdadeiro ou falso', 'Julgar uma afirmação'],
                      ['discursiva', 'Discursiva', 'Responder com suas palavras'],
                    ].map(([value, label, hint]) => (
                      <button key={value} type="button" aria-pressed={questionType === value} onClick={() => { setQuestionType(value); setQuestionStep(2); }} className="choice-chip">
                        <span className="block text-sm font-bold">{label}</span>
                        <span className="block text-xs opacity-80">{hint}</span>
                      </button>
                    ))}
                  </div>
                )}
                {questionStep === 2 && (
                  <div className="ihc-reveal grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['Fácil', 'Médio', 'Difícil', 'Misturado'].map((level) => (
                      <button key={level} type="button" aria-pressed={questionDifficulty === level} onClick={() => { setQuestionDifficulty(level); setQuestionStep(3); }} className="choice-chip">
                        <span className="block text-sm font-bold">{level}</span>
                      </button>
                    ))}
                  </div>
                )}
                {questionStep === 3 && (
                  <div className="ihc-reveal grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[5, 10, 20, 30].map((count) => (
                      <button key={count} type="button" aria-pressed={questionCount === count} onClick={() => setQuestionCount(count)} className="choice-chip">
                        <span className="block text-sm font-bold">{count} questões</span>
                      </button>
                    ))}
                  </div>
                )}
                <p className="field-help text-slate-400" role="status">
                  Você vai gerar {questionCount} questões de {questionTypeLabel}, nível {questionDifficulty.toLowerCase()}.
                  {documents.length === 0 ? ' Envie um material antes: o botão espera um arquivo pronto.' : ' A correção aparece assim que você responder.'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {questionStep > 1 && (
                    <button type="button" onClick={() => setQuestionStep((step) => step - 1)} className="btn-quiet border border-slate-700 text-slate-200">
                      Voltar um passo
                    </button>
                  )}
                  <button
                    disabled={generatingQuestions || documents.length === 0 || questionStep < 3}
                    onClick={handleGenerateQuestions}
                    className="btn-primary bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-lg shadow-indigo-600/30"
                  >
                    {generatingQuestions ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {generatingQuestions ? 'Gerando questões…' : 'Gerar questões'}
                  </button>
                </div>
              </div>

              <QuestionPractice questions={questions} />
            </div>
          )}

          {/* TAB 7: SIMULADOS */}
          {contentTab === 'simulados' && (
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
                      title="Cria uma prova de 10 questões e 20 minutos"
                      className="btn-primary bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30"
                    >
                      <Timer className="w-4 h-4" />
                      Iniciar simulado de 10 questões
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
                    type="button"
                    onClick={() => setActiveQuiz(null)}
                    className="btn-quiet text-slate-300 hover:text-white hover:bg-slate-800"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para a lista
                  </button>
                  <SimuladoRunner quiz={activeQuiz} onFinish={() => loadData()} />
                </div>
              )}
            </div>
          )}

          {/* TAB 8: MAPA MENTAL */}
          {contentTab === 'mapa_mental' && (
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

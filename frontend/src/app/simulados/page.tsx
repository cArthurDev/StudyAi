'use client';

import React, { useEffect, useState } from 'react';
import { api, Quiz, Subject } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { SimuladoRunner } from '@/components/SimuladoRunner';
import { Timer, Plus, Sparkles, Loader2, X, Award } from 'lucide-react';

export default function SimuladosPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);

  // Creation modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [timeLimit, setTimeLimit] = useState(20);
  const [creating, setCreating] = useState(false);

  const loadData = async () => {
    try {
      const [qList, sList] = await Promise.all([
        api.getQuizzes(),
        api.getSubjects()
      ]);
      setQuizzes(qList);
      setSubjects(sList);
      if (sList.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(sList[0].id);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId) return;
    setCreating(true);

    try {
      const sub = subjects.find((s) => s.id === selectedSubjectId);
      const quiz = await api.createQuiz({
        subject_id: selectedSubjectId,
        title: `Simulado — ${sub?.name || 'Geral'}`,
        total_questions: totalQuestions,
        time_limit_minutes: timeLimit
      });
      setQuizzes((prev) => [quiz, ...prev]);
      setActiveQuiz(quiz);
      setShowModal(false);
    } catch (err: any) {
      alert(err.message || 'Erro ao criar simulado.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0d12]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-3">
                <Timer className="w-8 h-8 text-teal-400" />
                Simulados Cronometrados
              </h1>
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                Realize avaliações com limite de tempo e receba o diagnóstico completo do seu domínio por assunto
              </p>
            </div>

            {!activeQuiz && (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-white" />
                Criar Simulado
              </button>
            )}
          </div>

          {activeQuiz ? (
            <div className="space-y-4">
              <button
                onClick={() => setActiveQuiz(null)}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                ← Voltar para lista de simulados
              </button>
              <SimuladoRunner quiz={activeQuiz} onFinish={() => loadData()} />
            </div>
          ) : loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
            </div>
          ) : quizzes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  onClick={() => setActiveQuiz(quiz)}
                  className="flex flex-col justify-between p-6 bg-[#161b22] border border-slate-800/80 hover:border-teal-500/50 rounded-2xl cursor-pointer transition-all duration-200 shadow-xl hover:-translate-y-0.5"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-xl bg-teal-500/15 text-teal-400">
                        <Timer className="w-6 h-6" />
                      </div>
                      <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                        quiz.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {quiz.status === 'completed' ? 'Finalizado' : 'Em andamento'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-100">{quiz.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {quiz.total_questions} questões • {quiz.time_limit_minutes} minutos
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Nota:</span>
                    <span className="text-xl font-extrabold font-mono text-teal-400">
                      {quiz.score_percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-[#161b22] border border-slate-800 rounded-3xl">
              <p className="text-slate-400 text-xs">Você ainda não realizou nenhum simulado.</p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl cursor-pointer"
              >
                Iniciar Primeiro Simulado
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 md:p-8 bg-[#161b22] border border-slate-800 rounded-3xl shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100">Configurar Simulado</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuiz} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Matéria</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-xl text-slate-200"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nº de Questões</label>
                  <input
                    type="number"
                    min={3}
                    max={50}
                    value={totalQuestions}
                    onChange={(e) => setTotalQuestions(Number(e.target.value))}
                    className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-xl text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tempo (minutos)</label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Number(e.target.value))}
                    className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-xl text-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={creating || !selectedSubjectId}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl shadow-lg shadow-teal-500/20 cursor-pointer"
                >
                  {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : 'Começar Simulado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

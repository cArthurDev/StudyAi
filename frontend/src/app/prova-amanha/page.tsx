'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, StudyPlan, Subject } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import confetti from 'canvas-confetti';
import { 
  AlarmClock, Clock, ShieldCheck, Loader2
} from 'lucide-react';

function ProvaAmanhaContent() {
  const searchParams = useSearchParams();
  const initialSubjectId = searchParams.get('subject_id') || '';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSubjectId);
  const [hoursAvailable, setHoursAvailable] = useState<number>(3.0);
  
  const [generating, setGenerating] = useState(false);
  const [cramPlan, setCramPlan] = useState<StudyPlan | null>(null);

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const subs = await api.getSubjects();
        setSubjects(subs);
        if (subs.length > 0 && !selectedSubjectId) {
          setSelectedSubjectId(subs[0].id);
        }
      } catch {
        // ignore
      }
    };
    loadSubjects();
  }, []);

  const handleGenerateCramPlan = async () => {
    if (!selectedSubjectId) return;
    setGenerating(true);

    try {
      const plan = await api.createCramPlan({
        subject_id: selectedSubjectId,
        available_hours: hoursAvailable
      });
      setCramPlan(plan);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch (err: any) {
      alert(err.message || 'Erro ao gerar plano de emergência.');
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleSession = async (sessionId: string) => {
    try {
      await api.toggleSession(sessionId);
      if (cramPlan) {
        const updatedSessions = cramPlan.sessions.map((s) =>
          s.id === sessionId ? { ...s, is_completed: !s.is_completed } : s
        );
        setCramPlan({ ...cramPlan, sessions: updatedSessions });
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0d12]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
          <div className="emergency-hero p-6 md:p-8 rounded-3xl border relative overflow-hidden">
            <div className="relative z-10 space-y-2">
              <span className="aviso-prova inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold text-xs">
                <AlarmClock className="w-3.5 h-3.5" />
                Aviso de prova
              </span>

              <h1 className="text-2xl md:text-4xl font-extrabold text-slate-100 tracking-tight">
                Tenho Prova Amanhã
              </h1>
              <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Prioriza onde seu domínio é mais baixo, nos assuntos mais frequentes nos materiais e mais cotados para cair na prova.
              </p>
            </div>
          </div>

          {/* Configuration Form */}
          <div className="p-6 md:p-8 bg-[#161b22] border border-slate-800/80 rounded-3xl shadow-xl space-y-6">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-400" />
              Parâmetros do Sprint de Estudo
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Matéria da Prova</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Hours Available */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Tempo Disponível para Estudar
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 6].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHoursAvailable(h)}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                        hoursAvailable === h
                          ? 'bg-teal-600 text-white shadow-md'
                          : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-end">
                <button
                  disabled={generating || !selectedSubjectId}
                  onClick={handleGenerateCramPlan}
                  className="aviso-prova w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold rounded-xl disabled:opacity-50 transition-all"
                >
                  {generating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <AlarmClock className="w-4 h-4" />
                  )}
                  {generating ? 'Calculando Prioridades...' : 'Gerar Plano Intensivo'}
                </button>
              </div>
            </div>
          </div>

          {/* Generated Cram Plan Timeline */}
          {cramPlan && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Timeline Container */}
              <div className="p-6 md:p-8 bg-[#161b22] border border-slate-800/80 rounded-3xl shadow-xl space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
                      <AlarmClock className="w-5 h-5 text-rose-500" />
                      {cramPlan.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Siga o cronograma minuto a minuto para máxima eficiência
                    </p>
                  </div>

                  <span className="px-3 py-1 text-xs font-mono font-bold rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/30">
                    Tempo sugerido: {cramPlan.total_hours}h
                  </span>
                </div>

                {/* Chronological sessions */}
                <div className="space-y-4 relative before:absolute before:left-7 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-800">
                  {cramPlan.sessions.map((sess, idx) => (
                    <div
                      key={sess.id}
                      onClick={() => handleToggleSession(sess.id)}
                      className={`relative flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                        sess.is_completed
                          ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                          : 'bg-slate-900/90 border-slate-800 hover:border-teal-500/40 shadow-lg'
                      }`}
                    >
                      {/* Step Circle */}
                      <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-mono font-bold shrink-0 mt-0.5 z-10 ${
                        sess.is_completed
                          ? 'bg-emerald-500 text-white'
                          : 'bg-indigo-600 text-white'
                      }`}>
                        {idx + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className={`text-sm font-bold ${sess.is_completed ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                            {sess.title}
                          </h4>

                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full ${
                              sess.priority_level === 'critica'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : sess.priority_level === 'alta'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                            }`}>
                              Prioridade {sess.priority_level}
                            </span>

                            <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-lg bg-slate-800 text-indigo-300">
                              {sess.start_time_label} - {sess.end_time_label} ({sess.duration_minutes}m)
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {sess.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* "Não perca tempo agora com" exclusion card */}
              {cramPlan.mastered_topics_avoid && cramPlan.mastered_topics_avoid.length > 0 && (
                <div className="p-6 bg-[#161b22] border border-emerald-500/30 rounded-3xl shadow-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <h4 className="text-sm font-bold text-slate-100">
                      Não perca tempo agora com estes assuntos:
                    </h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Seu índice de domínio nestes tópicos é alto (&ge; 80%). Não gaste seu tempo de emergência revisando o que você já domina:
                  </p>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {cramPlan.mastered_topics_avoid.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      >
                        {t} (Dominado)
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function ProvaAmanhaPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-[#0a0d12]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    }>
      <ProvaAmanhaContent />
    </Suspense>
  );
}

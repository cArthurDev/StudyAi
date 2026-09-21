'use client';

import React, { useEffect, useState } from 'react';
import { api, StudyPlan, Subject } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { CalendarDays, Plus, CheckCircle2, Clock, Sparkles, Loader2, X } from 'lucide-react';

export default function PlanoEstudosPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Creation modal state
  const [showModal, setShowModal] = useState(false);
  const [hoursPerDay, setHoursPerDay] = useState(2.0);
  const [selectedDays, setSelectedDays] = useState<string[]>(['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']);
  const [creating, setCreating] = useState(false);

  const daysList = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  const loadData = async () => {
    try {
      const [pList, sList] = await Promise.all([
        api.getStudyPlans(),
        api.getSubjects()
      ]);
      setPlans(pList);
      setSubjects(sList);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDays.length === 0) return;
    setCreating(true);

    try {
      const newPlan = await api.createWeeklyPlan({
        available_hours_per_day: hoursPerDay,
        days_of_week: selectedDays
      });
      setPlans((prev) => [newPlan, ...prev]);
      setShowModal(false);
    } catch (err: any) {
      alert(err.message || 'Erro ao criar plano.');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleSession = async (sessionId: string) => {
    try {
      await api.toggleSession(sessionId);
      loadData();
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
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-3">
                <CalendarDays className="w-8 h-8 text-indigo-400" />
                Planos de Estudo Adaptativos
              </h1>
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                Cronogramas calibrados pela IA com base nas suas matérias, tempo diário e assuntos críticos
              </p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              Gerar Novo Plano
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : plans.length > 0 ? (
            <div className="space-y-8">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="p-6 md:p-8 bg-[#161b22] border border-slate-800/80 rounded-3xl shadow-xl space-y-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                    <div>
                      <h3 className="text-lg font-bold text-slate-100">{plan.title}</h3>
                      <p className="text-xs text-slate-400">
                        Carga horária total: {plan.total_hours} horas • {plan.sessions.length} sessões estruturadas
                      </p>
                    </div>

                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 uppercase font-mono">
                      {plan.plan_type}
                    </span>
                  </div>

                  {/* Sessions grid */}
                  <div className="space-y-3">
                    {plan.sessions.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => handleToggleSession(s.id)}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                          s.is_completed
                            ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={s.is_completed}
                            onChange={() => handleToggleSession(s.id)}
                            className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700 focus:ring-indigo-500 cursor-pointer"
                          />
                          <div>
                            <h4 className={`text-sm font-semibold ${s.is_completed ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                              {s.title}
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5">{s.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded uppercase ${
                            s.priority_level === 'critica' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                            s.priority_level === 'alta' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                          }`}>
                            {s.priority_level}
                          </span>

                          <span className="px-3 py-1 text-xs font-mono font-bold rounded-lg bg-slate-800 text-indigo-300">
                            {s.start_time_label} - {s.end_time_label} ({s.duration_minutes}m)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-[#161b22] border border-slate-800 rounded-3xl">
              <p className="text-slate-400 text-xs">Nenhum plano de estudos ativo.</p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl"
              >
                Gerar Plano Semanal com IA
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
              <h3 className="text-lg font-bold text-slate-100">Configurar Cronograma</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tempo disponível por dia (horas)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="12"
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(Number(e.target.value))}
                  className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-xl text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Dias disponíveis para estudo
                </label>
                <div className="flex flex-wrap gap-2">
                  {daysList.map((day) => {
                    const isSelected = selectedDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleToggleDay(day)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                            : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
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
                  disabled={creating || selectedDays.length === 0}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30"
                >
                  {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Gerar Cronograma'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

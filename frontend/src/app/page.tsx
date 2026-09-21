'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api, DashboardOverview } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Calendar,
  AlarmClock,
  Plus,
  Loader2,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const loadDashboard = async () => {
    try {
      const data = await api.getDashboard();
      setDashboard(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadDashboard();
    }
  }, [user]);

  const handleToggleSession = async (sessionId: string) => {
    try {
      await api.toggleSession(sessionId);
      loadDashboard();
    } catch {
      // ignore
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const gettingStarted = !loading && Boolean(
    dashboard &&
    (dashboard.total_subjects || 0) === 0 &&
    (dashboard.total_questions_answered || 0) === 0 &&
    (dashboard.today_sessions?.length || 0) === 0
  );
  const hasTodayPlan = (dashboard?.today_sessions?.length || 0) > 0;
  const hasWeakTopics = (dashboard?.weak_topics?.length || 0) > 0;
  const hasExams = (dashboard?.upcoming_exams?.length || 0) > 0;
  const weeklyEntries = Object.entries(dashboard?.weekly_progress || {});
  const hasWeeklyActivity = weeklyEntries.some(([, count]) => count > 0);

  if (authLoading || (!user && loading)) {
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

        <main className="flex-1 p-5 md:p-6 space-y-5 max-w-7xl mx-auto w-full">
          <div className="study-hero flex flex-wrap items-center justify-between gap-4 p-5 md:p-6 rounded-2xl bg-gradient-to-r from-teal-950/50 via-cyan-950/20 to-slate-900/40 border border-teal-500/20 relative overflow-hidden">
            <div className="relative z-10 space-y-1">
              <span className="inline-flex px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-300 font-semibold text-xs border border-teal-500/30">
                StudyMind AI
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
                {getGreeting()}, <span className="bg-gradient-to-r from-teal-300 via-cyan-300 to-sky-300 bg-clip-text text-transparent">{user?.full_name || 'Estudante'}</span>
              </h2>
              <p className="text-sm text-slate-300 max-w-xl">
                {gettingStarted
                  ? 'Crie uma matéria e envie um material para começar.'
                  : 'Continue suas sessões ou explore novas questões.'}
              </p>
            </div>

            <div className="relative z-10 flex flex-wrap gap-3">
              <Link
                href="/prova-amanha"
                className="aviso-prova flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
              >
                <AlarmClock className="w-4 h-4" />
                Tenho Prova Amanhã
              </Link>

              <Link
                href="/materias"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm transition-all"
              >
                <Plus className="w-4 h-4 text-white" />
                Nova Matéria
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="px-4 py-4 rounded-2xl bg-[#161b22] border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Matérias</span>
                <div className="text-2xl font-extrabold text-slate-100 tabular-nums">
                  {dashboard?.total_subjects || 0}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>

            <div className="px-4 py-4 rounded-2xl bg-[#161b22] border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Horas Estudadas</span>
                <div className="text-2xl font-extrabold text-slate-100 tabular-nums">
                  {dashboard?.total_hours_studied || 0}h
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="px-4 py-4 rounded-2xl bg-[#161b22] border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Questões</span>
                <div className="text-2xl font-extrabold text-slate-100 tabular-nums">
                  {dashboard?.total_questions_answered || 0}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="px-4 py-4 rounded-2xl bg-[#161b22] border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Taxa de Acertos</span>
                <div className="text-2xl font-extrabold text-slate-100 tabular-nums">
                  {dashboard?.overall_accuracy_percentage || 0}%
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col h-full min-h-[168px] p-5 bg-[#161b22] border border-slate-800/80 rounded-2xl">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Calendar className="w-5 h-5 shrink-0 text-indigo-400" />
                  <h3 className="text-base font-bold text-slate-100 truncate">Plano de Hoje</h3>
                </div>
                <Link href="/plano-estudos" className="shrink-0 text-sm font-semibold text-indigo-400 hover:underline">
                  Ver cronograma →
                </Link>
              </div>
              <div className="flex flex-1 flex-col justify-center">
                {hasTodayPlan ? (
                  <div className="space-y-2">
                    {dashboard?.today_sessions.map((sess) => (
                      <div
                        key={sess.id}
                        onClick={() => handleToggleSession(sess.id)}
                        className={`flex items-center justify-between gap-3 p-3 rounded-xl border cursor-pointer ${
                          sess.is_completed
                            ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                            : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={sess.is_completed}
                            onChange={() => handleToggleSession(sess.id)}
                            className="w-4 h-4 shrink-0 rounded text-indigo-600 bg-slate-800 border-slate-700 cursor-pointer"
                          />
                          <span className={`text-sm font-semibold truncate ${sess.is_completed ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                            {sess.title}
                          </span>
                        </div>
                        <span className="shrink-0 px-2.5 py-1 text-xs font-mono rounded-lg bg-slate-800 text-indigo-300">
                          {sess.start_time_label} - {sess.end_time_label}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-slate-400 text-sm">
                    Nenhuma sessão para hoje.{' '}
                    <Link href="/plano-estudos" className="text-indigo-400 font-semibold underline">
                      Gerar plano com IA
                    </Link>
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col h-full min-h-[168px] p-5 bg-[#161b22] border border-slate-800/80 rounded-2xl">
              <h3 className="flex items-center gap-2 mb-3 text-base font-bold text-slate-100">
                <Calendar className="w-5 h-5 shrink-0 text-purple-400" />
                Próximas Provas
              </h3>
              <div className="flex flex-1 flex-col justify-center">
                {hasExams ? (
                  <div className="space-y-2">
                    {dashboard?.upcoming_exams.map((ex) => (
                      <div key={ex.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                        <span className="text-sm font-bold text-slate-200 truncate">{ex.title}</span>
                        <span className="shrink-0 text-xs font-bold text-purple-400">
                          {ex.days_remaining !== undefined && ex.days_remaining <= 1 ? 'Amanhã' : `${ex.days_remaining} dias`}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-slate-400 text-sm">
                    Nenhuma prova cadastrada.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col h-full min-h-[168px] p-5 bg-[#161b22] border border-slate-800/80 rounded-2xl">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
                  <h3 className="text-base font-bold text-slate-100 truncate">Assuntos que Precisam de Atenção</h3>
                </div>
                <Link href="/desempenho" className="shrink-0 text-sm font-semibold text-indigo-400 hover:underline">
                  Ver análise →
                </Link>
              </div>
              <div className="flex flex-1 flex-col justify-center">
                {hasWeakTopics ? (
                  <div className="grid grid-cols-1 gap-3">
                    {dashboard?.weak_topics.map((t) => (
                      <div key={t.topic_id} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                        <div className="flex items-center justify-between gap-2 text-sm mb-2">
                          <span className="font-semibold text-slate-200 truncate">{t.topic_name}</span>
                          <span className={`shrink-0 px-2 py-0.5 text-[11px] font-bold rounded ${
                            t.status === 'CRÍTICO' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {t.status}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${t.mastery_score < 40 ? 'bg-rose-500' : 'bg-amber-500'}`}
                            style={{ width: `${t.mastery_score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-slate-400 text-sm">
                    Nenhum assunto crítico no momento.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col h-full min-h-[168px] p-5 bg-[#161b22] border border-slate-800/80 rounded-2xl">
              <h3 className="flex items-center gap-2 mb-3 text-base font-bold text-slate-100">
                <TrendingUp className="w-5 h-5 shrink-0 text-emerald-400" />
                Desempenho Semanal
              </h3>
              <div className="flex flex-1 flex-col justify-center">
                {hasWeeklyActivity ? (
                  <div className="flex items-end justify-between h-28 px-1">
                    {weeklyEntries.map(([day, count], index) => {
                      const maxVal = Math.max(...weeklyEntries.map(([, value]) => value), 1);
                      const heightPct = count === 0 ? 0 : Math.min(100, Math.max(18, (count / maxVal) * 100));
                      return (
                        <div key={day} className="flex flex-col items-center gap-1.5 h-full justify-end">
                          <div
                            className={`w-6 rounded-t bg-gradient-to-t from-teal-700 to-teal-400 a11y-bar a11y-bar-${index % 4}`}
                            style={{ height: `${heightPct}%` }}
                            title={`${count} questões respondidas`}
                            aria-label={`${day}: ${count} questões`}
                          />
                          <span className="text-[11px] font-medium text-slate-400">{day}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : !loading && dashboard ? (
                  <p className="text-center text-slate-400 text-sm">
                    Nenhuma questão nesta semana.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

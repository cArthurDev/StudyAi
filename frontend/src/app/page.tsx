'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api, DashboardOverview } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { SubjectCard } from '@/components/SubjectCard';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Zap,
  ArrowRight,
  Plus,
  Loader2,
  Layers,
  Sparkles
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

  if (authLoading || (!user && loading)) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0d12]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0a0d12]">
      {/* Navigation Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Hero Greeting & Quick Action */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-6 md:p-8 rounded-3xl bg-gradient-to-r from-amber-950/20 via-yellow-950/10 to-slate-900/40 border border-[#FFEE8C]/20 shadow-2xl relative overflow-hidden">
            <div className="relative z-10 space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#FFEE8C]/20 text-[#FFEE8C] font-semibold text-xs border border-[#FFEE8C]/30">
                  StudyMind AI
                </span>
                <span className="text-xs text-slate-400 font-mono">qwen3:8b Engine</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
                {getGreeting()}, <span className="bg-gradient-to-r from-yellow-300 via-[#FFEE8C] to-amber-200 bg-clip-text text-transparent">{user?.full_name || 'Estudante'}</span> 👋
              </h2>
              <p className="text-xs md:text-sm text-slate-300 max-w-xl">
                Seus materiais de estudo estão sincronizados com a IA local. Continue suas sessões ou explore novas questões.
              </p>
            </div>

            <div className="relative z-10 flex flex-wrap gap-3">
              <Link
                href="/prova-amanha"
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-500/20 transition-all hover:scale-105"
              >
                <Zap className="w-4 h-4 animate-pulse" />
                🚨 Tenho Prova Amanhã
              </Link>

              <Link
                href="/materias"
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#FFEE8C] hover:bg-[#F3DD64] text-[#221d06] font-bold text-xs shadow-lg shadow-amber-500/20 transition-all"
              >
                <Plus className="w-4 h-4 text-[#221d06]" />
                Nova Matéria
              </Link>
            </div>

            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-[#FFEE8C]/10 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* Key Metrics Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {/* Card 1: Matérias */}
            <div className="p-5 rounded-2xl bg-[#161b22] border border-slate-800/80 shadow-md flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Matérias</span>
                <div className="text-2xl md:text-3xl font-extrabold text-slate-100 font-mono">
                  {dashboard?.total_subjects || 0}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <BookOpen className="w-6 h-6" />
              </div>
            </div>

            {/* Card 2: Horas Estudadas */}
            <div className="p-5 rounded-2xl bg-[#161b22] border border-slate-800/80 shadow-md flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Horas Estudadas</span>
                <div className="text-2xl md:text-3xl font-extrabold text-slate-100 font-mono">
                  {dashboard?.total_hours_studied || 0}h
                </div>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            {/* Card 3: Questões Respondidas */}
            <div className="p-5 rounded-2xl bg-[#161b22] border border-slate-800/80 shadow-md flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Questões</span>
                <div className="text-2xl md:text-3xl font-extrabold text-slate-100 font-mono">
                  {dashboard?.total_questions_answered || 0}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            {/* Card 4: Taxa de Acertos */}
            <div className="p-5 rounded-2xl bg-[#161b22] border border-slate-800/80 shadow-md flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Taxa de Acertos</span>
                <div className="text-2xl md:text-3xl font-extrabold text-slate-100 font-mono">
                  {dashboard?.overall_accuracy_percentage || 0}%
                </div>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Two Columns: Left (Plan of Today + Weak Points), Right (Upcoming Exams + Weekly Performance) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column (2 Cols wide) */}
            <div className="lg:col-span-2 space-y-8">
              {/* Today's Plan */}
              <div className="p-6 bg-[#161b22] border border-slate-800/80 rounded-3xl shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-base font-bold text-slate-100">Plano de Hoje</h3>
                  </div>
                  <Link href="/plano-estudos" className="text-xs font-semibold text-indigo-400 hover:underline">
                    Ver cronograma completo →
                  </Link>
                </div>

                {dashboard?.today_sessions && dashboard.today_sessions.length > 0 ? (
                  <div className="space-y-3">
                    {dashboard.today_sessions.map((sess) => (
                      <div
                        key={sess.id}
                        onClick={() => handleToggleSession(sess.id)}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          sess.is_completed
                            ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                            : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={sess.is_completed}
                            onChange={() => handleToggleSession(sess.id)}
                            className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700 focus:ring-indigo-500 cursor-pointer"
                          />
                          <div className="flex flex-col">
                            <span className={`text-sm font-semibold ${sess.is_completed ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                              {sess.title}
                            </span>
                            <span className="text-[11px] text-slate-400">{sess.description}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-slate-800 text-indigo-300">
                            {sess.start_time_label} - {sess.end_time_label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    Nenhuma sessão agendada para hoje.{' '}
                    <Link href="/plano-estudos" className="text-indigo-400 font-semibold underline">
                      Gerar Plano de Estudos com IA
                    </Link>
                  </div>
                )}
              </div>

              {/* Weak Points ("Assuntos que precisam de atenção") */}
              <div className="p-6 bg-[#161b22] border border-slate-800/80 rounded-3xl shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    <h3 className="text-base font-bold text-slate-100">Assuntos que Precisam de Atenção</h3>
                  </div>
                  <Link href="/desempenho" className="text-xs font-semibold text-indigo-400 hover:underline">
                    Ver análise completa →
                  </Link>
                </div>

                {dashboard?.weak_topics && dashboard.weak_topics.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {dashboard.weak_topics.map((t) => (
                      <div
                        key={t.topic_id}
                        className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-3"
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-semibold text-slate-200">{t.topic_name}</span>
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                              t.status === 'CRÍTICO' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}>
                              {t.status}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">{t.subject_name}</span>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] text-slate-400 font-mono mb-1">
                            <span>Domínio</span>
                            <span className="font-bold text-slate-200">{t.mastery_score}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${t.mastery_score < 40 ? 'bg-rose-500' : 'bg-amber-500'}`}
                              style={{ width: `${t.mastery_score}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    Excelente! Nenhum assunto crítico registrado no momento.
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (1 Col wide) */}
            <div className="space-y-8">
              {/* Upcoming Exams */}
              <div className="p-6 bg-[#161b22] border border-slate-800/80 rounded-3xl shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-400" />
                    Próximas Provas
                  </h3>
                </div>

                {dashboard?.upcoming_exams && dashboard.upcoming_exams.length > 0 ? (
                  <div className="space-y-3">
                    {dashboard.upcoming_exams.map((ex) => (
                      <div
                        key={ex.id}
                        className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200">{ex.title}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                            {ex.days_remaining !== undefined && ex.days_remaining <= 1 ? '🚨 Amanhã' : `Em ${ex.days_remaining} dias`}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 block">{ex.subject_name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    Nenhuma prova cadastrada.
                  </div>
                )}
              </div>

              {/* Weekly Performance Activity */}
              <div className="p-6 bg-[#161b22] border border-slate-800/80 rounded-3xl shadow-xl">
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  Desempenho Semanal
                </h3>

                <div className="flex items-end justify-between h-36 pt-4 pb-2 px-2 border-b border-slate-800">
                  {Object.entries(dashboard?.weekly_progress || { Seg: 5, Ter: 8, Qua: 12, Qui: 10, Sex: 15, Sáb: 4, Dom: 6 }).map(([day, count]) => {
                    const maxVal = Math.max(...Object.values(dashboard?.weekly_progress || {}), 10);
                    const heightPct = Math.min(100, Math.max(15, (count / maxVal) * 100));
                    return (
                      <div key={day} className="flex flex-col items-center gap-2">
                        <div
                          className="w-7 rounded-t-lg bg-gradient-to-t from-[#EBD053] to-[#FFEE8C] hover:opacity-90 transition-all"
                          style={{ height: `${heightPct}%` }}
                          title={`${count} questões respondidas`}
                        />
                        <span className="text-[11px] font-medium text-slate-400">{day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Subjects Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100">Matérias Recentes</h3>
              <Link href="/materias" className="text-xs font-semibold text-indigo-400 hover:underline">
                Ver todas as matérias →
              </Link>
            </div>

            {dashboard?.recent_subjects && dashboard.recent_subjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {dashboard.recent_subjects.map((sub) => (
                  <SubjectCard key={sub.id} subject={sub} />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-[#161b22] border border-slate-800 rounded-2xl">
                <p className="text-slate-400 text-xs">Você ainda não criou nenhuma matéria.</p>
                <Link
                  href="/materias"
                  className="inline-flex items-center gap-2 mt-3 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Criar Minha Primeira Matéria
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

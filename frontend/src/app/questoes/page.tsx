'use client';

import React, { useEffect, useState } from 'react';
import { api, Question, Subject } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { QuestionPractice } from '@/components/QuestionPractice';
import { HelpCircle, Sparkles, Loader2, Filter } from 'lucide-react';

export default function QuestoesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('Misturado');
  const [selectedType, setSelectedType] = useState<string>('misturado');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [qs, subs] = await Promise.all([
        api.getQuestions(
          selectedSubjectId || undefined,
          selectedDifficulty !== 'Misturado' ? selectedDifficulty : undefined,
          selectedType !== 'misturado' ? selectedType : undefined
        ),
        api.getSubjects()
      ]);
      setQuestions(qs);
      setSubjects(subs);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSubjectId, selectedDifficulty, selectedType]);

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
                <HelpCircle className="w-8 h-8 text-indigo-400" />
                Banco de Questões
              </h1>
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                Treine com questões objetivas, V/F e discursivas geradas a partir das suas apostilas
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="px-3.5 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
              >
                <option value="">Todas as matérias</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-3.5 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
              >
                <option value="Misturado">Todas as dificuldades</option>
                <option value="Fácil">Fácil</option>
                <option value="Médio">Médio</option>
                <option value="Difícil">Difícil</option>
              </select>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3.5 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200"
              >
                <option value="misturado">Todos os tipos</option>
                <option value="multipla_escolha">Múltipla Escolha</option>
                <option value="verdadeiro_falso">Verdadeiro / Falso</option>
                <option value="discursiva">Discursiva</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : (
            <QuestionPractice questions={questions} />
          )}
        </main>
      </div>
    </div>
  );
}

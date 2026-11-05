'use client';

import React, { useEffect, useState } from 'react';
import { api, Question, Subject } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { QuestionPractice } from '@/components/QuestionPractice';
import { StudyDemoBanner } from '@/components/StudyDemoBanner';
import { demoQuestions } from '@/lib/demo-study';
import { HelpCircle, Loader2 } from 'lucide-react';

export default function QuestoesPage() {
  const [showDemo, setShowDemo] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('Misturado');
  const [selectedType, setSelectedType] = useState<string>('misturado');
  const [filterFocus, setFilterFocus] = useState<'materia' | 'dificuldade' | 'tipo' | null>(null);
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
    if (showDemo) return;
    setLoading(true);
    loadData();
  }, [selectedSubjectId, selectedDifficulty, selectedType, showDemo]);

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

          </div>

          <section className="p-5 rounded-2xl bg-[#161b22] border border-slate-800 space-y-4" aria-label="Filtros do banco">
            <div>
              <h2 className="text-sm font-bold text-slate-100">Filtrar em uma etapa</h2>
              <p className="text-xs text-slate-400 mt-1">Abra só o critério que você quer mudar. Os outros ficam resumidos abaixo.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" aria-pressed={filterFocus === 'materia'} disabled={showDemo} title={showDemo ? 'No modo demonstração as questões não vêm de uma matéria sua' : 'Escolher a matéria'} onClick={() => setFilterFocus(filterFocus === 'materia' ? null : 'materia')} className="choice-chip disabled:opacity-50">
                <span className="block text-sm font-bold">Matéria</span>
              </button>
              <button type="button" aria-pressed={filterFocus === 'dificuldade'} onClick={() => setFilterFocus(filterFocus === 'dificuldade' ? null : 'dificuldade')} className="choice-chip">
                <span className="block text-sm font-bold">Dificuldade</span>
              </button>
              <button type="button" aria-pressed={filterFocus === 'tipo'} onClick={() => setFilterFocus(filterFocus === 'tipo' ? null : 'tipo')} className="choice-chip">
                <span className="block text-sm font-bold">Tipo de questão</span>
              </button>
            </div>
            {filterFocus === 'materia' && (
              <div className="ihc-reveal flex flex-wrap gap-2">
                <button type="button" aria-pressed={selectedSubjectId === ''} onClick={() => setSelectedSubjectId('')} className="choice-chip">Todas</button>
                {subjects.map((subject) => (
                  <button key={subject.id} type="button" aria-pressed={selectedSubjectId === subject.id} onClick={() => setSelectedSubjectId(subject.id)} className="choice-chip">{subject.name}</button>
                ))}
              </div>
            )}
            {filterFocus === 'dificuldade' && (
              <div className="ihc-reveal flex flex-wrap gap-2">
                {['Misturado', 'Fácil', 'Médio', 'Difícil'].map((level) => (
                  <button key={level} type="button" aria-pressed={selectedDifficulty === level} onClick={() => setSelectedDifficulty(level)} className="choice-chip">
                    {level === 'Misturado' ? 'Todas' : level}
                  </button>
                ))}
              </div>
            )}
            {filterFocus === 'tipo' && (
              <div className="ihc-reveal flex flex-wrap gap-2">
                {[
                  ['misturado', 'Todos'],
                  ['multipla_escolha', 'Múltipla escolha'],
                  ['verdadeiro_falso', 'Verdadeiro ou falso'],
                  ['discursiva', 'Discursiva'],
                ].map(([value, label]) => (
                  <button key={value} type="button" aria-pressed={selectedType === value} onClick={() => setSelectedType(value)} className="choice-chip">{label}</button>
                ))}
              </div>
            )}
            <p className="text-sm text-slate-300" role="status">
              Mostrando {selectedSubjectId ? subjects.find((subject) => subject.id === selectedSubjectId)?.name : 'todas as matérias'}
              {' · '}
              {selectedDifficulty === 'Misturado' ? 'qualquer dificuldade' : selectedDifficulty.toLowerCase()}
              {' · '}
              {selectedType === 'misturado' ? 'qualquer tipo' : selectedType === 'multipla_escolha' ? 'múltipla escolha' : selectedType === 'verdadeiro_falso' ? 'verdadeiro ou falso' : 'discursiva'}.
            </p>
          </section>

          <StudyDemoBanner active={showDemo} onToggle={() => setShowDemo((current) => !current)} />
          {showDemo ? (
            <QuestionPractice key={`demo-${selectedDifficulty}-${selectedType}`} demo questions={demoQuestions.filter((question) =>
              (selectedDifficulty === 'Misturado' || question.difficulty === selectedDifficulty) &&
              (selectedType === 'misturado' || question.question_type === selectedType)
            )} />
          ) : loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16" role="status">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-sm text-slate-300">Buscando questões com o filtro atual…</p>
            </div>
          ) : (
            <QuestionPractice key="saved" questions={questions} />
          )}
        </main>
      </div>
    </div>
  );
}

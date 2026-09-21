'use client';

import React, { useEffect, useState } from 'react';
import { api, Flashcard, Subject } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { FlashcardStudy } from '@/components/FlashcardStudy';
import { Layers, Sparkles, Loader2 } from 'lucide-react';

export default function FlashcardsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [cards, subs] = await Promise.all([
        api.getFlashcards(selectedSubjectId || undefined),
        api.getSubjects()
      ]);
      setFlashcards(cards);
      setSubjects(subs);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSubjectId]);

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
                <Layers className="w-8 h-8 text-indigo-400" />
                Central de Flashcards
              </h1>
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                Revisão ativa e repetição espaçada (SM-2) para maximizar a memorização
              </p>
            </div>

            {/* Subject Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Filtrar baralho:</span>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="px-3.5 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Todos os baralhos</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : (
            <FlashcardStudy flashcards={flashcards} onFinish={() => loadData()} />
          )}
        </main>
      </div>
    </div>
  );
}

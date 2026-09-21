'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api, Subject } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { SubjectCard } from '@/components/SubjectCard';
import { BookOpen, Plus, Sparkles, X, Loader2 } from 'lucide-react';

export default function MateriasPage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#FFEE8C');
  const [creating, setCreating] = useState(false);

  const colors = [
    '#FFEE8C', // Butter Yellow (Primária)
    '#f59e0b', // Amber
    '#eab308', // Yellow
    '#10b981', // Emerald
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
    '#ef4444', // Red
    '#84cc16', // Lime
  ];

  const loadSubjects = async () => {
    try {
      const list = await api.getSubjects();
      setSubjects(list);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);

    try {
      const newSub = await api.createSubject({
        name,
        description,
        color,
        icon: 'BookOpen'
      });
      setSubjects((prev) => [newSub, ...prev]);
      setShowModal(false);
      setName('');
      setDescription('');
    } catch {
      // ignore
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
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
                Minhas Matérias
              </h1>
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                Organize seus cursos, envie apostilas e acompanhe o domínio de cada assunto
              </p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FFEE8C] hover:bg-[#F3DD64] text-[#221d06] font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#221d06]" />
              Nova Matéria
            </button>
          </div>

          {/* Subjects Grid */}
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-[#FFEE8C]" />
            </div>
          ) : subjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((sub) => (
                <SubjectCard key={sub.id} subject={sub} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-[#161b22] border border-slate-800 rounded-3xl">
              <div className="flex items-center justify-center w-14 h-14 mb-4 rounded-2xl bg-[#FFEE8C]/20 text-[#FFEE8C] border border-[#FFEE8C]/30">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-200">Nenhuma matéria criada</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Crie matérias como Banco de Dados, Cálculo, História ou Programação para carregar seus materiais e começar a estudar com IA.
              </p>

              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 mt-5 px-5 py-2.5 rounded-xl bg-[#FFEE8C] hover:bg-[#F3DD64] text-[#221d06] font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#221d06]" />
                Criar Primeira Matéria
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
              <h3 className="text-lg font-bold text-slate-100">Criar Nova Matéria</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nome da Matéria</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Banco de Dados, Programação, História"
                  className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#FFEE8C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Descrição (opcional)</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Modelo Relacional, SQL, Normalização e Transações"
                  className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#FFEE8C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Cor de Destaque</label>
                <div className="flex flex-wrap gap-2.5">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={creating || !name.trim()}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-[#221d06] bg-[#FFEE8C] hover:bg-[#F3DD64] disabled:opacity-50 rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#221d06]" /> : 'Criar Matéria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

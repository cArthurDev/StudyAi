'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api, Subject } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { SubjectCard } from '@/components/SubjectCard';
import { BookOpen, Plus, Sparkles, X, Loader2 } from 'lucide-react';
import { RequiredMark } from '@/components/RequiredField';

export default function MateriasPage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#0D9488');
  const [creating, setCreating] = useState(false);

  const colors = [
    { hex: '#0D9488', name: 'Verde-azulado' },
    { hex: '#2563EB', name: 'Azul' },
    { hex: '#7C3AED', name: 'Violeta' },
    { hex: '#059669', name: 'Verde' },
    { hex: '#0891B2', name: 'Ciano' },
    { hex: '#D97706', name: 'Âmbar' },
    { hex: '#DC2626', name: 'Vermelho' },
    { hex: '#4F46E5', name: 'Índigo' },
  ];
  const [formStep, setFormStep] = useState(1);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdNotice, setCreatedNotice] = useState<string | null>(null);

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
    if (!name.trim()) {
      setFormError('vazio');
      setFormStep(1);
      return;
    }
    if (formStep === 1) {
      setFormError(null);
      setFormStep(2);
      return;
    }
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
      setFormStep(1);
      setName('');
      setDescription('');
      setCreatedNotice(`Matéria “${name.trim()}” criada. Abra o card para enviar um material.`);
    } catch {
      setFormError('servidor');
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
          {createdNotice && (
            <div role="status" className="ihc-status">
              <Sparkles className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{createdNotice}</p>
            </div>
          )}
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
              onClick={() => { setShowModal(true); setFormStep(1); setFormError(null); }}
              className="btn-primary bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-500/20"
            >
              <Plus className="w-4 h-4 text-white" />
              Nova matéria
            </button>
          </div>

          {/* Subjects Grid */}
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
            </div>
          ) : subjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((sub) => (
                <SubjectCard key={sub.id} subject={sub} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-[#161b22] border border-slate-800 rounded-3xl">
              <div className="flex items-center justify-center w-14 h-14 mb-4 rounded-2xl bg-teal-500/15 text-teal-400 border border-teal-500/30">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-200">Nenhuma matéria criada</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Crie matérias como Banco de Dados, Cálculo, História ou Programação para carregar seus materiais e começar a estudar com IA.
              </p>

              <button
                onClick={() => { setShowModal(true); setFormStep(1); setFormError(null); }}
                className="btn-primary mt-5 bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-500/20"
              >
                <Plus className="w-4 h-4 text-white" />
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
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-100">Nova matéria</h3>
                <p className="text-xs text-slate-400">Passo {formStep} de 2. Primeiro o nome, depois a cor.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn-quiet text-slate-300 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
                Fechar
              </button>
            </div>

            <form onSubmit={handleCreateSubject} className="space-y-4">
              {formStep === 1 && (
                <fieldset className="space-y-4 ihc-reveal">
                  <legend className="text-sm font-bold text-slate-100">Identidade</legend>
                  <div>
                    <label htmlFor="subject-name" className="block text-sm font-semibold text-slate-200 mb-1.5">
                      Nome da matéria<RequiredMark />
                    </label>
                    <input
                      id="subject-name"
                      type="text"
                      value={name}
                      aria-invalid={formError === 'vazio' || undefined}
                      onChange={(e) => { setName(e.target.value); setFormError(null); }}
                      placeholder="Ex.: Banco de Dados"
                      className={`w-full min-h-12 px-4 py-3 text-sm bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 ${formError === 'vazio' ? 'field-invalid' : ''}`}
                    />
                    {formError === 'vazio' && <p className="field-error" role="alert">Preencha o nome da matéria.</p>}
                    {formError === 'servidor' && <p className="field-error" role="alert">Não foi possível criar a matéria. Tente de novo.</p>}
                  </div>
                  <div>
                    <label htmlFor="subject-description" className="block text-sm font-semibold text-slate-200 mb-1.5">Descrição, opcional</label>
                    <textarea
                      id="subject-description"
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Ex.: SQL, normalização e transações"
                      className="w-full px-4 py-3 text-sm bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </fieldset>
              )}

              {formStep === 2 && (
                <fieldset className="space-y-3 ihc-reveal">
                  <legend className="text-sm font-bold text-slate-100">Cor do card</legend>
                  <div className="grid grid-cols-4 gap-2">
                    {colors.map((item) => (
                      <button
                        key={item.hex}
                        type="button"
                        aria-pressed={color === item.hex}
                        title={item.name}
                        onClick={() => setColor(item.hex)}
                        className={`choice-chip flex flex-col items-center gap-2 py-3 ${color === item.hex ? '' : ''}`}
                      >
                        <span className="w-8 h-8 rounded-full" style={{ backgroundColor: item.hex }} />
                        <span className="text-[11px] font-semibold">{item.name}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => formStep === 1 ? setShowModal(false) : setFormStep(1)}
                  className="btn-quiet text-slate-300 hover:text-slate-100 hover:bg-slate-800"
                >
                  {formStep === 1 ? 'Cancelar' : 'Voltar'}
                </button>

                {formStep === 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (!name.trim()) {
                        setFormError('vazio');
                        return;
                      }
                      setFormError(null);
                      setFormStep(2);
                    }}
                    className="btn-primary bg-teal-600 hover:bg-teal-500 text-white"
                  >
                    Escolher a cor
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={creating || !name.trim()}
                    className="btn-primary bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white shadow-lg shadow-teal-500/20"
                  >
                    {creating ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : 'Criar matéria'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

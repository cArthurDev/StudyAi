'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, DocumentItem, Subject } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { UploadDropzone } from '@/components/UploadDropzone';
import { FolderArchive, FileText, Trash2, BookOpen, Loader2 } from 'lucide-react';

export default function BibliotecaPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [docs, subs] = await Promise.all([
        api.getDocuments(selectedSubjectId || undefined),
        api.getSubjects()
      ]);
      setDocuments(docs);
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

  const handleDelete = async (docId: string) => {
    if (!confirm('Deseja excluir este documento?')) return;
    try {
      await api.deleteDocument(docId);
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
                <FolderArchive className="w-8 h-8 text-indigo-400" />
                Biblioteca de Documentos
              </h1>
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                Todos os PDFs, apresentações e textos indexados pelo motor de IA local
              </p>
            </div>

            {/* Subject Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Filtrar por matéria:</span>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="px-3.5 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Todas as matérias</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Upload Dropzone */}
          {subjects.length > 0 && (
            <div className="p-6 bg-[#161b22] border border-slate-800/80 rounded-3xl shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-200">Enviar Novo Material</h3>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>Vincular à matéria:</span>
                  <select
                    value={selectedSubjectId || subjects[0]?.id}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="px-2.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <UploadDropzone
                subjectId={selectedSubjectId || subjects[0]?.id}
                onSuccess={() => loadData()}
              />
            </div>
          )}

          {/* Documents Grid / Table */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : documents.length > 0 ? (
            <div className="p-6 bg-[#161b22] border border-slate-800/80 rounded-3xl shadow-xl space-y-4">
              <div className="divide-y divide-slate-800">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-200">{doc.name}</h4>
                        <p className="text-xs text-slate-400">
                          {doc.file_type.toUpperCase()} • {(doc.file_size / 1024 / 1024).toFixed(2)} MB • {doc.page_count} páginas/slides
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                        doc.status === 'ready'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : doc.status === 'error'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                      }`}>
                        {doc.status === 'ready' ? 'Pronto para Estudo' : doc.status === 'error' ? 'Erro' : `Processando (${doc.progress}%)`}
                      </span>

                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-[#161b22] border border-slate-800 rounded-3xl">
              <p className="text-slate-400 text-xs">Nenhum documento encontrado na biblioteca.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

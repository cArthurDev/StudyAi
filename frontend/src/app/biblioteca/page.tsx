'use client';

import React, { useEffect, useRef, useState } from 'react';
import { api, DocumentItem, Subject } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { UploadDropzone } from '@/components/UploadDropzone';
import { FolderArchive, FileText, Trash2, Loader2, UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';

export default function BibliotecaPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const documentsRef = useRef(documents);

  useEffect(() => {
    documentsRef.current = documents;
  }, [documents]);

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

  useEffect(() => {
    let checking = false;
    const pollStatuses = async () => {
      const pending = documentsRef.current.filter((doc) => !['ready', 'error'].includes(doc.status));
      if (checking || pending.length === 0) return;
      checking = true;
      try {
        const updates = await Promise.all(pending.map((doc) => api.getDocumentStatus(doc.id)));
        const byId = new Map(updates.map((status) => [status.id, status]));
        setDocuments((current) => current.map((doc) => {
          const status = byId.get(doc.id);
          return status ? { ...doc, status: status.status as DocumentItem['status'], progress: status.progress, error_message: status.error_message } : doc;
        }));
      } catch {
        // Retry transient errors on the next interval.
      } finally {
        checking = false;
      }
    };
    const interval = window.setInterval(pollStatuses, 1800);
    return () => window.clearInterval(interval);
  }, []);

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

        <main className="flex-1 p-4 md:p-8 space-y-7 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-3">
                <FolderArchive className="w-8 h-8 text-teal-400" />
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
            <section aria-labelledby="upload-heading" className="library-panel overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-black/10">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 px-5 py-4 md:px-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300">
                    <UploadCloud className="h-4 w-4" />
                  </span>
                  <h3 id="upload-heading" className="library-heading text-sm font-semibold text-slate-900 dark:text-slate-100">Adicionar material</h3>
                </div>
                <div className="library-muted flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>Vincular à matéria:</span>
                  <select
                    value={selectedSubjectId || subjects[0]?.id}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="max-w-48 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-4 md:p-5">
                <UploadDropzone
                  subjectId={selectedSubjectId || subjects[0]?.id}
                  onSuccess={() => loadData()}
                />
              </div>
            </section>
          )}

          {/* Documents Grid / Table */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : documents.length > 0 ? (
            <section aria-label="Documentos da biblioteca" className="library-panel overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-black/10">
              <div className="flex items-center justify-between border-b border-slate-800/80 px-5 py-4 md:px-6">
                <h2 className="library-heading text-sm font-semibold text-slate-900 dark:text-slate-100">Seus materiais</h2>
                <span className="library-muted text-xs tabular-nums text-slate-500 dark:text-slate-400">{documents.length} {documents.length === 1 ? 'arquivo' : 'arquivos'}</span>
              </div>
              <div className="divide-y divide-slate-800/80 px-4 md:px-6">
                {documents.map((doc) => (
                  <div key={doc.id} className="relative flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="shrink-0 rounded-xl border border-teal-500/15 bg-teal-500/[0.07] p-2.5 text-teal-700 dark:text-teal-300">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="library-heading break-words text-sm font-semibold text-slate-900 dark:text-slate-100">{doc.name}</h4>
                        <p className="library-muted mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {doc.file_type.toUpperCase()} • {(doc.file_size / 1024 / 1024).toFixed(2)} MB • {doc.page_count} páginas/slides
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 pl-12 sm:shrink-0 sm:justify-end sm:pl-0">
                      <span className={`library-status flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                        doc.status === 'ready' ? 'library-status-ready' :
                        doc.status === 'error' ? 'library-status-error' : 'library-status-processing'
                      }`}>
                        {doc.status === 'ready' ? <CheckCircle2 className="h-3.5 w-3.5" /> :
                          doc.status === 'error' ? <AlertCircle className="h-3.5 w-3.5" /> :
                          <Loader2 className="h-3 w-3 animate-spin" />}
                        {doc.status === 'ready' ? 'Pronto para estudo' : doc.status === 'error' ? 'Erro no processamento' :
                          doc.status === 'uploading' ? 'Enviando' :
                          doc.status === 'extracting' ? 'Extraindo texto' :
                          doc.status === 'analyzing' ? 'Analisando' : 'Indexando'}
                        {doc.status !== 'ready' && <span className="tabular-nums">{doc.progress}%</span>}
                      </span>

                      {doc.status !== 'ready' && doc.status !== 'error' && (
                        <div className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" aria-hidden="true">
                          <div className="h-full bg-teal-600 transition-all duration-500" style={{ width: `${doc.progress}%` }} />
                        </div>
                      )}

                      <button
                        onClick={() => handleDelete(doc.id)}
                        type="button"
                        aria-label={`Excluir ${doc.name}`}
                        title="Excluir documento"
                        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-rose-500/10 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 dark:text-slate-500 dark:hover:text-rose-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <div className="library-panel rounded-3xl border border-slate-200 bg-white p-12 text-center">
              <p className="library-muted text-xs text-slate-500 dark:text-slate-400">Nenhum documento encontrado na biblioteca.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

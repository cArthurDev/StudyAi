'use client';

import React, { useRef, useState } from 'react';
import { api, DocumentItem } from '@/lib/api';
import { AlertCircle, FileText, FileUp, UploadCloud, X } from 'lucide-react';

interface UploadDropzoneProps {
  subjectId: string;
  onSuccess?: (doc: DocumentItem) => void;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({ subjectId, onSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [statusMessages, setStatusMessages] = useState<string[]>([]);
  const [progressValues, setProgressValues] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = (selectedFiles: File[]) => {
    if (!selectedFiles.length) return;
    const allowed = ['.pdf', '.pptx', '.txt'];
    const validFiles = selectedFiles.filter((file) =>
      allowed.includes(file.name.substring(file.name.lastIndexOf('.')).toLowerCase())
    );
    const rejected = selectedFiles.length - validFiles.length;
    setError(rejected ? `${rejected} arquivo(s) ignorado(s). Envie somente PDF, PPTX ou TXT.` : null);
    if (validFiles.length) setFiles((current) => [...current, ...validFiles]);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(event.dataTransfer.files));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) addFiles(Array.from(event.target.files));
    event.target.value = '';
  };

  const removeFile = (index: number) => {
    if (uploading) return;
    setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
    setError(null);
  };

  const startUpload = async () => {
    if (!files.length || !subjectId || uploading) return;
    const queued = [...files];
    const messages = queued.map(() => 'Na fila');
    const progresses = queued.map(() => 0);
    const failedFiles: string[] = [];
    const successfulDocs: DocumentItem[] = [];
    setUploading(true);
    setError(null);
    setStatusMessages(messages);
    setProgressValues(progresses);

    const updateMessage = (index: number, message: string) => {
      messages[index] = message;
      setStatusMessages([...messages]);
    };
    const updateProgress = (index: number, value: number) => {
      progresses[index] = value;
      setProgressValues([...progresses]);
    };

    for (const [index, file] of queued.entries()) {
      try {
        updateMessage(index, 'Enviando arquivo...');
        updateProgress(index, 10);
        const formData = new FormData();
        formData.append('subject_id', subjectId);
        formData.append('file', file);
        const doc = await api.uploadDocument(formData);
        onSuccess?.(doc);
        updateProgress(index, 30);
        updateMessage(index, 'Processando documento...');

        while (true) {
          await sleep(1500);
          const status = await api.getDocumentStatus(doc.id);
          updateProgress(index, status.progress);
          if (status.status === 'extracting') updateMessage(index, 'Extraindo texto...');
          else if (status.status === 'analyzing') updateMessage(index, 'Analisando conteúdo...');
          else if (status.status === 'indexing') updateMessage(index, 'Indexando conteúdo...');
          else if (status.status === 'ready') {
            updateProgress(index, 100);
            updateMessage(index, 'Pronto para estudo');
            successfulDocs.push(doc);
            break;
          } else if (status.status === 'error') {
            updateMessage(index, status.error_message || 'Falha ao processar.');
            failedFiles.push(file.name);
            break;
          }
        }
      } catch (uploadError) {
        updateMessage(index, uploadError instanceof Error ? uploadError.message : 'Falha ao enviar arquivo.');
        failedFiles.push(file.name);
      }
    }

    setUploading(false);
    setFiles([]);
    if (failedFiles.length) setError(`${successfulDocs.length} enviado(s), ${failedFiles.length} com erro: ${failedFiles.join(', ')}`);
  };

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={uploading ? -1 : 0}
        aria-label="Selecionar ou soltar arquivos PDF, PPTX ou TXT"
        aria-busy={uploading}
        onKeyDown={(event) => {
          if ((event.key === 'Enter' || event.key === ' ') && !uploading) {
            event.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragging(false);
        }}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`library-dropzone relative flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed p-6 text-center outline-none transition-all duration-200 ease-out focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:min-h-56 sm:p-8 ${
          isDragging
            ? 'upload-dropzone-dragging scale-[1.01] border-teal-500 bg-teal-50 shadow-lg shadow-teal-500/10'
            : 'border-slate-300 bg-slate-50 hover:border-teal-500 hover:bg-white dark:border-slate-600 dark:bg-[#0d1522] dark:hover:border-slate-400 dark:hover:bg-[#111d2d]'
        } ${uploading ? 'cursor-wait' : 'cursor-pointer'}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.pptx,.txt"
          multiple
          onClick={(event) => event.stopPropagation()}
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />

        <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-500/20 bg-teal-500/10 text-teal-700 transition-transform duration-200 dark:text-teal-300 ${isDragging ? 'scale-110 animate-bounce' : ''}`}>
          {isDragging ? <FileUp className="h-5 w-5" /> : <UploadCloud className="h-5 w-5" />}
        </div>

        <h3 className="text-sm font-semibold text-slate-500 sm:text-base dark:text-slate-400">
          {isDragging ? <span className="text-teal-700 dark:text-teal-300">Solte os arquivos para anexar</span> : <>Arraste seus materiais aqui ou <span className="text-teal-700 underline underline-offset-4 dark:text-teal-300">procure no computador</span></>}
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          {isDragging ? 'Os arquivos serão adicionados à matéria selecionada' : 'PDF, PowerPoint (PPTX) ou texto (TXT) · até 50 MB por arquivo'}
        </p>

        {files.length > 0 && !uploading && (
          <div onClick={(event) => event.stopPropagation()} className="mt-5 w-full max-w-2xl space-y-2 text-left">
            {files.map((file, index) => (
              <div key={`${file.name}-${file.lastModified}-${index}`} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                <FileText className="h-5 w-5 shrink-0 text-teal-600 dark:text-teal-300" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800 dark:text-slate-200">{file.name}</span>
                <span className="shrink-0 text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                <button type="button" aria-label={`Remover ${file.name} da fila`} onClick={() => removeFile(index)} className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button type="button" onClick={startUpload} className="btn-primary mt-2 rounded-lg bg-teal-600 text-white hover:bg-teal-500">
              <UploadCloud className="h-4 w-4" /> Enviar {files.length} {files.length === 1 ? 'arquivo' : 'arquivos'}
            </button>
          </div>
        )}

        {uploading && (
          <div className="mt-5 w-full max-w-2xl space-y-3 text-left" aria-live="polite">
            {files.map((file, index) => (
              <div key={`${file.name}-${file.lastModified}-${index}`} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="truncate font-medium text-slate-800 dark:text-slate-200">{file.name}</span>
                  <span className="shrink-0 text-slate-500">{statusMessages[index]}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div className="h-full rounded-full bg-teal-600 transition-all duration-300" style={{ width: `${progressValues[index] || 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div onClick={(event) => event.stopPropagation()} className="mt-4 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-left text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

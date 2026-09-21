'use client';

import React, { useState, useRef } from 'react';
import { api, DocumentItem } from '@/lib/api';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, Sparkles, X } from 'lucide-react';

interface UploadDropzoneProps {
  subjectId: string;
  onSuccess?: (doc: DocumentItem) => void;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({ subjectId, onSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (selectedFile: File) => {
    const validExtensions = ['.pdf', '.pptx', '.txt'];
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(ext)) {
      setError('Formato não suportado. Por favor, envie arquivos PDF, PPTX ou TXT.');
      return;
    }
    setError(null);
    setFile(selectedFile);
  };

  const startUpload = async () => {
    if (!file || !subjectId) return;

    setUploading(true);
    setError(null);
    setProgress(20);
    setStatusMessage('Enviando arquivo para o servidor...');

    try {
      const formData = new FormData();
      formData.append('subject_id', subjectId);
      formData.append('file', file);

      const doc = await api.uploadDocument(formData);
      setProgress(35);
      setStatusMessage('Extraindo texto do documento...');

      // Poll document status
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await api.getDocumentStatus(doc.id);
          setProgress(statusRes.progress);

          if (statusRes.status === 'extracting') {
            setStatusMessage('Extraindo texto e estrutura...');
          } else if (statusRes.status === 'analyzing') {
            setStatusMessage('Analisando conceitos com qwen3:8b...');
          } else if (statusRes.status === 'indexing') {
            setStatusMessage('Gerando embeddings e índice vetorial...');
          } else if (statusRes.status === 'ready') {
            clearInterval(pollInterval);
            setProgress(100);
            setStatusMessage('Documento processado e pronto para estudo!');
            setTimeout(() => {
              setUploading(false);
              setFile(null);
              onSuccess?.(doc);
            }, 1000);
          } else if (statusRes.status === 'error') {
            clearInterval(pollInterval);
            setUploading(false);
            setError(statusRes.error_message || 'Erro durante o processamento do documento.');
          }
        } catch {
          // ignore transient polling errors
        }
      }, 1500);

    } catch (err: any) {
      setUploading(false);
      setError(err.message || 'Falha ao enviar arquivo.');
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-slate-800 bg-[#161b22]/50 hover:bg-[#161b22] hover:border-slate-700'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.pptx,.txt"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />

        <div className="flex items-center justify-center w-14 h-14 mb-4 rounded-2xl bg-[#FFEE8C]/20 text-[#FFEE8C] border border-[#FFEE8C]/30 shadow-lg shadow-amber-500/10">
          <UploadCloud className="w-7 h-7" />
        </div>

        <h3 className="text-base font-semibold text-slate-200 text-center">
          Arraste seus materiais aqui ou <span className="text-[#FFEE8C] underline">procure no computador</span>
        </h3>
        <p className="mt-1 text-xs text-slate-400 text-center">
          Suporte completo para PDF (PyMuPDF), PowerPoint PPTX e TXT (até 50MB)
        </p>

        {file && !uploading && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-between w-full max-w-md mt-5 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#FFEE8C]/20 text-[#FFEE8C]">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-medium text-slate-200 truncate max-w-[200px]">{file.name}</span>
                <span className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            </div>

            <button
              onClick={startUpload}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#221d06] bg-[#FFEE8C] rounded-lg hover:bg-[#F3DD64] transition-colors shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-[#221d06]" />
              Iniciar Processamento
            </button>
          </div>
        )}

        {/* Progress bar */}
        {uploading && (
          <div className="w-full max-w-md mt-6 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-2 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FFEE8C]" />
                {statusMessage}
              </span>
              <span className="text-xs font-bold font-mono text-[#FFEE8C]">{progress}%</span>
            </div>

            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#EBD053] to-[#FFEE8C] transition-all duration-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 mt-4 px-3.5 py-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

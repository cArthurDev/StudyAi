'use client';

import React from 'react';
import Link from 'next/link';
import { Subject } from '@/lib/api';
import { BookOpen, FileText, Layers, ArrowUpRight } from 'lucide-react';

interface SubjectCardProps {
  subject: Subject;
  compact?: boolean;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({ subject, compact = false }) => {
  return (
    <Link
      href={`/materias/${subject.id}`}
      className={`group relative flex flex-col justify-between bg-[#161b22] border border-slate-800/80 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-0.5 ${
        compact ? 'p-3.5 rounded-xl' : 'p-6 rounded-2xl'
      }`}
    >
      <div>
        <div className={`flex items-center justify-between ${compact ? 'mb-2' : 'mb-4'}`}>
          <div
            className={`flex items-center justify-center rounded-xl text-white font-bold shadow-md ${
              compact ? 'w-9 h-9' : 'w-12 h-12'
            }`}
            style={{ backgroundColor: subject.color || '#6366f1' }}
          >
            <BookOpen className={compact ? 'w-4 h-4' : 'w-6 h-6'} />
          </div>

          <div className="flex items-center gap-1 text-slate-400 group-hover:text-indigo-400 transition-colors">
            <span className="text-xs font-semibold">Abrir</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>

        <h3 className="text-sm font-bold text-slate-100 group-hover:text-white transition-colors">
          {subject.name}
        </h3>
        {!compact && (
          <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {subject.description || 'Nenhuma descrição informada.'}
          </p>
        )}
      </div>

      <div className={`border-t border-slate-800/80 ${compact ? 'mt-3 pt-2.5' : 'mt-6 pt-4'}`}>
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" /> {subject.document_count} docs
            </span>
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-slate-400" /> {subject.flashcard_count} cards
            </span>
          </div>

          <span className="font-mono font-bold text-teal-400">
            {Math.round(subject.mastery_average || 0)}%
          </span>
        </div>

        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-700 to-teal-400 transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, subject.mastery_average || 0))}%` }}
          />
        </div>
      </div>
    </Link>
  );
};

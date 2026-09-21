'use client';

import React from 'react';
import Link from 'next/link';
import { Subject } from '@/lib/api';
import { BookOpen, FileText, Layers, HelpCircle, ArrowUpRight, BarChart3 } from 'lucide-react';

interface SubjectCardProps {
  subject: Subject;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({ subject }) => {
  return (
    <Link
      href={`/materias/${subject.id}`}
      className="group relative flex flex-col justify-between p-6 bg-[#161b22] border border-slate-800/80 hover:border-indigo-500/50 rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-0.5"
    >
      <div>
        {/* Header with icon & color */}
        <div className="flex items-center justify-between mb-4">
          <div
            className="flex items-center justify-center w-12 h-12 rounded-xl text-white font-bold shadow-md"
            style={{ backgroundColor: subject.color || '#6366f1' }}
          >
            <BookOpen className="w-6 h-6" />
          </div>

          <div className="flex items-center gap-1 text-slate-400 group-hover:text-indigo-400 transition-colors">
            <span className="text-xs font-semibold">Abrir</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>

        {/* Title and description */}
        <h3 className="text-base font-bold text-slate-100 group-hover:text-white transition-colors">
          {subject.name}
        </h3>
        <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
          {subject.description || 'Nenhuma descrição informada.'}
        </p>
      </div>

      {/* Stats bar */}
      <div className="mt-6 pt-4 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" /> {subject.document_count} docs
            </span>
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-slate-400" /> {subject.flashcard_count} cards
            </span>
          </div>

          <span className="font-mono font-bold text-[#FFEE8C]">
            {Math.round(subject.mastery_average || 0)}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#EBD053] to-[#FFEE8C] transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, subject.mastery_average || 0))}%` }}
          />
        </div>
      </div>
    </Link>
  );
};

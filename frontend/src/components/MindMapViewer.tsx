'use client';

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, BookOpen, Layers, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface MindMapViewerProps {
  subjectName: string;
  chapters: Record<string, any[]>;
  mermaidCode?: string;
}

export const MindMapViewer: React.FC<MindMapViewerProps> = ({
  subjectName,
  chapters = {},
  mermaidCode
}) => {
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    Object.keys(chapters).forEach((ch) => {
      init[ch] = true;
    });
    return init;
  });

  const [selectedTopic, setSelectedTopic] = useState<any | null>(null);

  const toggleChapter = (chapterName: string) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterName]: !prev[chapterName]
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DOMINADO':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'EM PROGRESSO':
        return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
      case 'PRECISA REVISAR':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      default:
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Interactive Tree View */}
      <div className="lg:col-span-2 p-6 bg-[#161b22] border border-slate-800/80 rounded-2xl shadow-xl">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-800">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold text-slate-100">{subjectName} — Árvore de Conhecimento</h3>
        </div>

        <div className="space-y-4">
          {Object.entries(chapters).map(([chName, topics]) => {
            const isExpanded = expandedChapters[chName] ?? true;
            return (
              <div
                key={chName}
                className="rounded-xl border border-slate-800/80 bg-slate-900/40 overflow-hidden"
              >
                {/* Chapter header */}
                <button
                  onClick={() => toggleChapter(chName)}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-900/80 hover:bg-slate-850 text-left transition-colors"
                >
                  <div className="flex items-center gap-2.5 font-semibold text-sm text-slate-200">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                    <span>📁 {chName}</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                    {topics.length} tópicos
                  </span>
                </button>

                {/* Topics list inside chapter */}
                {isExpanded && (
                  <div className="p-3 space-y-2 border-t border-slate-800/60">
                    {topics.map((t) => {
                      const isSelected = selectedTopic?.id === t.id;
                      return (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTopic(t)}
                          className={`flex items-center justify-between p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-indigo-600/15 border-indigo-500 shadow-xs'
                              : 'bg-[#161b22] border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                            <span className="font-medium text-slate-200">{t.name}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(t.status)}`}>
                              {t.status} ({Math.round(t.mastery_score)}%)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Topic Details Popover Panel */}
      <div className="p-6 bg-[#161b22] border border-slate-800/80 rounded-2xl shadow-xl h-fit">
        <h4 className="text-sm font-bold text-slate-200 mb-4 pb-3 border-b border-slate-800 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          Detalhes do Conceito
        </h4>

        {selectedTopic ? (
          <div className="space-y-4">
            <div>
              <span className="text-[11px] font-semibold uppercase text-slate-400">Assunto</span>
              <h5 className="text-base font-bold text-slate-100 mt-0.5">{selectedTopic.name}</h5>
              {selectedTopic.description && (
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed bg-slate-900 p-3 rounded-xl border border-slate-800">
                  {selectedTopic.description}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400">Índice de Domínio:</span>
              <span className={`text-xs font-bold font-mono px-2.5 py-0.5 rounded border ${getStatusColor(selectedTopic.status)}`}>
                {selectedTopic.mastery_score}% ({selectedTopic.status})
              </span>
            </div>

            {selectedTopic.definitions && selectedTopic.definitions.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold uppercase text-slate-400 block mb-2">Definições-Chave</span>
                <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                  {selectedTopic.definitions.map((def: string, dIdx: number) => (
                    <li key={dIdx} className="leading-relaxed">{def}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedTopic.formulas && selectedTopic.formulas.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold uppercase text-slate-400 block mb-2">Fórmulas / Sintaxe</span>
                <div className="space-y-1.5">
                  {selectedTopic.formulas.map((f: string, fIdx: number) => (
                    <div key={fIdx} className="p-2 rounded bg-slate-950 border border-slate-800 font-mono text-xs text-indigo-300">
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-xs">
            Selecione um tópico na árvore para inspecionar definições, fórmulas e nível de domínio.
          </div>
        )}
      </div>
    </div>
  );
};

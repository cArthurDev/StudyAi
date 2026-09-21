'use client';

import React, { useEffect, useState } from 'react';
import { api, TopicMastery } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { LineChart, Award, AlertTriangle, ShieldCheck, Clock, Loader2, Filter } from 'lucide-react';

export default function DesempenhoPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [masteryList, setMasteryList] = useState<TopicMastery[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const data = await api.getAllMastery();
      setMasteryList(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredList = masteryList.filter((m) => {
    if (!statusFilter) return true;
    return m.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DOMINADO':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'EM PROGRESSO':
        return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
      case 'PRECISA REVISAR':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    }
  };

  const counts = {
    DOMINADO: masteryList.filter((m) => m.status === 'DOMINADO').length,
    'EM PROGRESSO': masteryList.filter((m) => m.status === 'EM PROGRESSO').length,
    'PRECISA REVISAR': masteryList.filter((m) => m.status === 'PRECISA REVISAR').length,
    'CRÍTICO': masteryList.filter((m) => m.status === 'CRÍTICO').length,
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
                <LineChart className="w-8 h-8 text-[#FFEE8C]" />
                Matriz de Desempenho & Domínio
              </h1>
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                Pontuações de domínio de 0 a 100 calculadas de forma determinística no backend com base nas suas resoluções
              </p>
            </div>
          </div>

          {/* 4 Status Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => setStatusFilter(statusFilter === 'DOMINADO' ? '' : 'DOMINADO')}
              className={`p-5 rounded-2xl bg-[#161b22] border cursor-pointer transition-all ${
                statusFilter === 'DOMINADO' ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">DOMINADO (≥ 80%)</span>
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">{counts.DOMINADO}</div>
            </div>

            <div
              onClick={() => setStatusFilter(statusFilter === 'EM PROGRESSO' ? '' : 'EM PROGRESSO')}
              className={`p-5 rounded-2xl bg-[#161b22] border cursor-pointer transition-all ${
                statusFilter === 'EM PROGRESSO' ? 'border-[#FFEE8C] ring-2 ring-[#FFEE8C]/30' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">EM PROGRESSO (60-79%)</span>
                <Award className="w-5 h-5 text-[#FFEE8C]" />
              </div>
              <div className="text-2xl font-bold font-mono text-[#FFEE8C] mt-2">{counts['EM PROGRESSO']}</div>
            </div>

            <div
              onClick={() => setStatusFilter(statusFilter === 'PRECISA REVISAR' ? '' : 'PRECISA REVISAR')}
              className={`p-5 rounded-2xl bg-[#161b22] border cursor-pointer transition-all ${
                statusFilter === 'PRECISA REVISAR' ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">PRECISA REVISAR (40-59%)</span>
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-amber-400 mt-2">{counts['PRECISA REVISAR']}</div>
            </div>

            <div
              onClick={() => setStatusFilter(statusFilter === 'CRÍTICO' ? '' : 'CRÍTICO')}
              className={`p-5 rounded-2xl bg-[#161b22] border cursor-pointer transition-all ${
                statusFilter === 'CRÍTICO' ? 'border-rose-500 ring-2 ring-rose-500/30' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">CRÍTICO (&lt; 40%)</span>
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-rose-400 mt-2">{counts['CRÍTICO']}</div>
            </div>
          </div>

          {/* Topics Table */}
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-[#FFEE8C]" />
            </div>
          ) : filteredList.length > 0 ? (
            <div className="p-6 bg-[#161b22] border border-slate-800/80 rounded-3xl shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <h3 className="text-base font-bold text-slate-100">
                  Tópicos e Níveis de Domínio ({filteredList.length})
                </h3>
                {statusFilter && (
                  <button
                    onClick={() => setStatusFilter('')}
                    className="text-xs text-[#FFEE8C] hover:underline"
                  >
                    Limpar filtro
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-800">
                {filteredList.map((m) => (
                  <div key={m.topic_id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-200">{m.topic_name}</h4>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getStatusBadge(m.status)}`}>
                          {m.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{m.subject_name}</p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block">Tentativas</span>
                        <span className="text-xs font-mono text-slate-200">
                          {m.correct_attempts}/{m.total_attempts} ({m.accuracy_rate}%)
                        </span>
                      </div>

                      <div className="w-32 space-y-1">
                        <div className="flex justify-between text-xs font-mono font-bold">
                          <span className="text-slate-400">Domínio:</span>
                          <span className="text-[#FFEE8C]">{m.mastery_score}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              m.mastery_score >= 80 ? 'bg-emerald-500' :
                              m.mastery_score >= 60 ? 'bg-[#FFEE8C]' :
                              m.mastery_score >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${m.mastery_score}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-[#161b22] border border-slate-800 rounded-3xl">
              <p className="text-slate-400 text-xs">
                Nenhum tópico registrado ainda. Envie documentos em suas matérias para começar o mapeamento de domínio.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

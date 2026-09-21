'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { 
  Settings, 
  Cpu, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  User, 
  Terminal, 
  Sun, 
  Moon, 
  Palette,
  Check
} from 'lucide-react';

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const { theme, setTheme, isDarkMode, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const res = await api.getOllamaStatus();
      setOllamaStatus(res);
    } catch {
      setOllamaStatus({ available: false, error: 'Não foi possível contatar o servidor local.' });
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#0a0d12]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-3">
                <Settings className="w-8 h-8 text-[#FFEE8C]" />
                Configurações & Diagnóstico da IA
              </h1>
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                Personalize o visual e verifique a integridade da comunicação com os modelos locais
              </p>
            </div>

            {/* Quick Toggle Button */}
            <button
              onClick={toggleTheme}
              className="self-start sm:self-auto flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#161b22] hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold transition-all shadow-md cursor-pointer group"
            >
              {isDarkMode ? (
                <>
                  <div className="p-1 rounded-lg bg-[#FFEE8C]/20 text-[#FFEE8C] group-hover:scale-110 transition-transform">
                    <Sun className="w-4 h-4 text-[#FFEE8C]" />
                  </div>
                  <span>Mudar para Modo Claro</span>
                </>
              ) : (
                <>
                  <div className="p-1 rounded-lg bg-[#FFEE8C]/20 text-[#221d06] group-hover:scale-110 transition-transform">
                    <Moon className="w-4 h-4 text-[#221d06]" />
                  </div>
                  <span>Mudar para Modo Escuro</span>
                </>
              )}
            </button>
          </div>

          {/* Theme Selector Section */}
          <div className="p-6 md:p-8 bg-[#161b22] border border-slate-800/80 rounded-3xl shadow-xl space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="p-2.5 rounded-xl bg-[#FFEE8C]/20 text-[#FFEE8C] border border-[#FFEE8C]/30">
                <Palette className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100">Aparência & Tema do Sistema</h2>
                <p className="text-xs text-slate-400">Escolha o modo de exibição de sua preferência</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Dark Mode Card */}
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`relative flex flex-col p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer group ${
                  isDarkMode
                    ? 'border-[#FFEE8C] bg-[#FFEE8C]/15 ring-2 ring-[#FFEE8C]/40 shadow-lg shadow-amber-500/10'
                    : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/50 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[#FFEE8C]">
                      <Moon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-100 block">Modo Escuro</span>
                      <span className="text-[11px] text-slate-400">Ambiente ideal para foco noturno</span>
                    </div>
                  </div>
                  {isDarkMode && (
                    <div className="w-6 h-6 rounded-full bg-[#FFEE8C] text-[#221d06] flex items-center justify-center shadow-xs font-bold">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Visual Preview */}
                <div className="w-full h-16 rounded-xl bg-[#0a0d12] border border-slate-800 p-2 flex gap-2 items-center">
                  <div className="w-8 h-full rounded-lg bg-[#0d1117] border border-slate-800 flex flex-col justify-center items-center gap-1">
                    <div className="w-3 h-1 rounded-full bg-[#FFEE8C]"></div>
                    <div className="w-3 h-1 rounded-full bg-slate-700"></div>
                  </div>
                  <div className="flex-1 h-full rounded-lg bg-[#161b22] border border-slate-800 p-2 flex flex-col justify-center gap-1.5">
                    <div className="w-16 h-2 rounded-full bg-slate-700"></div>
                    <div className="w-24 h-1.5 rounded-full bg-slate-800"></div>
                  </div>
                </div>
              </button>

              {/* Light Mode Card */}
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`relative flex flex-col p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer group ${
                  !isDarkMode
                    ? 'border-[#FFEE8C] bg-[#FFEE8C]/15 ring-2 ring-[#FFEE8C]/40 shadow-lg shadow-amber-500/10'
                    : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/50 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#FFEE8C]/20 border border-[#FFEE8C]/40 text-[#a37d04]">
                      <Sun className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-100 block">Modo Claro</span>
                      <span className="text-[11px] text-slate-400">Leitura clara com paleta Butter Yellow</span>
                    </div>
                  </div>
                  {!isDarkMode && (
                    <div className="w-6 h-6 rounded-full bg-[#FFEE8C] text-[#241e05] flex items-center justify-center shadow-xs font-bold">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Visual Preview */}
                <div className="w-full h-16 rounded-xl bg-[#FCFBF7] border border-[#EFEAD8] p-2 flex gap-2 items-center">
                  <div className="w-8 h-full rounded-lg bg-white border border-[#EFEAD8] flex flex-col justify-center items-center gap-1">
                    <div className="w-3 h-1 rounded-full bg-[#FFEE8C]"></div>
                    <div className="w-3 h-1 rounded-full bg-[#EFEAD8]"></div>
                  </div>
                  <div className="flex-1 h-full rounded-lg bg-white border border-[#EFEAD8] p-2 flex flex-col justify-center gap-1.5">
                    <div className="w-16 h-2 rounded-full bg-[#FFEE8C]"></div>
                    <div className="w-24 h-1.5 rounded-full bg-[#F7F5EE]"></div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Ollama Local AI Diagnostics */}
            <div className="p-6 md:p-8 bg-[#161b22] border border-slate-800/80 rounded-3xl shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#FFEE8C]/20 text-[#FFEE8C] border border-[#FFEE8C]/30">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-100">Status do Ollama</h2>
                    <p className="text-xs text-slate-400 font-mono">http://localhost:11434</p>
                  </div>
                </div>

                <button
                  onClick={checkStatus}
                  disabled={checking}
                  className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
                  Testar Conexão
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-xs font-medium text-slate-300">Servidor Local Ollama</span>
                  {ollamaStatus?.available ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" /> Operacional
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                      <AlertCircle className="w-4 h-4" /> Indisponível
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="space-y-0.5">
                    <span className="text-xs font-medium text-slate-300 block">Modelo Principal (LLM)</span>
                    <span className="text-[11px] text-slate-500 font-mono">qwen3:8b</span>
                  </div>
                  {ollamaStatus?.llm_ready ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" /> Pronto
                    </span>
                  ) : (
                    <span className="text-xs text-amber-400 font-mono">ollama pull qwen3:8b</span>
                  )}
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="space-y-0.5">
                    <span className="text-xs font-medium text-slate-300 block">Modelo de Embeddings (RAG)</span>
                    <span className="text-[11px] text-slate-500 font-mono">qwen3-embedding:0.6b</span>
                  </div>
                  {ollamaStatus?.embedding_ready ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" /> Pronto
                    </span>
                  ) : (
                    <span className="text-xs text-amber-400 font-mono">ollama pull qwen3-embedding:0.6b</span>
                  )}
                </div>
              </div>

              {/* Instructions box */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                  <Terminal className="w-4 h-4 text-[#FFEE8C]" />
                  Comandos de Inicialização Local:
                </div>
                <div className="font-mono text-[11px] text-slate-400 space-y-1 bg-slate-900 p-3 rounded-xl">
                  <p className="text-emerald-400"># Baixar os modelos oficiais no seu terminal:</p>
                  <p>ollama pull qwen3:8b</p>
                  <p>ollama pull qwen3-embedding:0.6b</p>
                  <p className="text-emerald-400 mt-2"># Iniciar serviço local:</p>
                  <p>ollama serve</p>
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="p-6 md:p-8 bg-[#161b22] border border-slate-800/80 rounded-3xl shadow-xl space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                <div className="p-2.5 rounded-xl bg-[#FFEE8C]/20 text-[#FFEE8C] border border-[#FFEE8C]/30">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-100">Perfil do Estudante</h2>
                  <p className="text-xs text-slate-400">Dados da conta local ativa</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Nome Completo</label>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200">
                    {user?.full_name || 'Carregando...'}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">E-mail Cadastrado</label>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200">
                    {user?.email || 'Carregando...'}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Privacidade dos Dados</label>
                  <p className="text-xs text-slate-400 leading-relaxed p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                    🔒 Todos os seus arquivos, transcrições e embeddings são processados estritamente na sua máquina local com Ollama. Nenhuma informação é transmitida para provedores em nuvem pagos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

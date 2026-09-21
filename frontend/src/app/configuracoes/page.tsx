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
  Check,
  Eye,
  Contrast,
  Type,
  Blend
} from 'lucide-react';
import type { A11yPalette } from '@/context/ThemeContext';

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const { setTheme, isDarkMode, toggleTheme, a11yPalette, setA11yPalette, a11yText, setA11yText } = useTheme();

  const palettes: {
    id: A11yPalette;
    title: string;
    description: string;
    swatches: string[];
    icon: React.ReactNode;
  }[] = [
    {
      id: 'default',
      title: 'Padrão',
      description: 'Paleta teal da plataforma',
      swatches: ['#0d9488', '#14b8a6', '#f59e0b', '#f43f5e'],
      icon: <Palette className="w-5 h-5" />,
    },
    {
      id: 'colorblind',
      title: 'Daltonismo',
      description: 'Azul, laranja e âmbar — distinguíveis na protanopia e deuteranopia',
      swatches: ['#0072B2', '#E69F00', '#D55E00', '#009E73'],
      icon: <Eye className="w-5 h-5" />,
    },
    {
      id: 'high-contrast',
      title: 'Alto contraste',
      description: 'Texto e bordas fortes, indicado para baixa visão',
      swatches: ['#000000', '#ffffff', '#ffff00', '#0000ee'],
      icon: <Contrast className="w-5 h-5" />,
    },
    {
      id: 'monochrome',
      title: 'Sem cor',
      description: 'Escala de cinza para acromatopsia',
      swatches: ['#111111', '#555555', '#999999', '#eeeeee'],
      icon: <Blend className="w-5 h-5" />,
    },
  ];
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
                <Settings className="w-8 h-8 text-teal-400" />
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
                  <div className="p-1 rounded-lg bg-teal-500/15 text-teal-400 group-hover:scale-110 transition-transform">
                    <Sun className="w-4 h-4 text-teal-400" />
                  </div>
                  <span>Mudar para Modo Claro</span>
                </>
              ) : (
                <>
                  <div className="p-1 rounded-lg bg-teal-500/15 text-teal-700 group-hover:scale-110 transition-transform">
                    <Moon className="w-4 h-4 text-teal-700" />
                  </div>
                  <span>Mudar para Modo Escuro</span>
                </>
              )}
            </button>
          </div>

          {/* Theme Selector Section */}
          <div className="p-6 md:p-8 bg-[#161b22] border border-slate-800/80 rounded-3xl shadow-xl space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="p-2.5 rounded-xl bg-teal-500/15 text-teal-400 border border-teal-500/30">
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
                    ? 'border-teal-500 bg-teal-500/15 ring-2 ring-teal-500/40 shadow-lg shadow-teal-500/10'
                    : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/50 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-teal-400">
                      <Moon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-100 block">Modo Escuro</span>
                      <span className="text-[11px] text-slate-400">Ambiente ideal para foco noturno</span>
                    </div>
                  </div>
                  {isDarkMode && (
                    <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-xs font-bold">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Visual Preview */}
                <div className="w-full h-16 rounded-xl bg-[#0a0d12] border border-slate-800 p-2 flex gap-2 items-center">
                  <div className="w-8 h-full rounded-lg bg-[#0d1117] border border-slate-800 flex flex-col justify-center items-center gap-1">
                    <div className="w-3 h-1 rounded-full bg-teal-600"></div>
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
                    ? 'border-teal-500 bg-teal-500/15 ring-2 ring-teal-500/40 shadow-lg shadow-teal-500/10'
                    : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/50 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-teal-500/15 border border-teal-500/40 text-teal-700">
                      <Sun className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-100 block">Modo Claro</span>
                      <span className="text-[11px] text-slate-400">Fundo branco, leitura confortável</span>
                    </div>
                  </div>
                  {!isDarkMode && (
                    <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-xs font-bold">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Visual Preview */}
                <div className="w-full h-16 rounded-xl bg-[#f4f7fa] border border-slate-200 p-2 flex gap-2 items-center">
                  <div className="w-8 h-full rounded-lg bg-white border border-slate-200 flex flex-col justify-center items-center gap-1">
                    <div className="w-3 h-1 rounded-full bg-teal-600"></div>
                    <div className="w-3 h-1 rounded-full bg-slate-200"></div>
                  </div>
                  <div className="flex-1 h-full rounded-lg bg-white border border-slate-200 p-2 flex flex-col justify-center gap-1.5">
                    <div className="w-16 h-2 rounded-full bg-teal-600"></div>
                    <div className="w-24 h-1.5 rounded-full bg-slate-100"></div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="p-6 md:p-8 bg-[#161b22] border border-slate-800/80 rounded-3xl shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-500/15 text-teal-400 border border-teal-500/30">
                  <Eye className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-100">Acessibilidade visual</h2>
                  <p className="text-xs text-slate-400">
                    Paletas pensadas para daltonismo, baixa visão e acromatopsia
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setA11yText(a11yText === 'large' ? 'normal' : 'large')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all ${
                  a11yText === 'large'
                    ? 'border-teal-500 bg-teal-500/15 text-teal-300'
                    : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                }`}
                aria-pressed={a11yText === 'large'}
              >
                <Type className="w-4 h-4" />
                {a11yText === 'large' ? 'Texto maior ativo' : 'Ativar texto maior'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {palettes.map((option) => {
                const selected = a11yPalette === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setA11yPalette(option.id)}
                    aria-pressed={selected}
                    className={`relative flex flex-col p-4 rounded-2xl border text-left transition-all ${
                      selected
                        ? 'border-teal-500 bg-teal-500/15 ring-2 ring-teal-500/40'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-teal-400">
                          {option.icon}
                        </span>
                        <span className="text-sm font-bold text-slate-100">{option.title}</span>
                      </div>
                      {selected && (
                        <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed mb-3 min-h-[2.5rem]">
                      {option.description}
                    </p>
                    <div className="flex gap-1.5" aria-hidden="true">
                      {option.swatches.map((color) => (
                        <span
                          key={color}
                          className="h-7 flex-1 rounded-md border border-slate-700"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Daltonismo troca verde e vermelho por azul e laranja, para quem tem dificuldade em distinguir essas cores.
              Alto contraste reforça texto e bordas. Sem cor usa só tons de cinza. A escolha fica salva neste dispositivo.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Ollama Local AI Diagnostics */}
            <div className="p-6 md:p-8 bg-[#161b22] border border-slate-800/80 rounded-3xl shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-teal-500/15 text-teal-400 border border-teal-500/30">
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
                  <Terminal className="w-4 h-4 text-teal-400" />
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
                <div className="p-2.5 rounded-xl bg-teal-500/15 text-teal-400 border border-teal-500/30">
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

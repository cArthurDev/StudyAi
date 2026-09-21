'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { api } from '@/lib/api';
import { Menu, Cpu, LogOut, User as UserIcon, CheckCircle2, AlertCircle, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  onMenuClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [ollamaStatus, setOllamaStatus] = useState<{ available: boolean; llm_ready?: boolean; embedding_ready?: boolean } | null>(null);

  useEffect(() => {
    const checkOllama = async () => {
      try {
        const res = await api.getOllamaStatus();
        setOllamaStatus(res);
      } catch {
        setOllamaStatus({ available: false });
      }
    };
    checkOllama();
    const interval = setInterval(checkOllama, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 bg-[#0d1117]/80 backdrop-blur-md border-b border-slate-800/80">
      {/* Mobile toggle & breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">Local Ollama</span>
          <span>•</span>
          <span className="text-[#FFEE8C] font-medium">qwen3:8b & qwen3-embedding:0.6b</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          type="button"
          aria-label={isDarkMode ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
          title={isDarkMode ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-800 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white transition-all duration-200 cursor-pointer text-xs font-medium shadow-xs"
        >
          {isDarkMode ? (
            <>
              <Sun className="w-3.5 h-3.5 text-[#FFEE8C]" />
              <span className="hidden sm:inline">Modo Claro</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Modo Escuro</span>
            </>
          )}
        </button>

        {/* Ollama Status Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs">
          <Cpu className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-300 hidden sm:inline">IA Local:</span>
          {ollamaStatus?.available ? (
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Conectado
            </span>
          ) : (
            <span className="flex items-center gap-1 text-rose-400 font-medium">
              <AlertCircle className="w-3 h-3 text-rose-400" />
              Offline
            </span>
          )}
        </div>

        {/* User profile dropdown / logout */}
        {user && (
          <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-[#EBD053] to-[#FFEE8C] text-[#221d06] font-bold text-xs shadow-xs">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-200">{user.full_name}</span>
                <span className="text-[10px] text-slate-400">{user.email}</span>
              </div>
            </div>

            <button
              onClick={logout}
              title="Encerrar sessão"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Menu, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  onMenuClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-12 px-3 md:px-5 bg-[#0d1117]/80 backdrop-blur-md border-b border-slate-800/80">
      <button
        onClick={onMenuClick}
        type="button"
        aria-label="Abrir menu de navegação"
        title="Abre as etapas Estudar, Praticar e Acompanhar"
        className="btn-quiet text-slate-300 hover:text-white hover:bg-slate-800"
      >
        <Menu className="w-5 h-5" />
        Menu
      </button>

      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={toggleTheme}
          type="button"
          aria-label={isDarkMode ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
          title={isDarkMode ? 'Deixa o fundo claro para leitura diurna' : 'Deixa o fundo escuro para leitura noturna'}
          className="btn-quiet rounded-full border border-slate-800 bg-[#161b22] hover:bg-slate-800 text-slate-300 hover:text-white transition-all duration-200"
        >
          {isDarkMode ? (
            <>
              <Sun className="w-4 h-4 text-teal-400" />
              Modo claro
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-amber-600" />
              Modo escuro
            </>
          )}
        </button>

        {user && (
          <Link
            href="/configuracoes"
            title={`Abrir perfil de ${user.full_name}`}
            className="btn-quiet rounded-full bg-gradient-to-tr from-teal-700 to-teal-400 text-white shadow-xs hover:opacity-90 transition-opacity"
          >
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/15 font-bold text-xs">
              {user.full_name.charAt(0).toUpperCase()}
            </span>
            <span className="max-w-28 truncate">{user.full_name.split(' ')[0]}</span>
          </Link>
        )}
      </div>
    </header>
  );
};

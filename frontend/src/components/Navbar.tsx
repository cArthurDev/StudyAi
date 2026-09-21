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
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 bg-[#0d1117]/80 backdrop-blur-md border-b border-slate-800/80">
      <button
        onClick={onMenuClick}
        type="button"
        aria-label="Abrir menu"
        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-3 ml-auto">
        <button
          onClick={toggleTheme}
          type="button"
          aria-label={isDarkMode ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
          title={isDarkMode ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-800 bg-[#161b22] hover:bg-slate-800 text-slate-300 hover:text-white transition-all duration-200 cursor-pointer text-xs font-medium"
        >
          {isDarkMode ? (
            <>
              <Sun className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">Modo Claro</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Modo Escuro</span>
            </>
          )}
        </button>

        {user && (
          <Link
            href="/configuracoes"
            title={user.full_name}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-teal-700 to-teal-400 text-white font-bold text-xs shadow-xs hover:opacity-90 transition-opacity"
          >
            {user.full_name.charAt(0).toUpperCase()}
          </Link>
        )}
      </div>
    </header>
  );
};

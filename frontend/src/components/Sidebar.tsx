'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  FolderArchive,
  Layers,
  HelpCircle,
  Timer,
  CalendarDays,
  LineChart,
  Settings,
  AlarmClock,
  GraduationCap,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Minhas Matérias', href: '/materias', icon: BookOpen },
    { name: 'Biblioteca', href: '/biblioteca', icon: FolderArchive },
    { name: 'Flashcards', href: '/flashcards', icon: Layers },
    { name: 'Questões', href: '/questoes', icon: HelpCircle },
    { name: 'Simulados', href: '/simulados', icon: Timer },
    { name: 'Plano de Estudos', href: '/plano-estudos', icon: CalendarDays },
    { name: 'Desempenho', href: '/desempenho', icon: LineChart },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 z-50 flex flex-col justify-between w-64 h-screen shrink-0 bg-[#0d1117] border-r border-slate-800/80 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand header */}
          <div className="flex items-center gap-2 px-4 py-4 border-b border-slate-800/80">
            <Link href="/" onClick={onClose} className="flex items-center gap-3 min-w-0 flex-1 group">
              <div className="flex items-center justify-center w-10 h-10 shrink-0 rounded-xl bg-gradient-to-tr from-teal-700 to-teal-400 shadow-md shadow-teal-500/20">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base font-bold tracking-tight text-slate-100 truncate">
                    StudyMind
                  </h1>
                  <span className="shrink-0 text-[10px] leading-none px-1.5 py-1 rounded-md bg-teal-500/15 text-teal-400 border border-teal-500/30 font-semibold">
                    AI
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium truncate">
                  Estudos com IA local
                </p>
              </div>
            </Link>
            {onClose && (
              <button
                onClick={onClose}
                type="button"
                aria-label="Fechar menu"
                className="p-1.5 shrink-0 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 md:hidden"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="px-3.5 pt-4 pb-2">
            <Link
              href="/prova-amanha"
              onClick={onClose}
              className={`aviso-prova flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                pathname === '/prova-amanha' ? 'aviso-prova-active' : ''
              }`}
            >
              <span className="aviso-prova-icon flex items-center justify-center w-8 h-8 rounded-[10px] shrink-0">
                <AlarmClock className="w-4 h-4" />
              </span>
              <div className="flex flex-col min-w-0">
                <span className="font-bold leading-tight">Tenho Prova Amanhã</span>
                <span className="text-[11px] font-medium opacity-80">Plano intensivo</span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3.5 py-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom configuration */}
        <div className="p-3.5 border-t border-slate-800/80">
          <Link
            href="/configuracoes"
            onClick={onClose}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              pathname === '/configuracoes'
                ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Configurações & IA</span>
          </Link>
        </div>
      </aside>
    </>
  );
};

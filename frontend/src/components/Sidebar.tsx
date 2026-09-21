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
  Zap,
  Settings,
  Sparkles,
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
        className={`fixed md:sticky top-0 left-0 z-50 flex flex-col justify-between w-64 h-screen bg-[#0d1117] border-r border-slate-800/80 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-800/80">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-[#EBD053] to-[#FFEE8C] shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-[#221d06]" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  StudyMind <span className="text-xs px-1.5 py-0.5 rounded bg-[#FFEE8C]/20 text-[#FFEE8C] border border-[#FFEE8C]/30 font-semibold">AI</span>
                </h1>
                <p className="text-[11px] text-slate-400 font-medium">Local AI Study Engine</p>
              </div>
            </Link>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Special Cram Mode Button */}
          <div className="px-3.5 pt-4 pb-2">
            <Link
              href="/prova-amanha"
              onClick={onClose}
              className={`relative flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 overflow-hidden group ${
                pathname === '/prova-amanha'
                  ? 'bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-rose-500/20 text-amber-300 border border-amber-500/40 shadow-lg shadow-orange-500/10'
                  : 'bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 text-amber-400 border border-amber-500/20 hover:border-amber-500/40 hover:scale-[1.02]'
              }`}
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-rose-500 text-white shadow-xs">
                <Zap className="w-4 h-4 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-extrabold tracking-wide uppercase text-amber-400">
                  Tenho Prova Amanhã
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Plano de choque intensivo</span>
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
                      ? 'bg-[#FFEE8C]/15 text-[#FFEE8C] border border-[#FFEE8C]/30 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#FFEE8C]' : 'text-slate-400'}`} />
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
                ? 'bg-[#FFEE8C]/15 text-[#FFEE8C] border border-[#FFEE8C]/30'
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

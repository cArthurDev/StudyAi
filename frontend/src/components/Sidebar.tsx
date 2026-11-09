'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import logoPreta from '../../images/logo_preto.png';
import logoBranca from '../../images/logo_branca.png';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
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
  CircleHelp,
  AlarmClock,
  LogOut,
  X,
  ChevronDown
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navGroups = [
  {
    id: 'estudar',
    label: 'Estudar',
    hint: 'Organizar o dia e os materiais',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard, tip: 'O que fazer agora' },
      { name: 'Minhas Matérias', href: '/materias', icon: BookOpen, tip: 'Cursos e ferramentas' },
      { name: 'Biblioteca', href: '/biblioteca', icon: FolderArchive, tip: 'Arquivos enviados' },
      { name: 'Plano de Estudos', href: '/plano-estudos', icon: CalendarDays, tip: 'Sessões da semana' },
    ],
  },
  {
    id: 'praticar',
    label: 'Praticar',
    hint: 'Treinar o que você já viu',
    items: [
      { name: 'Flashcards', href: '/flashcards', icon: Layers, tip: 'Revisão espaçada' },
      { name: 'Questões', href: '/questoes', icon: HelpCircle, tip: 'Exercícios do material' },
      { name: 'Simulados', href: '/simulados', icon: Timer, tip: 'Prova com tempo' },
    ],
  },
  {
    id: 'acompanhar',
    label: 'Acompanhar',
    hint: 'Ver o que ainda está fraco',
    items: [
      { name: 'Desempenho', href: '/desempenho', icon: LineChart, tip: 'Domínio por assunto' },
    ],
  },
];

function groupForPath(pathname: string) {
  if (pathname.startsWith('/flashcards') || pathname.startsWith('/questoes') || pathname.startsWith('/simulados')) {
    return 'praticar';
  }
  if (pathname.startsWith('/desempenho')) return 'acompanhar';
  if (
    pathname === '/' ||
    pathname.startsWith('/materias') ||
    pathname.startsWith('/biblioteca') ||
    pathname.startsWith('/plano-estudos')
  ) {
    return 'estudar';
  }
  return null;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { isDarkMode } = useTheme();
  const { logout } = useAuth();
  const [openGroup, setOpenGroup] = useState<string | null>(groupForPath(pathname));
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(min-width: 768px)').matches) setVisible(true);
  }, []);

  useEffect(() => {
    if (isOpen) setVisible(true);
  }, [isOpen]);

  useEffect(() => {
    setOpenGroup(groupForPath(pathname));
  }, [pathname]);

  const closeMenu = () => {
    setVisible(false);
    onClose?.();
  };

  const closeIfNarrow = () => {
    if (window.matchMedia('(max-width: 767px)').matches) closeMenu();
  };

  return (
    <>
      {visible && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={closeMenu}
        />
      )}

      <aside
        className={`top-0 left-0 z-50 flex h-screen w-56 shrink-0 flex-col justify-between bg-[#0d1117] border-r border-slate-800/80 transition-transform duration-300 ease-in-out ${
          visible ? 'fixed translate-x-0 md:sticky' : 'fixed -translate-x-full md:hidden'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-800/80">
            <Link href="/" onClick={closeIfNarrow} className="flex items-center gap-3 min-w-0 flex-1 group">
              <div className="min-w-0">
                <Image src={isDarkMode ? logoBranca : logoPreta} alt="Study AI" className="h-auto w-40" />
              </div>
            </Link>
            {onClose && (
              <button
                onClick={closeMenu}
                type="button"
                aria-label="Fechar menu"
                title="Fecha o menu e volta ao conteúdo"
                className={`btn-quiet shrink-0 h-8 w-8 rounded-full p-0 flex items-center justify-center border ${isDarkMode ? 'border-slate-500 text-white hover:text-white hover:border-slate-300 hover:bg-slate-800' : 'border-slate-400 text-slate-700 hover:text-slate-950 hover:border-slate-600 hover:bg-slate-100'}`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="px-2.5 pt-2.5 pb-1">
            <Link
              href="/prova-amanha"
              onClick={closeIfNarrow}
              title="Monta um plano curto para a prova de amanhã"
              className={`aviso-prova flex items-center gap-2 px-2.5 py-2 rounded-xl text-sm font-semibold transition-all ${
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

          <nav className="flex-1 px-2.5 py-1" aria-label="Navegação principal">
            {navGroups.map((group) => {
              const open = openGroup === group.id;
              return (
                <div key={group.id} className="ihc-cluster">
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={`nav-${group.id}`}
                    onClick={() => setOpenGroup(open ? null : group.id)}
                    title={group.hint}
                    className="flex w-full items-center justify-between gap-2 min-h-8 px-2 py-1 rounded-lg text-left text-slate-200 hover:bg-slate-800/60"
                  >
                    <span>
                      <span className="ihc-kicker block px-0 pt-0 text-teal-400">{group.label}</span>
                    </span>
                    <ChevronDown className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>
                  {open && (
                    <div id={`nav-${group.id}`} className="ihc-reveal space-y-1 pb-1">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={closeIfNarrow}
                            title={item.tip}
                            aria-current={isActive ? 'page' : undefined}
                            className={`nav-item flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              isActive
                                ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-xs'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                            }`}
                          >
                            <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                            <span className="min-w-0 leading-tight">{item.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="p-3.5 border-t border-slate-800/80 space-y-1">
          <Link
            href="/ajuda"
            onClick={closeIfNarrow}
            title="Para que serve cada parte e como fazer"
            aria-current={pathname === '/ajuda' ? 'page' : undefined}
            className={`nav-item flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              pathname === '/ajuda'
                ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <CircleHelp className="w-4 h-4 shrink-0" />
            <span>Ajuda</span>
          </Link>
          <Link
            href="/configuracoes"
            onClick={closeIfNarrow}
            title="Perfil, tema e estado da IA local"
            className={`nav-item flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              pathname === '/configuracoes'
                ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>Configurações</span>
          </Link>
          <button
            type="button"
            title="Encerra a sessão neste navegador"
            onClick={() => {
              closeIfNarrow();
              logout();
            }}
            className="btn-quiet w-full justify-start text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            <span>Sair da conta</span>
          </button>
        </div>
      </aside>
    </>
  );
};

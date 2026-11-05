'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { CircleHelp } from 'lucide-react';

const stages = [
  {
    id: 'estudar',
    tone: { accent: '#4e80bc', wash: '#d6e6f5', ink: '#163a66' },
    label: 'Estudar',
    hint: 'Organizar o dia e os materiais',
    items: [
      {
        name: 'Dashboard',
        href: '/',
        purpose: 'Ver o que fazer agora: sessões de hoje, próximas provas e assuntos que precisam de atenção.',
        steps: 'Abra Dashboard. Se o plano de hoje estiver vazio, use Gerar plano com IA.',
      },
      {
        name: 'Minhas Matérias',
        href: '/materias',
        purpose: 'Guardar cada curso e as ferramentas dele.',
        steps: 'Use Nova matéria, escreva o nome e escolha a cor. Abra o card. Em Organizar, envie o arquivo. Em Aprender, use Chat com Matéria, Resumos ou Mapa Mental. Em Treinar, use Flashcards, Questões ou Simulados.',
      },
      {
        name: 'Biblioteca',
        href: '/biblioteca',
        purpose: 'Ver os arquivos enviados.',
        steps: 'Abra Biblioteca. Se quiser, filtre por uma matéria.',
      },
      {
        name: 'Plano de Estudos',
        href: '/plano-estudos',
        purpose: 'Montar as sessões da semana.',
        steps: 'Abra Plano de Estudos e use Gerar Novo Plano. Antes disso, crie ao menos uma matéria.',
      },
      {
        name: 'Tenho Prova Amanhã',
        href: '/prova-amanha',
        purpose: 'Montar um plano curto só com o que ainda está fraco.',
        steps: 'Use Tenho Prova Amanhã no topo do menu.',
      },
    ],
  },
  {
    id: 'praticar',
    tone: { accent: '#2e9b22', wash: '#e3f3df', ink: '#145214' },
    label: 'Praticar',
    hint: 'Treinar o que você já viu',
    items: [
      {
        name: 'Flashcards',
        href: '/flashcards',
        purpose: 'Revisar com cartas.',
        steps: 'Abra Flashcards, ou entre na matéria e escolha a etapa Treinar.',
      },
      {
        name: 'Questões',
        href: '/questoes',
        purpose: 'Treinar com exercícios do material.',
        steps: 'Abra Questões. Filtre uma etapa de cada vez: Matéria, Dificuldade ou Tipo de questão.',
      },
      {
        name: 'Simulados',
        href: '/simulados',
        purpose: 'Fazer uma prova com tempo.',
        steps: 'Abra Simulados e inicie a prova. O gabarito aparece quando você finalizar.',
      },
    ],
  },
  {
    id: 'acompanhar',
    tone: { accent: '#d02010', wash: '#fde8e4', ink: '#8d1c10' },
    label: 'Acompanhar',
    hint: 'Ver o que ainda está fraco',
    items: [
      {
        name: 'Desempenho',
        href: '/desempenho',
        purpose: 'Ver o domínio por assunto.',
        steps: 'Abra Desempenho. Os assuntos críticos também aparecem no Dashboard, em Assuntos que Precisam de Atenção.',
      },
    ],
  },
];

export default function AjudaPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stageId, setStageId] = useState('estudar');
  const stage = stages.find((item) => item.id === stageId) ?? stages[0];

  return (
    <div className="flex min-h-screen bg-[#0a0d12]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 space-y-4 max-w-3xl mx-auto w-full">
          <div className="ajuda-banner flex items-start gap-3">
            <CircleHelp className="w-6 h-6 shrink-0 mt-1" style={{ color: stage.tone.accent }} />
            <div>
              <h1 className="text-xl font-extrabold">Ajuda</h1>
              <p className="text-sm mt-1">
                Escolha a mesma etapa do menu. Cada item diz para que serve e como fazer.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" role="tablist" aria-label="Etapas da ajuda">
            {stages.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={stageId === item.id}
                onClick={() => setStageId(item.id)}
                className="choice-chip ajuda-chip"
                style={{
                  ['--ajuda-accent' as string]: item.tone.accent,
                  ['--ajuda-wash' as string]: item.tone.wash,
                  ['--ajuda-ink' as string]: item.tone.ink,
                }}
              >
                <span className="block text-sm font-bold">{item.label}</span>
                <span className="block text-xs opacity-80">{item.hint}</span>
              </button>
            ))}
          </div>

          <div className="ihc-reveal space-y-3">
            {stage.items.map((item) => (
              <article
                key={item.name}
                className="ajuda-card p-4 rounded-xl border space-y-2"
                style={{
                  ['--ajuda-accent' as string]: stage.tone.accent,
                  ['--ajuda-wash' as string]: stage.tone.wash,
                  ['--ajuda-ink' as string]: stage.tone.ink,
                }}
              >
                <h2 className="text-base font-bold">
                  <Link href={item.href} className="hover:underline">{item.name}</Link>
                </h2>
                <p className="text-sm">
                  <span className="ajuda-purpose font-semibold">Para que serve. </span>
                  {item.purpose}
                </p>
                <p className="text-sm">
                  <span className="ajuda-steps font-semibold">Como fazer. </span>
                  {item.steps}
                </p>
              </article>
            ))}
          </div>

          <p className="text-sm text-slate-400">
            <Link href="/configuracoes" className="font-semibold hover:underline" style={{ color: '#4e80bc' }}>Configurações</Link>
            {' '}guarda o perfil, o tema e o estado da IA local.
          </p>
        </main>
      </div>
    </div>
  );
}

'use client';

export function StudyDemoBanner({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4">
      <div>
        <p className="text-sm font-semibold text-indigo-400">{active ? 'Demonstração da interface' : 'Quer testar a interface?'}</p>
        <p className="mt-1 text-xs text-slate-400">{active ? 'Conteúdo de exemplo. Experimente as ações sem alterar seu progresso.' : 'Abra exemplos de estudo para explorar as funcionalidades.'}</p>
      </div>
      <button type="button" onClick={onToggle} className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white transition-colors">
        {active ? 'Ver meu conteúdo' : 'Ver demonstração'}
      </button>
    </div>
  );
}

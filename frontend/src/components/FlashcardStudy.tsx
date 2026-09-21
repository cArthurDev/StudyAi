'use client';

import React, { useState } from 'react';
import { Flashcard, api } from '@/lib/api';
import confetti from 'canvas-confetti';
import { RotateCw, CheckCircle2, XCircle, Sparkles, Volume2, ArrowRight, ArrowLeft } from 'lucide-react';

interface FlashcardStudyProps {
  flashcards: Flashcard[];
  onFinish?: () => void;
}

export const FlashcardStudy: React.FC<FlashcardStudyProps> = ({ flashcards, onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cards, setCards] = useState<Flashcard[]>(flashcards);
  const [completed, setCompleted] = useState(false);

  if (!cards || cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-[#161b22] border border-slate-800 rounded-2xl">
        <Sparkles className="w-10 h-10 text-[#FFEE8C] mb-3" />
        <h3 className="text-base font-bold text-slate-200">Nenhum flashcard disponível</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Gere um baralho de flashcards a partir dos seus documentos para iniciar a revisão espaçada.
        </p>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  const handleRating = async (rating: 'errei' | 'dificil' | 'bom' | 'facil') => {
    try {
      await api.reviewFlashcard(currentCard.id, rating);
    } catch {
      // Offline fallback
    }

    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex((prev) => prev + 1), 150);
    } else {
      setCompleted(true);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
      if (onFinish) onFinish();
    }
  };

  const resetStudy = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setCompleted(false);
  };

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-[#161b22] border border-slate-800 rounded-3xl shadow-xl max-w-md mx-auto">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 mb-4 border border-emerald-500/20 shadow-lg">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-200">Sessão Concluída com Sucesso!</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md">
          Você revisou todos os {cards.length} flashcards deste baralho. O algoritmo de repetição espaçada recalibrou as próximas datas de estudo.
        </p>

        <button
          onClick={resetStudy}
          className="mt-6 px-6 py-2.5 text-xs font-bold text-[#221d06] bg-[#FFEE8C] hover:bg-[#F3DD64] rounded-xl transition-colors shadow-lg shadow-amber-500/20 cursor-pointer"
        >
          Revisar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
      {/* Progress & Card Topic */}
      <div className="flex items-center justify-between w-full mb-4 px-1">
        <span className="text-xs font-medium text-slate-400">
          Cartão <strong className="text-[#FFEE8C]">{currentIndex + 1}</strong> de {cards.length}
        </span>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-slate-800 text-[#FFEE8C] border border-slate-700">
            {currentCard.topic_name}
          </span>
          <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            {currentCard.difficulty}
          </span>
        </div>
      </div>

      {/* 3D Flashcard Flip Container */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="relative w-full h-80 cursor-pointer select-none perspective"
      >
        <div
          className={`w-full h-full rounded-2xl transition-transform duration-500 transform-style-3d border border-slate-800/80 shadow-2xl p-8 flex flex-col justify-between ${
            isFlipped ? 'bg-[#1b2230] rotate-y-180' : 'bg-[#161b22]'
          }`}
        >
          {/* Card Front (Question) */}
          {!isFlipped ? (
            <div className="flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Pergunta
                </span>
                <span className="text-xs text-indigo-400 flex items-center gap-1 font-medium">
                  <RotateCw className="w-3 h-3" /> Clique para virar
                </span>
              </div>

              <div className="my-auto text-center px-4">
                <h4 className="text-lg md:text-xl font-semibold text-slate-100 leading-snug">
                  {currentCard.question}
                </h4>
              </div>

              <div className="text-[11px] text-slate-400 text-right">
                {currentCard.source_citation && `Fonte: ${currentCard.source_citation}`}
              </div>
            </div>
          ) : (
            /* Card Back (Answer) */
            <div className="flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Resposta Correta
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <RotateCw className="w-3 h-3" /> Clique para virar
                </span>
              </div>

              <div className="my-auto text-center px-4">
                <p className="text-base md:text-lg text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {currentCard.answer}
                </p>
              </div>

              <div className="text-[11px] text-slate-400 text-right">
                Avalie abaixo para agendar a próxima revisão
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SM-2 Spaced Repetition Rating Buttons */}
      {isFlipped ? (
        <div className="grid grid-cols-4 gap-3 w-full mt-6">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRating('errei');
            }}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all font-semibold text-xs"
          >
            <span>Errei</span>
            <span className="text-[10px] text-rose-500/80 font-normal">Revisar hoje</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRating('dificil');
            }}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all font-semibold text-xs"
          >
            <span>Difícil</span>
            <span className="text-[10px] text-amber-500/80 font-normal">Em 1 dia</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRating('bom');
            }}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 transition-all font-semibold text-xs"
          >
            <span>Bom</span>
            <span className="text-[10px] text-indigo-500/80 font-normal">Em 3 dias</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRating('facil');
            }}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all font-semibold text-xs"
          >
            <span>Fácil</span>
            <span className="text-[10px] text-emerald-500/80 font-normal">Em 6 dias</span>
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsFlipped(true)}
          className="w-full mt-6 py-3 px-6 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-lg shadow-indigo-600/20"
        >
          Mostrar Resposta
        </button>
      )}
    </div>
  );
};

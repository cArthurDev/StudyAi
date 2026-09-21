'use client';

import React, { useState, useEffect } from 'react';
import { Quiz, api } from '@/lib/api';
import confetti from 'canvas-confetti';
import { Timer, CheckCircle2, XCircle, Award, AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react';

interface SimuladoRunnerProps {
  quiz: Quiz;
  onFinish?: () => void;
}

export const SimuladoRunner: React.FC<SimuladoRunnerProps> = ({ quiz: initialQuiz, onFinish }) => {
  const [quiz, setQuiz] = useState<Quiz>(initialQuiz);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(initialQuiz.time_limit_minutes * 60);
  const [submitted, setSubmitted] = useState(initialQuiz.status === 'completed');
  const [submitting, setSubmitting] = useState(false);

  const questions = quiz.questions || [];

  // Countdown timer
  useEffect(() => {
    if (submitted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted, timeLeft]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = (qId: string, ans: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qId]: ans }));
  };

  const handleSubmitQuiz = async () => {
    if (submitting || submitted) return;
    setSubmitting(true);
    const timeSpent = (initialQuiz.time_limit_minutes * 60) - timeLeft;

    try {
      const result = await api.submitQuiz(quiz.id, {
        answers,
        total_time_seconds: timeSpent
      });
      setQuiz(result);
      setSubmitted(true);
      if (result.score_percentage >= 70) {
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      }
      onFinish?.();
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="p-8 text-center bg-[#161b22] border border-slate-800 rounded-2xl">
        <p className="text-slate-300">Nenhuma questão vinculada a este simulado.</p>
      </div>
    );
  }

  // --- SCORECARD RESULT SCREEN ---
  if (submitted) {
    const isPassing = (quiz.score_percentage || 0) >= 60;
    return (
      <div className="p-6 md:p-8 bg-[#161b22] border border-slate-800/80 rounded-2xl shadow-2xl max-w-3xl mx-auto space-y-6">
        {/* Score banner */}
        <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-[#161b22] border border-slate-800">
          <div className={`flex items-center justify-center w-16 h-16 mb-4 rounded-2xl border ${
            isPassing ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
          }`}>
            <Award className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-bold text-slate-100">Simulado Finalizado!</h3>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-4xl font-extrabold font-mono text-indigo-400">{quiz.score_percentage}%</span>
            <span className="text-sm text-slate-400">Nota Final</span>
          </div>

          <div className="grid grid-cols-3 gap-4 w-full max-w-md mt-6 pt-6 border-t border-slate-800 text-center">
            <div>
              <span className="text-xs text-slate-400 block">Acertos</span>
              <strong className="text-base text-emerald-400">{quiz.correct_count}</strong>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Erros</span>
              <strong className="text-base text-rose-400">{quiz.incorrect_count}</strong>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Tempo Total</span>
              <strong className="text-base text-slate-200">{formatTimer(quiz.total_time_seconds || 0)}</strong>
            </div>
          </div>
        </div>

        {/* Breakdown by Topic */}
        {quiz.topics_breakdown_json && Object.keys(quiz.topics_breakdown_json).length > 0 && (
          <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
              Desempenho Detalhado por Assunto
            </h4>
            <div className="space-y-3">
              {Object.entries(quiz.topics_breakdown_json).map(([topic, pct]) => {
                const numPct = typeof pct === 'number' ? pct : 0;
                return (
                  <div key={topic} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-300">{topic}</span>
                      <span className={`font-mono font-bold ${numPct >= 70 ? 'text-emerald-400' : numPct >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                        {numPct}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${numPct >= 70 ? 'bg-emerald-500' : numPct >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                        style={{ width: `${numPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="p-6 md:p-8 bg-[#161b22] border border-slate-800/80 rounded-2xl shadow-2xl max-w-3xl mx-auto space-y-6">
      {/* Top Simulado Bar: Timer & Progress */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/90 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono font-bold text-sm ${
            timeLeft < 180 ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse' : 'bg-slate-800 border-slate-700 text-indigo-400'
          }`}>
            <Timer className="w-4 h-4" />
            <span>{formatTimer(timeLeft)}</span>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">Tempo restante</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            Respondidas: <strong className="text-indigo-400">{answeredCount}</strong>/{questions.length}
          </span>
          <button
            onClick={handleSubmitQuiz}
            disabled={submitting}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-md shadow-emerald-600/20"
          >
            Finalizar Simulado
          </button>
        </div>
      </div>

      {/* Question palette dots */}
      <div className="flex flex-wrap gap-2">
        {questions.map((_, qIdx) => {
          const isDone = !!answers[questions[qIdx].id];
          const isCurrent = qIdx === currentIdx;
          return (
            <button
              key={qIdx}
              onClick={() => setCurrentIdx(qIdx)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                isCurrent
                  ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                  : isDone
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {qIdx + 1}
            </button>
          );
        })}
      </div>

      {/* Active Question */}
      <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-indigo-400">
            Questão {currentIdx + 1} de {questions.length} • {currentQ.topic_name}
          </span>
          <span className="text-xs text-slate-400">{currentQ.difficulty}</span>
        </div>

        <h4 className="text-base font-semibold text-slate-100 leading-snug mb-6">
          {currentQ.question_text}
        </h4>

        {/* Options */}
        {currentQ.question_type === 'multipla_escolha' && currentQ.options_json?.length > 0 ? (
          <div className="space-y-2.5">
            {currentQ.options_json.map((opt, optIdx) => {
              const isSelected = answers[currentQ.id] === opt;
              return (
                <button
                  key={optIdx}
                  onClick={() => handleSelectAnswer(currentQ.id, opt)}
                  className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-sm text-left transition-all ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-medium'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-slate-800 text-slate-300 font-bold text-xs shrink-0">
                    {String.fromCharCode(65 + optIdx)}
                  </span>
                  <span className="flex-1">{opt}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {['Verdadeiro', 'Falso'].map((choice) => {
              const isSelected = answers[currentQ.id] === choice;
              return (
                <button
                  key={choice}
                  onClick={() => handleSelectAnswer(currentQ.id, choice)}
                  className={`p-4 rounded-xl border text-sm font-semibold transition-all ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {choice}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between items-center">
        <button
          disabled={currentIdx === 0}
          onClick={() => setCurrentIdx((prev) => prev - 1)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Anterior
        </button>

        {currentIdx + 1 < questions.length ? (
          <button
            onClick={() => setCurrentIdx((prev) => prev + 1)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-md shadow-indigo-600/20"
          >
            Próxima <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmitQuiz}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-md shadow-emerald-600/20"
          >
            Finalizar e Ver Nota
          </button>
        )}
      </div>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import { Question, api } from '@/lib/api';
import { CheckCircle2, XCircle, HelpCircle, FileText, Sparkles, Send } from 'lucide-react';

interface QuestionPracticeProps {
  questions: Question[];
}

export const QuestionPractice: React.FC<QuestionPracticeProps> = ({ questions }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [attemptsResult, setAttemptsResult] = useState<Record<string, any>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  if (!questions || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-[#161b22] border border-slate-800 rounded-2xl">
        <HelpCircle className="w-10 h-10 text-indigo-400 mb-3" />
        <h3 className="text-base font-bold text-slate-200">Nenhuma questão disponível</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Gere questões com IA para praticar o conteúdo e atualizar seu índice de domínio determinístico.
        </p>
      </div>
    );
  }

  const handleSelectOption = (questionId: string, option: string) => {
    if (attemptsResult[questionId]) return; // already answered
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async (question: Question) => {
    const answer = selectedAnswers[question.id];
    if (!answer || submittingId === question.id) return;

    setSubmittingId(question.id);
    try {
      const res = await api.submitQuestionAttempt(question.id, {
        user_answer: answer,
        time_spent_seconds: 15
      });
      setAttemptsResult((prev) => ({ ...prev, [question.id]: res }));
    } catch {
      // fallback if network error
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {questions.map((q, idx) => {
        const selected = selectedAnswers[q.id];
        const result = attemptsResult[q.id];
        const isAnswered = !!result;

        return (
          <div
            key={q.id}
            className="p-6 bg-[#161b22] border border-slate-800/80 rounded-2xl shadow-xl"
          >
            {/* Header info */}
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 font-bold text-xs border border-indigo-500/20">
                  {idx + 1}
                </span>
                <span className="text-xs font-semibold text-slate-300">{q.topic_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-[11px] rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                  {q.difficulty}
                </span>
                <span className="px-2.5 py-0.5 text-[11px] rounded-md bg-slate-800 text-indigo-400 border border-slate-700 uppercase">
                  {q.question_type.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Enunciado */}
            <p className="text-sm md:text-base font-medium text-slate-100 leading-relaxed mb-5">
              {q.question_text}
            </p>

            {/* Multiple Choice Options */}
            {q.question_type === 'multipla_escolha' && q.options_json && q.options_json.length > 0 ? (
              <div className="space-y-2.5">
                {q.options_json.map((opt, optIdx) => {
                  const optLetter = opt.substring(0, 1).toUpperCase();
                  const isSelected = selected === opt || selected === optLetter;
                  const isCorrect = isAnswered && (q.correct_answer.startsWith(optLetter) || q.correct_answer === opt);
                  const isWrongSelected = isAnswered && isSelected && !result.is_correct;

                  let buttonStyle = 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700';
                  if (isSelected && !isAnswered) {
                    buttonStyle = 'bg-indigo-600/15 border-indigo-500 text-indigo-300 font-medium';
                  } else if (isAnswered) {
                    if (isCorrect) {
                      buttonStyle = 'bg-emerald-500/15 border-emerald-500 text-emerald-300 font-medium';
                    } else if (isWrongSelected) {
                      buttonStyle = 'bg-rose-500/15 border-rose-500 text-rose-300 font-medium';
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      disabled={isAnswered}
                      onClick={() => handleSelectOption(q.id, opt)}
                      className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-sm text-left transition-all ${buttonStyle}`}
                    >
                      <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-slate-800 text-slate-300 font-bold text-xs shrink-0">
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="flex-1">{opt}</span>
                    </button>
                  );
                })}
              </div>
            ) : q.question_type === 'verdadeiro_falso' ? (
              /* True / False Options */
              <div className="grid grid-cols-2 gap-3">
                {['Verdadeiro', 'Falso'].map((choice) => {
                  const isSelected = selected === choice;
                  const isCorrect = isAnswered && q.correct_answer.toLowerCase().startsWith(choice.toLowerCase()[0]);
                  const isWrongSelected = isAnswered && isSelected && !result.is_correct;

                  let buttonStyle = 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700';
                  if (isSelected && !isAnswered) {
                    buttonStyle = 'bg-indigo-600/15 border-indigo-500 text-indigo-300 font-medium';
                  } else if (isAnswered) {
                    if (isCorrect) {
                      buttonStyle = 'bg-emerald-500/15 border-emerald-500 text-emerald-300 font-medium';
                    } else if (isWrongSelected) {
                      buttonStyle = 'bg-rose-500/15 border-rose-500 text-rose-300 font-medium';
                    }
                  }

                  return (
                    <button
                      key={choice}
                      disabled={isAnswered}
                      onClick={() => handleSelectOption(q.id, choice)}
                      className={`p-3.5 rounded-xl border text-sm font-semibold transition-all ${buttonStyle}`}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Discursive Open Text */
              <div className="space-y-3">
                <textarea
                  disabled={isAnswered}
                  value={selected || ''}
                  onChange={(e) => setSelectedAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  placeholder="Escreva sua resposta dissertativa aqui..."
                  rows={3}
                  className="w-full p-3.5 text-sm bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {/* Submit Button */}
            {!isAnswered ? (
              <div className="flex justify-end mt-4">
                <button
                  disabled={!selected || submittingId === q.id}
                  onClick={() => handleSubmit(q)}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all shadow-md shadow-indigo-600/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  Verificar Resposta
                </button>
              </div>
            ) : (
              /* Immediate Feedback with Explanation and Citation */
              <div className={`mt-5 p-4 rounded-xl border ${result.is_correct ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                <div className="flex items-center gap-2 font-bold text-sm mb-1.5">
                  {result.is_correct ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="text-emerald-300">Resposta Correta!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-rose-400" />
                      <span className="text-rose-300">Resposta Incorreta</span>
                    </>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  <strong className="text-slate-200">Gabarito:</strong> {q.correct_answer}
                </p>

                {q.explanation && (
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    <strong className="text-slate-200">Explicação:</strong> {q.explanation}
                  </p>
                )}

                {q.source_citation && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Fonte: {q.source_citation}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

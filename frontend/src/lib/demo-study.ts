import type { Flashcard, Question } from './api';

const shared = {
  user_id: 'demo',
  subject_id: 'demo',
  created_at: '2026-01-01T00:00:00Z',
  source_citation: 'Exemplo de demonstração',
};

export const demoFlashcards: Flashcard[] = [
  { topic_name: 'Interação Humano-Computador', question: 'O que é feedback em uma interface?', answer: 'É a resposta do sistema a uma ação da pessoa. Por exemplo, uma mensagem de confirmação depois de salvar um arquivo.', difficulty: 'Fácil' },
  { topic_name: 'Segurança da Informação', question: 'Quais são os três pilares da segurança da informação?', answer: 'Confidencialidade, integridade e disponibilidade. Eles protegem o acesso, a exatidão e a disponibilidade dos dados.', difficulty: 'Médio' },
  { topic_name: 'Arquitetura de Computadores', question: 'Qual é a função da memória cache?', answer: 'Guardar cópias de dados e instruções usados com frequência, reduzindo o tempo de acesso do processador.', difficulty: 'Médio' },
].map((card, index) => ({ ...shared, ...card, id: `demo-card-${index}`, repetition_count: 0, interval_days: 0, ease_factor: 2.5, next_review_at: shared.created_at }));

export const demoQuestions: Question[] = [
  {
    ...shared, id: 'demo-question-1', topic_name: 'Interação Humano-Computador', subtopic_name: 'Feedback', difficulty: 'Fácil', question_type: 'multipla_escolha',
    question_text: 'Depois de salvar um documento, qual comportamento oferece um feedback claro?',
    options_json: ['A) Mostrar a mensagem “Documento salvo”.', 'B) Fechar o aplicativo sem aviso.', 'C) Alterar apenas a cor de um ícone.', 'D) Manter a tela sem qualquer mudança.'],
    correct_answer: 'A', explanation: 'Uma confirmação em texto informa o resultado da ação de forma clara, sem depender apenas da percepção de cores.',
  },
  {
    ...shared, id: 'demo-question-2', topic_name: 'Segurança da Informação', subtopic_name: 'Integridade', difficulty: 'Médio', question_type: 'verdadeiro_falso',
    question_text: 'A integridade busca proteger os dados contra alterações indevidas.', options_json: [], correct_answer: 'Verdadeiro',
    explanation: 'A integridade está relacionada à exatidão dos dados e à proteção contra modificações não autorizadas.',
  },
  {
    ...shared, id: 'demo-question-3', topic_name: 'Arquitetura de Computadores', subtopic_name: 'Memória cache', difficulty: 'Médio', question_type: 'multipla_escolha',
    question_text: 'Qual é a principal finalidade da memória cache do processador?',
    options_json: ['A) Substituir o armazenamento permanente.', 'B) Reduzir o tempo de acesso a dados e instruções frequentes.', 'C) Controlar a conexão com a internet.', 'D) Aumentar a resolução do monitor.'],
    correct_answer: 'B', explanation: 'A cache aproxima do processador dados e instruções que provavelmente serão acessados novamente.',
  },
];
